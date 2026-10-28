import type { Entry, Ledger, Session } from './model';
import { remaining,drinkKey } from './model.ts';

export type CollectedDrink = { key: string; product: Entry; volume: number; personalVolume: number; occasions: number; latestDate: string; favorite: boolean; sessions: Session[] };

// Quick drinks are a view over saved history, not new inventory or purchases.
// Product specifications keep a 330 ml can separate from a 500 ml bottle.
export function collectedDrinks(data: Ledger): CollectedDrink[] {
  const drinks = new Map<string, CollectedDrink>();
  const favorites = new Set(data.favoriteDrinks ?? []);
  for (const session of data.sessions) {
    for (const entry of session.entries) {
      if (entry.bottleId !== null || entry.kind !== 'drink') continue;
      const key = drinkKey(entry);
      let drink = drinks.get(key);
      if (!drink) {
        drink = { key, product: entry, volume: 0, personalVolume: 0, occasions: 0, latestDate: session.date, favorite: favorites.has(key), sessions: [] };
        drinks.set(key, drink);
      }
      drink.volume += entry.volume;
      drink.personalVolume += entry.volume * entry.ratio;
      if (drink.sessions.at(-1)?.id !== session.id) { drink.sessions.push(session); drink.occasions++; }
      if (session.date >= drink.latestDate) { drink.latestDate = session.date; drink.product = entry; }
    }
  }
  return [...drinks.values()].sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

export function cabinetSections(data:Ledger){
  const recent=new Map<string,string>();
  for(const session of data.sessions)for(const e of session.entries)if(e.bottleId)recent.set(e.bottleId,session.created);
  const open=data.bottles.filter(b=>!b.hidden&&remaining(data,b)>0).sort((a,b)=>(recent.get(b.id)??b.date).localeCompare(recent.get(a.id)??a.date));
  const archived=[
    ...data.bottles.filter(b=>!b.hidden&&remaining(data,b)===0).map(b=>({key:'bottle:'+b.id,type:'bottle' as const,id:b.id,product:b,favorite:b.favorite,date:recent.get(b.id)?.slice(0,10)??b.date})),
    ...collectedDrinks(data).map(d=>({key:'drink:'+d.key,type:'drink' as const,id:d.key,product:d.product,favorite:d.favorite,date:d.latestDate})),
  ].sort((a,b)=>b.date.localeCompare(a.date));
  return {open,archived};
}
