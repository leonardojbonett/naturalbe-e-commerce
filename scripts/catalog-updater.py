import json
import os

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def update_catalog(source_file, target_file):
    if not os.path.exists(source_file) or not os.path.exists(target_file):
        print(f"Error: Archivo no encontrado. Source: {source_file}, Target: {target_file}")
        return
    
    source_data = load_json(source_file)
    target_data = load_json(target_file)
    
    # Crear un mapa de productos por ID para acceso rapido
    source_map = {str(item['id']): item for item in source_data}
    
    updated_count = 0
    for i, item in enumerate(target_data):
        item_id = str(item.get('id'))
        if item_id in source_map:
            # Actualizar todos los campos del producto objetivo con los del origen
            target_data[i].update(source_map[item_id])
            updated_count += 1
            # print(f"Producto ID {item_id} actualizado.")

    if updated_count > 0:
        save_json(target_file, target_data)
        print(f"Finalizado {os.path.basename(target_file)}: {updated_count} productos actualizados.")
    else:
        print(f"No se encontraron coincidencias de ID en {os.path.basename(target_file)}.")

if __name__ == "__main__":
    BASE_DIR = r"c:\Users\User}\OneDrive\Documentos\Escritorio\natural be"
    SOURCE_FILE = os.path.join(BASE_DIR, "19 id.txt")
    
    TARGETS = [
        os.path.join(BASE_DIR, "productos_enriquecido.json"),
        os.path.join(BASE_DIR, "static", "data", "productos.json"),
        os.path.join(BASE_DIR, "apps", "naturalbe-app", "public", "productos.json")
    ]
    
    for target in TARGETS:
        if os.path.exists(target):
            update_catalog(SOURCE_FILE, target)
