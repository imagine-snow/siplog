import test from 'node:test';
import assert from 'node:assert/strict';
import { collectedDrinks, cabinetSections } from '../lib/cabinet.ts';
import { emptyLedger, stats, purchaseTotal, validateLedger, removeSession } from '../lib/model.ts';
const beer=(id,extra={})=>({id,name:'Heineken',brand:'Heineken',category:'啤酒',origin:'',abv:5,capacity:500,bottleId:null,before:100,after:0,volume:1000,ratio:.5,cost:10,paid:20,kind:'drink',reason:'',...extra});
const session=(id,entries,date='2026-10-26')=>({id,entries,date,created:date+'T12:00:00Z'});

test('old beer history appears without migration, inventory changes or duplicate costs',()=>{
 const data={...emptyLedger(),sessions:[session('s1',[beer('e1'),beer('e2')]),session('s2',[beer('e3')])]};
 const snapshot=JSON.stringify(data);const before=stats(data.sessions);const spend=purchaseTotal(data,'2026-01-01','2026-12-31');
 const [drink]=collectedDrinks(validateLedger(data));
 assert.equal(drink.occasions,2);assert.equal(drink.volume,3000);assert.equal(drink.personalVolume,1500);assert.equal(data.bottles.length,0);
 assert.equal(JSON.stringify(data),snapshot);assert.deepEqual(stats(data.sessions),before);assert.deepEqual(purchaseTotal(data,'2026-01-01','2026-12-31'),spend);
});

test('specifications stay separate and latest date respects backdated records',()=>{
 const data={...emptyLedger(),sessions:[session('s1',[beer('e1'),beer('e2',{capacity:330}),beer('e3',{abv:0})]),session('s2',[beer('e4',{ratio:0})],'2026-10-01')]};
 const drinks=collectedDrinks(data);assert.equal(drinks.length,3);
 const full=drinks.find(d=>d.product.capacity===500&&d.product.abv===5);
 assert.equal(full.latestDate,'2026-10-26');assert.equal(full.personalVolume,500);assert.equal(full.volume,2000);
});

test('favorites survive backup; removing final record removes its collection card',()=>{
 const data={...emptyLedger(),sessions:[session('s1',[beer('e1')])]};
 const key=collectedDrinks(data)[0].key;data.favoriteDrinks=[key];
 assert.equal(collectedDrinks(validateLedger(JSON.parse(JSON.stringify(data))))[0].favorite,true);
 assert.equal(collectedDrinks(removeSession(data,'s1')).length,0);
 assert.throws(()=>validateLedger({...data,favoriteDrinks:[{}]}));
});

test('tracked bottle entries do not create a second collection card',()=>{
 const data={...emptyLedger(),sessions:[session('s1',[beer('e1',{bottleId:'b1'})])]};
 assert.deepEqual(collectedDrinks(data),[]);
});

test('open bottles precede a separate archive and sort by recent use, without changing data',()=>{
 const b=(id,initial,date)=>({id,name:id,brand:'',origin:'',category:'威士忌',abv:40,capacity:700,initial,date,price:null,favorite:false});
 const data={...emptyLedger(),bottles:[b('old',100,'2026-10-01'),b('empty',0,'2026-10-02'),b('new',100,'2026-10-20')],sessions:[session('s1',[beer('e1')])]};
 const snapshot=JSON.stringify(data);const result=cabinetSections(data);
 assert.deepEqual(result.open.map(b=>b.id),['new','old']);
 assert.equal(result.archived.length,2);assert.ok(result.archived.some(d=>d.id==='empty'));assert.ok(result.archived.some(d=>d.type==='drink'));
 assert.equal(JSON.stringify(data),snapshot);
});
