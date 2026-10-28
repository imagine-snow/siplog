// Display/search aliases only: stored product names and source IDs stay intact.
// Unknown cuvées and model names are deliberately preserved in their original language.
const brands:[RegExp,string][]=[
  [/johnnie walker/ig,'尊尼获加'],[/jack daniel'?s?/ig,'杰克丹尼'],[/jameson/ig,'尊美醇'],[/chivas(?: regal)?/ig,'芝华士'],[/glenfiddich/ig,'格兰菲迪'],[/glenlivet/ig,'格兰威特'],[/macallan/ig,'麦卡伦'],[/talisker/ig,'泰斯卡'],[/lagavulin/ig,'乐加维林'],[/laphroaig/ig,'拉弗格'],[/ardbeg/ig,'阿贝'],[/ballantine'?s?/ig,'百龄坛'],[/jim beam/ig,'占边'],[/maker'?s mark/ig,'美格'],[/hibiki/ig,'响'],[/yamazaki/ig,'山崎'],[/hakushu/ig,'白州'],[/suntory/ig,'三得利'],[/nikka/ig,'日果'],
  [/heineken/ig,'喜力'],[/carlsberg/ig,'嘉士伯'],[/corona/ig,'科罗娜'],[/budweiser/ig,'百威'],[/tsingtao/ig,'青岛'],[/guinness/ig,'健力士'],[/hoegaarden/ig,'福佳'],[/asahi/ig,'朝日'],[/kirin/ig,'麒麟'],[/sapporo/ig,'札幌'],[/stella artois/ig,'时代'],[/kronenbourg/ig,'克伦堡'],[/leffe/ig,'乐飞'],[/duvel/ig,'督威'],[/chimay/ig,'智美'],[/pilsner urquell/ig,'皮尔森'],[/erdinger/ig,'艾丁格'],[/paulaner/ig,'保拉纳'],[/warsteiner/ig,'沃斯坦'],
  [/absolut/ig,'绝对伏特加'],[/smirnoff/ig,'斯米诺'],[/grey goose/ig,'灰雁'],[/bacardi/ig,'百加得'],[/havana club/ig,'哈瓦那俱乐部'],[/captain morgan/ig,'摩根船长'],[/beefeater/ig,'必富达'],[/tanqueray/ig,'添加利'],[/bombay sapphire/ig,'孟买蓝宝石'],[/bombay/ig,'孟买'],[/hendrick'?s?/ig,'亨利爵士'],[/gordon'?s?/ig,'哥顿'],[/jose cuervo/ig,'豪帅'],[/patr[oó]n/ig,'培恩'],[/hennessy/ig,'轩尼诗'],[/r[eé]my martin/ig,'人头马'],[/martell/ig,'马爹利'],[/courvoisier/ig,'拿破仑'],[/baileys/ig,'百利甜'],[/j[aä]germeister/ig,'野格'],[/cointreau/ig,'君度'],[/kahl[uú]a/ig,'甘露'],[/aperol/ig,'阿佩罗'],[/campari/ig,'金巴利'],[/mo[eë]t(?: & chandon)?/ig,'酩悦'],[/veuve clicquot/ig,'凯歌'],[/penfolds/ig,'奔富'],[/yellow tail/ig,'黄尾袋鼠'],[/jacob'?s creek/ig,'杰卡斯'],[/mouton cadet/ig,'木桐嘉棣'],[/dassai/ig,'獭祭'],[/gekkeikan/ig,'月桂冠']
];
const terms:[RegExp,string][]=[[/\bdouble black\b/ig,'醇黑'],[/\bblack label\b/ig,'黑牌'],[/\bred label\b/ig,'红牌'],[/\bblue label\b/ig,'蓝牌'],[/\bgreen label\b/ig,'绿牌'],[/\bgold label\b/ig,'金牌'],[/\b(\d+)\s*(?:years? old|years?|yo)\b/ig,'$1年'],[/\bsingle malt\b/ig,'单一麦芽'],[/\bblended\b/ig,'调和'],[/\bscotch\b/ig,'苏格兰'],[/\bwhisk(?:e)?y\b/ig,'威士忌'],[/\blondon dry gin\b/ig,'伦敦干金酒'],[/\bgin\b/ig,'金酒'],[/\bvodka\b/ig,'伏特加'],[/\brum\b/ig,'朗姆酒'],[/\blager\b/ig,'拉格'],[/\bstout\b/ig,'世涛'],[/\bwheat beer\b/ig,'小麦啤酒'],[/\bbeer\b/ig,'啤酒'],[/\bbi[eè]re blonde\b/ig,'金色啤酒'],[/\bbi[eè]re\b/ig,'啤酒'],[/\bblanc\b/ig,'白'],[/\bblonde\b/ig,'金色'],[/\boriginal\b/ig,'原味'],[/\bdraught\b/ig,'生啤']];
export function drinkName(p:{name:string;brand?:string},lang:'zh'|'en'='zh'):string{
  if(lang==='en'||/[\u3400-\u9fff]/.test(p.name))return p.name;
  let name=p.name;
  for(const [pattern,zh] of [...brands,...terms])name=name.replace(pattern,zh);
  // Some database names are just “lager”; a known brand makes these identifiable.
  if(p.brand){let brand=p.brand;for(const [pattern,zh] of brands)brand=brand.replace(pattern,zh);if(/[\u3400-\u9fff]/.test(brand)&&!brands.some(([pattern,zh])=>name.includes(zh))){name=brand+' · '+name;}}
  return name.replace(/\s+/g,' ').trim();
}
