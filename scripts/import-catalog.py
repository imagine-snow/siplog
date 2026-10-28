"""Build the redistributable, offline ODbL catalog from official database exports.
Usage: python scripts/import-catalog.py --off off-alcohol.json --beer openbeerdb_csv
No user records, reviews, descriptions or images are imported.
"""
import argparse, csv, datetime, json, re, pathlib, collections
from catalog_rules import classify
p=argparse.ArgumentParser();p.add_argument('--off',required=True);p.add_argument('--beer',required=True);p.add_argument('--out',default='public/data/drinks.json');p.add_argument('--date',default=datetime.date.today().isoformat());args=p.parse_args()
today=args.date; result=[]; rejected=[]
aliases={'johnnie walker':'尊尼获加 强尼沃克','jack daniel':'杰克丹尼','jameson':'尊美醇','chivas':'芝华士','glenfiddich':'格兰菲迪','glenlivet':'格兰威特','macallan':'麦卡伦','talisker':'泰斯卡','lagavulin':'乐加维林','laphroaig':'拉弗格','ardbeg':'阿贝','ballantine':'百龄坛','jim beam':'占边 金宾','maker':'美格','hibiki':'响','yamazaki':'山崎','hakushu':'白州','suntory':'三得利','nikka':'日果 一甲','heineken':'喜力','carlsberg':'嘉士伯','corona':'科罗娜','budweiser':'百威','tsingtao':'青岛','snow beer':'雪花','guinness':'健力士 吉尼斯','hoegaarden':'福佳','asahi':'朝日','kirin':'麒麟','sapporo':'札幌','stella artois':'时代','1664':'凯旋 克伦堡','kronenbourg':'克伦堡','leffe':'乐飞 莱福','duvel':'督威','chimay':'智美','pilsner urquell':'皮尔森','erdinger':'艾丁格','paulaner':'保拉纳 柏龙','warsteiner':'沃斯坦','absolut':'绝对伏特加','smirnoff':'斯米诺 红牌','grey goose':'灰雁','bacardi':'百加得','havana club':'哈瓦那俱乐部','captain morgan':'摩根船长','beefeater':'必富达','tanqueray':'添加利','bombay':'孟买','hendrick':'亨利爵士','gordon':'哥顿','jose cuervo':'豪帅 金快活','patron':'培恩','hennessy':'轩尼诗','remy martin':'人头马','martell':'马爹利','courvoisier':'拿破仑','baileys':'百利甜','jagermeister':'野格','jägermeister':'野格','cointreau':'君度','kahlua':'甘露','kahlúa':'甘露','aperol':'阿佩罗','campari':'金巴利','moet':'酩悦','moët':'酩悦','veuve clicquot':'凯歌','penfolds':'奔富','yellow tail':'黄尾袋鼠','jacob':'杰卡斯','mouton cadet':'木桐嘉棣','maotai':'茅台','moutai':'茅台','wuliangye':'五粮液','dassai':'獭祭','gekk eikan':'月桂冠'}
def clean(s,n=180):return re.sub(r'\s+',' ',str(s or '')).strip()[:n]
def capacity(q):
 matches=re.findall(r'(\d+(?:[.,]\d+)?)\s*(ml|cl|l|litre|liter|lt)\b',str(q or '').lower())
 if len(matches)!=1:return None
 value,unit=matches[-1];v=float(value.replace(',','.'))*({'ml':1,'cl':10}.get(unit,1000))
 return round(v,2) if 1<=v<=100000 else None
def extra(d):
 text=(d['name']+' '+d['brand']).lower();d['aliases']=list(dict.fromkeys(d.get('aliases',[])+[v for k,v in aliases.items() if k in text]))
 if 'johnnie' in text:
  for en,zh in [('black label','黑牌 黑方'),('red label','红牌 红方'),('blue label','蓝牌 蓝方'),('green label','绿牌 绿方'),('gold label','金牌 金方')]:
   if en in text:d['aliases'].append(zh)
 d['popularity']=int(d.get('popularity') or 0)+(100 if d['aliases'] else 0)+(20 if d['abv'] is not None else 0)
 return d
