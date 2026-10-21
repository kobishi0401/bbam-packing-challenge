import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { orders, ordersFor } from '../../../lib/orders';
import { validateEvents, result, type Event } from '../../../lib/engine';
import { validItems } from '../../../lib/catalog';
export const dynamic='force-dynamic';
const db=()=>{if(!env.DB)throw new Error('資料庫未設定');return env.DB;};
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
async function passwordHash(password:string,salt:string){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},k,256)),b=>b.toString(16).padStart(2,'0')).join('');}
const json=(body:unknown,status=200,cookie?:string)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(cookie?{'Set-Cookie':cookie}:{})}});
const cookie=(value:string,req:Request,age=1800)=>`bbam_admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
async function admin(req:Request){const user=await getChatGPTUser();const token=req.headers.get('cookie')?.match(/(?:^|;\s*)bbam_admin=([^;]+)/)?.[1];if(!user||!token)return false;return !!await db().prepare('SELECT hash FROM admin_sessions WHERE hash=? AND owner=? AND expires>?').bind(await hash(token),user.userId,Date.now()).first();}
export async function GET(req:Request){try {const setting=await db().prepare('SELECT id FROM settings WHERE id=1').first();const user=await getChatGPTUser();return json({setupRequired:!setting,signedIn:!!user,admin:await admin(req),serverNow:Date.now()});}catch{return json({error:'無法連接資料庫，請稍後重試'},503);}}
export async function POST(req:Request){
 try {
  if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'來源驗證失敗'},403);
  if(Number(req.headers.get('content-length')||0)>200000)return json({error:'資料過大'},413);
  const raw=await req.text();if(raw.length>200000)return json({error:'資料過大'},413);const b=JSON.parse(raw);const now=Date.now();
  if(b.action==='setup'||b.action==='login'){
   const user=await getChatGPTUser();if(!user)return json({error:'請先登入網站擁有者的 ChatGPT 帳號'},401);
   const s:any=await db().prepare('SELECT * FROM settings WHERE id=1').first();
   if(b.action==='setup'){
    if(s)return json({error:'管理員已設定，請登入'},409);
    const ownerEmail=(env as unknown as {ADMIN_OWNER_EMAIL?:string}).ADMIN_OWNER_EMAIL;
    if(!ownerEmail||user.email.toLowerCase()!==ownerEmail.toLowerCase())return json({error:'只有網站擁有者可以設定管理員'},403);
    if(typeof b.password!=='string'||b.password.length<12||b.password.length>200)return json({error:'請設定至少 12 個字元的密碼'},400);
    const salt=random();await db().prepare('INSERT INTO settings(id,owner,salt,password) VALUES(1,?,?,?)').bind(user.userId,salt,await passwordHash(b.password,salt)).run();
   }else{
    if(!s||s.blocked_until>now)return json({error:'暫時無法登入，請 15 分鐘後重試'},429);
    if(typeof b.password!=='string'||b.password.length>200||s.owner!==user.userId||await passwordHash(b.password,s.salt)!==s.password){await db().prepare('UPDATE settings SET failures=failures+1, blocked_until=CASE WHEN failures>=4 THEN ? ELSE blocked_until END WHERE id=1').bind(now+900000).run();return json({error:'帳號或管理密碼不正確'},401);}
    await db().prepare('UPDATE settings SET failures=0,blocked_until=0 WHERE id=1').run();
   }
   const token=random();await db().prepare('INSERT INTO admin_sessions(hash,owner,expires) VALUES(?,?,?)').bind(await hash(token),user.userId,now+1800000).run();return json({ok:true},200,cookie(token,req));
  }
  if(b.action==='logout'){
   const token=req.headers.get('cookie')?.match(/(?:^|;\s*)bbam_admin=([^;]+)/)?.[1];if(token)await db().prepare('DELETE FROM admin_sessions WHERE hash=?').bind(await hash(token)).run();return json({ok:true},200,cookie('',req,0));
  }
  if(b.action==='list'||b.action==='delete'){
   if(!await admin(req))return json({error:'請登入面試官管理區'},401);
   if(b.action==='delete'){if(typeof b.id!=='string')return json({error:'紀錄不存在'},400);await db().prepare('DELETE FROM tests WHERE id=?').bind(b.id).run();return json({ok:true});}
   const all=await db().prepare('SELECT id,name,started,deadline,events,synced,delayed FROM tests ORDER BY started DESC').all<any>();return json({records:all.results.map(r=>result(r,now))});
  }
  if(b.action==='start'){
   if(!await db().prepare('SELECT id FROM settings WHERE id=1').first())return json({error:'請面試官先完成管理員設定'},409);
   if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>80||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token)||typeof b.id!=='string'||!/^[a-f0-9-]{36}$/.test(b.id))return json({error:'請填寫有效姓名'},400);
   const h=await hash(b.token);const existing:any=await db().prepare('SELECT * FROM tests WHERE id=?').bind(b.id).first();
   if(existing){if(existing.token_hash!==h)return json({error:'測驗驗證失敗'},403);return json({id:existing.id,started:existing.started,deadline:existing.deadline,orders:ordersFor(existing),serverNow:now},200,cookie('',req,0));}
   await db().prepare('INSERT INTO tests(id,token_hash,name,started,deadline,events,progress,synced) VALUES(?,?,?,?,?,?,?,?)').bind(b.id,h,b.name.trim(),now,now+600000,'[]','{}',now).run();
   // A candidate must never inherit an unlocked interviewer session.
   const old=req.headers.get('cookie')?.match(/(?:^|;\s*)bbam_admin=([^;]+)/)?.[1];if(old)await db().prepare('DELETE FROM admin_sessions WHERE hash=?').bind(await hash(old)).run();
   return json({id:b.id,started:now,deadline:now+600000,orders,serverNow:now},200,cookie('',req,0));
  }
  if(b.action==='result'){
   if(typeof b.id!=='string'||typeof b.token!=='string')return json({error:'測驗驗證失敗'},403);
   const row:any=await db().prepare('SELECT * FROM tests WHERE id=? AND token_hash=?').bind(b.id,await hash(b.token)).first();
   if(!row)return json({error:'測驗不存在或驗證失敗'},404);
   const report=result(row,now);
   if(!report.ended)return json({error:'測驗結束後才能查看結果'},409);
   return json({report});
  }
  if(b.action==='sync'){
   if(typeof b.id!=='string'||typeof b.token!=='string')return json({error:'測驗驗證失敗'},403);
   const row:any=await db().prepare('SELECT * FROM tests WHERE id=? AND token_hash=?').bind(b.id,await hash(b.token)).first();if(!row)return json({error:'測驗已刪除或驗證失敗，請聯絡面試官'},404);
   validateEvents(b.events,row.started,row.deadline,now);
   const old:Event[]=JSON.parse(row.events);if(b.events.length<old.length||JSON.stringify(b.events.slice(0,old.length))!==JSON.stringify(old))return json({error:'此測驗已在另一個分頁更新，請停止操作並通知面試官'},409);
   if(!b.progress||!validItems(b.progress.bag,row.deadline-row.started===300000)||typeof b.progress.draft!=='string'||b.progress.draft.length>20000)return json({error:'暫存資料格式不正確'},400);
   const last=b.events.at(-1)?.at;const delayed=row.delayed||(b.events.length>old.length&&last&&now-last>15000)?1:0;
   const updated=await db().prepare('UPDATE tests SET events=?,progress=?,synced=?,revision=revision+1,delayed=? WHERE id=? AND revision=?').bind(JSON.stringify(b.events),JSON.stringify(b.progress),now,delayed,b.id,row.revision).run();
   if(!updated.meta.changes)return json({error:'同步衝突，請重試'},409);
   return json({ok:true,serverNow:now,accepted:b.events.length});
  }
  return json({error:'不支援的操作'},400);
 }catch(e){return json({error:e instanceof Error&&/操作時間|紀錄格式|先完成客服|出貨紀錄/.test(e.message)?e.message:'儲存失敗，請檢查連線後重試'},400);}
}

