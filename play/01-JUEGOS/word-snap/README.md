# 🔤 Word Snap - Sopa de Letras Viral

## 📋 Descripción
Sopa de letras con temas diarios virales (memes, series, celebridades). Los jugadores tienen 60 segundos para encontrar todas las palabras.

## 🎮 Mecánica del Juego

### Objetivo
Encuentra todas las palabras ocultas en la sopa de letras antes de que se acabe el tiempo.

### Controles
- **Mouse/Touch**: Arrastra sobre las letras para seleccionar palabras
- Las palabras pueden estar en cualquier dirección (horizontal, vertical, diagonal)
- Suelta para verificar si la palabra es correcta

### Sistema de Puntuación
- **10 puntos** por cada letra de la palabra encontrada
- Ejemplo: "SHAKIRA" (7 letras) = 70 puntos
- Bonus por completar todas las palabras antes del tiempo

## 🎯 Temas Disponibles

1. **Memes Virales 2024**: SKIBIDI, RIZZ, SIGMA, GYATT, OHIO
2. **Series Netflix**: STRANGER, SQUID, CROWN, WITCHER, NARCOS
3. **Reggaeton**: FEID, KAROL, PESO, PLUMA, BIZARRAP
4. **Celebridades**: SHAKIRA, MESSI, ROSALIA, ANUEL, MALUMA
5. **Gaming**: FORTNITE, MINECRAFT, ROBLOX, VALORANT, APEX
6. **TikTok Trends**: DANCE, VIRAL, TREND, DUET, FILTER
7. **Futbol**: MADRID, BARCA, MBAPPE, HAALAND, VINICIUS

El tema cambia automáticamente cada día basado en la fecha.

## 🚀 Características Virales

### Compartir Resultados
- Tabla de tiempo personalizada
- Estadísticas detalladas (palabras encontradas, tiempo, puntos)
- Formato optimizado para redes sociales

### Modo "Retar a un Amigo"
- Comparte tu puntuación
- Desafía a tus amigos a superarte
- Texto pre-formateado para WhatsApp/Twitter/Instagram

## 💰 Monetización

### 1. Ads Intersticiales
- Mostrar ad después de cada partida
- Frecuencia: 1 ad cada 2 juegos
- Plataforma recomendada: Google AdSense

### 2. Paquetes de Temas Premium
- **Pack Básico** ($0.99): 10 temas adicionales
- **Pack Pro** ($2.99): 30 temas + sin ads
- **Pack Ultimate** ($4.99): Temas ilimitados + modo multijugador

### Temas Premium Sugeridos
- Anime/Manga
- K-Pop
- Películas Marvel/DC
- Música Urbana Latina
- YouTubers Famosos
- Comida Internacional
- Marcas de Moda

## 🤖 Integración con ChatGPT

### Generar Listas Temáticas
```javascript
// Prompt para ChatGPT:
"Genera 5 palabras cortas (4-8 letras) relacionadas con [TEMA]. 
Las palabras deben ser reconocibles, virales y en mayúsculas."

// Ejemplo de respuesta:
{
  "tema": "Anime 2024",
  "palabras": ["NARUTO", "GOKU", "LUFFY", "EREN", "TANJIRO"]
}
```

### Actualización Automática
1. Conectar API de ChatGPT
2. Generar tema nuevo cada día
3. Validar palabras (longitud, caracteres)
4. Actualizar base de datos de temas

## 📱 Optimización Mobile

- Grid responsive (se adapta a pantalla)
- Touch events optimizados
- Feedback visual inmediato
- Diseño vertical-first

## 🎨 Personalización

### Cambiar Colores
```css
/* En word-snap.html, sección <style> */
--color-primary: #667eea;
--color-secondary: #764ba2;
--color-success: #4caf50;
--color-danger: #f5576c;
```

### Ajustar Dificultad
```javascript
// En word-snap.js, constructor
this.gridSize = 10;      // Tamaño del grid (10x10)
this.timeLimit = 60;     // Segundos disponibles
```

## 📊 Métricas de Éxito

### KPIs a Monitorear
- Tasa de finalización de juegos
- Tiempo promedio por partida
- Palabras encontradas promedio
- Tasa de compartir en redes
- Retención día 1, 7, 30

### Metas Virales
- 1000+ compartidos en primera semana
- 50%+ de jugadores comparten resultados
- 30%+ retorno al día siguiente

## 🔧 Próximas Mejoras

1. **Modo Multijugador**: Competir en tiempo real
2. **Ligas y Rankings**: Sistema de clasificación global
3. **Logros**: Badges por completar temas
4. **Racha Diaria**: Bonus por jugar consecutivamente
5. **Modo Infinito**: Sin límite de tiempo, más palabras

## 🚀 Cómo Lanzar

1. Subir archivos a servidor
2. Configurar Google AdSense
3. Crear landing page
4. Campaña en redes sociales con tema del día
5. Colaborar con influencers para promoción

## 📈 Estrategia de Crecimiento

### Semana 1-2: Lanzamiento
- Post diario en Instagram/TikTok con tema del día
- Hashtags: #WordSnap #SopaDeLetras #JuegoViral

### Semana 3-4: Viralización
- Colaboraciones con micro-influencers
- Retos en TikTok (#WordSnapChallenge)
- Sorteos para mejores puntuaciones

### Mes 2+: Monetización
- Lanzar paquetes premium
- Implementar sistema de referidos
- Crear comunidad en Discord/Telegram

---

**¡Listo para jugar!** Abre `word-snap.html` en tu navegador y empieza a encontrar palabras. 🎯


## 🔧 Gestión de Temas

### Archivo themes.json
Los temas se cargan dinámicamente desde `themes.json`. Para añadir nuevos temas:

```json
{
  "id": "tu-tema",
  "name": "Nombre del Tema",
  "emoji": "🎯",
  "words": ["PALABRA1", "PALABRA2", "PALABRA3", "PALABRA4", "PALABRA5"]
}
```

### Requisitos de Palabras
- Entre 4 y 9 letras
- Solo letras mayúsculas
- Sin acentos ni ñ
- Mínimo 5 palabras por tema

### Sistema de Fallback
Si `themes.json` no se puede cargar, el juego usa temas predefinidos automáticamente.

## ⚡ Características de UX

### Timer con Alerta
- **Normal**: Color rojo estándar
- **≤10 segundos**: Pulso animado + vibración triple
- **Efecto**: Aumenta tensión y urgencia

### Botón Inteligente
- **"▶️ Jugar"**: Cuando no está jugando
- **"🔄 Reiniciar"**: Durante el juego (color rojo)
- **Click**: Cambia entre iniciar y reiniciar automáticamente

### Feedback Continuo
- Sonido en cada letra seleccionada
- Color indica validez de la palabra
- Animaciones en cada palabra encontrada
- Vibración en móvil
