// Private loopback moderator. Never bundle this file or its environment in dist.
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {query} from './hosted_accounts_admin.mjs';
const repoRoot=fileURLToPath(new URL('..', import.meta.url));
const root=resolve(repoRoot,'dist');
// Reuse the build's public-key validation; ordinary rebuilds may clear dist's config.
const publicConfig=JSON.parse(execFileSync('python3',['-c',
 'import json; from scripts.build_web import leaderboard_config; print(json.dumps(leaderboard_config()))'
],{encoding:'utf8',cwd:repoRoot}));
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const uuid=value=>{if(!/^[0-9a-f-]{36}$/.test(value||''))throw Error('Invalid ID');return quote(value)+'::uuid';};
export const server=http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 // Reject DNS rebinding and cross-origin form/fetch requests, including null origins.
 if(!['localhost:8777','127.0.0.1:8777'].includes(req.headers.host))return reply(403,{error:'Localhost only'});
 if(req.url.startsWith('/__news')) {
  if(req.method!=='POST'||req.headers.origin!==`http://${req.headers.host}`||req.headers['content-type']!=='application/json')return reply(403,{error:'Same-origin JSON required'});
  try {
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>12000)throw Error('Too large');}
   const b=JSON.parse(raw);let result;
   if(b.action==='status')result={moderator:true,label:'Nate, the creator'};
   else if(b.action==='discussion'){
    const operation=['list','create','like','delete'].includes(b.operation)?b.operation:'invalid';
    if(operation==='create'&&(typeof b.body!=='string'||b.body.length>1000))throw Error('Invalid comment');
    const rows=await query(`select news_private.discussion(${quote(operation)},${uuid(b.id)},${b.body===undefined?'null':quote(b.body)},${b.parent?uuid(b.parent):'null'},${quote(b.kind||'suggestion')},null,true) data`);result=rows[0].data;
   }
   else if(b.action==='reply'||b.action==='deleteReply'){
    if(b.action==='reply'&&(typeof b.body!=='string'||!b.body.trim()||b.body.length>1000))throw Error('Invalid reply');
    result=await query(`select news_private.reply_action(${quote(b.action==='reply'?'create':'delete')},${uuid(b.id)},${b.action==='reply'?quote(b.body):'null'},null,true)`);
   }
   else if(b.action==='postLike') {await query(`update news_private.posts set local_liked=not local_liked where id=${uuid(b.id)}`);result={};}
   else if(b.action==='suggestionLike') {await query(`select news_private.toggle_suggestion(${uuid(b.id)},null,true)`);result={};}
   else if(b.action==='suggestionLikes') {result=await query("select comment from news_private.suggestion_likes where actor='local_creator'");}
   else if(b.action==='chat'){
    if(b.body!==undefined){
     if(typeof b.body!=='string'||!b.body.trim()||b.body.length>2000)throw Error('Invalid message');
     await query(`insert into news_private.chat(owner,local_creator,body) values(null,true,${quote(b.body.trim())})`);
    }
    result=await query(`select c.id,c.body,c.created_at,case when c.local_creator then 'Nate, the creator' else t.label end as label,c.local_creator as mine from (select * from news_private.chat order by id desc limit 100) c left join news_private.team t on t.owner=c.owner order by c.id`);
   }
   else if(b.action==='publish'){
    if(typeof b.title!=='string'||typeof b.body!=='string'||!b.title.trim()||!b.body.trim()||b.title.length>120||b.body.length>4000)throw Error('Invalid post');
    await query(`insert into news_private.posts(title,body) values(${quote(b.title.trim())},${quote(b.body.trim())})`);result={};
   }else if(b.action==='delete') {await query(`delete from news_private.comments where id=${uuid(b.id)}`);result={};}
   else if(b.action==='deletePost'){await query(`delete from news_private.posts where id=${uuid(b.id)}`);result={};}
   else if(b.action==='block') {await query(`insert into news_private.people(owner,blocked) select owner,true from news_private.comments where id=${uuid(b.id)} on conflict(owner) do update set blocked=true`);result={};}
   else if(b.action==='blocked'){result=await query('select p.owner,i.handle from news_private.people p left join accounts_private.identities i on i.owner=p.owner where p.blocked');}
   else if(b.action==='unblock'){await query(`update news_private.people set blocked=false where owner=${uuid(b.id)}`);result={};}
   else throw Error('Unknown action');
   reply(200,result);
  }catch {reply(400,{error:'Moderator request failed. Check the local server configuration.'});}return;
 }
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/leaderboard-config.json')return reply(200,publicConfig);
  const file=resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+'/'))return reply(403,{});
  const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm','.mp3':'audio/mpeg','.mp4':'video/mp4','.jpg':'image/jpeg','.webp':'image/webp'})[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{reply(404,{error:'Not found'});}
});
server.listen(8777,'127.0.0.1',()=>console.log('Private news moderator and preview: http://localhost:8777/'));
