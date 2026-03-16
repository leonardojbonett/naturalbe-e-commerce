import os
import re

def sanitize_filename(filename):
    # 1. Corregir typo en marca
    new_name = filename.replace('millenium', 'millennium')
    
    # 2. Corregir extensiones duplicadas
    new_name = re.sub(r'\.png\.jpg$', '.png', new_name)
    new_name = re.sub(r'\.jpg\.jpg$', '.jpg', new_name)
    new_name = re.sub(r'\.jpeg\.jpg$', '.jpeg', new_name)
    new_name = re.sub(r'\.webp\.webp$', '.webp', new_name)
    
    return new_name

def cleanup_disk(base_path):
    for root, dirs, files in os.walk(base_path):
        for f in files:
            new_f = sanitize_filename(f)
            if f != new_f:
                old_path = os.path.join(root, f)
                new_path = os.path.join(root, new_f)
                
                if os.path.exists(new_path):
                    print(f"DUPLICADO: Eliminando {f} porque {new_f} ya existe.")
                    os.remove(old_path)
                else:
                    print(f"RENOMBRANDO: {f} -> {new_f}")
                    os.rename(old_path, new_path)

if __name__ == "__main__":
    IMG_DIR = r"c:\Users\User}\OneDrive\Documentos\Escritorio\natural be\static\img"
    cleanup_disk(IMG_DIR)
