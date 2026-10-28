"""Conservative catalog classification. Never infer gin from 'ginger'.

The importer keeps only a single supported, explicit beverage category. Mixed
drinks and uncertain records stay out of the general catalog; manual logging
remains available. These rules are screening, not product verification.
"""
import re
import unicodedata

GROUPS = {
    '白酒': {'en:baijiu', 'en:baijius'},
    '黄酒': {'en:huangjiu'},
    '威士忌': {'en:whisky', 'en:whiskies', 'en:whiskey', 'en:whiskeys'},
    '龙舌兰': {'en:tequila', 'en:tequilas', 'en:mezcal', 'en:mezcals'},
    '白兰地': {'en:brandies', 'en:brandy', 'en:cognac', 'en:cognacs', 'en:armagnac'},
    '利口酒': {'en:liqueurs', 'en:liqueur'},
    '伏特加': {'en:vodka', 'en:vodkas'},
    '金酒': {'en:gins', 'en:gin'},
    '朗姆酒': {'en:rums', 'en:rum'},
    '清酒': {'en:sake', 'en:sakes', 'en:rice-wines'},
    '苹果酒': {'en:ciders', 'en:cider', 'en:perries', 'en:perry'},
    '啤酒': {'en:beers', 'en:beer', 'en:non-alcoholic-beers'},
    '葡萄酒': {'en:wines', 'en:wine', 'en:champagnes', 'en:vermouths'},
}
FOOD = {'en:snacks','en:sweet-snacks','en:condiments','en:sauces','en:desserts',
        'en:chocolates','en:candies','en:biscuits','en:food-supplements','en:vinegars',
        'en:waters','en:mineral-waters','en:syrups','en:alcoholic-syrups'}
MIX_TAGS = {'en:premixed-alcoholic-beverages','en:mixed-drinks','en:cocktails',
            'en:beer-based-alcoholic-beverages','en:wine-based-alcoholic-beverages',
            'en:vodka-based-alcoholic-beverages','en:rum-based-alcoholic-beverages',
            'en:hard-seltzer','en:hard-seltzers','en:shandy','en:radler-beers',
            'en:mulled-wines','en:punchs'}
MIX_NAME = re.compile(r'\b(?:cocktails?|premix(?:ed)?|ready[ -]to[ -]drink|'
    r'gin\s*(?:&|and|et|con|und|[-+])?\s*tonic|gin\s*&\s*juice|'
    r'(?:rum|rhum|ron|vodka|whisk(?:e)?y|bourbon|jack\s*daniel\S*)\b.{0,16}\b(?:cola|coke|lemonade|tonic)|'
    r'mojitos?|margaritas?|daiquiris?|sangria|spritz|negroni|highball|'
    r'pina colada|moscow mule|cuba libre|smirnoff\s*[- ]*ice|'
    r'radler|shandy|panache|gluhwein|hard seltzer)\b|金汤力|鸡尾酒|預調酒|预调酒|调制酒|調製酒', re.I)
NOT_DRINK_NAME = re.compile(r'\b(?:gelatine?|gelantine|chocolates?|chocolats?|syrups?|sirop|sauce|vinegar|biscuits?|candies)\b', re.I)

def normalized(text):
    return ''.join(c for c in unicodedata.normalize('NFKD',text.casefold()) if not unicodedata.combining(c))

def classify(tags, names, abv, brand=''):
    tags={t.lower() for t in tags}
    name=normalized(' '.join(brand+' '+n for n in names))
    if tags & FOOD or NOT_DRINK_NAME.search(name): return None,'not-a-drink'
    if 'en:ginger-beer' in tags or 'en:tonic-water' in tags or re.search(r'\bginger\s*(?:beer|ale)\b',name):
        return None,'mixer-or-ginger-beer'
    if tags & MIX_TAGS or any('cocktail' in t for t in tags) or MIX_NAME.search(name) or (re.search(r'\bgin\b',name) and re.search(r'\btonic\b',name)):
        return None,'mixed-drink'
    matches=[category for category, allowed in GROUPS.items() if tags & allowed]
    # Some sake records inherit the broad wine category. The specific tag wins.
    if '清酒' in matches and '葡萄酒' in matches: matches.remove('葡萄酒')
    if len(matches)!=1: return None,'conflicting-category' if matches else 'unclassified'
    category=matches[0]
    if category!='利口酒' and re.search(r'\b(?:liqueurs?|liquer|likor)\b',name):
        return None,'conflicting-category'
    # Screening limits flag suspicious imports, never set or change an ABV.
    if abv is not None:
        if category in {'金酒','伏特加','朗姆酒','威士忌','白兰地','龙舌兰','白酒'} and not 20<=abv<=85:
            return None,'spec-needs-review'
        if category in {'啤酒','苹果酒','葡萄酒','清酒','黄酒'} and abv>30:
            return None,'spec-needs-review'
    return category,None
