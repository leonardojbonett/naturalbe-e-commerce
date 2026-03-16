#!/usr/bin/env python3
import json

with open('all_products_mapping_855_881.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("Missing products:")
for id_num in ['874', '877', '879', '880']:
    if id_num in products:
        title = products[id_num].get('seo_title', 'N/A')
        print(f"ID {id_num}: {title[:80]}")
    else:
        print(f"ID {id_num}: NOT IN JSON")

# Show all IDs in JSON
print("\nAll IDs in JSON:", sorted(products.keys()))
