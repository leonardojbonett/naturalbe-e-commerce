#!/usr/bin/env python3
"""
Apply SEO improvements to Funat products (IDs 824-854)
from mejoras_seo_ids_824_854.docx
"""

import json
import os
import re
from pathlib import Path

# SEO improvements mapping - extracted from DOCX
mejoras = {
    "825": {
        "file": "valeriana-extracto-60ml.html",
        "seo_title": "Valeriana Extracto Funat 60 mL – Sueño y Relajación | Natural Be",
        "seo_description": "Valeriana Extracto Funat 60 mL. Fitoterapéutico para la relajación, reducir la ansiedad y mejorar el sueño. Envío Colombia, $29.000.",
        "bullets": [
            "Extracto de Valeriana en formato líquido de 60 mL.",
            "Apoya la relajación y reduce la tensión nerviosa.",
            "Contribuye a mejorar la calidad y duración del sueño.",
            "Fitoterapéutico Funat. Seguir indicaciones del empaque."
        ],
        "tags": ["valeriana extracto", "valeriana funat", "sueño natural", "relajacion", "ansiedad natural", "tension nerviosa", "insomnio natural", "fitoterapeutico colombia"]
    },
    "826": {
        "file": "extracto-de-passiflora-60-ml.html",
        "seo_title": "Extracto de Pasiflora Funat 60 mL – Ansiedad y Sueño | Natural Be",
        "seo_description": "Extracto de Pasiflora Funat 60 mL en oferta $24.000. Calma la ansiedad y favorece el sueño reparador. Envío Colombia.",
        "bullets": [
            "Extracto de Pasiflora (Passiflora incarnata) en 60 mL.",
            "Calma la ansiedad y reduce la tensión nerviosa de forma natural.",
            "Favorece el sueño reparador y la relajación muscular.",
            "En oferta a $24.000. Fitoterapéutico Funat."
        ],
        "tags": ["pasiflora extracto", "pasiflora funat", "ansiedad natural", "calma y relajacion", "sueño reparador", "estres nervioso", "passiflora", "fitoterapeutico colombia"]
    },
    "827": {
        "file": "purveg-sachet-13-g.html",
        "seo_title": "Purveg Funat Sobre 13 g – Fibra Vegetal Digestiva | Natural Be",
        "seo_description": "Purveg Funat sobre 13 g. Fibra vegetal para regularizar el tránsito intestinal y aliviar el estreñimiento. Fácil de disolver. Envío Colombia, $24.000.",
        "bullets": [
            "Fibra vegetal en sobre individual de 13 g, fácil de disolver en agua.",
            "Regulariza el tránsito intestinal y alivia el estreñimiento.",
            "Contribuye a una digestión cómoda y bienestar intestinal.",
            "Formato portátil ideal para llevar en el bolso o maletín."
        ],
        "tags": ["purveg fibra", "fibra vegetal", "transito intestinal", "estreñimiento natural", "digestivo sobre", "fibra soluble", "funat digestivo", "fibra colombia"]
    },
    "828": {
        "file": "antax-calendula-masticable-10-tabletas.html",
        "seo_title": "Antax Caléndula Funat 10 Tabletas Masticables – Acidez | Natural Be",
        "seo_description": "Antax Caléndula Funat en 10 tabletas masticables. Antiácido natural para aliviar la acidez, gastritis y malestar estomacal. Envío Colombia, $20.000.",
        "bullets": [
            "Antax con Caléndula en 10 tabletas masticables de fácil consumo.",
            "Alivia la acidez estomacal y el malestar por gastritis.",
            "Caléndula con acción calmante sobre la mucosa gástrica.",
            "Presentación compacta ideal para llevar y usar en el momento."
        ],
        "tags": ["antax calendula", "antacido natural", "acidez estomacal", "gastritis natural", "tabletas masticables", "malestar digestivo", "funat antax", "calendula digestiva"]
    },
    "829": {
        "file": "artritend-harpagofito-30-capsulas-blandas.html",
        "seo_title": "Artritend Harpagofito Funat 30 Cápsulas – Articulaciones | Natural Be",
        "seo_description": "Artritend Harpagofito Funat en 30 cápsulas blandas. Reduce la inflamación articular y el dolor en artritis y artrosis. Envío Colombia, $54.000.",
        "bullets": [
            "Harpagofito (Harpagophytum procumbens) en cápsulas blandas de alta absorción.",
            "Apoya la reducción de la inflamación y el dolor articular.",
            "Contribuye al bienestar en artritis, artrosis y dolor de espalda.",
            "Fitoterapéutico Funat. 30 cápsulas blandas. Seguir indicaciones del empaque."
        ],
        "tags": ["artritend harpagofito", "harpagofito funat", "dolor articular", "artritis natural", "artrosis", "inflamacion articular", "articulaciones colombia", "antiinflamatorio natural"]
    },
    "830": {
        "file": "alcachofa-extracto-60-ml.html",
        "seo_title": "Extracto de Alcachofa Funat 60 mL – Hígado y Digestión | Natural Be",
        "seo_description": "Extracto de Alcachofa Funat 60 mL. Fitoterapéutico para apoyar la función hepática, la digestión de grasas y el colesterol. Envío Colombia, $32.000.",
        "bullets": [
            "Extracto líquido de Alcachofa (Cynara scolymus) en 60 mL.",
            "Apoya la función del hígado y la vesícula biliar.",
            "Facilita la digestión de grasas y reduce la pesadez.",
            "Contribuye al control del colesterol dentro de una dieta balanceada."
        ],
        "tags": ["extracto alcachofa", "alcachofa funat", "higado sano", "digestivo natural", "colesterol natural", "digestion grasas", "depurativo hepatico", "alcachofa colombia"]
    },
    "831": {
        "file": "alcachofa-100-tabletas.html",
        "seo_title": "Alcachofa Funat 100 Tabletas – Hígado y Control de Peso | Natural Be",
        "seo_description": "Alcachofa Funat en 100 tabletas. Apoya la función hepática, la digestión y el control de peso. Presentación económica. Envío Colombia, $39.000.",
        "bullets": [
            "Alcachofa (Cynara scolymus) en 100 tabletas para uso prolongado.",
            "Apoya la salud del hígado y la función biliar.",
            "Facilita la digestión de grasas y la sensación de ligereza.",
            "Acompaña el control de peso dentro de una dieta balanceada."
        ],
        "tags": ["alcachofa tabletas", "alcachofa funat", "higado sano", "control de peso", "digestivo grasas", "colesterol natural", "alcachofa 100 tabs", "alcachofa colombia"]
    },
    "832": {
        "file": "urifin-vira-vira-extracto-60-ml.html",
        "seo_title": "Urifín Vira Vira Funat 60 mL – Vías Urinarias | Natural Be",
        "seo_description": "Urifín Vira Vira Funat 60 mL. Fitoterapéutico para apoyar la salud de las vías urinarias y reducir infecciones recurrentes. Envío Colombia, $29.000.",
        "bullets": [
            "Extracto de Urifín Vira Vira (Achyrocline satureioides) en 60 mL.",
            "Apoya la salud de las vías urinarias y reduce la inflamación.",
            "Contribuye a prevenir infecciones urinarias recurrentes.",
            "Fitoterapéutico Funat de plantas colombianas. Seguir indicaciones del empaque."
        ],
        "tags": ["urifin vira vira", "vias urinarias", "infeccion urinaria natural", "cistitis natural", "fitoterapeutico urinario", "funat urinario", "vira vira planta", "salud renal colombia"]
    },
    "833": {
        "file": "bronquinat-totumo-sin-azucar-240-ml.html",
        "seo_title": "Bronquinat Totumo Funat 240 mL Sin Azúcar – Tos y Vías Resp. | Natural Be",
        "seo_description": "Bronquinat Totumo Funat 240 mL sin azúcar. Expectorante natural para aliviar la tos y la congestión respiratoria. Envío Colombia, $41.000.",
        "bullets": [
            "Bronquinat con Totumo en 240 mL, fórmula sin azúcar.",
            "Expectorante natural para aliviar la tos seca y con flema.",
            "Apoya el bienestar de las vías respiratorias y bronquios.",
            "Sin azúcar, apto para personas que controlan su consumo de azúcar."
        ],
        "tags": ["bronquinat totumo", "expectorante natural", "tos seca", "tos con flema", "vias respiratorias", "congestion bronquial", "funat respiratorio", "totumo para tos"]
    },
    "834": {
        "file": "extracto-sangre-de-drago-60-ml.html",
        "seo_title": "Sangre de Drago Funat 60 mL – Cicatrización Natural | Natural Be",
        "seo_description": "Sangre de Drago Funat 60 mL. Fitoterapéutico amazónico para cicatrización, inflamación de mucosas y protección digestiva. Envío Colombia, $40.000.",
        "bullets": [
            "Sangre de Drago (Croton lechleri) en extracto líquido de 60 mL.",
            "Apoya la cicatrización interna y externa de forma natural.",
            "Contribuye a reducir la inflamación de mucosas digestivas y orales.",
            "Planta amazónica con uso fitoterapéutico tradicional en Colombia."
        ],
        "tags": ["sangre de drago", "croton lechleri", "cicatrizante natural", "antiinflamatorio mucosas", "planta amazonica", "gastritis natural", "funat sangre drago", "cicatrizacion colombia"]
    },
}

def apply_improvements():
    base_path = Path("./producto")
    changes_applied = 0
    
    for product_id, data in mejoras.items():
        file_path = base_path / data["file"]
        
        if not file_path.exists():
            print(f"❌ ID {product_id}: File not found: {file_path.name}")
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Update SEO title in <title> tag
        content = re.sub(
            r'<title>[^<]+</title>',
            f'<title>{data["seo_title"]}</title>',
            content,
            count=1
        )
        
        # Update meta description
        content = re.sub(
            r'<meta name="description" content="[^"]+">',
            f'<meta name="description" content="{data["seo_description"]}">',
            content,
            count=1
        )
        
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ ID {product_id}: {data['file']}")
            changes_applied += 1
        else:
            print(f"⚠ ID {product_id}: No changes found in file")
    
    return changes_applied

if __name__ == "__main__":
    print("Starting SEO improvements application...")
    total = apply_improvements()
    print(f"\n✅ Applied changes to {total} products")
