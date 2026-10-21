// Isolated local integration test. Never targets production.
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium,webkit}=createRequire(import.meta.url)(process.env.BBAM_PLAYWRIGHT||'playwright');
const base='http://127.0.0.1:8787';
execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command','DELETE FROM tests; DELETE FROM admin_sessions; DELETE FROM settings;'],{stdio:'pipe'});
const headers={origin:base,'content-type':'application/json','oai-authenticated-user-id':'restart-qa','oai-authenticated-user-email':'qa@sites.test'};
const setup=await fetch(base+'/api/service',{method:'POST',headers,body:JSON.stringify({action:'setup',password:randomBytes(24).toString('hex')})});assert.equal(setup.status,200);const cookie=setup.headers.get('set-cookie').split(';')[0];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
 const context=await browser.newContext();const page=await context.newPage();
 await page.goto(base);await page.locator('#candidate').fill('重新開始驗收');await page.getByRole('button',{name:'開始測驗',exact:false}).click();await page.getByRole('heading',{name:'BB-101'}).waitFor();
 assert.equal(await page.locator('.product-card').count(),17);
 for(const id of ['G','M','N','O','H','P','Q']){await page.locator('.product-card').filter({has:page.locator('.card-code',{hasText:new RegExp('^'+id+'$')})}).click();assert.equal(await page.locator('.size-options').isVisible(),false);await page.locator('.color-options button').nth(1).click();await page.getByRole('button',{name:'加入包裝袋',exact:false}).click();}
 assert.equal(await page.locator('.bag-item').count(),7);
 const old=await page.evaluate(async()=>{const t=JSON.parse(localStorage.getItem('bbam.active.v1'));t.events=[];for(let n=0;n<6;n++){t.events.push({type:'shipment',at:Date.now()+t.offset,items:t.orders[n].items});if(n===1)for(const text of ['測試一','測試二'])t.events.push({type:'reply',at:Date.now()+t.offset,text});}localStorage.setItem('bbam.active.v1',JSON.stringify(t));return {id:t.id};});
 await page.reload();await page.getByText('測驗結果已提交',{exact:true}).waitFor();await page.getByRole('heading',{name:'我的測驗結果',exact:true}).waitFor();
 // A failed save must retain the previous candidate and allow retry.
 await context.setOffline(true);await page.getByRole('button',{name:'開始新測驗',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')).id),old.id);
 await context.setOffline(false);await page.getByRole('button',{name:'開始新測驗',exact:true}).click();await page.locator('#candidate').waitFor();assert.equal(await page.locator('#candidate').inputValue(),'');assert.equal(await page.evaluate(()=>localStorage.getItem('bbam.active.v1')),null);
 await page.locator('#candidate').fill('下一位驗收');await page.getByRole('button',{name:'開始測驗',exact:false}).click();await page.getByRole('heading',{name:'BB-101'}).waitFor();const fresh=await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')));assert.notEqual(fresh.id,old.id);assert.equal(fresh.events.length,0);assert.equal(fresh.deadline-fresh.started,600000);
 const records=await fetch(base+'/api/service',{method:'POST',headers:{...headers,cookie},body:JSON.stringify({action:'list'})}).then(r=>r.json());assert.ok(records.records.some(r=>r.id===old.id&&r.status==='完成'));
 console.log(engine.name()+': PASS anonymous restart, failed-sync retention, clean next candidate, old record preserved');
 }finally{await browser.close();}
}

