// Local-only integration QA. This script never targets a deployed Site.
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import http from 'node:http';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.BBAM_PLAYWRIGHT||'playwright');
const base='http://127.0.0.1:8788';
let networkUp=true;
const proxy=http.createServer((req,res)=>{if(!networkUp){req.socket.destroy();return;}const upstream=http.request('http://127.0.0.1:8787'+req.url,{method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});upstream.on('error',()=>res.destroy());req.pipe(upstream);});
await new Promise(resolve=>proxy.listen(8788,'127.0.0.1',resolve));
const password=randomBytes(24).toString('hex');
const only=process.env.BBAM_BROWSER;
const results=only?JSON.parse(await readFile('work/qa/results.json','utf8')).filter(r=>r.browser!==only&&r.status==='passed'):[];
await mkdir('work/qa',{recursive:true});
function sql(command){execFileSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',command],{stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});}
// Only the isolated local D1 used by this project is reset.
sql('DELETE FROM tests;');sql('DELETE FROM admin_sessions;');sql('DELETE FROM settings;');
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 if(only&&name!==only)continue;
 let browser;
 try{
  browser=await engine.launch({headless:true});
  const landscape=name==='WebKit'?{width:1024,height:768}:{width:1194,height:834};
  const portrait=name==='WebKit'?{width:768,height:1024}:{width:834,height:1194};
  const context=await browser.newContext({viewport:landscape,hasTouch:true,isMobile:true,deviceScaleFactor:1,extraHTTPHeaders:{'oai-authenticated-user-id':'bbam-local-qa','oai-authenticated-user-email':'qa@sites.test'}});
  const page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(20000);const errors=[],networkDiagnostics=[];page.on('pageerror',e=>{if(/api\/service due to access control checks/.test(e.message))networkDiagnostics.push(e.message);else errors.push(e.message);});console.log(name,'開始驗收');
  const call=body=>page.evaluate(async b=>{const r=await fetch('/api/service',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return {status:r.status,body:await r.json()};},body);
  await page.goto(base+'/admin');await page.waitForSelector('#password');
  const setup=await page.locator('#confirm').count();await page.locator('#password').fill(password);if(setup)await page.locator('#confirm').fill(password);
  await page.getByRole('button',{name:setup?'設定並進入':'登入管理區',exact:true}).click();await page.getByRole('heading',{name:'出貨測驗結果'}).waitFor();
  await page.getByRole('button',{name:'開始新測驗 →',exact:true}).click();await page.locator('#candidate').waitFor();
  if(name==='Chromium')await page.screenshot({path:'work/qa/01-start.png',fullPage:true});
  await page.locator('#candidate').fill('驗收測試 '+name);await page.getByRole('button',{name:'開始測驗',exact:false}).tap();await page.getByRole('heading',{name:'BB-101'}).waitFor();
  let local=await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')));
  const originalDeadline=local.deadline;
  assert.equal((await call({action:'list'})).status,401,'candidate cannot read other results'); assert.equal(local.deadline-local.started,600000); assert.equal((await call({action:'result',id:local.id,token:local.token})).status,409); assert.equal(await page.locator('.product-card').count(),17);
  const add=async(p,c,s,q=1)=>{await page.locator('.product-card').filter({has:page.locator('.card-code',{hasText:p})}).click();await page.getByRole('button',{name:c+'色',exact:true}).click();if(s!=='單一尺寸')await page.locator('.size-options').getByRole('button',{name:s,exact:true}).click();for(let n=0;n<q;n++)await page.getByRole('button',{name:'加入包裝袋'}).click();};
  // Color rendering, repeated add, remove and clear all exercised through UI.
  await add('A','粉','M',2);assert.equal(await page.locator('.product-card.selected svg').getAttribute('aria-label'),'A 款細肩帶瑜伽上衣 粉色');
  await page.getByRole('button',{name:'移除一件 A 粉 M'}).click();
  assert.equal(await page.locator('.quantity span').innerText(),'1');
  await page.getByRole('button',{name:'清空',exact:true}).click();await page.getByRole('button',{name:'確認清空',exact:true}).click();assert.equal(await page.locator('.bag-item').count(),0);
  const shipments=local.orders;
  const submit=async()=>{await page.locator('.bag-footer').getByRole('button',{name:'確認出貨'}).click();await page.getByRole('dialog').getByRole('button',{name:'確認出貨',exact:true}).click();};
  const firstTimer=await page.locator('.timer strong').innerText();await page.waitForTimeout(1300);assert.notEqual(await page.locator('.timer strong').innerText(),firstTimer);
  for(const i of shipments[0].items)await add(i.product,i.color,i.size,i.quantity);
  if(name==='Chromium')await page.screenshot({path:'work/qa/02-packing-landscape.png',fullPage:true});
  await page.reload();await page.getByRole('heading',{name:'BB-101'}).waitFor();await page.waitForFunction(()=>!document.body.innerText.includes('另一個分頁開啟'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')).deadline),originalDeadline);
  assert.equal(await page.locator('.bag-item').count(),3);
  await submit();await page.getByRole('heading',{name:'BB-102'}).waitFor();
  for(const i of shipments[1].items)await add(i.product,i.product==='A'?'灰':i.color,i.size,i.quantity);
  await submit();await page.getByRole('heading',{name:'緊急客服訊息'}).waitFor();
  const csTimer=await page.locator('.timer strong').innerText();await page.waitForTimeout(1300);assert.notEqual(await page.locator('.timer strong').innerText(),csTimer);
  assert.ok(await page.getByRole('button',{name:'送出回覆 →'}).isDisabled());
  const reply1='  第一則測試回覆：\n保留換行、空白與原文。  ';const reply2='第二則測試回覆\n我會確認退貨方式與退款時程。';
  await page.locator('#reply').fill(reply1);
  if(name==='Chromium')await page.screenshot({path:'work/qa/03-customer.png',fullPage:true});
  await page.getByRole('button',{name:'送出回覆 →'}).click();await page.getByText('所以現在是怎樣？你們每次都只會說不好意思嗎？講這些有什麼用？',{exact:true}).waitFor();
  await page.locator('#reply').fill(reply2);await page.getByRole('button',{name:'送出回覆 →'}).click();await page.getByRole('heading',{name:'BB-103'}).waitFor();
  await page.setViewportSize(portrait);assert.ok(await page.locator('.bag-footer .primary').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(name==='Chromium')await page.screenshot({path:'work/qa/04-packing-portrait.png',fullPage:true});
  await page.setViewportSize(landscape);
  console.log(name,'離線前快取',await page.evaluate(async()=>({controller:!!navigator.serviceWorker.controller,cache:!!await caches.match('/'),keys:await caches.keys(),registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({active:r.active?.state,waiting:r.waiting?.state,installing:r.installing?.state}))})));
  await page.waitForFunction(async()=>!!navigator.serviceWorker.controller&&!!await caches.match('/'));
  networkUp=false;
  for(const i of shipments[2].items)await add(i.product,i.color,i.size,i.quantity);
  await page.reload();await page.getByRole('heading',{name:'BB-103'}).waitFor();await page.waitForFunction(()=>!document.body.innerText.includes('另一個分頁開啟'));
  assert.equal(await page.locator('.bag-item').count(),shipments[2].items.length);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')).deadline),originalDeadline);
  await submit();await page.getByRole('heading',{name:'BB-104'}).waitFor();
  networkUp=true;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  for(let n=3;n<6;n++){for(const i of shipments[n].items)await add(i.product,i.color,i.size,i.quantity);await submit();}
  await page.getByRole('heading',{name:'測驗結束',exact:true}).waitFor();await page.getByText('測驗結果已提交',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'我的測驗結果',exact:true}).waitFor(); await page.locator('.own-result').getByText('83.3%',{exact:true}).waitFor();
  local=await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')));
  assert.equal((await call({action:'result',id:local.id,token:'invalid'})).status,404); const own=(await call({action:'result',id:local.id,token:local.token})).body.report; assert.equal(own.correct,5); assert.equal(own.replies[0].text,reply1); if(name==='Chromium')await page.screenshot({path:'work/qa/06-own-result.png',fullPage:true});
  const tampered=structuredClone(local.events);tampered[0].items=[];assert.equal((await call({action:'sync',id:local.id,token:local.token,events:tampered,progress:{bag:[],draft:''}})).status,409);
  assert.equal((await call({action:'sync',id:local.id,token:'invalid',events:[],progress:{bag:[],draft:''}})).status,404);
  await page.goto(base+'/admin');await page.locator('#password').fill(password);await page.getByRole('button',{name:'登入管理區',exact:true}).click();await page.getByRole('heading',{name:'出貨測驗結果'}).waitFor();
  const saved=(await call({action:'list'})).body.records.find(r=>r.id===local.id);assert.equal(saved.correct,5);assert.equal(saved.wrong,1);assert.equal(saved.unfinished,0);assert.equal(saved.replies[0].text,reply1);assert.equal(saved.replies[1].text,reply2);assert.equal(saved.shipments[1].difference.changes[0].fields[0],'顏色');
  await page.locator('tr').filter({hasText:'BB-102'}).getByRole('button',{name:'查看明細'}).click();await page.getByText('顏色不符：',{exact:true}).waitFor();
  if(name==='Chromium')await page.screenshot({path:'work/qa/05-results.png',fullPage:true});
  const csvPromise=page.waitForEvent('download');await page.getByRole('button',{name:'匯出本筆 CSV',exact:true}).click();const csv=await csvPromise;await csv.saveAs(`work/qa/${name}-result.csv`);const csvText=await readFile(`work/qa/${name}-result.csv`,'utf8');assert.ok(csvText.includes(reply1));assert.ok(csvText.includes('BB-106'));
  const txtPromise=page.waitForEvent('download');await page.getByRole('button',{name:'匯出客服回覆原文',exact:true}).click();const txt=await txtPromise;await txt.saveAs(`work/qa/${name}-reply.txt`);assert.ok((await readFile(`work/qa/${name}-reply.txt`,'utf8')).includes(reply2));
  await page.getByRole('button',{name:'開始新測驗 →'}).click();await page.locator('#candidate').fill('逾時測試 '+name);await page.getByRole('button',{name:'開始測驗',exact:false}).click();await page.getByRole('heading',{name:'BB-101'}).waitFor();
  const timeout=await page.evaluate(()=>JSON.parse(localStorage.getItem('bbam.active.v1')));const ending=Date.now()+2500;
  // Accelerate only this local database fixture; production timer remains 10 minutes.
  sql(`UPDATE tests SET started=${ending-600000},deadline=${ending} WHERE id='${timeout.id}';`);
  await page.evaluate(({ending})=>{const t=JSON.parse(localStorage.getItem('bbam.active.v1'));t.started=ending-600000;t.deadline=ending;t.clock=Date.now();t.offset=0;localStorage.setItem('bbam.active.v1',JSON.stringify(t));},{ending});
  await page.reload();await page.getByRole('heading',{name:'測驗結束',exact:true}).waitFor();await page.getByText('測驗結果已提交',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'加入包裝袋'}).count(),0);
  await page.goto(base+'/admin');await page.locator('#password').fill(password);await page.getByRole('button',{name:'登入管理區',exact:true}).click();await page.getByRole('heading',{name:'出貨測驗結果'}).waitFor();const timed=(await call({action:'list'})).body.records.find(r=>r.id===timeout.id);assert.equal(timed.status,'逾時');assert.equal(timed.elapsed,600000);assert.equal(timed.unfinished,6);
  await page.locator('.history-item').filter({hasText:'逾時測試 '+name}).click();await page.getByRole('button',{name:'刪除此筆測驗紀錄',exact:true}).click();await page.getByRole('button',{name:'確認刪除',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.ok(!(await call({action:'list'})).body.records.some(r=>r.id===timeout.id));
  assert.deepEqual(errors,[]);results.push({browser:name,status:'passed',networkDiagnostics,checks:['start','svg-colors','add-remove-repeat-clear','six-orders','wrong-color','timer','refresh','two-replies','offline-reload-sync','portrait','server-auth','immutable-submission','CSV','raw-text','timeout','delete']});
  await context.close();
 }catch(e){results.push({browser:name,status:'failed',error:e.stack});console.error(name,e);}
 finally{networkUp=true;if(browser)await browser.close();}
}
proxy.closeAllConnections();await new Promise(resolve=>proxy.close(resolve));await writeFile('work/qa/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.status!=='passed'))process.exitCode=1;


