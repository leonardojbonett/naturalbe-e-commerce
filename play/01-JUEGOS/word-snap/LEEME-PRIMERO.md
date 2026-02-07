# 🎮 Word Snap - Inicio Rápido

## 🚀 Cómo Jugar AHORA MISMO

### 🎯 Opción 1: Versión con 100 Niveles (RECOMENDADA)

**Abre directamente:**
```
word-snap-campaign.html
```

✅ 100 niveles progresivos  
✅ Sistema de desbloqueo  
✅ Temas visuales por categoría  
✅ Progresión guardada  
✅ Sin servidor necesario  

### ⚡ Opción 2: Versión Rápida (Prueba rápida)

**Abre directamente:**
```
word-snap-standalone.html
```

✅ Funciona sin servidor  
✅ Temas embebidos  
✅ Doble clic y juega  

---

### 🌐 Opción 2: Versión Completa (Con servidor)

**Windows:**
1. Doble clic en `start-server.bat`
2. Abre http://localhost:8000/word-snap.html

**Mac/Linux:**
```bash
chmod +x start-server.sh
./start-server.sh
```
Luego abre http://localhost:8000/word-snap.html

✅ Carga temas desde JSON  
✅ Sin problemas de CORS  
✅ Versión completa  

---

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `word-snap.html` | Juego principal (requiere servidor) |
| `word-snap-standalone.html` | Versión sin servidor |
| `start-server.bat` | Inicia servidor (Windows) |
| `start-server.sh` | Inicia servidor (Mac/Linux) |
| `themes.json` | Temas diarios |
| `campaign-levels.json` | 100 niveles de campaña |

---

## 🎯 Temas Disponibles

### Temas Diarios:
- **26 Nov**: 🎭 Memes TikTok
- **27 Nov**: 📺 Series Netflix
- **28 Nov**: 🎵 Reggaeton
- **29 Nov**: ⭐ Celebridades
- **30 Nov**: 🎮 Gaming

### Niveles de Campaña:
- 100 niveles progresivos
- 10 categorías diferentes
- Dificultad creciente

---

## ❓ Problemas Comunes

### "NetworkError when attempting to fetch"
👉 Usa `word-snap-standalone.html` o inicia el servidor

### "Las palabras siempre son las mismas"
👉 Limpia caché: `Ctrl + Shift + Delete`

### "Python no se reconoce"
👉 Instala Python: https://www.python.org/downloads/

---

## 📚 Documentación

- `INICIAR-SERVIDOR.md` - Guía completa de servidores
- `SOLUCION-CACHE.md` - Solución a problemas de caché
- `GUIA-NIVELES-CAMPANA.md` - Cómo usar los 100 niveles
- `README.md` - Documentación completa

---

## 🎮 Controles del Juego

- **Arrastra** el mouse sobre las letras
- **Suelta** para confirmar la palabra
- **2 minutos** para encontrar todas las palabras
- **10 puntos** por cada letra

---

## 🔥 Características

✨ Temas diarios rotativos  
✨ 100 niveles de campaña  
✨ 3 niveles de dificultad  
✨ Modo oscuro  
✨ Sistema de logros  
✨ Compartir resultados  
✨ Desafiar amigos  

---

## 💡 Tip Pro

Para desarrollo, usa **Live Server** en VS Code:
1. Instala extensión "Live Server"
2. Click derecho en `word-snap.html`
3. "Open with Live Server"

¡Recarga automática al guardar cambios!
