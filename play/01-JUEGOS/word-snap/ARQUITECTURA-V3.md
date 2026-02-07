# 🏗️ Arquitectura Word Snap V3

## 📊 Estructura de Archivos

```
word-snap/
├── 🎮 JUEGO PRINCIPAL
│   ├── word-snap-campaign.html      (UI Campaña)
│   ├── word-snap-campaign.js        (Lógica Campaña)
│   └── word-snap-levels.js          (100 Niveles + Palabras Ocultas)
│
├── 🏃 MODO MARATÓN
│   ├── word-snap-marathon.html      (UI Maratón)
│   └── word-snap-marathon.js        (Lógica Maratón)
│
├── 🔊 SISTEMA DE AUDIO
│   └── audio-manager.js             (Web Audio API)
│
├── 💰 SISTEMAS ADICIONALES
│   ├── coins-manager.js             (Monedas)
│   └── word-snap-quests.js          (Misiones)
│
└── 📚 DOCUMENTACIÓN
    ├── FEATURES-AVANZADAS-V3.md     (Completa)
    ├── TEST-FEATURES.md             (Pruebas)
    ├── RESUMEN-V3.md                (Ejecutivo)
    ├── INICIO-RAPIDO-V3.md          (Quick Start)
    └── ARQUITECTURA-V3.md           (Este archivo)
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                    WORD SNAP V3                         │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   ┌────▼────┐                           ┌─────▼─────┐
   │ CAMPAÑA │                           │  MARATÓN  │
   └────┬────┘                           └─────┬─────┘
        │                                      │
        ├──► word-snap-campaign.js            │
        ├──► word-snap-campaign.html          │
        │                                      │
        │                                      ├──► word-snap-marathon.js
        │                                      └──► word-snap-marathon.html
        │                                      
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────┴──────────────────┐
        │                                 │
   ┌────▼────┐                      ┌────▼────┐
   │ NIVELES │                      │  AUDIO  │
   └────┬────┘                      └────┬────┘
        │                                │
        ├──► word-snap-levels.js        ├──► audio-manager.js
        │    • 100 niveles              │    • 5 sonidos
        │    • Palabras ocultas         │    • Web Audio API
        │    • Temas por categoría      │    • Toggle persistente
        │                                │
        └────────────┬───────────────────┘
                     │
              ┌──────▼──────┐
              │ LOCALSTORAGE│
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼────┐  ┌───▼───┐  ┌────▼────┐
   │ PERFIL  │  │ STATS │  │ RÉCORDS │
   └─────────┘  └───────┘  └─────────┘
```

---

## 🧩 Componentes Principales

### 1. WordSnapCampaign (Clase Base)

```javascript
class WordSnapCampaign {
    // Propiedades Core
    grid[][]              // Grid de letras
    words[]               // Palabras a encontrar
    foundWords[]          // Palabras encontradas
    score                 // Puntuación
    
    // Sistema de Niveles
    currentLevel          // Nivel actual
    maxLevelUnlocked      // Nivel máximo desbloqueado
    levelData             // Datos del nivel actual
    
    // Sistema de Palabra Oculta (TAREA 1)
    hiddenWord            // Palabra secreta
    hiddenWordFound       // Boolean
    
    // Sistema de Perfil (TAREA 4)
    playerId              // UUID único
    
    // Métodos Principales
    init()
    loadLevel()
    createGrid()
    startSelection()
    endSelection()
    foundWord()
    handleHiddenWordFound()  // TAREA 1
    levelComplete()
    
    // Selector de Niveles (TAREA 5)
    initLevelSelector()
    renderLevelCards()
    filterLevels()
    
    // Tema Visual (TAREA 6)
    applyTheme()
    startPatternAnimation()
}
```

### 2. WordSnapMarathon (Hereda de Campaign)

```javascript
class WordSnapMarathon extends WordSnapCampaign {
    // Propiedades Maratón
    globalTimeLeft        // Tiempo global
    marathonScore         // Score acumulado
    marathonLevels        // Niveles completados
    
    // Métodos Override
    start()               // Inicia con 90s
    levelComplete()       // +20s bonus
    endMarathon()         // Guarda récords
    showQuickFeedback()   // Feedback rápido
}
```

### 3. AudioManager (Sistema de Sonido)

```javascript
class AudioManager {
    // Propiedades
    enabled               // Boolean
    audioContext          // Web Audio API
    
    // Métodos
    play(name)            // Reproduce sonido
    playClick()           // 800Hz corto
    playWord()            // 600-1200Hz ascendente
    playLevelComplete()   // C5-E5-G5
    playTimeWarning()     // Alerta alternada
    playHiddenWord()      // Vibrato especial
    toggle()              // On/Off
}
```

