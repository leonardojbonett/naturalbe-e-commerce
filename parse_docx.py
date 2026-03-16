#!/usr/bin/env python3
from docx import Document
import json
import re

doc = Document('mejoras_seo_ids_824_854.docx')

# Obtain all text
all_text = []
for para in doc.paragraphs:
    all_text.append(para.text)

full_text = '\n'.join(all_text)

# Parse products
products = {}
current_id = None
current_field = None

lines = full_text.split('\n')
i = 0

while i < len(lines):
    line = lines[i].strip()
    
    # Detect ID
    if line.startswith('ID '):
        current_id = re.search(r'ID (\d+)', line).group(1)
        products[current_id] = {}
        i += 1
        continue
    
    # Detect field (seo_title, seo_description_mejorado, etc)
    if line in ['seo_title', 'seo_description_mejorado', 'descripcion_corta', 'tags', 'beneficios_bullet']:
        current_field = line
        products[current_id][current_field] = {}
        i += 1
        
        # Get ANTES
        if i < len(lines) and lines[i].strip() == 'ANTES':
            antes_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() != 'DESPUÉS':
                antes_lines.append(lines[i])
                i += 1
            products[current_id][current_field]['antes'] = '\n'.join(antes_lines).strip()
        
        # Get DESPUÉS
        if i < len(lines) and lines[i].strip() == 'DESPUÉS':
            despues_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() not in ['seo_title', 'seo_description_mejorado', 'descripcion_corta', 'tags', 'beneficios_bullet'] and not lines[i].strip().startswith('ID '):
                despues_lines.append(lines[i])
                i += 1
            products[current_id][current_field]['despues'] = '\n'.join(despues_lines).strip()
        continue
    
    i += 1

# Save as JSON
with open('mejoras_estructura.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

# Print summary
print(f"Processed {len(products)} products: {', '.join(sorted(products.keys()))}")

# Print first product as sample
if products:
    first_id = list(products.keys())[0]
    print(f"\nSample (ID {first_id}):")
    print(json.dumps(products[first_id], ensure_ascii=False, indent=2)[:500])
