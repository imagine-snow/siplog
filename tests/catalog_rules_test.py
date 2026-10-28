import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from catalog_rules import classify

class ClassificationTest(unittest.TestCase):
    def test_gin_is_exact(self):
        self.assertEqual(classify(['en:gins'],['London Dry Gin'],40),('金酒',None))
        self.assertIsNone(classify(['en:ginger-beer','en:non-alcoholic-beers'],['Ginger Beer'],0)[0])
    def test_mixed_drink_wins_over_base_spirit(self):
        for category,name in [('en:gins','Gin & Tonic'),('en:rums','Rum and Cola'),('en:vodka','Smirnoff Ice'),('en:whisky','Whiskey Cola')]:
            self.assertEqual(classify([category],[name],40)[1],'mixed-drink')
        self.assertIsNone(classify(['en:rums','en:premixed-alcoholic-beverages'],['Brand X'],40)[0])
        self.assertIsNone(classify(['en:gins'],['Gin & diet tonic'],40)[0])
        self.assertIsNone(classify(['en:vodka'],['ICE'],None,'Smirnoff')[0])
        self.assertIsNone(classify(['en:gins'],['Ginger Gin Liqueur'],None)[0])
    def test_conflicts_unknown_and_food_stay_out(self):
        self.assertEqual(classify(['en:gins','en:vodka'],['Unknown'],40)[1],'conflicting-category')
        self.assertEqual(classify(['en:alcoholic-beverages'],['Unknown'],40)[1],'unclassified')
        self.assertEqual(classify(['en:rums'],['Gelantine'],40)[1],'not-a-drink')
    def test_low_abv_spirit_is_not_assigned_guessed_cocktail(self):
        self.assertEqual(classify(['en:gins'],['Unclear drink'],6)[1],'spec-needs-review')
        self.assertEqual(classify(['en:gins'],['Dry Gin'],None),('金酒',None))
        self.assertEqual(classify(['en:beers'],['Heineken 0.0'],0),('啤酒',None))

if __name__=='__main__':unittest.main()
