# 🎮 Sistema de 100 Niveles - Word Snap

## 🎯 Cambios Implementados

### ✅ 1. De "Tema Diario" a "Campaña de Niveles"

**ANTES:**
- Temas por fecha (2025-11-26, etc.)
- Un tema diferente cada día
- Sin progresión

**AHORA:**
- 100 niveles progresivos
- Sistema de desbloqueo
- Progresión guardada en localStorage

### ✅ 2. Badge Temático con Ilusión Visual

**Formato del badge:**
```
🌍 Nivel 1 – Países del mundo
⚽ Nivel 16 – Fútbol mundial
🧪 Nivel 7 – Conceptos de ciencia
```

Cada nivel tiene:
- **Icono temático** (⚽ fútbol, 📚 historia, 🔬 ciencia)
- **Número de nivel** visible
- **Nombre del tema**
- **Color personalizado** según categoría

### ✅ 3. 100 Niveles Integrados

Los niveles están en `word-snap-levels.js`:

```javascript
const GAME_LEVELS = {
    version: "3.0",
    totalLevels: 100,
    levels: [
        {nivel: 1, tema: "Países del mundo", icono: "🌍", categoria: "Cultura general", color: "#4CAF50", palabras: [...]},
        {nivel: 2, tema: "Capitales famosas", icono: "🏙️", categoria: "Cultura general", color: "#2196F3", palabras: [...]},
        // ... 98 niveles más
    ]
};
```

**Categorías incluidas:**
- 🌍 Cultura general (25 niveles)
- ⚽ Deportes (15 niveles)
- 📜 Historia (20 niveles)
- 🔬 Ciencia (20 niveles)
- 🗺️ Geografía (15 niveles)
- 🎨 Arte y cultura (10 niveles)
- 💻 Tecnología (5 niveles)

### ✅ 4. Sistema de Progresión

**Al completar un nivel:**
1. Se muestra modal de "¡Nivel Completado!"
2. Badge: "✅ Nivel X superado"
3. Se desbloquea el siguiente nivel
4. Botón "➡️ Siguiente Nivel" visible
5. Progreso guardado en localStorage

**Condiciones para avanzar:**
- Encontrar todas las palabras del nivel
- Antes de que termine el tiempo

**Métricas mostradas:**
- Palabras encontradas (X/Y)
- Tiempo usado
- Nivel máximo desbloqueado

### ✅ 5. Ilusión Visual por Tema

**Fondos dinámicos por categoría:**

```javascript
const CATEGORY_THEMES = {
    "Deportes": {
        background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
        pattern: "⚽"
    },
    "Historia": {
        background: "linear-gradient(135deg, #795548 0%, #5d4037 100%)",
        pattern: "📜"
    },
    "Ciencia": {
        background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
        pattern: "⚛️"
    }
    // ... más categorías
};
```

**Elementos visuales:**
- Fondo degradado según categoría
- Emoji gigante semi-transparente en esquina
- Color del badge personalizado
- Transiciones suaves entre niveles

## 📁 Archivos Nuevos

1. **word-snap-campaign.html** - HTML principal con sistema de niveles
2. **word-snap-campaign.js** - Lógica del juego con progresión
3. **word-snap-levels.js** - 100 niveles embebidos + temas visuales

## 🎮 Cómo Usar

### Opción 1: Abrir directamente
```
word-snap-campaign.html
```

### Opción 2: Con servidor
```bash
python -m http.server 8000
# Abrir: http://localhost:8000/word-snap-campaign.html
```

## 🔧 Características Técnicas

### LocalStorage
```javascript
// Nivel actual
localStorage.getItem('wordSnapLevel')  // 1-100

// Nivel máximo desbloqueado
localStorage.getItem('wordSnapMaxLevel')  // 1-100

// Modo oscuro
localStorage.getItem('darkMode')  // 'true' / 'false'
```

### Progresión
```javascript
// Cargar nivel específico
game.loadLevel(5);

// Avanzar al siguiente
game.nextLevel();

// Reiniciar nivel actual
game.restart();
```

### Personalización de Temas
```javascript
// Cambiar fondo según categoría
applyTheme() {
    const categoria = this.levelData.categoria;
    const theme = CATEGORY_THEMES[categoria];
    document.body.style.background = theme.background;
}
```

