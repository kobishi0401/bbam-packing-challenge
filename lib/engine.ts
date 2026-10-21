import { aggregate, equalItems, key, validItems, type Item } from './catalog';
import { ordersFor } from './orders';
export type Event = {type:'shipment';at:number;items:Item[]} | {type:'reply';at:number;text:string};
export function validateEvents(events:unknown,started:number,deadline:number,now:number): asserts events is Event[] {
 if(!Array.isArray(events)||events.length>8) throw new Error('測驗紀錄格式不正確');
 let shipments=0,replies=0,last=started;
 for(const e of events){
  if(!Number.isFinite(e.at)||e.at<last||e.at>=deadline||e.at>now+2000) throw new Error('操作時間超出測驗範圍');
  const replyRequired=shipments===2&&replies<2;
  if(replyRequired){if(e.type!=='reply'||typeof e.text!=='string'||!e.text.trim()||e.text.length>20000) throw new Error('請先完成客服回覆');replies++;}
  else {if(e.type!=='shipment'||shipments>=6||!validItems(e.items,deadline-started===300000)) throw new Error('出貨紀錄無效');shipments++;}
  last=e.at;
 }
}
export function difference(expected:Item[],actual:Item[]){
 const a=aggregate(expected),b=aggregate(actual); const missing:Item[]=[],extra:Item[]=[];
 for(const x of a){const n=x.quantity-(b.find(y=>key(x)===key(y))?.quantity||0);if(n>0)missing.push({...x,quantity:n});}
 for(const x of b){const n=x.quantity-(a.find(y=>key(x)===key(y))?.quantity||0);if(n>0)extra.push({...x,quantity:n});}
 const changes:{fields:string[];expected:Item;actual:Item}[]=[];
 for(const x of missing){const matches=extra.filter(y=>[x.product!==y.product,x.color!==y.color,x.size!==y.size].filter(Boolean).length===1);if(matches.length===1){const y=matches[0]; const reverse=missing.filter(z=>[z.product!==y.product,z.color!==y.color,z.size!==y.size].filter(Boolean).length===1);if(reverse.length===1)changes.push({fields:[x.product!==y.product?'款式':'',x.color!==y.color?'顏色':'',x.size!==y.size?'尺寸':''].filter(Boolean),expected:x,actual:y});}}
 const quantities=a.filter(x=>b.some(y=>key(x)===key(y)&&x.quantity!==y.quantity)).map(x=>({expected:x,actual:b.find(y=>key(x)===key(y))!}));
 return {missing,extra,changes,quantities};
}
export function result(row:{id:string;name:string;started:number;deadline:number;events:string;synced:number;delayed:number},now=Date.now()){
 const orders=ordersFor(row);
 const events:Event[]=JSON.parse(row.events); let index=0,last=row.started; const shipments:any[]=[];const replies:any[]=[];
 for(const e of events){if(e.type==='shipment'){const o=orders[index++]; shipments.push({id:o.id,correct:equalItems(o.items,e.items),at:e.at,duration:e.at-last,expected:o.items,actual:aggregate(e.items),difference:difference(o.items,e.items)});}else replies.push({text:e.text,at:e.at,duration:e.at-last});last=e.at;}
 const complete=shipments.length===6;const ended=complete?last:now>=row.deadline?row.deadline:null;
 for(let n=shipments.length;n<6;n++)shipments.push({id:orders[n].id,correct:null,at:null,duration:null,expected:orders[n].items,actual:[],difference:null});
 const correct=shipments.filter(s=>s.correct===true).length,wrong=shipments.filter(s=>s.correct===false).length;
 return {id:row.id,name:row.name,started:row.started,ended,elapsed:(ended??Math.min(now,row.deadline))-row.started,status:complete?'完成':ended?'逾時':'進行中',correct,wrong,unfinished:6-correct-wrong,accuracy:correct/6*100,shipments,replies,synced:row.synced,delayed:!!row.delayed};
}
