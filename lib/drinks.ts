import type { Category, Product } from './model';
import {drinkName} from './drink-names.ts';
export type CatalogDrink = Omit<Product,'abv'> & {id:string;abv:number|null;capacity:number|null;aliases?:string[];style?:string;source:NonNullable<Product['source']>;popularity?:number;serving?:boolean};
export type CatalogFile = {version:1;importedAt:string;sources:{name:string;url:string;license:string;count:number;snapshot?:string}[];drinks:CatalogDrink[]};
export const bottleCategories:Category[]=['威士忌','葡萄酒','白酒','金酒','朗姆酒','伏特加','龙舌兰','白兰地','利口酒','清酒','黄酒'];
export const usesBottle=(category:Category)=>bottleCategories.includes(category);
export function normalize(text:string){return text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
const searchIndex=new WeakMap<CatalogDrink,string>();
const nameIndex=new WeakMap<CatalogDrink,string>();
function searchable(d:CatalogDrink){let text=searchIndex.get(d);if(text===undefined){text=normalize([d.name,drinkName(d),d.brand,d.style,...(d.aliases??[])].join(' '));searchIndex.set(d,text);}return text;}
export function searchDrinks(drinks:CatalogDrink[],query:string,category:Category|'all'='all'){
  const words=normalize(query).split(' ').filter(Boolean);
  const contains=(text:string,word:string)=>text.includes(word)||(/[\u3400-\u9fff]/.test(word)&&text.replaceAll(' ','').includes(word));
  const relevance=(d:CatalogDrink)=>{if(!words.length)return 0;let name=nameIndex.get(d);if(name===undefined){name=normalize(d.name+' '+drinkName({name:d.name}));nameIndex.set(d,name);}return words.every(w=>contains(name!,w))?2:words.some(w=>contains(name!,w))?1:0;};
  return drinks.filter(d=>(category==='all'||d.category===category)&&words.every(w=>contains(searchable(d),w))).sort((a,b)=>relevance(b)-relevance(a)||(b.popularity??0)-(a.popularity??0));
}