## 🎨 Personalización Visual

### Añadir nuevo tema de categoría:
```javascript
CATEGORY_THEMES["Nueva Categoría"] = {
    background: "linear-gradient(135deg, #color1, #color2)",
    emoji: "🎯🎪🎨",  // Emojis relacionados
    pattern: "🎯"      // Emoji de fondo
};
```

### Añadir nuevo nivel:
```javascript
{
    nivel: 101,
    tema: "Nuevo Tema",
    icono: "🎯",
    categoria: "Categoría",
    color: "#FF5722",
    palabras: ["PALABRA1", "PALABRA2", "PALABRA3", "PALABRA4", "PALABRA5"]
}
```

## 🚀 Mejoras Futuras Sugeridas

### 1. Pantalla de Selección de Niveles
```
┌─────────────────────────────┐
│  🌍 Nivel 1  ⭐⭐⭐         │
│  🏙️ Nivel 2  ⭐⭐          │
│  🌋 Nivel 3  🔒            │
└─────────────────────────────┘
```

### 2. Sistema de Estrellas
- ⭐ 1 estrella: Completar el nivel
- ⭐⭐ 2 estrellas: Sin pistas
- ⭐⭐⭐ 3 estrellas: Tiempo récord

### 3. Logros
- 🏆 "Velocista": Completar 10 niveles en menos de 1 minuto
- 🔥 "Racha": Completar 5 niveles seguidos sin fallar
- 🎯 "Perfeccionista": Obtener 3 estrellas en 20 niveles

### 4. Modo Desafío
- Niveles aleatorios
- Tiempo reducido
- Palabras más difíciles

### 5. Compartir Progreso
```javascript
shareProgress() {
    const text = `🎮 Word Snap\n` +
                `📊 Nivel ${this.currentLevel}/100\n` +
                `⭐ ${this.score} puntos\n` +
                `🔥 ¡Únete al desafío!`;
    navigator.share({text});
}
```

## 📊 Estadísticas del Juego

- **Total de niveles**: 100
- **Total de palabras**: ~500
- **Categorías**: 7
- **Dificultades**: 3 (Fácil, Normal, Difícil)
- **Tiempo por nivel**: 2 minutos

## 🎯 Experiencia del Usuario

### Flujo del Juego:
1. Usuario abre el juego → Ve "Nivel 1 – Países del mundo"
2. Presiona "▶️ Jugar Nivel 1"
3. Encuentra las palabras
4. Completa el nivel → "✅ Nivel 1 superado"
5. Presiona "➡️ Nivel 2"
6. Nuevo tema carga con fondo diferente
7. Repite hasta nivel 100

### Feedback Visual:
- ✅ Palabras encontradas se marcan en verde
- ⭐ Partículas al encontrar palabras
- 🎊 Confetti al completar nivel
- 🎨 Fondo cambia según categoría
- 📊 Barra de progreso muestra avance

## 🐛 Solución de Problemas

### El nivel no avanza
```javascript
// Verificar en consola:
console.log(localStorage.getItem('wordSnapLevel'));
console.log(localStorage.getItem('wordSnapMaxLevel'));

// Resetear si es necesario:
localStorage.setItem('wordSnapLevel', '1');
localStorage.setItem('wordSnapMaxLevel', '1');
```

### Los temas no cambian
```javascript
// Verificar que word-snap-levels.js está cargado:
console.log(GAME_LEVELS);
console.log(CATEGORY_THEMES);
```

### Palabras no se encuentran
- Verificar que las palabras estén en mayúsculas
- Revisar que no tengan espacios
- Comprobar la dificultad (algunas direcciones están deshabilitadas en fácil)

## 🎉 ¡Listo para Jugar!

Abre `word-snap-campaign.html` y disfruta de los 100 niveles progresivos con temas visuales únicos.

**Características destacadas:**
- ✅ Sin necesidad de servidor (standalone)
- ✅ Progresión guardada automáticamente
- ✅ Temas visuales por categoría
- ✅ 100 niveles únicos
- ✅ Sistema de desbloqueo
- ✅ Responsive (funciona en móvil)
- ✅ Modo oscuro
- ✅ Efectos visuales (partículas, confetti)