---

## 💾 LocalStorage Schema

```javascript
{
    // Identificación
    "wsPlayerID": "uuid-v4",
    
    // Progreso de Campaña
    "wordSnapLevel": 1,
    "wordSnapMaxLevel": 1,
    "wordSnapMaxScore": 0,
    "wordSnapDaysPlayed": 0,
    "wordSnapStreak": 0,
    "wordSnapLastDay": "2025-11-27",
    
    // Stats Globales (TAREA 4)
    "wsTotalWordsFound": 0,
    "wsTotalLevelsCompleted": 0,
    "wsTotalTimePlayed": 0,
    "wsHiddenWordsFound": 0,
    
    // Récords de Maratón (TAREA 2)
    "wsMarathonBestLevels": 0,
    "wsMarathonBestScore": 0,
    
    // Preferencias
    "wsSoundEnabled": "true",
    "darkMode": "false"
}
```

---

## 🎨 Sistema de Temas

```javascript
CATEGORY_THEMES = {
    "Deportes": {
        background: "linear-gradient(135deg, #4CAF50, #45a049)",
        emoji: "⚽🏀🏈⚾🎾",
        pattern: "⚽"
    },
    "Historia": {
        background: "linear-gradient(135deg, #795548, #5d4037)",
        emoji: "🏺📜🏰⚔️👑",
        pattern: "📜"
    },
    // ... 8 categorías totales
}
```

---

## 🔊 Sistema de Audio

```
AudioManager
    │
    ├─► Web Audio API
    │   ├─► OscillatorNode (generador de tono)
    │   ├─► GainNode (control de volumen)
    │   └─► LFO (vibrato para palabra oculta)
    │
    └─► Sonidos Sintéticos
        ├─► click: 800Hz, 0.1s
        ├─► word: 600→1200Hz, 0.3s
        ├─► levelComplete: C5-E5-G5, 0.3s cada uno
        ├─► timeWarning: 800Hz-600Hz alternado
        └─► hiddenWord: 400→1600Hz con vibrato
```

---

## 🎯 Flujo de Juego

### Campaña Normal:

```
1. Cargar nivel actual
2. Generar grid con palabras
3. Jugador selecciona letras
4. Detectar palabra
   ├─► Palabra normal → +puntos
   └─► Palabra oculta → +100 puntos + animación
5. Completar nivel
6. Guardar progreso
7. Desbloquear siguiente nivel
```

### Modo Maratón:

```
1. Iniciar con 90s
2. Cargar nivel 1
3. Completar nivel
   ├─► +20s bonus
   └─► Feedback rápido
4. Auto-avanzar a siguiente nivel
5. Repetir hasta tiempo = 0
6. Mostrar resultados
7. Guardar récords si aplica
```

---

## 🧪 Puntos de Extensión

### Fácil de Añadir:

1. **Más palabras ocultas:**
   - Editar `word-snap-levels.js`
   - Añadir campo `palabraOculta` a cualquier nivel

2. **Nuevos sonidos:**
   - Añadir método en `AudioManager`
   - Llamar con `audioManager.play('nuevoSonido')`

3. **Nuevas categorías:**
   - Añadir en `CATEGORY_THEMES`
   - Crear niveles con esa categoría

4. **Nuevas stats:**
   - Añadir key en localStorage
   - Actualizar en `updateMetaProgress()`
   - Incluir en `getPlayerProfile()`

---

## 🔐 Seguridad y Persistencia

- **UUID único:** Generado con `crypto.randomUUID()`
- **LocalStorage:** Datos persisten entre sesiones
- **No hay backend:** Todo es client-side
- **Sin cookies:** Solo localStorage
- **Sin tracking:** Datos solo locales

---

## 📈 Performance

- **Pool de partículas:** 30 partículas reutilizables
- **Sonidos sintéticos:** Sin carga de archivos
- **Grid optimizado:** Renderizado eficiente
- **Animaciones CSS:** Hardware accelerated
- **Lazy loading:** Niveles cargados bajo demanda

---

## 🚀 Escalabilidad

### Actual:
- 100 niveles
- 5 palabras ocultas
- 8 categorías
- 5 sonidos
- 2 modos de juego

### Fácil de Escalar a:
- ∞ niveles (generador IA)
- Palabras ocultas en todos los niveles
- Más categorías temáticas
- Más sonidos y música
- Más modos (PvP, Cooperativo, etc.)

---

**Versión:** 3.0  
**Arquitectura:** Modular y Extensible  
**Estado:** ✅ Producción Ready
