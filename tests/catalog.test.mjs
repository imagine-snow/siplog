import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {categories} from '../lib/model.ts';
import {searchDrinks} from '../lib/drinks.ts';
const catalog=JSON.parse(fs.readFileSync(new URL('../public/data/drinks.json',import.meta.url),'utf8'));
test('bundled catalog has valid unique identities, bounded specs and complete provenance',()=>{
 assert.ok(catalog.drinks.length>0);
 assert.equal(catalog.qualityRevision,2);
 assert.equal(new Set(catalog.drinks.map(d=>d.id)).size,catalog.drinks.length);
 assert.equal(catalog.sources.reduce((n,s)=>n+s.count,0),catalog.drinks.length);
 for(const d of catalog.drinks){
  assert.ok(d.name&&d.name.length<=200);assert.ok(categories.includes(d.category));
  assert.ok(d.abv===null||Number.isFinite(d.abv)&&d.abv>=0&&d.abv<=100);
  assert.ok(d.capacity===null||Number.isFinite(d.capacity)&&d.capacity>=1&&d.capacity<=100000);
  assert.ok(d.source.database&&d.source.id&&d.source.license&&d.source.retrievedAt&&d.source.url.startsWith('https://'));
 }
});

test('mixed drinks, ginger beer and quarantined identities are absent from the regular catalog',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../public/data/classification-report.json',import.meta.url),'utf8'));
 const excluded=new Set(report.excluded.map(d=>d.id));
 assert.ok(report.byReason['mixed-drink']>0);
 for(const d of catalog.drinks){assert.equal(excluded.has(d.id),false);assert.notEqual(d.category,'鸡尾酒');assert.notEqual(d.category,'其他');}
 for(const query of ['gin tonic','gin & tonic','Smirnoff Ice','mojito'])assert.equal(searchDrinks(catalog.drinks,query).length,0,query);
 assert.equal(searchDrinks(catalog.drinks,'ginger beer','金酒').length,0);
 assert.ok(searchDrinks(catalog.drinks,'Hendrick','金酒').length);
});
test('representative real beer, whisky, wine and baijiu can be found without network calls',()=>{
 for(const [query,category] of [['青岛','啤酒'],['Heineken','啤酒'],['尊尼获加 黑牌','威士忌'],['奔富','葡萄酒'],['茅台','白酒'],['汾酒','白酒']])assert.ok(searchDrinks(catalog.drinks,query,category).length>0,query);
 const black=searchDrinks(catalog.drinks,'尊尼获加 黑牌','威士忌').find(d=>d.source.id==='5000267024202');
 assert.equal(black.abv,40);assert.equal(black.capacity,700);
 assert.ok(catalog.drinks.some(d=>d.abv===null));assert.ok(catalog.drinks.some(d=>d.capacity===null));
 assert.equal(searchDrinks(catalog.drinks,'doesnotexist-zxy-7349').length,0);
});
