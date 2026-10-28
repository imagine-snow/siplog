# 酒款数据来源 / Catalog provenance

本项目的酒款数据是可下载、离线搜索的数据库快照。它不包含用户的饮酒记录。导入日期、每库数量和每条数据的来源均保存在 `public/data/drinks.json`。

The catalog is a downloadable offline database snapshot, separate from private drinking records. Import date, source counts and per-product references are stored in `public/data/drinks.json`.

## Open Food Facts

- Publisher: Open Food Facts contributors, https://world.openfoodfacts.org/
- Official export: https://huggingface.co/datasets/openfoodfacts/product-database
- Export revision reference: `3ac7e8b6e93775a2b28e993a3e4cf90059ca73cb` (2026-10-26).
- Candidate pool: products tagged `en:alcoholic-beverages` or `en:non-alcoholic-beers`, with a product name and numeric barcode. Only records passing the v0.4 category screen are included in the app.
- Fields: product name and translated labels, brand, category, alcohol value where supplied, package size where unambiguous, origin, style/category tag and barcode.
- Per-product source URL links to its Open Food Facts page. Missing ABV stays `null`; it is never replaced by an assumed category average. Package values are editable and may refer to regional variants.
- Quality: community-contributed records can be incomplete, miscategorized or outdated. Non-alcoholic products may be present. A category is an app mapping of upstream tags, not an independent verification.

## Open Beer Database

- Publisher / license statement: https://openbeerdb.com/
- Official CSV archive: https://openbeerdb.com/files/openbeerdb_csv.zip
- Upstream snapshot: **2011-12-14**. This is a historical supplement, not a claim of current availability or current recipes.
- Fields: beer ID, name, brewery name, brewery country, style and ABV. Descriptions, reviews, images and contact information are excluded.
- Missing/zero ABV values in this historical export are treated as unknown, not as proof that a beer is alcohol-free. Bottle size is unknown and must be chosen by the user.

## Brand label references / 品牌规格补充

The bundled catalog also includes 11 factual product specifications from manufacturer pages, maintained in `scripts/brand-labels.json`: [Kweichow Moutai](https://www.moutai.com.cn/mtjt/2025-12/31/article_2025123121121938437.html), [Fenjiu](https://www.fenjiu.com.cn/gf/fenjiu/index.html), and [Yanghe](https://www.yangheglobal.com/mengzhilan-series.html?k=3). Only product identity, ABV and stated package size are transcribed. These additions are labeled **Brand label references**, separately from the imported databases. Unknown package variants remain null; no promotional descriptions or images are reproduced.

本次快照包含 **35,964 条商品规格条目**：Open Food Facts 30,152 条、Open Beer Database 5,801 条、品牌官网规格补充 11 条。其中 12,456 条含可带入的酒精度，其余由用户按瓶身补充。异常精度、缺少明确百分比单位的酒精值不会自动带入。相同酒款的不同容量、地区版本仍可能各占一条。

This snapshot contains **35,964 product entries**: 30,152 from Open Food Facts, 5,801 from Open Beer Database and 11 manufacturer references. 12,456 entries have a prefillable ABV. Values without a percentage unit or with suspicious excess precision are left unknown. These checks do not establish that every supplied value is correct; confirm the label.

## v0.4 分类筛选 / Category screening

Use `scripts/catalog_rules.py` before import. Category tags are matched exactly, so `en:ginger-beer` cannot match `en:gin`. Cocktail/premix tags and explicit mixed-drink names take precedence over base-spirit tags. Mixers, food, conflicting categories, unsupported categories and suspicious specifications are excluded rather than guessed. This is conservative screening, not a claim that every retained label has been verified.

本版从常规酒库移除鸡尾酒、预调酒、调酒辅料、非饮品、分类冲突与待核对条目。鸡尾酒保留独立手动入口；配方和度数估算暂缓。过去的个人记录不会因酒库清理被删除或重新计算。

Compared with v0.3, the searchable snapshot drops from 41,738 to 35,964 entries. The raw candidate screen excludes 6,442 records before deduplication; these two counts have different grains. Reasons and source IDs are preserved in `public/data/classification-report.json`. That report can be downloaded for future GitHub maintenance. Conservative rules may omit valid unusual products; manual entry remains available.

Run `python tests/catalog_rules_test.py` and the Node tests after rebuilding. The rules cover Gin & Tonic, diet tonic, Smirnoff Ice, Ginger Beer, mixed rum/whisky drinks, ambiguous labels and true base spirits. Source ABV/capacity values remain editable; screening does not establish that every value is correct.

## Attribution and data license / 署名与数据许可

Contains information from **Open Food Facts** and **Open Beer Database**, made available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Individual database contents are available under the [Database Contents License 1.0](https://opendatacommons.org/licenses/dbcl/1-0/).

The combined, normalized catalog in `public/data/drinks.json`, including its search aliases and category mappings, is made available under **ODbL-1.0**. Preserve these notices and the source references when redistributing it. The app offers the complete derivative catalog for download under Settings → Catalog and sources. License copies are in `public/data/`.

导入数据与应用代码分别说明许可。合并后的酒款库按 ODbL-1.0 提供；请保留来源和署名。中文品牌搜索别名由本项目补充，不代表上游数据库已核验。品牌名称和商标仍属于各自权利人。没有导入酒瓶照片或品牌宣传文案。

Chinese brand search aliases are additions by this project, not upstream verification. Brands and trademarks belong to their owners. Product photos and promotional copy are not imported. The data license does not grant rights to users' private logs, which remain separate and local.

## Rebuilding / 重新导入

1. Install Python and DuckDB (`python -m pip install duckdb`). These are maintenance tools, not app/runtime dependencies.
2. Run `python scripts/fetch-off.py --output off-alcohol.json` to extract the official export. It uses range reads, but the upstream file is large; allow time and bandwidth.
3. Download the official Open Beer CSV archive and extract `openbeerdb_csv/`.
4. Run `python scripts/import-catalog.py --off off-alcohol.json --beer path/to/openbeerdb_csv` from the repository root.
5. Review counts, ABV ranges, source references and representative brands; run tests and build. Do not commit the full upstream export or user backups.

Normalization trims long labels, maps categories, parses simple ml/cl/l package expressions, leaves ambiguous/missing values unknown, and collapses identical name/brand/ABV/capacity specifications **within each source**. Distinct package variants and entries from different databases can remain; counts are product entries, not a count of unique global brands. Sources have uneven regional coverage, especially Chinese baijiu and small producers. Users can always add missing drinks locally.

## v0.5 中文显示 / Chinese display

`lib/drink-names.ts` contains project-maintained common brand aliases and literal style/model labels for display and search. These are not official translations supplied or verified by the databases. Original names and source identifiers remain unchanged and original names are visible under localized search results. Unknown model names are retained, not guessed. Product name/category corrections remove the old source association to avoid misattributing a different drink.
