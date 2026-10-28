'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {drinkName} from '../lib/drink-names';
import { useI18n } from '../lib/i18n';
import { searchDrinks, usesBottle, type CatalogDrink, type CatalogFile } from '../lib/drinks';
import { alcohol, bottleEntry, categories, localDate, personal, remaining, round, uid, type Bottle, type Category, type Entry, type Ledger, type Product } from '../lib/model';
import type { Preset } from '../lib/catalog';

type Selection = Omit<Product,'abv'> & {abv:number|null;capacity:number|null;serving?:boolean};
let catalogPromise:Promise<CatalogFile>|undefined;
export function loadCatalog():Promise<CatalogFile>{return catalogPromise??=fetch('/data/drinks.json?v=4').then(r=>{if(!r.ok)throw new Error('catalog');return r.json() as Promise<CatalogFile>;}).catch(e=>{catalogPromise=undefined;throw e;});}
export function LogFlow({data,mode='quick',preset,bottle,date,busy,queue,onBottle,onExit,initialCategory='all'}:{data:Ledger;mode?:'quick'|'bottle';preset?:Preset;bottle?:Bottle;date:string;busy:boolean;queue:(e:Entry,b?:Bottle)=>void;onBottle:(b:Bottle)=>Promise<void>;onExit:()=>void;initialCategory?:Category|'all'}){
  const {tr,t,lang}=useI18n();
  const [step,setStep]=useState(bottle?2:preset||initialCategory==='鸡尾酒'?1:0);
  const [catalog,setCatalog]=useState<CatalogFile|null>(null);const [loadError,setLoadError]=useState(false);
  const [search,setSearch]=useState('');const [filter,setFilter]=useState<Category|'all'>(initialCategory);const [limit,setLimit]=useState(30);
  const [selected,setSelected]=useState<Selection|null>(preset??bottle??null);const [existing,setExisting]=useState<Bottle|undefined>(bottle);
  const [custom,setCustom]=useState(initialCategory==='鸡尾酒');const [name,setName]=useState(preset?.name??'');const [category,setCategory]=useState<Category>(preset?.category??(initialCategory==='all'?'啤酒':initialCategory));
  const [abv,setAbv]=useState(preset?String(preset.abv):'');const [capacity,setCapacity]=useState(preset?String(preset.capacity):'');
  const [single,setSingle]=useState(preset?.serving??false);const [initial,setInitial]=useState(100);const [level,setLevel]=useState(bottle?remaining(data,bottle):100);
  const [qty,setQty]=useState(1);const [ratio,setRatio]=useState(1);const [price,setPrice]=useState('');const [newId]=useState(uid);
  const [attempted,setAttempted]=useState(false);
  const flowRef=useRef<HTMLDivElement>(null);const capacityRef=useRef<HTMLInputElement>(null);
  const [customSize,setCustomSize]=useState(false);
  useEffect(()=>{flowRef.current?.closest('dialog')?.scrollTo({top:0});},[step]);
  useEffect(()=>{let active=true;loadCatalog().then(d=>{if(active)setCatalog(d);}).catch(()=>{if(active)setLoadError(true);});return()=>{active=false;};},[]);
  useEffect(()=>{setLimit(30);},[search,filter]);
  const remembered=useMemo(()=>{
    const map=new Map<string,CatalogDrink>();
    const approved=new Map(catalog?.drinks.map(d=>[d.source.database+':'+d.source.id,d])??[]);
    [...data.bottles,...data.sessions.flatMap(s=>s.entries)].reverse().forEach(p=>{if(p.source&&p.source.database!=='My records'&&!approved.has(p.source.database+':'+p.source.id))return;const normalized=p.source?approved.get(p.source.database+':'+p.source.id):undefined;p={...p,category:normalized?.category??p.category};const key=[p.name,p.abv,p.capacity].join('|');if(!map.has(key))map.set(key,{...p,id:'local:'+key,serving:'bottleId' in p&&p.bottleId===null&&usesBottle(p.category),source:p.source??{database:'My records',id:key,url:'https://jiuji-drink-log.imagine-snow.chatgpt.site/',license:'Private',retrievedAt:''},popularity:1e8});});
    return [...map.values()];
  },[data,catalog]);
  const results=useMemo(()=>{
    const local=searchDrinks(remembered.filter(d=>d.category!=='鸡尾酒'),search,filter);
    const keys=new Set(local.map(d=>`${d.name}|${d.abv}|${d.capacity}`));
    return [...local,...searchDrinks(catalog?.drinks??[],search,filter).filter(d=>!keys.has(`${d.name}|${d.abv}|${d.capacity}`))];
  },[catalog,remembered,search,filter]);
  const otherResults=useMemo(()=>search.trim()&&filter!=='all'?searchDrinks(catalog?.drinks??[],search,'all').filter(d=>d.category!==filter):[],[catalog,search,filter]);
  function addCustom(c:Category=filter==='all'?'啤酒':filter){setSelected(null);setCustom(true);setCustomSize(false);setQty(1);setRatio(1);setName(search);setCategory(c);setAbv('');setCapacity('');setExisting(undefined);setSingle(false);setInitial(100);setLevel(100);setPrice('');setStep(1);setAttempted(false);}
  function choose(p:Selection){setSelected(p);setName(p.name);setCategory(p.category);setAbv(p.abv===null?'':String(p.abv));setCapacity(p.capacity===null?'':String(p.capacity));setCustom(false);setCustomSize(false);setQty(1);setRatio(1);setExisting(undefined);setSingle(mode==='quick'&&(p.serving??false));setInitial(100);setLevel(100);setPrice('');setStep(1);setAttempted(false);}
  function chooseExisting(b:Bottle){setSelected(b);setExisting(b);setCategory(b.category);setLevel(remaining(data,b));setRatio(1);setStep(2);}
  const cat=existing?.category??category;
  const trackBottle=!!existing||mode==='bottle'||(usesBottle(cat)&&!single);
  const max=existing?remaining(data,existing):initial;
  const sizes=single?[30,45,60,150]:cat==='鸡尾酒'?[100,150,200,250]:['啤酒','苹果酒'].includes(cat)?[330,355,500,568]:[500,700,750,1000];
  const validSpec=name.trim().length>0&&capacity!==''&&Number.isFinite(Number(capacity))&&Number(capacity)>0&&Number(capacity)<=100000&&abv!==''&&Number.isFinite(Number(abv))&&Number(abv)>=0&&Number(abv)<=100;
  const validPrice=price===''||(Number.isFinite(Number(price))&&Number(price)>=0&&Number(price)<=1e9);
  const product:Product={name:name.trim(),category,abv:Number(abv),brand:selected?.brand??'',origin:selected?.origin??'',...(selected?.source&&selected.source.database!=='My records'?{source:selected.source}:{}),...(selected?.style?{style:selected.style}:{})};
  const pendingBottle:Bottle={...product,id:newId,capacity:Number(capacity),initial,price:price===''?null:Number(price),date,favorite:false};
  const entry:Entry=trackBottle?bottleEntry(data,existing??pendingBottle,level,ratio):{...product,id:newId+'-entry',bottleId:null,capacity:Number(capacity),before:100,after:0,volume:round(Number(capacity)*qty),ratio,cost:price===''?null:round(Number(price)*ratio),paid:price===''?null:Number(price),kind:'drink',reason:''};
  const validAmount=trackBottle?level<max:qty>0&&qty<=100&&Number.isFinite(qty);
  const matched=selected?data.bottles.filter(b=>!b.hidden&&remaining(data,b)>0&&(b.source?.id&&b.source.id===selected.source?.id||b.name===selected.name)):[];
  function nextSpec(){setAttempted(true);if(!validSpec)return;setLevel(l=>Math.min(l,initial));setStep(mode==='bottle'?3:2);}
  const labels=[tr('选酒款','Choose'),tr('确认规格','Details'),tr('喝了多少','Amount'),mode==='bottle'?tr('放入酒柜','Cabinet'):tr('我的份额','My share')];
  const showCustomSize=customSize||(capacity!==''&&!sizes.includes(Number(capacity)));
  function back(){setAttempted(false);if(step===0){onExit();}else if(existing&&step===2){setExisting(undefined);setStep(0);}else setStep(s=>s===3&&mode==='bottle'?1:s-1);}
  useEffect(()=>{if(customSize&&step===1)capacityRef.current?.focus();},[customSize,step]);
  return <div className="log-flow" ref={flowRef}>
    <div className="flow-nav"><button className="flow-back" onClick={back}><span aria-hidden="true">←</span> {step===1||existing&&step===2?tr('重新选择酒款','Change drink'):step===0?tr('返回','Back'):tr('返回上一步','Previous step')}</button></div>
    <div className="flow-progress" aria-label={tr('记录步骤','Logging steps')}>{labels.map((label,i)=>mode==='bottle'&&i===2?null:<span key={label} className={i===step?'current':i<step?'done':''} aria-current={i===step?'step':undefined}><i>{i<step?'✓':mode==='bottle'&&i===3?3:i+1}</i>{label}</span>)}</div>

    {step===0&&<>
      <h3 className="flow-title">{tr('先找到你喝的那款酒','Find your drink')}</h3>
      <div className="search-entry"><label className="search-label" htmlFor="drink-search">{tr('搜索酒名或品牌','Search by name or brand')}</label><label className="catalog-search" htmlFor="drink-search"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg><input id="drink-search" aria-label={tr('搜索酒款','Search drinks')} autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr('例如：喜力、黑牌、孟买蓝宝石','e.g. Heineken, Black Label, Bombay')}/>{search&&<button aria-label={tr('清空搜索','Clear search')} onClick={()=>setSearch('')}>×</button>}</label>
      <button className="custom-drink primary-custom" onClick={()=>addCustom()}><b>＋ {tr('找不到？自己添加','Can’t find it? Add your own')}</b><span>{tr('不用在酒库里，也能直接记录','No catalog match needed to keep a record')}</span></button></div>
      <div className="catalog-filters" tabIndex={0} role="group" aria-label={tr('按酒类筛选，可横向滚动','Filter by category; scroll horizontally')}><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>{tr('全部酒款','All drinks')}</button>{categories.filter(c=>c!=='鸡尾酒').map(c=><button key={c} className={filter===c?'active':''} onClick={()=>setFilter(c)}>{t(c)}</button>)}</div>
      {mode==='quick'&&!search&&data.bottles.some(b=>!b.hidden&&remaining(data,b)>0)&&<div className="resume-bottles"><span className="field-label">{tr('继续记已开瓶的酒','Continue an open bottle')}</span>{data.bottles.filter(b=>!b.hidden&&remaining(data,b)>0&&(filter==='all'||b.category===filter)).slice(0,4).map(b=><button key={b.id} onClick={()=>chooseExisting(b)}><strong>{drinkName(b,lang)}</strong><small>{tr('约剩','About')} {remaining(data,b)}% · {b.capacity} ml →</small></button>)}</div>}
      <p className="catalog-meta" role="status">{catalog?tr(`${results.length.toLocaleString()} 款匹配 · 本地搜索`,`${results.length.toLocaleString()} matches · offline search`):loadError?tr('酒款库暂时无法加载，你仍可自行添加。','Catalog unavailable. You can still add your drink.'):tr('正在打开酒款库…','Opening the catalog…')}</p>
      <div className="catalog-results">{results.slice(0,limit).map(d=><button className="catalog-result" key={d.id} onClick={()=>choose(d)}><span className="catalog-monogram">{t(d.category).slice(0,2)}</span><span><strong>{drinkName(d,lang)}</strong>{drinkName(d,lang)!==d.name&&<small className="original-drink-name">{d.name}</small>}<small>{d.brand&&`${d.brand} · `}{d.abv===null?tr('度数待确认','ABV needed'):`${d.abv}%`}{d.capacity?` · ${d.capacity} ml`:''}</small><em>{d.source.database==='My records'?tr('我的记录','My records'):d.source.database}</em></span><b>›</b></button>)}</div>
      {results.length>limit&&<button className="text-button full" onClick={()=>setLimit(n=>n+30)}>{tr('显示更多酒款','Show more drinks')}</button>}
      {catalog&&results.length===0&&<div className="no-drink-results"><p>{tr('暂时没找到这款酒，上面的“自己添加”就可以继续。','No match yet. Use “Add your own” above to continue.')}</p>{otherResults.length>0&&<button className="text-button" onClick={()=>setFilter('all')}>{tr(`其他酒类中有 ${otherResults.length} 个结果，查看全部`,`See ${otherResults.length} matches in other categories`)} →</button>}</div>}
      <details className="cocktail-entry"><summary>{tr('记录鸡尾酒 / 预调酒','Log a cocktail / premixed drink')}</summary><p className="help">{tr('独立手动记录，暂不提供配方或度数推算。','A separate manual entry. Recipes and ABV estimates are not included yet.')}</p><button className="button outline full" onClick={()=>addCustom('鸡尾酒')}>{tr('手动记录鸡尾酒','Add a cocktail manually')}</button></details>
      <p className="help">{tr('开放酒款数据仅作起点，规格以手中酒瓶为准。','Open product data is a starting point. Check your bottle label.')}</p>
    </>}
    {step===1&&<>
      <h3 className="flow-title">{custom?tr('加上你自己的酒款','Add your drink'):drinkName({name,brand:selected?.brand},lang)}</h3>
      {selected?.source&&<p className="source-credit">{tr('资料来源','Source')}: <a href={selected.source.url} target="_blank" rel="noreferrer">{selected.source.database} ↗</a></p>}
      {matched.length>0&&mode==='quick'&&<div className="resume-bottles"><span>{tr('酒柜里已有这款酒，继续记同一瓶？','Already in your cabinet. Continue that bottle?')}</span>{matched.map(b=><button key={b.id} onClick={()=>chooseExisting(b)}><strong>{b.capacity} ml · {remaining(data,b)}%</strong><small>{b.date} →</small></button>)}<p className="help">{tr('下面的规格用于新的一瓶。','The details below are for a new bottle.')}</p></div>}
      {custom&&<div className="form-grid"><label className="form-label wide">{tr('酒款名称','Drink name')}<input maxLength={150} value={name} onChange={e=>setName(e.target.value)} autoFocus/></label><label className="form-label wide">{tr('酒类','Category')}<select value={category} onChange={e=>{setCategory(e.target.value as Category);setSingle(false);}}>{categories.map(c=><option key={c} value={c}>{c==='鸡尾酒'?tr('鸡尾酒 / 预调酒','Cocktail / premixed drink'):t(c)}</option>)}</select></label></div>}
      {usesBottle(cat)&&mode==='quick'&&<div className="segments vessel-mode"><button className={!single?'selected':''} onClick={()=>{setSingle(false);setCapacity(selected?.capacity?String(selected.capacity):'');}}>{tr('我有一整瓶','My bottle')}</button><button className={single?'selected':''} onClick={()=>{setSingle(true);setCapacity('');}}>{tr('只喝单杯','By the glass')}</button></div>}
      <div className="spec-fields"><label className="form-label">{tr('酒精度','Alcohol by volume')}<div className="input-unit"><input aria-label={tr('酒精度','ABV')} type="number" min="0" max="100" step="0.1" value={abv} onChange={e=>setAbv(e.target.value)} placeholder={tr('看一下瓶身','Check the label')}/><span>% vol</span></div><small>{selected?.abv!==null&&selected?.abv!==undefined?tr('已从酒款资料带入，可以修改','From the catalog; you can edit it'):tr('资料暂无度数，请按瓶身填写','ABV missing. Please check the label.')}</small></label></div>
      <fieldset className="capacity-picker"><legend>{single||cat==='鸡尾酒'?tr('每杯容量','Size of one glass'):trackBottle?tr('这瓶的容量','Bottle size'):tr('每瓶 / 罐容量','Size of one bottle / can')}</legend>
        <div className="size-chips">{sizes.map(n=><button key={n} aria-pressed={!showCustomSize&&Number(capacity)===n} className={!showCustomSize&&Number(capacity)===n?'active':''} onClick={()=>{setCustomSize(false);setCapacity(String(n));}}>{n} ml</button>)}<button className={showCustomSize?'active custom-size':'custom-size'} aria-pressed={showCustomSize} onClick={()=>{setCustomSize(true);capacityRef.current?.focus();}}>{tr('自定义','Custom')} ✎</button></div>
        {showCustomSize&&<label className="form-label custom-capacity">{tr('输入容量（ml）','Enter size (ml)')}<div className="input-unit"><input ref={capacityRef} aria-label={tr('自定义容量毫升','Custom capacity in ml')} type="number" inputMode="decimal" min="1" max="100000" value={capacity} onChange={e=>setCapacity(e.target.value)} placeholder={tr('例如 650','e.g. 650')}/><span>ml</span></div></label>}
      </fieldset>
      {trackBottle&&<details className="advanced"><summary>{tr('这瓶之前已经喝过？','Already opened before?')}</summary><label className="form-label">{tr('开始记之前约剩','Remaining before this record')} {initial}%<input aria-label={tr('开始记录时的余量','Starting level')} type="range" min="1" max="100" value={initial} onChange={e=>setInitial(Number(e.target.value))}/></label><p className="help">{tr('从这个液面开始记，之前喝的不会补算。','Start here; earlier consumption is not added.')}</p></details>}
      {attempted&&!validSpec&&<p className="error" role="alert">{tr('请确认名称、0–100% 的酒精度，以及有效容量。','Enter a name, ABV from 0 to 100%, and a valid size.')}</p>}
      <button className="button primary full" onClick={nextSpec}>{tr('确认规格，下一步','Confirm details · next')} →</button>
    </>}
    {step===2&&<>
      <h3 className="flow-title">{trackBottle?tr('现在，瓶里还剩多少？','How much is left in the bottle?'):cat==='鸡尾酒'||single?tr('这次喝了几杯？','How many glasses this time?'):tr('这次喝了几瓶 / 罐？','How many bottles / cans?')}</h3>
      <p className="flow-description">{drinkName(existing??{name,brand:selected?.brand},lang)} · {existing?.capacity??capacity} ml · {existing?.abv??abv}%</p>
      {trackBottle?<><div className="flow-liquid"><div className="liquid-bottle" aria-hidden="true"><div style={{height:`${level}%`}}/><span>SipLog</span></div><div className="flow-liquid-value"><strong>{level}<small>%</small></strong><span>{tr('约剩余','remaining')}</span></div></div><input className="full-range" aria-label={tr('瓶内剩余百分比','Bottle remaining percent')} type="range" min="0" max={max} step="1" value={level} onChange={e=>setLevel(Number(e.target.value))}/><div className="range-labels"><span>{tr('空瓶','Empty')}</span><span>{tr('开始时','Started at')} {max}%</span></div><div className="size-chips">{[0,25,50,75,max].filter((n,i,a)=>n<=max&&a.indexOf(n)===i).map(n=><button key={n} className={level===n?'active':''} onClick={()=>setLevel(n)}>{n===0?tr('喝完了','Finished'):`${n}%`}</button>)}</div><p className="flow-note">{tr(`这一瓶共少了约 ${round((existing?.capacity??Number(capacity))*(max-level)/100)} ml，下一步再分自己和朋友。`,`About ${round((existing?.capacity??Number(capacity))*(max-level)/100)} ml used. Split your share next.`)}</p></>:<><div className="big-counter"><button aria-label={tr('减少数量','Decrease quantity')} disabled={qty<=1} onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><label><input aria-label={tr('饮用数量','Drink quantity')} type="number" min="0.5" max="100" step="0.5" value={qty} onChange={e=>setQty(Number(e.target.value))}/><span>{single||cat==='鸡尾酒'?tr('杯','glasses'):tr('瓶 / 罐','bottles / cans')}</span></label><button aria-label={tr('增加数量','Increase quantity')} disabled={qty>=100} onClick={()=>setQty(q=>q+1)}>＋</button></div><div className="size-chips">{[1,2,3,4,6,8].map(n=><button key={n} className={qty===n?'active':''} onClick={()=>setQty(n)}>{n}</button>)}</div><p className="flow-note">{tr('合计','Total')} {round(Number(capacity)*qty)} ml</p></>}
      <button className="button primary full" disabled={!validAmount} onClick={()=>setStep(3)}>{tr('下一步，确认我的份额','Next · my share')} →</button>
    </>}
    {step===3&&<>
      <h3 className="flow-title">{mode==='bottle'?tr('给它留一个位置','Make room in your cabinet'):tr('这些酒，是谁喝的？','Who drank it?')}</h3>
      {mode!=='bottle'&&<><div className="segments share-options">{[[1,tr('都是我','Just me')],[.5,tr('一起喝','Shared')],[0,tr('都是朋友','Friends only')]].map(([n,label])=><button key={label} className={(n===.5?ratio>0&&ratio<1:ratio===n)?'selected':''} onClick={()=>setRatio(Number(n))}>{label}</button>)}</div>{ratio>0&&ratio<1&&<label className="form-label">{tr('我喝了其中约','My share is about')} {Math.round(ratio*100)}%<input aria-label={tr('我喝的比例','My share percent')} type="range" min="5" max="95" step="5" value={ratio*100} onChange={e=>setRatio(Number(e.target.value)/100)}/></label>}<div className="share-summary"><div><span>{tr('自己约喝了','My intake')}</span><b>{round(personal(entry))} <small>ml</small></b></div><div><span>{tr('朋友约喝了','Friends')}</span><b>{round(entry.volume*(1-ratio))} <small>ml</small></b></div><div><span>{tr('个人纯酒精约','My alcohol')}</span><b>{round(alcohol(entry))} <small>g</small></b></div></div>{trackBottle&&<p className="flow-note">{tr(`酒柜将同步为剩余 ${level}%，朋友喝的不计入你的统计。`,`Cabinet updates to ${level}% remaining. Friends' share stays out of your stats.`)}</p>}</>}
      {!existing&&<details className="advanced"><summary>{tr('记一下价格（选填）','Add a price (optional)')}</summary><label className="form-label">{trackBottle?tr('整瓶购入价','Whole bottle purchase price'):tr('本次合计花费','Total paid this time')} · {data.currency}<input aria-label={tr('价格','Price')} type="number" min="0" max="1000000000" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder={tr('可以留空','Leave blank if unknown')}/></label><p className="help">{trackBottle?tr('饮用成本按喝掉的份额自动分摊。','Consumption cost is allocated by your share.'):tr('分享时，个人成本按个人饮用份额分摊。','Shared costs follow your drinking share.')}</p></details>}
      {mode==='bottle'&&<p className="flow-note">{name} · {capacity} ml · {initial}% {tr('余量','remaining')}</p>}
      <button className="button primary full" disabled={busy||!validPrice||(mode!=='bottle'&&!validAmount)} onClick={()=>{if(mode==='bottle')void onBottle(pendingBottle);else queue(entry,trackBottle&&!existing?pendingBottle:undefined);}}>{mode==='bottle'?tr('放进我的酒柜','Add to my cabinet'):tr('加入这次记录','Add to this occasion')} ✓</button>
    </>}
  </div>;
}
