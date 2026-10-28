import {validCover,MAX_COVERS_CHARS} from './photos.ts';
export const categories = ['啤酒', '威士忌', '葡萄酒', '白酒', '金酒', '朗姆酒', '伏特加', '鸡尾酒', '龙舌兰', '白兰地', '利口酒', '清酒', '黄酒', '苹果酒', '其他'] as const;
export type Category = typeof categories[number];
export type ProductSource = { database:string; id:string; url:string; license:string; retrievedAt:string; abv?:number|null; capacity?:number|null };
export type Product = { name: string; category: Category; abv: number; brand: string; origin: string; source?:ProductSource; style?:string };
export type Bottle = Product & { id: string; capacity: number; initial: number; price: number | null; date: string; favorite: boolean; hidden?: boolean };
export type Entry = Product & { id: string; bottleId: string | null; capacity: number; before: number; after: number; volume: number; ratio: number; cost: number | null; paid: number | null; kind: 'drink' | 'adjust'; reason: string };
export type Session = { id: string; date: string; created: string; entries: Entry[] };
export type Ledger = { version: 1; revision: number; bottles: Bottle[]; sessions: Session[]; favoriteDrinks?: string[]; covers?: Record<string,string>; currency: 'CNY' | 'CAD' | 'USD' };
export const emptyLedger = (): Ledger => ({ version: 1, revision: 0, bottles: [], sessions: [], currency: 'CNY' });
export const uid = () => crypto.randomUUID();
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const round = (n: number) => Math.round(n * 100) / 100;
export const personal = (e: Entry) => e.kind === 'drink' ? e.volume * e.ratio : 0;
export const alcohol = (e: Entry) => personal(e) * e.abv / 100 * 0.789;
export function remaining(data: Ledger, bottle: Bottle): number {
  const entries = data.sessions.flatMap(s => s.entries).filter(e => e.bottleId === bottle.id);
  return entries.length ? entries[entries.length - 1].after : bottle.initial;
}
export function latestEntry(data: Ledger, bottleId: string) {
  return data.sessions.flatMap(s => s.entries).filter(e => e.bottleId === bottleId).at(-1);
}
export function canRemove(data: Ledger, session: Session) {
  try { removeSession(data, session.id); return true; } catch { return false; }
}
export function removeSession(data: Ledger, id: string): Ledger {
  const session = data.sessions.find(s => s.id === id);
  if (!session) throw new Error('找不到这次记录。');
  return rebuildLevels({ ...data, sessions: data.sessions.filter(s => s.id !== id) });
}
// Drinking entries retain their consumed amounts. Explicit inventory corrections
// remain absolute observations, so edits never rewrite a later measured level.
export function rebuildLevels(data:Ledger):Ledger {
  const levels=new Map(data.bottles.map(b=>[b.id,b.initial]));
  const bottles=new Map(data.bottles.map(b=>[b.id,b]));
  const sessions=data.sessions.map(s=>({...s,entries:s.entries.map(e=>{
    if(!e.bottleId)return {...e,cost:e.paid===null?null:round(e.paid*e.ratio)};
    const b=bottles.get(e.bottleId);if(!b)throw new Error('找不到这瓶酒。');
    const before=levels.get(b.id)!;
    const unchanged=Math.abs(before-e.before)<1e-8&&e.volume===round(e.capacity*(e.before-e.after)/100);
    let after=e.kind==='adjust'||unchanged?e.after:Math.round((before-e.volume/b.capacity*100)*1e8)/1e8;
    // Volume snapshots are rounded to 0.01 ml; tolerate that rounding at empty.
    if(e.kind==='drink'&&after<0&&after>=-0.02/b.capacity*100)after=0;
    if(!Number.isFinite(after)||after<0||after>100)throw new Error('修改后瓶内余量会超出 0–100%，请检查饮用量或后续余量修正。');
    levels.set(b.id,after);
    return {...e,before,after,capacity:b.capacity,volume:e.kind==='adjust'?round(b.capacity*(before-after)/100):e.volume,cost:e.kind==='adjust'||b.price===null?null:round(b.price*e.volume/b.capacity*e.ratio)};
  })}));
  return validateLedger({...data,sessions});
}
export function editSession(data:Ledger, edited:Session, syncBottleIds:string[]=[]):Ledger {
  const old=data.sessions.find(s=>s.id===edited.id);
  if(!old||old.entries.length!==edited.entries.length||old.entries.some((e,i)=>e.id!==edited.entries[i].id||e.bottleId!==edited.entries[i].bottleId||e.kind!==edited.entries[i].kind))throw new Error('记录结构发生变化，请重新打开后修改。');
  const corrections=new Map<string,Product>();
  const entries=edited.entries.map((e,i)=>{
    const previous=old.entries[i];
    // A different named product must not inherit the old product's database ID.
    const changed=e.name!==previous.name||e.category!==previous.category;
    const next={...e,source:changed?undefined:e.source,brand:changed?'':e.brand,origin:changed?'':e.origin,style:changed?undefined:e.style};
    if(e.bottleId&&syncBottleIds.includes(e.bottleId)){
      const prior=corrections.get(e.bottleId);
      if(prior&&(prior.name!==next.name||prior.category!==next.category||prior.abv!==next.abv))throw new Error('同一瓶酒的同步资料不一致，请统一酒名、酒类和度数，或取消同步。');
      corrections.set(e.bottleId,{name:next.name,category:next.category,abv:next.abv,brand:next.brand,origin:next.origin,style:next.style,source:next.source});
    }
    return next;
  });
  let next=rebuildLevels({...data,bottles:data.bottles.map(b=>({...b,...corrections.get(b.id)})),sessions:data.sessions.map(s=>({...s,date:s.id===edited.id?edited.date:s.date,entries:(s.id===edited.id?entries:s.entries).map(e=>({...e,...(e.bottleId?corrections.get(e.bottleId):undefined)}))}))});
  const covers={...next.covers};const favorites=new Set(next.favoriteDrinks??[]);
  for(let i=0;i<old.entries.length;i++){
    const a=old.entries[i],b=entries[i];if(a.bottleId)continue;
    const from=drinkKey(a),to=drinkKey(b);if(from===to)continue;
    if(covers['drink:'+from]&&!covers['drink:'+to])covers['drink:'+to]=covers['drink:'+from];
    if(favorites.has(from))favorites.add(to);
    if(!next.sessions.some(s=>s.entries.some(e=>!e.bottleId&&drinkKey(e)===from))){delete covers['drink:'+from];favorites.delete(from);}
  }
  next={...next,covers,favoriteDrinks:[...favorites]};return validateLedger(next);
}
export const drinkKey=(e:Pick<Entry,'category'|'name'|'brand'|'abv'|'capacity'>)=>JSON.stringify([e.category,e.name.trim().toLocaleLowerCase('en'),e.brand.trim().toLocaleLowerCase('en'),e.abv,e.capacity]);
export function setBottleHidden(data:Ledger,id:string,hidden:boolean):Ledger {
  if(!data.bottles.some(b=>b.id===id))throw new Error('找不到这瓶酒。');
  return validateLedger({...data,bottles:data.bottles.map(b=>b.id===id?{...b,hidden}:b)});
}
export function addSession(data: Ledger, session: Session): Ledger {
  if (!session.entries.length || !validDate(session.date)) throw new Error('请添加酒款，并选择有效日期。');
  const next = { ...data, sessions: [...data.sessions, session] };
  validateLedger(next);
  return next;
}
// Commit new bottles and their first consumption together. Abandoned draft bottles stay out.
export function addDraftSession(data:Ledger, session:Session, pending:Bottle[]):Ledger {
  const used=pending.filter(b=>session.entries.some(e=>e.bottleId===b.id));
  return addSession({...data,bottles:[...data.bottles,...used]},session);
}
export function stats(sessions: Session[]) {
  const drinks = sessions.flatMap(s => s.entries).filter(e => e.kind === 'drink' && personal(e) > 0);
  const priced = drinks.filter(e => e.cost !== null);
  const grams = drinks.reduce((n, e) => n + alcohol(e), 0);
  const cost = priced.reduce((n, e) => n + (e.cost ?? 0), 0);
  const pricedGrams = priced.reduce((n, e) => n + alcohol(e), 0);
  return { grams, ml: drinks.reduce((n, e) => n + personal(e), 0), cost, pricedCount: priced.length, count: sessions.filter(s => s.entries.some(e => personal(e) > 0)).length, days: new Set(sessions.filter(s => s.entries.some(e => personal(e) > 0)).map(s => s.date)).size, unknown: drinks.length - priced.length, unitCost: pricedGrams > 0 ? cost / pricedGrams : null };
}
export function purchaseTotal(data: Ledger, start: string, end: string) {
  const amounts = [...data.bottles.filter(b => b.date >= start && b.date <= end).map(b => b.price), ...data.sessions.filter(s => s.date >= start && s.date <= end).flatMap(s => s.entries.filter(e => !e.bottleId).map(e => e.paid))];
  return { value: amounts.reduce<number>((n, x) => n + (x ?? 0), 0), known: amounts.filter(x => x !== null).length, unknown: amounts.filter(x => x === null).length };
}
export function bottleEntry(data: Ledger, b: Bottle, after: number, ratio: number, kind: 'drink' | 'adjust' = 'drink', reason = ''): Entry {
  const before = remaining(data, b);
  const volume = round(b.capacity * (before - after) / 100);
  return { ...b, id: uid(), bottleId: b.id, before, after, volume, ratio: kind === 'drink' ? ratio : 0, cost: kind === 'drink' && b.price !== null ? round(b.price * volume / b.capacity * ratio) : null, paid: null, kind, reason };
}
export function updateBottlePrice(data: Ledger, bottleId: string, price: number | null): Ledger {
  if (price !== null && !num(price)) throw new Error('请填写有效的价格，或留空。');
  const bottle = data.bottles.find(b => b.id === bottleId);
  if (!bottle) throw new Error('找不到这瓶酒。');
  return {
    ...data,
    bottles: data.bottles.map(b => b.id === bottleId ? { ...b, price } : b),
    sessions: data.sessions.map(s => ({ ...s, entries: s.entries.map(e => e.bottleId === bottleId && e.kind === 'drink' ? { ...e, cost: price === null ? null : round(price * e.volume / e.capacity * e.ratio) } : e) })),
  };
}
function fail(): never { throw new Error('数据格式不正确或瓶内余量不一致，未修改现有记录。'); }
const num = (x: unknown, min = 0, max = 1e9): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const str = (x: unknown, max = 200): x is string => typeof x === 'string' && x.length <= max;
export function validDate(x: unknown): x is string {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const [y, m, d] = x.split('-').map(Number); const date = new Date(y, m - 1, d);
  return y >= 1900 && y <= 2100 && localDate(date) === x;
}
function product(x: Product) { return x && str(x.name) && x.name.trim().length > 0 && categories.includes(x.category) && num(x.abv, 0, 100) && str(x.brand) && str(x.origin) && (x.style===undefined||str(x.style)) && (x.source===undefined||(str(x.source.database)&&str(x.source.id)&&str(x.source.url,1000)&&/^https:\/\//.test(x.source.url)&&str(x.source.license)&&str(x.source.retrievedAt,100)&&(x.source.abv===undefined||x.source.abv===null||num(x.source.abv,0,100))&&(x.source.capacity===undefined||x.source.capacity===null||num(x.source.capacity,1,100000)))); }
export function validateLedger(raw: unknown): Ledger {
  const d = raw as Ledger;
  if (!d || d.version !== 1 || !Number.isInteger(d.revision) || d.revision < 0 || !['CNY', 'CAD', 'USD'].includes(d.currency) || !Array.isArray(d.bottles) || !Array.isArray(d.sessions) || d.bottles.length > 10000 || d.sessions.length > 100000) fail();
  if (d.favoriteDrinks!==undefined&&(!Array.isArray(d.favoriteDrinks)||d.favoriteDrinks.length>100000||d.favoriteDrinks.some(k=>!str(k,1000)))) fail();
  if(d.covers!==undefined){
    if(!d.covers||typeof d.covers!=='object'||Array.isArray(d.covers))fail();
    let bytes=0;
    for(const [key,value] of Object.entries(d.covers)){
      if(!/^(bottle|drink):/.test(key)||key.length>1100||!validCover(value))fail();
      bytes+=value.length;
    }
    if(bytes>MAX_COVERS_CHARS)throw new Error('封面总量已达上限，请先移除不需要的封面。');
  }
  const ids = new Set<string>();
  const id = (x: string) => { if (!str(x, 100) || !x || ids.has(x)) fail(); ids.add(x); };
  const levels = new Map<string, number>();
  const bottles = new Map<string, Bottle>();
  for (const b of d.bottles) {
    if (!product(b) || !num(b.capacity, 1, 100000) || !num(b.initial, 0, 100) || !(b.price === null || num(b.price)) || !validDate(b.date) || typeof b.favorite !== 'boolean' || (b.hidden!==undefined&&typeof b.hidden!=='boolean')) fail();
    id(b.id); bottles.set(b.id, b); levels.set(b.id, b.initial);
  }
  for (const s of d.sessions) {
    if (!s || !validDate(s.date) || !str(s.created, 100) || !Number.isFinite(Date.parse(s.created)) || !Array.isArray(s.entries) || !s.entries.length || s.entries.length > 500) fail();
    id(s.id);
    for (const e of s.entries) {
      if (!product(e) || !num(e.capacity, 1, 100000) || !num(e.before, 0, 100) || !num(e.after, 0, 100) || !num(e.volume, -100000, 1000000) || !num(e.ratio, 0, 1) || !['drink', 'adjust'].includes(e.kind) || !str(e.reason) || !(e.cost === null || num(e.cost)) || !(e.paid === null || num(e.paid))) fail();
      id(e.id);
      if (e.bottleId !== null) {
        const b = bottles.get(e.bottleId);
        if (!b || Math.abs((levels.get(e.bottleId) ?? -1) - e.before) > 0.01 || e.capacity !== b.capacity || Math.abs(e.volume - round(e.capacity * (e.before - e.after) / 100)) > 0.02 || e.paid !== null) fail();
        levels.set(e.bottleId, e.after);
      } else if (e.kind !== 'drink' || e.volume <= 0) fail();
      if (e.kind === 'drink' && (e.volume <= 0 || (e.bottleId && e.after >= e.before))) fail();
      if (e.kind === 'adjust' && (e.ratio !== 0 || e.cost !== null)) fail();
    }
  }
  return d;
}
