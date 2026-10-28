import { type Product, type Ledger, type Bottle, localDate, bottleEntry, uid } from './model';
export type Preset = Product & { capacity: number; serving?:boolean };
// Suggested starting points, always editable to match the package in hand.
export const presets: Preset[] = [
  { name: '拉格啤酒', category: '啤酒', abv: 5, capacity: 330, brand: '', origin: '' },
  { name: '精酿 IPA', category: '啤酒', abv: 6, capacity: 500, brand: '', origin: '' },
  { name: '威士忌', category: '威士忌', abv: 40, capacity: 700, brand: '', origin: '' },
  { name: '红葡萄酒', category: '葡萄酒', abv: 13, capacity: 750, brand: '', origin: '' },
  { name: '白葡萄酒', category: '葡萄酒', abv: 12, capacity: 750, brand: '', origin: '' },
  { name: '白酒', category: '白酒', abv: 52, capacity: 500, brand: '', origin: '' },
  { name: '金酒', category: '金酒', abv: 40, capacity: 700, brand: '', origin: '' },
  { name: '朗姆酒', category: '朗姆酒', abv: 40, capacity: 700, brand: '', origin: '' },
  { name: '伏特加', category: '伏特加', abv: 40, capacity: 750, brand: '', origin: '' },
  { name: '我的鸡尾酒', category: '鸡尾酒', abv: 15, capacity: 150, brand: '', origin: '' },
];
export function sampleLedger(): Ledger {
  const dateAgo = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return localDate(d); };
  const bottles: Bottle[] = [
    { ...presets[2], id: uid(), name: '黑牌 · 调和威士忌', brand: '尊尼获加', origin: '苏格兰', initial: 100, price: 228, date: dateAgo(25), favorite: true },
    { ...presets[3], id: uid(), name: '晚餐的赤霞珠', initial: 100, price: 98, date: dateAgo(5), favorite: false },
    { ...presets[6], id: uid(), name: '伦敦干金酒', initial: 100, price: 168, date: dateAgo(55), favorite: true },
  ];
  const d: Ledger = { version: 1, revision: 0, currency: 'CNY', bottles, sessions: [] };
  for (const [index, days, level, ratio] of [[0,24,90,1],[2,22,60,.5],[0,19,75,.7],[2,16,30,.5],[0,12,60,1],[2,8,0,.3],[1,4,55,.5],[0,2,45,.6]] as number[][]) {
    d.sessions.push({ id: uid(), date: dateAgo(days), created: new Date().toISOString(), entries: [bottleEntry(d,bottles[index],level,ratio)] });
  }
  for (const days of [20, 14, 7, 3, 0]) d.sessions.push({ id: uid(), date: dateAgo(days), created: new Date().toISOString(), entries: [{ ...presets[0], id: uid(), bottleId: null, before: 100, after: 0, volume: 330, ratio: 1, cost: 12, paid: 12, kind: 'drink', reason: '' }] });
  return d;
}
