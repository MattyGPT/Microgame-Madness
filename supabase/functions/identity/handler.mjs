import {fault,genericCredentials,normalizeHandle,validatePassword,randomSecret,sha256,sessionProjection,identityProvider} from '../_shared/identity.mjs';

/** @param {{url?: string,serviceKey?: string,fetch?: typeof globalThis.fetch,allowedOrigins?: string[]}} options */
export function createIdentityHandler({url,serviceKey,fetch:transport=globalThis.fetch,allowedOrigins=[]}) {
  const provider=identityProvider({url,serviceKey,fetch:transport});
  const {rpc,auth,authenticate,passwordLogin,rate}=provider;
  return async request=>{
    const origin=request.headers.get('origin');
    const permitted=!origin || !allowedOrigins.length || allowedOrigins.includes(origin);
    const headers={'Access-Control-Allow-Origin':allowedOrigins.length?(permitted&&origin?origin:allowedOrigins[0]):'*',
      'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS',Vary:'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
    const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
    if(!permitted)return respond({error:{code:'origin',message:'This origin is not permitted.'}},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return respond({error:{code:'method',message:'Use POST.'}},405);
    try {
      if(!url || !serviceKey)throw fault('unavailable','Accounts are not configured.',503);
      if(Number(request.headers.get('content-length'))>4096)throw fault('too_large','This request is too large.',413);
      const reader=request.body?.getReader(), chunks=[];let size=0;
      if(reader)while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw fault('too_large','This request is too large.',413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}
      let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{throw fault('invalid','Request must be JSON.');}
      if(!body || typeof body!=='object' || Array.isArray(body))throw fault('invalid','Request must be an object.');
      const actions=['register','login','recover','change_password','rotate_recovery','reauthenticate'];
      if(!actions.includes(body.action))throw fault('invalid','Unknown identity action.');
      const action=body.action;
      const allowed={register:['handle','password'],login:['handle','password'],recover:['handle','recoveryCode','newPassword'],change_password:['password','newPassword'],rotate_recovery:['password'],reauthenticate:['password']}[action];
      if(Object.keys(body).some(key=>key!=='action'&&!allowed.includes(key)))throw fault('invalid','Unexpected identity field.');
      let handle=['register','login','recover'].includes(action)?normalizeHandle(body.handle):'';
      if(handle)await rate(request,action,handle);
      let user,identity,session,code,mutation;
      if(['register','change_password','rotate_recovery','reauthenticate'].includes(action)){
        try { user=await authenticate(request.headers.get('authorization')); }
        catch(error) {
          if(action!=='register' || !['auth_required','invalid_credentials'].includes(error.code))throw error;
          // Auth may revoke the anonymous session when conversion assigns a password.
          // For a lost-response retry, current credentials independently prove the
          // reserved owner. Never use a decoded or invalid bearer as ownership proof.
          const pending=await rpc('identity_lookup',{p_handle:handle});
          if(!pending)throw genericCredentials();
          validatePassword(body.password);
          session=await passwordLogin(pending,body.password);
          user=session.user;
        }
        identity=await rpc('identity_lookup',{p_owner:user.id});
        if(!handle)await rate(request,action,user.id);
      }
      if(action==='login'){
        validatePassword(body.password);
        identity=await rpc('identity_lookup',{p_handle:handle});
        if(!identity?.active)throw genericCredentials();
        session=await passwordLogin(identity,body.password);
        return respond({session:sessionProjection(session,identity.handle)});
      }
      if(action==='register'){
        validatePassword(body.password);
        if(identity?.active){
          if(identity.handle!==handle)throw genericCredentials();
          session=await passwordLogin(identity,body.password); // Lost-response retry must prove current password.
        }else if(!user.is_anonymous && !identity)throw genericCredentials();
        code=randomSecret();mutation=crypto.randomUUID();
        identity=identity?.active
          ?await rpc('identity_mutation_begin',{p_owner:user.id,p_recovery_hash:null,p_new_recovery_hash:await sha256(code),p_mutation:mutation})
          :await rpc('identity_register_begin',{p_owner:user.id,p_handle:handle,p_identifier:`${randomSecret()}@accounts.invalid`,p_recovery_hash:await sha256(code),p_mutation:mutation});
        await auth(`admin/users/${identity.owner}`,{method:'PUT',body:{email:identity.provider_identifier,email_confirm:true,password:body.password,app_metadata:{handle:identity.handle,mm_mutation:mutation}}});
        if(!await rpc('identity_mutation_finish',{p_owner:identity.owner,p_mutation:mutation}))throw fault('identity_busy','Please retry account setup.',409);
        session=await passwordLogin(identity,body.password);
        return respond({session:sessionProjection(session,identity.handle),recoveryCode:code});
      }
      if(action==='recover'){
        validatePassword(body.newPassword);
        const input=String(body.recoveryCode || '').trim().toLowerCase().replace(/[ -]/g,'');
        if(!/^[0-9a-f]{64}$/.test(input))throw genericCredentials();
        identity=await rpc('identity_lookup',{p_handle:handle});
        if(!identity?.active)throw genericCredentials();
        code=randomSecret();mutation=crypto.randomUUID();
        identity=await rpc('identity_mutation_begin',{p_owner:identity.owner,p_recovery_hash:await sha256(input),p_new_recovery_hash:await sha256(code),p_mutation:mutation});
      }else{
        if(!identity?.active)throw genericCredentials();
        validatePassword(body.password);
        session=await passwordLogin(identity,body.password);
        if(action==='reauthenticate')return respond({session:sessionProjection(session,identity.handle)});
        if(action==='change_password')validatePassword(body.newPassword);
        if(action==='rotate_recovery')code=randomSecret();
        mutation=crypto.randomUUID();
        identity=await rpc('identity_mutation_begin',{p_owner:identity.owner,p_recovery_hash:null,p_new_recovery_hash:code?await sha256(code):null,p_mutation:mutation});
      }
      if(action!=='rotate_recovery'){
        // Fence every existing session before changing the password. A timeout cannot leave
        // known old sessions authorized at the application gateway.
        if(!await rpc('identity_revoke_sessions',{p_owner:identity.owner,p_mutation:mutation}))throw fault('identity_busy','Please retry this account change.',409);
        await auth(`admin/users/${identity.owner}`,{method:'PUT',body:{password:body.newPassword,app_metadata:{handle:identity.handle,mm_mutation:mutation}}});
        // Close the old-password login race between initial revocation and replacement.
        if(!await rpc('identity_revoke_sessions',{p_owner:identity.owner,p_mutation:mutation}))throw fault('identity_busy','Please retry this account change.',409);
      }
      if(!await rpc('identity_mutation_finish',{p_owner:identity.owner,p_mutation:mutation}))throw fault('identity_busy','Please retry this account change.',409);
      session=action==='rotate_recovery'?session:await passwordLogin(identity,body.newPassword);
      return respond({session:sessionProjection(session,identity.handle),...(code?{recoveryCode:code}:{})});
    }catch(error){return respond({error:{code:error.code || 'unavailable',message:error.code?error.message:'Account service is temporarily unavailable. Try again shortly.'}},error.status || 503);}
  };
}
