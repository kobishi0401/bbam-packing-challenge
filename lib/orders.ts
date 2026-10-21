// Canonical order source is imported only by server modules.
import { validItems, type Item } from './catalog';
export type Order = { id:string; items:Item[] };
const i=(product:string,color:string,size:string,quantity=1):Item=>({product,color,size,quantity});
export const legacyOrders:Order[]=[
 {id:'BB-101',items:[i('B','藍','M'),i('D','黑','S'),i('G','白','單一尺寸',2)]},
 {id:'BB-102',items:[i('A','黑','S'),i('E','藍','M'),i('H','粉','單一尺寸')]},
 {id:'BB-103',items:[i('B','綠','L'),i('F','黑','M'),i('G','黑','單一尺寸')]},
 {id:'BB-104',items:[i('C','卡其','M'),i('D','粉','M'),i('H','黑','單一尺寸',2)]},
 {id:'BB-105',items:[i('A','灰','L'),i('E','黑','L'),i('G','白','單一尺寸')]},
 {id:'BB-106',items:[i('C','白','S'),i('F','紫','S'),i('H','粉','單一尺寸')]},
];
export const fiveMinuteOrders:Order[]=[
 ...legacyOrders.slice(0,2),
 {id:'BB-103',items:[i('I','白','M',2),i('I','白','L'),i('K','黑','M',2),i('G','黑','M',2)]},
 {id:'BB-104',items:[i('B','藍','S',2),i('B','綠','M'),i('J','灰','M'),i('L','綠','S',2),i('G','白','S',2)]},
 {id:'BB-105',items:[i('C','卡其','M',2),i('C','白','L'),i('D','黑','S',2),i('D','粉','M'),i('G','黑','S'),i('G','白','L',2)]},
 {id:'BB-106',items:[i('J','黑','S'),i('J','卡其','M',2),i('F','紫','S',2),i('K','紫','S'),i('L','黑','L',2),i('G','灰','M',2),i('G','灰','L'),i('H','粉','單一尺寸',2)]},
];
export const orders:Order[]=[
 ...legacyOrders.slice(0,2),
 {id:'BB-103',items:[i('I','白','M',2),i('I','白','L'),i('K','黑','M',2),i('M','黑','單一尺寸',2)]},
 {id:'BB-104',items:[i('B','藍','S',2),i('B','綠','M'),i('J','灰','M'),i('L','綠','S',2),i('O','白','單一尺寸',2),i('P','粉','單一尺寸')]},
 {id:'BB-105',items:[i('C','卡其','M',2),i('C','白','L'),i('D','黑','S',2),i('D','粉','M'),i('N','黑','單一尺寸'),i('N','紫','單一尺寸',2),i('Q','卡其','單一尺寸')]},
 {id:'BB-106',items:[i('J','黑','S'),i('J','卡其','M',2),i('F','紫','S',2),i('K','紫','S'),i('L','黑','L',2),i('G','灰','單一尺寸',2),i('O','藍','單一尺寸'),i('H','粉','單一尺寸',2),i('P','黑','單一尺寸'),i('Q','粉','單一尺寸')]},
];
// Released v1 tests have an eight-minute window; retain their original answers.
export const ordersFor=(row:{started:number;deadline:number})=>row.deadline-row.started===480000?legacyOrders:row.deadline-row.started===300000?fiveMinuteOrders:orders;
if(!orders.every(o=>validItems(o.items))) throw new Error('固定訂單規格無效');
