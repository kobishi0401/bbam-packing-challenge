import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
const base='http://127.0.0.1:8787';
const owner={'oai-authenticated-user-id':'bbam-public-qa','oai-authenticated-user-email':'qa@sites.test'};
async function call(body,headers={}){const r=await fetch(base+'/api/service',{method:'POST',headers:{origin:base,'content-type':'application/json',...headers},body:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const password=randomBytes(24).toString('hex');
assert.equal((await call({action:'setup',password})).status,401);
assert.equal((await call({action:'setup',password},{...owner,'oai-authenticated-user-email':'other@sites.test'})).status,403);
const setup=await call({action:'setup',password},owner);assert.equal(setup.status,200);
assert.equal((await call({action:'list'})).status,401);
assert.equal((await call({action:'delete',id:'test'})).status,401);
assert.equal((await call({action:'list'},{cookie:setup.cookie})).status,401);
assert.equal((await call({action:'list'},{...owner,cookie:setup.cookie})).status,200);
const id=randomUUID(),token=randomBytes(32).toString('hex');
const started=await call({action:'start',id,token,name:'匿名驗收'});assert.equal(started.status,200);assert.equal(started.body.orders.length,6);
assert.equal((await call({action:'sync',id,token,events:[],progress:{bag:[],draft:''}})).status,200);
assert.equal((await call({action:'sync',id,token:'wrong',events:[],progress:{bag:[],draft:''}})).status,404);
assert.equal(started.body.deadline-started.body.started,600000);
assert.equal((await call({action:'result',id,token})).status,409);
const events=[];
for(let n=0;n<6;n++){events.push({type:'shipment',at:Date.now(),items:started.body.orders[n].items});if(n===1)for(const text of ['匿名回覆一\n保留原文','匿名回覆二'])events.push({type:'reply',at:Date.now(),text});}
assert.equal((await call({action:'sync',id,token,events,progress:{bag:[],draft:''}})).status,200);
const own=await call({action:'result',id,token});assert.equal(own.status,200);assert.equal(own.body.report.correct,6);assert.equal(own.body.report.replies[0].text,'匿名回覆一\n保留原文');
assert.equal((await call({action:'result',id,token:randomBytes(32).toString('hex')})).status,404);
assert.equal((await call({action:'result',id:randomUUID(),token})).status,404);
assert.equal((await call({action:'delete',id},{...owner,cookie:setup.cookie})).status,200);
console.log('PASS: anonymous start/sync, owner-only setup, authenticated admin results, unauthorized list/delete, wrong token');
