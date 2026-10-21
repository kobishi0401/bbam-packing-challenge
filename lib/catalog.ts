export type Item = { product: string; color: string; size: string; quantity: number };
export const colors: Record<string,string> = { 黑:'#383a38', 灰:'#969b99', 粉:'#cda5a2', 藍:'#6f8d9c', 綠:'#869482', 白:'#eeeae0', 卡其:'#b5a48c', 紫:'#a19ab5' };
export const products = [
 { id:'A', name:'細肩帶瑜伽上衣', category:'上衣', colors:['黑','灰','粉'], sizes:['S','M','L'] },
 { id:'B', name:'交叉美背瑜伽上衣', category:'上衣', colors:['黑','藍','綠'], sizes:['S','M','L'] },
 { id:'C', name:'長版瑜伽背心', category:'上衣', colors:['黑','白','卡其'], sizes:['S','M','L'] },
 { id:'D', name:'高腰無縫瑜伽褲', category:'褲裝', colors:['黑','灰','粉'], sizes:['S','M','L'] },
 { id:'E', name:'口袋瑜伽褲', category:'褲裝', colors:['黑','藍','綠'], sizes:['S','M','L'] },
 { id:'F', name:'喇叭瑜伽褲', category:'褲裝', colors:['黑','紫','卡其'], sizes:['S','M','L'] },
 { id:'G', name:'運動襪', category:'配件', colors:['白','黑','灰'], sizes:['單一尺寸'] },
 { id:'H', name:'髮圈', category:'配件', colors:['粉','黑'], sizes:['單一尺寸'] },
 { id:'I', name:'短袖瑜伽上衣', category:'上衣', colors:['黑','白','粉'], sizes:['S','M','L'] },
 { id:'J', name:'長袖拉鍊外套', category:'上衣', colors:['黑','灰','卡其'], sizes:['S','M','L'] },
 { id:'K', name:'五分瑜伽褲', category:'褲裝', colors:['黑','藍','紫'], sizes:['S','M','L'] },
 { id:'L', name:'交叉腰瑜伽短褲', category:'褲裝', colors:['黑','灰','綠'], sizes:['S','M','L'] },
 {id:'M',name:'踝襪',category:'配件',colors:['白','黑','粉'],sizes:['單一尺寸']},
 {id:'N',name:'止滑瑜伽襪',category:'配件',colors:['黑','灰','紫'],sizes:['單一尺寸']},
 {id:'O',name:'長筒運動襪',category:'配件',colors:['白','黑','藍'],sizes:['單一尺寸']},
 {id:'P',name:'細版彈力髮圈',category:'配件',colors:['黑','灰','粉'],sizes:['單一尺寸']},
 {id:'Q',name:'蝴蝶結髮圈',category:'配件',colors:['黑','粉','卡其'],sizes:['單一尺寸']},
];
export const productById = (id: string) => products.find(p=>p.id===id)!;
export const key = (i: Item) => `${i.product}|${i.color}|${i.size}`;
export function validItems(items: unknown, legacySockSizes=false): items is Item[] { return Array.isArray(items) && items.length<=100 && items.every(i=>{ const p=products.find(p=>p.id===i?.product); return p && p.colors.includes(i.color) && (p.sizes.includes(i.size)||(legacySockSizes&&i.product==='G'&&['S','M','L'].includes(i.size))) && Number.isInteger(i.quantity) && i.quantity>0 && i.quantity<=99; }); }
export function aggregate(items: Item[]) { const m=new Map<string,Item>(); for(const i of items){const k=key(i);m.set(k,{...i,quantity:(m.get(k)?.quantity||0)+i.quantity});} return [...m.values()].sort((a,b)=>key(a).localeCompare(key(b))); }
export function equalItems(a: Item[], b: Item[]) { const x=aggregate(a),y=aggregate(b);return x.length===y.length&&x.every((i,n)=>key(i)===key(y[n])&&i.quantity===y[n].quantity); }
export const itemLabel=(i:Item)=>`${i.product} 款 ${productById(i.product).name}｜${i.color}色｜${i.size}｜${i.quantity} 件`;
export const duration=(ms:number)=>{const s=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
export const complaints = [
 ['你們到底是在搞什麼？我買的是一套衣服，結果上下兩件全部寄錯！連這種最基本的事情都做不好，到底有沒有在認真做生意？','我花錢買東西，結果還要幫你們收拾爛攤子？真的很誇張。我現在就要整筆退貨，以後不會再買你們家的東西！'],
 ['所以現在是怎樣？你們每次都只會說不好意思嗎？講這些有什麼用？','我現在就要知道怎麼退貨、什麼時候拿得到錢！不要再給我複製貼上的回覆！'],
];
