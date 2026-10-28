"""Optional catalog-maintenance tool. Requires Python and `pip install duckdb`.
Reads selected columns from the official Open Food Facts parquet using HTTP ranges.
Run outside the app: python scripts/fetch-off.py --output off-alcohol.json
This is a large upstream export; allow time and bandwidth. No API key is required.
"""
import argparse,json,pathlib,duckdb
p=argparse.ArgumentParser();p.add_argument('--revision',default='3ac7e8b6e93775a2b28e993a3e4cf90059ca73cb');p.add_argument('--output',default='off-alcohol.json');args=p.parse_args()
db=duckdb.connect();db.execute("INSTALL httpfs; LOAD httpfs; SET threads=4; SET memory_limit='1GB';")
url=f'https://huggingface.co/datasets/openfoodfacts/product-database/resolve/{args.revision}/food.parquet'
print('Reading the official Open Food Facts export; this can take several minutes.',flush=True)
cursor=db.execute("SELECT code,product_name,brands,categories_tags,nutriments,quantity,origins,unique_scans_n FROM read_parquet(?) WHERE list_contains(categories_tags,'en:alcoholic-beverages') OR list_contains(categories_tags,'en:non-alcoholic-beers')",[url])
names=[c[0] for c in cursor.description];rows=[dict(zip(names,row)) for row in cursor.fetchall()]
pathlib.Path(args.output).write_text(json.dumps(rows,ensure_ascii=False),encoding='utf-8')
print(f'Wrote {len(rows)} rows to {args.output}')
