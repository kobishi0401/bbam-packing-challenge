import {colors, productById} from '../lib/catalog';
export default function Garment({id,color='黑',className=''}:{id:string;color?:string;className?:string}){
 const fill=colors[color]; const common={fill,stroke:'#292c2a',strokeWidth:1.3,strokeOpacity:.35,strokeLinejoin:'round' as const};
 return <svg className={className} viewBox="0 0 180 180" role="img" aria-label={`${id} 款${productById(id).name} ${color}色`}>
 {id==='A'&&<g {...common}><path d="M57 27h8l4 39q21 12 42 0l4-39h8l-1 51 14 61q-46 12-92 0l14-61Z"/><path d="M58 78q32 18 64 0M47 125q43 11 86 0" fill="none"/><path d="M69 66q21 12 42 0" fill="none" strokeWidth="3"/></g>}
 {id==='B'&&<g {...common}><path d="m52 35 10-6 59 57-8 9Z"/><path d="m118 29 10 6-59 60-8-9Z"/><path d="M52 84q38 22 76 0l10 50q-48 14-96 0Z"/><path d="M44 121q46 13 92 0" fill="none"/><path d="M73 103q17 5 34 0" fill="none"/></g>}
 {id==='C'&&<g {...common}><path d="M57 24h18q0 23 15 23t15-23h18l-2 37q-1 10 8 17l8 79q-47 12-94 0l8-79q9-7 8-17Z"/><path d="M75 24q0 23 15 23t15-23M57 28q7 42-6 50m72-50q-7 42 6 50M45 148q45 10 90 0" fill="none"/></g>}
 {id==='D'&&<g {...common}><path d="M57 19h66l9 48-15 96h-25l-2-76-2 76H63L48 67Z"/><path d="M53 40q37 7 74 0M90 40v47M62 159h25m6 0h25" fill="none"/></g>}
 {id==='E'&&<g {...common}><path d="M57 19h66l9 48-15 96H93l-3-76-3 76H63L48 67Z"/><path d="M54 37h72M90 37v50M51 55l18 5-3 37-13-4m76-38-18 5 3 37 13-4M69 60l-4 93m46-93 4 93" fill="none" strokeWidth="2"/></g>}
 {id==='F'&&<g {...common}><path d="M58 19h64l6 38-12 55 26 52H94l-4-81-4 81H38l26-52-12-55Z"/><path d="M55 38q35 6 70 0M90 40v43M42 156h44m8 0h44M64 112l5-43m47 43-5-43" fill="none"/></g>}
 {id==='G'&&<g {...common}><path d="M46 34h33v66l-8 25-28 18q-21 9-26-4t12-26l17-13Z"/><path d="M109 44h33v66l-8 25-28 18q-21 9-26-4t12-26l17-13Z"/><path d="M46 46h33m30 10h33M46 54h33m30 10h33M29 113l17 14m46-4 17 14" fill="none"/></g>}
 {id==='H'&&<g {...common}><path fillRule="evenodd" d="M90 38q13-13 25 2 19-2 22 16 17 7 11 25 12 14-1 27 1 18-17 23-8 17-25 10-15 13-28-1-19 3-24-15-17-6-12-25-12-14 1-28-1-18 17-23 9-16 31-11Zm0 28a25 25 0 1 0 0 50 25 25 0 0 0 0-50Z"/><path d="m90 39 0 21m31-12-13 18m35 12-22 5m20 30-22-12m-14 38-8-19m-29 13 10-17M47 98l18-5M61 53l13 16" fill="none"/></g>}
 {id==='I'&&<g {...common}><path d="m59 36 18-8q13 16 26 0l18 8 29 31-20 21-13-14 6 62H57l6-62-13 14-20-21Z"/><path d="M77 28q13 23 26 0M59 126h62M43 58l18 16m58 0 18-16" fill="none"/></g>}
 {id==='J'&&<g {...common}><path d="M73 23h34l5 19 19 10 25 94-23 7-18-66 5 68H60l5-68-18 66-23-7 25-94 19-10Z"/><path d="M90 25v130M73 23l17 26 17-26M65 105l15-10m20 0 15 10M61 145h58" fill="none" strokeWidth="2"/></g>}
 {id==='K'&&<g {...common}><path d="M57 36h66l9 43-9 59H94l-4-52-4 52H57l-9-59Z"/><path d="M54 55h72M90 55v31M57 129h29m8 0h29" fill="none"/></g>}
 {id==='L'&&<g {...common}><path d="m57 51 33 14 33-14 12 64-39 6-6-34-6 34-39-6Z"/><path d="m57 51 33 24 33-24M49 106l35 6m12 0 35-6" fill="none" strokeWidth="2"/></g>}
 {id==='M'&&<g {...common}><path d="M54 80h30v29l-12 21-35 16q-24 6-25-10t25-26l17-5Z"/><path d="M117 91h30v29l-12 21-35 16q-24 6-25-10t25-26l17-5Z"/><path d="M54 88h30m33 11h30M30 114l12 22m51-11 12 22" fill="none"/></g>}
 {id==='N'&&<g {...common}><path d="M46 42h33v58l-8 25-28 18q-21 9-26-4t12-26l17-13Z"/><path d="M109 52h33v58l-8 25-28 18q-21 9-26-4t12-26l17-13Z"/><path d="M46 56h33m30 10h33" fill="none"/>{[0,1,2,3].map(n=><g key={n} fill="#50554d" stroke="none"><circle cx={33+n*8} cy={133-n*5} r="3"/><circle cx={96+n*8} cy={143-n*5} r="3"/></g>)}</g>}
 {id==='O'&&<g {...common}><path d="M46 14h33v89l-8 25-28 18q-21 9-26-4t12-26l17-13Z"/><path d="M109 24h33v89l-8 25-28 18q-21 9-26-4t12-26l17-13Z"/><path d="M46 25h33m-33 9h33m30 1h33m-33 9h33" fill="none" strokeWidth="4"/></g>}
 {id==='P'&&<g {...common}><circle cx="90" cy="92" r="47" fill="none" stroke={fill} strokeOpacity="1" strokeWidth="11"/><circle cx="90" cy="92" r="53" fill="none"/><circle cx="90" cy="92" r="41" fill="none"/></g>}
 {id==='Q'&&<g {...common}><circle cx="90" cy="109" r="32" fill="none" stroke={fill} strokeOpacity="1" strokeWidth="13"/><path d="M88 71Q35 19 31 58t52 27l-17 39 21-11 8-34 14 44 18 4-23-43q55 20 47-24t-57 11Z"/><circle cx="92" cy="76" r="10"/><path d="m42 59 40 16m59-16-39 16" fill="none"/></g>}
 </svg>;
}
