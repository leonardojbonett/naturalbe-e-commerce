# 🚀 Cómo Iniciar el Servidor Local

## ❌ Problema
Los navegadores bloquean `fetch()` cuando abres archivos con `file://`. Necesitas un servidor HTTP local.

## ✅ Soluciones Rápidas

### Opción 1: Python (Recomendado)

#### Python 3:
```bash
cd microjuegos/01-JUEGOS/word-snap
python -m http.server 8000
```

#### Python 2:
```bash
cd microjuegos/01-JUEGOS/word-snap
python -m SimpleHTTPServer 8000
```

Luego abre: **http://localhost:8000/word-snap.html**

### Opción 2: Node.js (http-server)

```bash
# Instalar (solo una vez)
npm install -g http-server

# Ejecutar
cd microjuegos/01-JUEGOS/word-snap
http-server -p 8000
```

Luego abre: **http://localhost:8000/word-snap.html**

### Opción 3: PHP

```bash
cd microjuegos/01-JUEGOS/word-snap
php -S localhost:8000
```

Luego abre: **http://localhost:8000/word-snap.html**

### Opción 4: Live Server (VS Code)

1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `word-snap.html`
3. Selecciona "Open with Live Server"

### Opción 5: Navegador con CORS deshabilitado (NO RECOMENDADO)

Solo para pruebas rápidas:

#### Chrome:
```bash
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome"
```

#### Firefox:
1. Escribe `about:config` en la barra
2. Busca `security.fileuri.strict_origin_policy`
3. Cambia a `false`

## 🎯 Comando Rápido para Windows

Crea un archivo `start-server.bat`:

```batch
@echo off
cd /d "%~dp0"
echo Iniciando servidor en http://localhost:8000
echo Presiona Ctrl+C para detener
python -m http.server 8000
pause
```

Haz doble clic en `start-server.bat` y listo.

## 🎯 Comando Rápido para Mac/Linux

Crea un archivo `start-server.sh`:

```bash
#!/bin/bash
cd "$(dirname "$0")"
echo "Iniciando servidor en http://localhost:8000"
echo "Presiona Ctrl+C para detener"
python3 -m http.server 8000
```

Ejecuta:
```bash
chmod +x start-server.sh
./start-server.sh
```

## ✨ Verificar que Funciona

1. Inicia el servidor
2. Abre http://localhost:8000/word-snap.html
3. Abre la consola (F12)
4. Deberías ver:
```
🎯 Tema seleccionado: Memes TikTok
📝 Palabras: ["SKIBIDI", "RIZZ", "GYATT", "OHIO", "CAPCUT"]
```

## 🔍 Solución de Problemas

### "python no se reconoce como comando"
- Instala Python desde https://www.python.org/downloads/
- Marca "Add Python to PATH" durante la instalación

### "Puerto 8000 ya está en uso"
Usa otro puerto:
```bash
python -m http.server 8080
```

### Sigue sin funcionar
Verifica que estás en la carpeta correcta:
```bash
# Deberías ver estos archivos:
dir  # Windows
ls   # Mac/Linux

# Salida esperada:
# word-snap.html
# word-snap.js
# themes.json
# campaign-levels.json
```
