export const fault = (code, message, status = 400) => Object.assign(new Error(message), { code, status });
export const genericCredentials = () => fault('invalid_credentials', 'The handle, password, or recovery code is incorrect.', 401);
export const normalizeHandle = value => {
  if (typeof value !== 'string' || !/^[a-z0-9_]{3,24}$/i.test(value.trim())) throw fault('invalid_handle', 'Use 3–24 letters, numbers, or underscores for your handle.');
  return value.trim().toLowerCase();
};
export const validatePassword = value => {
  // bcrypt has a 72-byte boundary: the configured Auth provider must use its current
  // password hashing implementation; reject >72 UTF-8 bytes rather than truncate.
  if (typeof value !== 'string' || value.length < 12 || value.length > 128 || new TextEncoder().encode(value).length > 72)
    throw fault('invalid_password', 'Use 12–72 password bytes (up to 72 plain letters or symbols).');
  return value;
};
export const randomSecret = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2,'0')).join('');
export const sha256 = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2,'0')).join('');
export const sessionId = token => {
  try {
    const claims = JSON.parse(atob(token.replace(/^Bearer /,'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    return /^[0-9a-f-]{36}$/i.test(claims.session_id) ? claims.session_id : null;
  } catch { return null; }
};
export const sessionProjection = (data, handle) => ({access_token:data.access_token,refresh_token:data.refresh_token,
  expires_in:data.expires_in,expires_at:data.expires_at,token_type:data.token_type || 'bearer',
  user:{id:data.user.id,is_anonymous:data.user.is_anonymous===true,handle,last_sign_in_at:data.user.last_sign_in_at || null}});

export function identityProvider({url,serviceKey,fetch:transport=globalThis.fetch}) {
  const base=String(url || '').replace(/\/$/,'');
  const rpc=async(name,body)=>{
    const response=await transport(`${base}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(!response.ok){
      const known=['handle_unavailable','invalid_handle','already_registered','identity_busy','invalid_credentials','account_deleted'].find(code=>String(data?.message).includes(code));
      if(known==='invalid_credentials')throw genericCredentials();
      if(known)throw fault(known,({handle_unavailable:'That handle is unavailable. Choose another.',invalid_handle:'Choose another handle.',already_registered:'This player already has an account.',identity_busy:'Another account change is in progress. Try again in a minute.',account_deleted:'This account has been deleted.'})[known],known==='identity_busy'?409:400);
      throw fault('unavailable','Account service is temporarily unavailable.',503);
    }
    return data;
  };
  const auth=async(path,{method='POST',body,token,credentials=false}={})=>{
    const response=await transport(`${base}/auth/v1/${path}`,{method,headers:{apikey:serviceKey,Authorization:`Bearer ${token || serviceKey}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
    if(!response.ok){if(credentials)throw genericCredentials();throw fault('unavailable','Account service is temporarily unavailable.',503);}
    return response.status===204?null:response.json();
  };
  const authenticate=async bearer=>{
    const sid=sessionId(bearer || '');
    if(!sid)throw fault('auth_required','Sign in again to continue.',401);
    const user=await auth('user',{method:'GET',token:bearer.replace(/^Bearer /,''),credentials:true});
    if(!user?.id || !await rpc('identity_session_active',{p_owner:user.id,p_session:sid}))throw fault('auth_required','Sign in again to continue.',401);
    return user;
  };
  const passwordLogin=async(identity,password)=>{
    const result=await auth('token?grant_type=password',{body:{email:identity.provider_identifier,password},credentials:true});
    if(result?.user?.id!==identity.owner)throw genericCredentials();
    return result;
  };
  const rate=async(request,action,handle='')=>{
    const ip=(request.headers.get('x-forwarded-for') || 'unknown').split(',').at(-1).trim().slice(0,128);
    // Salted hashes keep IP/handle text out of this short-lived abuse table.
    for(const [key,limit,seconds] of [[`global:${action}`,1000,60],[`ip:${ip}:${action}`,action==='register'?10:40,60],[`handle:${handle}:${action}`,action==='register'?5:12,60]]){
      if(!await rpc('identity_rate_limit',{p_bucket:await sha256(`${serviceKey}:${key}`),p_limit:limit,p_seconds:seconds}))throw fault('rate_limited','Too many attempts. Wait a minute and try again.',429);
    }
  };
  return {rpc,auth,authenticate,passwordLogin,rate};
}
