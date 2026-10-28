import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLedger, bottleEntry, addSession, stats, remaining, removeSession, canRemove, validateLedger, purchaseTotal, updateBottlePrice } from '../lib/model.ts';

const bottle = (id='b1') => ({ id, name:'测试威士忌', category:'威士忌', brand:'', origin:'', abv:40, capacity:700, initial:100, price:280, date:'2026-10-01', favorite:false });
const ledger = () => ({ ...emptyLedger(), bottles:[bottle()] });
const session = (id, entries, date='2026-10-26') => ({id,entries,date,created:'2026-10-26T12:00:00Z'});
test('shared bottle: inventory depletion and personal ethanol/cost are independent',()=>{
 const d=ledger();const e=bottleEntry(d,d.bottles[0],80,.5);const next=addSession(d,session('s1',[e]));
 assert.equal(remaining(next,next.bottles[0]),80); assert.equal(e.volume,140); assert.equal(e.cost,28);
 assert.ok(Math.abs(stats(next.sessions).grams-22.092)<1e-8); assert.equal(stats(next.sessions).ml,70);
});
test('friends-only lowers inventory but does not create a personal drinking session',()=>{
 const d=ledger();const next=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],50,0)]));
 assert.equal(remaining(next,next.bottles[0]),50);assert.equal(stats(next.sessions).count,0);assert.equal(stats(next.sessions).grams,0);
});
test('multiple drinks and repeated bottle entries count as one session; undo restores original',()=>{
 let d=ledger();const e=bottleEntry(d,d.bottles[0],80,1);const temp=addSession(d,session('draft',[e]));const e2=bottleEntry(temp,d.bottles[0],70,.5);
 d=addSession(d,session('s1',[e,e2]));assert.equal(stats(d.sessions).count,1);assert.equal(remaining(d,d.bottles[0]),70);
 d=removeSession(d,'s1');assert.equal(remaining(d,d.bottles[0]),100);
});
test('out-of-order removal reflows stock while preserving later consumed amounts',()=>{
 let d=ledger();d=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],80,1)]));d=addSession(d,session('s2',[bottleEntry(d,d.bottles[0],60,1)]));
 assert.equal(canRemove(d,d.sessions[0]),true);const removed=removeSession(d,'s1');assert.equal(remaining(removed,d.bottles[0]),80);assert.equal(removed.sessions[0].entries[0].volume,140);
 assert.equal(remaining(removeSession(d,'s2'),d.bottles[0]),80);
});
test('cross-bottle atomic removal recomputes every affected bottle',()=>{
 let d={...ledger(),bottles:[bottle(),bottle('b2')]};d=addSession(d,session('s1',d.bottles.map(b=>bottleEntry(d,b,80,1))));
 d=addSession(d,session('s2',[bottleEntry(d,d.bottles[1],60,1)]));assert.equal(canRemove(d,d.sessions[0]),true);const next=removeSession(d,'s1');assert.equal(remaining(next,next.bottles[0]),100);assert.equal(remaining(next,next.bottles[1]),80);
});
test('loss and upward estimate correction are inventory only',()=>{
 let d=ledger();d=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],70,0,'adjust','洒出')]));
 d=addSession(d,session('s2',[bottleEntry(d,d.bottles[0],85,0,'adjust','修正')]));
 assert.equal(remaining(d,d.bottles[0]),85);assert.equal(stats(d.sessions).grams,0);assert.equal(stats(d.sessions).count,0);
});
test('ordinary drinking cannot increase stock; stale before level is rejected',()=>{
 let d=ledger();d=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],50,1)]));
 assert.throws(()=>addSession(d,session('s2',[bottleEntry(d,d.bottles[0],70,1)])));
 const stale=bottleEntry(ledger(),d.bottles[0],80,1);assert.throws(()=>addSession(d,session('s2',[stale])));
});
test('unknown price stays unknown; gifts can be explicitly zero; weighted denominator matches priced intake',()=>{
 const d=ledger();const a=bottleEntry(d,d.bottles[0],80,1);const unknown={...a,id:'unknown',bottleId:null,cost:null,paid:null,volume:200};const gift={...unknown,id:'gift',cost:0,paid:0};
 const s=stats([session('s1',[a,unknown,gift])]);assert.equal(s.unknown,1);assert.equal(s.pricedCount,2);assert.ok(Math.abs(s.unitCost-56/((140+200)*.4*.789))<1e-8);
 assert.equal(purchaseTotal(addSession(d,session('s1',[a])),'2026-10-01','2026-10-31').value,280);
});
test('backdating groups by user date without inventing daily allocations',()=>{
 const d=ledger();const n=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],75,1)],'2026-10-02'));assert.equal(n.sessions[0].date,'2026-10-02');assert.equal(stats(n.sessions).days,1);
});
test('explicit bottle-price correction updates costs without changing volumes or shares',()=>{
 let d=ledger();d=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],80,.5)]));
 const corrected=updateBottlePrice(d,'b1',350);assert.equal(stats(corrected.sessions).cost,35);assert.equal(stats(corrected.sessions).ml,70);assert.equal(remaining(corrected,corrected.bottles[0]),80);
 assert.equal(stats(updateBottlePrice(corrected,'b1',null).sessions).unknown,1);assert.equal(purchaseTotal(corrected,'2026-10-01','2026-10-31').value,350);
});
test('backup round-trip preserves inventory and rejects corrupt schema, duplicate IDs, missing references, invalid dates',()=>{
 let d=ledger();d=addSession(d,session('s1',[bottleEntry(d,d.bottles[0],0,.6)]));assert.deepEqual(validateLedger(JSON.parse(JSON.stringify(d))),d);
 for(const mutate of [x=>x.version=99,x=>x.sessions[0].date='2026-02-30',x=>x.sessions[0].entries[0].bottleId='absent',x=>x.sessions[0].entries[0].id='b1',x=>x.bottles[0].capacity=0,x=>x.sessions[0].entries[0].ratio=2]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>validateLedger(bad));}
});
