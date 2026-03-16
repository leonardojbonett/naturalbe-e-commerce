import json
import os
import re

def sanitize_path(path):
    if not path:
        return path
    
    # 1. Corregir ruta base
    path = path.replace('/static/images/catalogo/', '/static/img/')
    
    # 2. Corregir typo en marca
    path = path.replace('millenium-', 'millennium-')
    
    # 3. Corregir extensiones duplicadas o mal formadas
    # Ejemplo: .png.jpg -> .png si existe, .jpg.jpg -> .jpg
    path = re.sub(r'\.png\.jpg$', '.png', path)
    path = re.sub(r'\.jpg\.jpg$', '.jpg', path)
    path = re.sub(r'\.webp\.webp$', '.webp', path)
    
    return path

def find_existing_file(ideal_path, base_dir):
    local_rel_path = ideal_path.lstrip('/')
    local_full_path = os.path.join(base_dir, local_rel_path.replace('/', os.sep))
    
    if os.path.exists(local_full_path):
        return ideal_path
    
    # Probar variaciones si no existe
    root, ext = os.path.splitext(local_full_path)
    # Si es .png, probar .jpg, .jpeg, .webp y sus variantes dobles
    variations = ['.png', '.jpg', '.jpeg', '.webp', '.png.jpg', '.jpg.jpg', '.jpeg.jpg']
    
    current_dir = os.path.dirname(local_full_path)
    if not os.path.exists(current_dir):
        return None
        
    base_name = os.path.basename(root)
    # Si el base_name ya tiene una extension (ej: producto.png), quitarla para probar otras
    base_name_clean = re.sub(r'\.(png|jpg|jpeg|webp)$', '', base_name)
    
    for v_ext in variations:
        test_path = os.path.join(current_dir, base_name + v_ext)
        if os.path.exists(test_path):
            return ideal_path.replace(os.path.basename(local_full_path), os.path.basename(test_path))
        
        test_path_clean = os.path.join(current_dir, base_name_clean + v_ext)
        if os.path.exists(test_path_clean):
            return ideal_path.replace(os.path.basename(local_full_path), os.path.basename(test_path_clean))
            
    return None

def process_file(file_path, base_dir):
    if not os.path.exists(file_path):
        print(f"Archivo no encontrado: {file_path}")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified_count = 0
    not_found_count = 0
    
    for item in data:
        # Saneamiento de texto
        text_fields = ['nombre', 'marca', 'descripcion_corta', 'descripcion_larga', 'descripcion_google']
        for tf in text_fields:
            if tf in item and item[tf]:
                old_val = item[tf]
                new_val = old_val.replace('Millenium', 'Millennium').replace('millenium', 'millennium')
                if old_val != new_val:
                    item[tf] = new_val
                    modified_count += 1
        
        if 'tags' in item and isinstance(item['tags'], list):
            new_tags = [t.replace('millenium', 'millennium') for t in item['tags']]
            if item['tags'] != new_tags:
                item['tags'] = new_tags
                modified_count += 1

        for field in ['imagen_principal', 'imagen_principal_webp']:
            if field in item and item[field]:
                old_path = item[field]
                # Saneamiento basico inicial
                temp_path = sanitize_path(old_path)
                
                # Buscar archivo real en disco
                found_path = find_existing_file(temp_path, base_dir)
                
                if found_path:
                    if old_path != found_path:
                        item[field] = found_path
                        modified_count += 1
                else:
                    not_found_count += 1
                    print(f"MISSING: {old_path}")

    if modified_count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Finalizado {os.path.basename(file_path)}: {modified_count} cambios realizados. {not_found_count} no encontradas.")
    else:
        print(f"No se requirieron cambios en {os.path.basename(file_path)}. {not_found_count} no encontradas.")

if __name__ == "__main__":
    BASE_DIR = r"c:\Users\User}\OneDrive\Documentos\Escritorio\natural be"
    files_to_process = [
        os.path.join(BASE_DIR, "productos_enriquecido.json"),
        os.path.join(BASE_DIR, "static", "data", "productos.json"),
        os.path.join(BASE_DIR, "apps", "naturalbe-app", "public", "productos.json"),
    ]
    
    for f in files_to_process:
        process_file(f, BASE_DIR)
