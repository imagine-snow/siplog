'use client';
import {useMemo,useState,type ReactNode} from 'react';
import {drinkName} from '../lib/drink-names';
import {normalize} from '../lib/drinks';
import {useI18n} from '../lib/i18n';
import {type Session,stats} from '../lib/model';
export function RecordList({sessions,row,onAdd}:{sessions:Session[];row:(s:Session)=>ReactNode;onAdd:()=>void}){
  const {tr,t}=useI18n();const [query,setQuery]=useState('');const [month,setMonth]=useState('');const [limit,setLimit]=useState(30);
  const months=[...new Set(sessions.map(s=>s.date.slice(0,7)))].sort().reverse();
  const filtered=useMemo(()=>sessions.filter(s=>(!month||s.date.startsWith(month))&&normalize(query).split(' ').every(w=>normalize(s.date+' '+s.entries.map(e=>[e.name,drinkName(e),e.category,e.brand,t(e.category)].join(' ')).join(' ')).includes(w))).sort((a,b)=>b.date.localeCompare(a.date)||b.created.localeCompare(a.created)),[sessions,month,query,t]);
  const shown=filtered.slice(0,limit);const days=[...new Set(shown.map(s=>s.date))];const total=stats(filtered);
  return <section className="journal-list"><div className="journal-filters"><label className="cabinet-search"><span aria-hidden="true">⌕</span><input aria-label={tr('搜索记录','Search records')} placeholder={tr('搜索酒名、酒类或日期','Search drink, category or date')} value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}}/></label><select aria-label={tr('记录月份','Record month')} value={month} onChange={e=>{setMonth(e.target.value);setLimit(30);}}><option value="">{tr('全部月份','All months')}</option>{months.map(m=><option key={m}>{m}</option>)}</select></div><p className="help">{tr(`找到 ${filtered.length} 次记录 · 个人纯酒精约 ${total.grams.toFixed(1)} g`,`Found ${filtered.length} occasions · about ${total.grams.toFixed(1)} g alcohol`)} · {tr('点开即可编辑','Tap to edit')}</p>
    {days.map(day=><section className="journal-day panel" key={day}><h2>{day}<span>{shown.filter(s=>s.date===day).length} {tr('次','occasions')}</span></h2>{shown.filter(s=>s.date===day).map(row)}</section>)}
    {!filtered.length&&<div className="empty"><h3>{sessions.length?tr('没有匹配的记录','No matching records'):tr('第一笔，从这里开始','Start your first record')}</h3><p>{sessions.length?tr('换个关键词，或查看全部月份。','Try another term or all months.'):tr('已保存的记录会按日期放在这里，喝完的也能改。','Saved occasions appear here by date. Finished drinks can be edited too.')}</p><button className="button outline" onClick={onAdd}>{tr('记录喝酒','Log a drink')} ＋</button></div>}
    {filtered.length>limit&&<button className="button outline full" onClick={()=>setLimit(n=>n+30)}>{tr('再显示 30 次记录','Show 30 more occasions')}</button>}
  </section>;
}
