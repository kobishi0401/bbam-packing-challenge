'use client';
import {useEffect,useState} from 'react';
import {api} from '../lib/client';
import {complaints,duration,itemLabel,type Item} from '../lib/catalog';
export default function OwnResult({id,token,synced}:{id:string;token:string;synced:boolean}){
 const [report,setReport]=useState<any>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;if(!synced)return;setError('');api({action:'result',id,token}).then(d=>{if(active)setReport(d.report);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[id,token,synced,retry]);
 return <section className="own-result" aria-label="我的測驗結果"><h2>我的測驗結果</h2>{!synced?<p>連線並同步完成後，即可查看本次結果。</p>:error?<><p role="alert">{error}</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>重新載入結果</button></>:!report?<p role="status">正在載入結果…</p>:<>
 <p>{report.name} · {report.status}</p><div className="metrics">{[['正確',report.correct],['錯誤',report.wrong],['未完成',report.unfinished],['正確率',report.accuracy.toFixed(1)+'%']].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
 <p className="metric-note">正確率以全部 6 筆訂單計算。以下為本次測驗的實際紀錄。</p>
 {report.shipments.map((s:any)=><details className="own-order" key={s.id}><summary>{s.id} · {s.correct===null?'未完成':s.correct?'正確':'錯誤'} · {s.duration===null?'—':duration(s.duration)}<span>查看明細</span></summary><div className="comparison"><div><h3>原始訂單</h3>{s.expected.map((i:Item,n:number)=><p key={n}>{itemLabel(i)}</p>)}</div><div><h3>實際出貨</h3>{s.correct===null?<p>未提交出貨</p>:s.actual.length?s.actual.map((i:Item,n:number)=><p key={n}>{itemLabel(i)}</p>):<p>空包裝袋</p>}</div></div>{s.correct===false&&<><h3>差異比較</h3><div className="comparison"><div><h4>缺少商品</h4>{s.difference.missing.length?s.difference.missing.map((i:Item,n:number)=><p key={n}>{itemLabel(i)}</p>):<p>無</p>}</div><div><h4>多出商品</h4>{s.difference.extra.length?s.difference.extra.map((i:Item,n:number)=><p key={n}>{itemLabel(i)}</p>):<p>無</p>}</div></div>{s.difference.changes.map((c:any,n:number)=><p key={n}>{c.fields.join('、')}不符：{itemLabel(c.expected)} → {itemLabel(c.actual)}</p>)}{s.difference.quantities.map((q:any,n:number)=><p key={n}>數量不符：{itemLabel(q.expected)}；實際 {q.actual.quantity} 件</p>)}</>}</details>)}
 <h2>我的客服回覆</h2>{complaints.map((messages,n)=><article className="reply-record" key={n}><h3>第 {n+1} 則 · 回覆耗時 {report.replies[n]?duration(report.replies[n].duration):'—'}</h3><div className="message">{messages.map(m=><p key={m}>{m}</p>)}</div><h4>回覆原文</h4><div className="original-reply">{report.replies[n]?.text??'未送出回覆'}</div></article>)}
 </>}</section>;
}
