import json
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os

def build_meta_feed():
    try:
        with open('productos_enriquecido.json', 'r', encoding='utf-8') as f:
            productos = json.load(f)
    except FileNotFoundError:
        print("No se encontró productos_enriquecido.json")
        return

    rss = ET.Element('rss', {
        'version': '2.0',
        'xmlns:g': 'http://base.google.com/ns/1.0'
    })
    channel = ET.SubElement(rss, 'channel')
    
    ET.SubElement(channel, 'title').text = 'Natural Be - Catálogo Meta WhatsApp'
    ET.SubElement(channel, 'link').text = 'https://naturalbe.com.co'
    ET.SubElement(channel, 'description').text = 'Catálogo de productos para Meta Commerce Manager y WhatsApp Business'

    for p in productos:
        item = ET.SubElement(channel, 'item')
        
        # ID: Preferimos MPN, luego product_id, luego id alfanumérico
        g_id = p.get('mpn') or p.get('product_id') or str(p.get('id', ''))
        ET.SubElement(item, 'g:id').text = g_id
        
        # Título
        title = p.get('titulo_google') or p.get('seo_title') or p.get('nombre')
        ET.SubElement(item, 'g:title').text = title
        
        # Descripción
        desc = p.get('descripcion_google') or p.get('descripcion_corta') or title
        ET.SubElement(item, 'g:description').text = desc
        
        # Link
        link = p.get('link')
        if not link and p.get('slug'):
            link = f"https://naturalbe.com.co/producto/{p.get('slug')}"
        ET.SubElement(item, 'g:link').text = link
        
        # Image link
        img = p.get('imagen_principal', '')
        if img.startswith('/'):
            img = f"https://naturalbe.com.co{img}"
        elif not img.startswith('http'):
            # Fallback en caso de que sea sólo nombre de archivo
            img = f"https://naturalbe.com.co/static/img/{img}"
        ET.SubElement(item, 'g:image_link').text = img
        
        # Condition
        ET.SubElement(item, 'g:condition').text = 'new'
        
        # Availability
        availability = 'in stock' if p.get('disponible', True) else 'out of stock'
        ET.SubElement(item, 'g:availability').text = availability
        
        # Price
        precio = p.get('precio_oferta') or p.get('precio', 0)
        ET.SubElement(item, 'g:price').text = f"{int(precio)} COP"
        
        # Brand
        brand = p.get('marca')
        if brand:
            ET.SubElement(item, 'g:brand').text = brand

    xmlstr = minidom.parseString(ET.tostring(rss)).toprettyxml(indent="  ")
    # Remover líneas en blanco generadas por toprettyxml
    xmlstr = '\n'.join([line for line in xmlstr.split('\n') if line.strip()])

    with open('meta-catalog-feed.xml', 'w', encoding='utf-8') as f:
        f.write(xmlstr)
    
    print("Catalog feed for Meta created successfully as meta-catalog-feed.xml")

if __name__ == '__main__':
    build_meta_feed()