off=json.loads(pathlib.Path(args.off).read_text(encoding='utf-8'))
for r in sorted(off,key=lambda r:r.get('unique_scans_n') or 0,reverse=True):
 names=r.get('product_name') or [];name=next((clean(n['text']) for lang in ['zh','en','main'] for n in names if n.get('lang')==lang and clean(n.get('text'))),'')
 if not name:name=next((clean(n.get('text')) for n in names if clean(n.get('text'))),'')
 if not name or not str(r.get('code','')).isdigit():continue
 nutrients=r.get('nutriments') or [];a=next((n for n in nutrients if n['name']=='alcohol'),None);abv=None
 if a:
  val=a.get('value') if a.get('value') is not None else a.get('100g')
  if isinstance(val,(int,float)) and 0<=val<=100 and a.get('unit') in ('% vol','% vol / *','%') and abs(val-round(val,2))<0.0001:abv=round(val,2)
 cap=capacity(r.get('quantity'));code=str(r['code']);tags=r.get('categories_tags') or []
 cat,reason=classify(tags,[n.get('text','') for n in names],abv,clean(r.get('brands')))
 if reason:
  rejected.append({'id':'off:'+code,'reason':reason});continue
 source={'database':'Open Food Facts','id':code,'url':'https://world.openfoodfacts.org/product/'+code,'license':'ODbL-1.0 / DbCL-1.0','retrievedAt':today,'abv':abv,'capacity':cap}
 result.append(extra({'id':'off:'+code,'name':name,'brand':clean(r.get('brands')),'origin':clean(r.get('origins')),'category':cat,'abv':abv,'capacity':cap,'aliases':[clean(n['text']) for n in names if clean(n.get('text')) and clean(n['text'])!=name],'style':clean(next((t[3:] for t in reversed(tags) if t.startswith('en:')),'')),'source':source,'popularity':r.get('unique_scans_n') or 0}))
beer=pathlib.Path(args.beer)
def csv_rows(name):
 with (beer/name).open(encoding='utf-8-sig',errors='replace',newline='') as f:return list(csv.DictReader(f))
brewers={b['id']:b for b in csv_rows('breweries.csv')};styles={b['id']:b for b in csv_rows('styles.csv')}
for r in csv_rows('beers.csv'):
 b=brewers.get(r['brewery_id'],{});name=clean(r['name'])
 if not name:continue
 try:abv=float(r['abv']);abv=abv if 0<abv<=100 else None
 except (ValueError,TypeError):abv=None
 cat,reason=classify(['en:beers'],[name],abv)
 if reason:
  rejected.append({'id':'openbeer:'+r['id'],'reason':reason});continue
 result.append(extra({'id':'openbeer:'+r['id'],'name':name,'brand':clean(b.get('name')),'origin':clean(b.get('country')),'category':'啤酒','abv':abv,'capacity':None,'style':clean(styles.get(r['style_id'],{}).get('style_name')),'source':{'database':'Open Beer Database','id':r['id'],'url':'https://openbeerdb.com/','license':'ODbL-1.0 / DbCL-1.0','retrievedAt':today,'abv':abv,'capacity':None},'popularity':0}))
for i,r in enumerate(json.loads((pathlib.Path(__file__).parent/'brand-labels.json').read_text(encoding='utf-8'))):
 url=r.pop('url');r['id']='label:'+str(i+1);r['style']='';r['popularity']=150
 r['source']={'database':'Brand label references','id':r['id'],'url':url,'license':'Factual label data; catalog ODbL-1.0','retrievedAt':today,'abv':r['abv'],'capacity':r['capacity']}
 result.append(r)
# Collapse identical product specifications within a source; retain distinct package variants.
seen=set();drinks=[]
for d in sorted(result,key=lambda d:-d['popularity']):
 key=(d['source']['database'],d['name'].casefold(),d['brand'].casefold(),d['abv'],d['capacity'])
 if key not in seen:seen.add(key);drinks.append(d)
counts=collections.Counter(d['source']['database'] for d in drinks)
payload={'qualityRevision':2,'excludedCount':len(rejected),'version':1,'importedAt':today,'sources':[{'name':'Open Food Facts','url':'https://huggingface.co/datasets/openfoodfacts/product-database','license':'ODbL-1.0 / DbCL-1.0','count':counts['Open Food Facts'],'snapshot':'Hugging Face official export'},{'name':'Open Beer Database','url':'https://openbeerdb.com/','license':'ODbL-1.0 / DbCL-1.0','count':counts['Open Beer Database'],'snapshot':'2011-12-14 (historical)'}],'drinks':drinks}
payload['sources'].append({'name':'Brand label references','url':'https://jiuji-drink-log.imagine-snow.chatgpt.site/data/README.md','license':'Factual label data; catalog ODbL-1.0','count':counts['Brand label references'],'snapshot':today})
out=pathlib.Path(args.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
report={'revision':2,'screenedAt':today,'excludedCount':len(rejected),'byReason':dict(collections.Counter(d['reason'] for d in rejected)),'excluded':rejected}
(out.parent/'classification-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'excluded':report['byReason'],'total':len(drinks),'bySource':dict(counts),'byCategory':dict(collections.Counter(d['category'] for d in drinks)),'withAbv':sum(d['abv'] is not None for d in drinks),'bytes':out.stat().st_size},ensure_ascii=False))
