import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLedger,bottleEntry,addSession,editSession,removeSession,remaining,stats,setBottleHidden,validateLedger,drinkKey} from '../lib/model.ts';
import {cabinetSections,collectedDrinks} from '../lib/cabinet.ts';
import {drinkName} from '../lib/drink-names.ts';
import {searchDrinks} from '../lib/drinks.ts';
const b={id:'b',name:'Johnnie Walker Black Label',category:'威士忌',brand:'Johnnie Walker',origin:'Scotland',abv:40,capacity:700,initial:100,price:280,date:'2026-10-01',favorite:false};
const session=(id,entries)=>({id,entries,date:'2026-10-20',created:'2026-10-20T12:00:00Z'});
function linked(){let d={...emptyLedger(),bottles:[b]};d=addSession(d,session('s1',[bottleEntry(d,b,80,1)]));return addSession(d,session('s2',[bottleEntry(d,b,60,.5)]));}
const q={id:'q',name:'Heineken',category:'啤酒',brand:'Heineken',origin:'',abv:5,capacity:500,bottleId:null,before:100,after:0,volume:1500,ratio:1,cost:30,paid:30,kind:'drink',reason:''};
test('finished beer remains editable: name/category/ABV/size/amount/price/date update totals',()=>{
 const d=addSession(emptyLedger(),session('s',[q]));const edited={...d.sessions[0],date:'2026-10-19',entries:[{...q,name:'My cider',category:'苹果酒',abv:6,capacity:330,volume:660,paid:20,ratio:.5}]};
 const n=editSession(d,edited);assert.equal(stats(n.sessions).ml,330);assert.equal(stats(n.sessions).cost,10);assert.ok(Math.abs(stats(n.sessions).grams-15.6222)<1e-8);assert.equal(n.sessions[0].date,'2026-10-19');assert.equal(collectedDrinks(n)[0].product.name,'My cider');assert.equal(d.sessions[0].entries[0].volume,1500);
});
test('editing an early amount preserves later consumption and recomputes levels and costs',()=>{
 const d=linked();const first=d.sessions[0];const n=editSession(d,{...first,entries:[{...first.entries[0],volume:70}]});
 assert.equal(n.sessions[0].entries[0].after,90);assert.equal(n.sessions[1].entries[0].before,90);assert.equal(n.sessions[1].entries[0].after,70);assert.equal(n.sessions[1].entries[0].volume,140);assert.equal(remaining(n,b),70);assert.equal(stats(n.sessions).cost,56);assert.equal(remaining(d,b),60);
});
test('later manual level corrections remain observations and invalid changes are atomic',()=>{
 let d=linked();d=addSession(d,session('fix',[bottleEntry(d,b,55,0,'adjust','修正之前的估计')]));const first=d.sessions[0];
 const n=editSession(d,{...first,entries:[{...first.entries[0],volume:70}]});assert.equal(remaining(n,b),55);assert.equal(n.sessions[2].entries[0].volume,105);assert.equal(stats([n.sessions[2]]).grams,0);
 assert.throws(()=>editSession(d,{...first,entries:[{...first.entries[0],volume:650}]}),/0–100/);assert.equal(remaining(d,b),55);
});
test('product corrections default to one entry; explicit sync updates the bottle and every linked entry',()=>{
 const d=linked();const first=d.sessions[0];const e={...first,entries:[{...first.entries[0],name:'Correct gin',category:'金酒',abv:47}]};
 const one=editSession(d,e);assert.equal(one.bottles[0].category,'威士忌');assert.equal(one.sessions[1].entries[0].abv,40);assert.equal(one.sessions[0].entries[0].category,'金酒');
 const all=editSession(d,e,['b']);assert.equal(all.bottles[0].category,'金酒');assert.equal(all.sessions[1].entries[0].abv,47);assert.equal(remaining(all,b),60);
});
test('cabinet removal and restoration retain history, stock, cost and backup compatibility',()=>{
 const d=linked();const n=setBottleHidden(d,'b',true);assert.equal(cabinetSections(n).open.length,0);assert.equal(stats(n.sessions).grams,stats(d.sessions).grams);assert.equal(remaining(n,b),60);assert.equal(n.bottles[0].price,280);assert.equal(cabinetSections(setBottleHidden(validateLedger(JSON.parse(JSON.stringify(n))),'b',false)).open.length,1);assert.equal(validateLedger(d),d);
 assert.throws(()=>validateLedger({...n,bottles:[{...b,hidden:'yes'}]}));
});
test('quick drink edits preserve cover and favorite; renaming removes wrong source attribution',()=>{
 const source={database:'Test',id:'1',url:'https://example.com/1',license:'test',retrievedAt:'2026-10-01'};
 const entry={...q,source};const key=drinkKey(entry);const cover='data:image/jpeg;base64,/9j/AA==';let d=addSession({...emptyLedger(),covers:{['drink:'+key]:cover},favoriteDrinks:[key]},session('s',[entry]));
 const n=editSession(d,{...d.sessions[0],entries:[{...entry,name:'My beer',abv:4}]});const e=n.sessions[0].entries[0];assert.equal(e.source,undefined);assert.equal(n.covers['drink:'+drinkKey(e)],cover);assert.deepEqual(n.favoriteDrinks,[drinkKey(e)]);assert.equal(n.covers['drink:'+key],undefined);
});
test('removing a saved beer affects only its occasion and updates derived cabinet history',()=>{
 const d=addSession(emptyLedger(),session('s',[q]));const n=removeSession(d,'s');assert.equal(n.sessions.length,0);assert.equal(collectedDrinks(n).length,0);
});
test('Chinese names are display aliases; original names and source metadata survive searching',()=>{
 const drink={...b,source:{id:'x'},aliases:[]};assert.equal(drinkName(drink),'尊尼获加 黑牌');assert.equal(drinkName(drink,'en'),b.name);assert.equal(searchDrinks([drink],'尊尼获加 黑牌').length,1);assert.equal(searchDrinks([drink],'尊尼获加黑牌').length,1);assert.equal(searchDrinks([drink],'Johnnie Black').length,1);assert.equal(drink.name,b.name);assert.equal(drinkName({name:'Unknown Cuvee'}),'Unknown Cuvee');assert.equal(drinkName({name:'自家米酒'}),'自家米酒');
});
test('direct drink-name matches rank above manufacturer-only matches',()=>{
 const a={...q,name:'Heineken',popularity:1};const other={...q,name:'Other beer',brand:'Heineken',popularity:10000};assert.equal(searchDrinks([other,a],'喜力')[0],a);
});
test('metadata-only edits do not drift existing fractional-capacity level snapshots',()=>{
 const bottle={...b,capacity:333.33};let d={...emptyLedger(),bottles:[bottle]};d=addSession(d,session('s',[bottleEntry(d,bottle,67,1)]));const edited={...d.sessions[0],entries:[{...d.sessions[0].entries[0],abv:43}]};const n=editSession(d,edited);assert.equal(remaining(n,bottle),67);assert.equal(n.sessions[0].entries[0].volume,d.sessions[0].entries[0].volume);
});
