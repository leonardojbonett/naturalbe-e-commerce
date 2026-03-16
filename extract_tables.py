#!/usr/bin/env python3
from docx import Document
import json
import re

doc = Document('mejoras_seo_ids_824_854.docx')

# Extract data from tables
improvements = {}

for table in doc.tables:
    rows = table.rows
    current_id = None
    current_field = None
    
    for i, row in enumerate(rows):
        cells = [cell.text.strip() for cell in row.cells]
        
        # Check if first cell contains ID
        if cells and cells[0].startswith('ID '):
            match = re.search(r'ID (\d+)', cells[0])
            if match:
                current_id = match.group(1)
                if current_id not in improvements:
                    improvements[current_id] = {}
        
        # Check for field names (ANTES/DESPUÉS headers)
        if len(cells) >= 2 and cells[0] in ['seo_title', 'seo_description_mejorado', 'descripcion_corta', 'tags (ANTES — idénticos en 31 productos)', 'tags (DESPUÉS)', 'beneficios_bullet (ANTES — copypaste)', 'beneficios_bullet (DESPUÉS)']:
            field_name = cells[0]
            
            if current_id:
                if '(ANTES' in field_name or 'DESPUÉS' in cells[1]:
                    field_base = field_name.split(' (')[0] if ' (' in field_name else field_name
                    if field_base not in improvements[current_id]:
                        improvements[current_id][field_base] = {}
                    
                    if 'ANTES' in field_name or cells[1] == 'ANTES':
                        if 'ANTES' in field_name:
                            improvements[current_id][field_base]['antes'] = cells[1] if len(cells) > 1 else ''
                    elif 'DESPUÉS' in field_name or cells[1] == 'DESPUÉS':
                        if 'DESPUÉS' in field_name:
                            improvements[current_id][field_base]['despues'] = cells[1] if len(cells) > 1 else ''

# Save as JSON
with open('mejoras_data.json', 'w', encoding='utf-8') as f:
    json.dump(improvements, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(improvements)} products")
for product_id in sorted(improvements.keys()):
    print(f"ID {product_id}: {len(improvements[product_id])} fields")
