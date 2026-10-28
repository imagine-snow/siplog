import test from 'node:test';
import assert from 'node:assert/strict';
import {addDraftSession,addSession,bottleEntry,emptyLedger,remaining,stats,validateLedger} from '../lib/model.ts';
import {searchDrinks,usesBottle} from '../lib/drinks.ts';
const source={database:'Open Food Facts',id:'123',url:'https://world.openfoodfacts.org/product/123',license:'ODbL-1.0',retrievedAt:'2026-10-26',abv:40,capacity:700};
const b={id:'b',name:'Shared bottle',category:'威士忌',brand:'Brand',origin:'',abv:40,capacity:700,initial:100,price:280,date:'2026-10-26',favorite:false,source};
const session=entries=>({id:'s',date:'2026-10-26',created:'2026-10-26T12:00:00Z',entries});
test('first spirit record atomically creates bottle and saves its remaining level; next record resumes it',()=>{
 const original=emptyLedger();const entry=bottleEntry(original,b,80,.5);
 const saved=addDraftSession(original,session([entry]),[b]);
 assert.equal(original.bottles.length,0);assert.equal(saved.bottles.length,1);assert.equal(remaining(saved,saved.bottles[0]),80);assert.equal(stats(saved.sessions).ml,70);assert.equal(entry.cost,28);
 const next=addSession(saved,{...session([bottleEntry(saved,b,60,0)]),id:'s2'});
 assert.equal(next.bottles.length,1);assert.equal(remaining(next,b),60);assert.equal(stats(next.sessions).ml,70);
 assert.deepEqual(validateLedger(JSON.parse(JSON.stringify(next))).bottles[0].source,source);
});
test('discarded draft bottles are not committed with other drinks',()=>{
 const beer={...b,id:'beer',bottleId:null,category:'啤酒',capacity:500,abv:5,before:100,after:0,volume:3000,ratio:1,kind:'drink',reason:'',cost:null,paid:null};
 const saved=addDraftSession(emptyLedger(),session([beer]),[b]);
 assert.equal(saved.bottles.length,0);assert.equal(stats(saved.sessions).ml,3000);assert.equal(stats(saved.sessions).count,1);
 assert.ok(Math.abs(stats(saved.sessions).grams-118.35)<1e-8);
});
test('catalog search supports accents, Chinese aliases and category separation',()=>{
 const catalog=[{...b,id:'d1',name:'Johnnie Walker Black Label',aliases:['尊尼获加 黑牌 黑方'],popularity:3},{...b,id:'d2',name:'Bière',category:'啤酒',aliases:[],popularity:2}];
 assert.equal(searchDrinks(catalog,'尊尼获加 黑牌','威士忌')[0].id,'d1');
 assert.equal(searchDrinks(catalog,'biere','啤酒')[0].id,'d2');assert.equal(searchDrinks(catalog,'Johnnie','啤酒').length,0);
 assert.equal(usesBottle('啤酒'),false);assert.equal(usesBottle('威士忌'),true);assert.equal(usesBottle('鸡尾酒'),false);assert.equal(usesBottle('白酒'),true);
});
test('source metadata is optional for old backups, and unsafe source links are rejected',()=>{
 assert.doesNotThrow(()=>validateLedger({...emptyLedger(),bottles:[{...b,source:undefined}]}));
 assert.throws(()=>validateLedger({...emptyLedger(),bottles:[{...b,source:{...source,url:'javascript:alert(1)'}}]}));
});
