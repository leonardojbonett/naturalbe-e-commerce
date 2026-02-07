# 🧠 Trivia Challenge - Documento de Diseño V1.0

## 📋 Información General

**Nombre:** Trivia Challenge  
**Tipo:** Juego de preguntas y respuestas  
**Plataforma:** Web (HTML5 + JavaScript)  
**Versión:** 1.0  
**Fecha:** 2025-11-27  

---

## 🎯 Concepto del Juego

Trivia Challenge es un juego de cultura general que pone a prueba los conocimientos del jugador en 7 categorías diferentes. El jugador debe responder correctamente el mayor número de preguntas posibles antes de perder sus 3 vidas.

---

## 🎮 Mecánicas de Juego

### Flujo Principal
1. **Inicio:** El jugador ve la pantalla de bienvenida con las reglas
2. **Juego:** Se presentan 10 preguntas aleatorias
3. **Respuesta:** El jugador tiene 15 segundos para responder cada pregunta
4. **Resultado:** Al final se muestra el puntaje y estadísticas

### Sistema de Vidas
- El jugador comienza con **3 vidas** (❤️❤️❤️)
- Pierde 1 vida por:
  - Respuesta incorrecta
  - Tiempo agotado
- El juego termina cuando:
  - Se pierden todas las vidas
  - Se responden todas las preguntas

### Sistema de Puntuación
**Puntos base por dificultad:**
- Fácil: 100 puntos
- Media: 150 puntos
- Difícil: 200 puntos

**Multiplicador por racha:**
- Racha de 1-2: x1.0
- Racha de 3-4: x1.3
- Racha de 5+: x1.5
- Máximo: x2.0

**Ejemplo:**
- Pregunta difícil (200 pts) + racha de 5 = 200 × 1.5 = 300 puntos

### Sistema de Tiempo
- **15 segundos** por pregunta
- Barra visual que disminuye
- Últimos 5 segundos: barra roja (warning)
- Si se agota: cuenta como respuesta incorrecta

---

## 📚 Categorías y Preguntas

### Categorías Disponibles (7)
1. **Historia** - Eventos históricos, personajes, fechas
2. **Ciencia** - Física, química, biología, astronomía
3. **Geografía** - Países, capitales, ríos, montañas
4. **Cultura Pop** - Cine, música, series, entretenimiento
5. **Deportes** - Fútbol, olimpiadas, récords deportivos
6. **Tecnología** - Informática, internet, innovación
7. **Arte y Literatura** - Pintores, escritores, obras famosas

### Niveles de Dificultad
- **Fácil:** Conocimiento general básico
- **Media:** Requiere cultura general sólida
- **Difícil:** Conocimiento especializado

### Banco de Preguntas
- **Total:** 100 preguntas
- **Distribución:**
  - Historia: 15 preguntas
  - Ciencia: 15 preguntas
  - Geografía: 15 preguntas
  - Cultura Pop: 15 preguntas
  - Deportes: 15 preguntas
  - Tecnología: 13 preguntas
  - Arte y Literatura: 12 preguntas

### Estructura de Pregunta
```javascript
{
    categoria: "Historia",
    dificultad: "media",
    pregunta: "¿En qué año cayó el Muro de Berlín?",
    opciones: ["1987", "1989", "1991", "1985"],
    correcta: 1  // índice de la respuesta correcta
}
```

---

## 💰 Integración con Sistemas

### Sistema de XP (xp-manager.js)
**XP por respuesta correcta:**
- Fácil: +10 XP
- Media: +20 XP
- Difícil: +30 XP
- Bonus por racha ≥3: +5 XP adicional

**Ejemplo de progresión:**
- 10 preguntas correctas (mix): ~150-200 XP
- Suficiente para subir 1-2 niveles

### Sistema de Monedas (coins-manager.js)
**Monedas por respuesta:**
- Calculadas como: `puntos / 20`
- Ejemplo: 200 puntos = 10 monedas

**Bonus al completar:**
- Completar con vidas restantes: +50 monedas

**Promedio por partida:**
- Partida promedio: 50-100 monedas
- Partida perfecta: 150+ monedas

### Sistema de Logros (achievements.js)
**Logros implementados:**
1. **Primer Quiz** - Completar primera partida
2. **Cerebro en Llama** - Racha de 5 correctas
3. **Perfeccionista** - 10/10 correctas
4. **Historiador** - 10 correctas en Historia (futuro)
5. **Científico** - 10 correctas en Ciencia (futuro)
6. **Maratón de Trivia** - 50 preguntas totales (futuro)

### Sistema de Audio (audio-manager.js)
**Sonidos integrados:**
- `start` - Inicio de partida
- `correct` - Respuesta correcta
- `wrong` - Respuesta incorrecta
- `win` - Victoria
- `lose` - Derrota

### Sistema de Anuncios (ad-manager.js)
**Puntos de integración preparados:**
- Botón "Ver anuncio para x2 monedas" (pantalla final)
- Botón "Continuar con +1 vida" (durante juego)
- Hooks listos, sin implementación real aún

---

## 🎨 Diseño Visual

### Paleta de Colores
- **Principal:** #667eea → #764ba2 (degradado morado/azul)
- **Correcto:** #4caf50 (verde)
- **Incorrecto:** #f44336 (rojo)
- **Monedas:** #FFD700 → #FFA500 (dorado)
- **Fondo:** Blanco con sombras suaves

### Componentes UI
1. **Header:**
   - Título del juego
   - Display de monedas
   - Nivel del jugador

2. **Stats Bar:**
   - Vidas (corazones)
   - Número de pregunta
   - Puntuación actual

3. **Pregunta Card:**
   - Categoría (badge)
   - Barra de tiempo
   - Texto de la pregunta
   - 4 opciones en grid 2x2

4. **Pantalla de Resultados:**
   - Puntuación final
   - Estadísticas detalladas
   - Botones de acción

### Responsive Design
- **Desktop:** Grid 2x2 para respuestas
- **Móvil:** Optimizado para pantallas pequeñas
- **Touch:** Botones grandes y táctiles

---

## 🔄 Estados del Juego

### 1. Pantalla de Inicio
- Descripción del juego
- Reglas básicas
- Botón "Comenzar Trivia"
- Botón "Volver a Word Snap"

### 2. Pantalla de Juego
- Pregunta activa
- Timer corriendo
- Botones de respuesta habilitados
- Stats actualizados en tiempo real

### 3. Estado de Respuesta
- Botones deshabilitados
- Respuesta marcada (verde/rojo)
- Pausa de 1.5s antes de siguiente pregunta

### 4. Pantalla de Resultados
- Estadísticas completas
- Botón "Compartir"
- Botón "Jugar de Nuevo"

---

## 📊 Métricas y Estadísticas

### Durante el Juego
- Pregunta actual / Total
- Vidas restantes
- Puntuación acumulada
- Racha actual (si ≥3)

### Pantalla Final
- **Puntuación total**
- **Respuestas correctas** / Total
- **Racha máxima**
- **Monedas ganadas**
- **XP ganado**
- **Precisión** (%)

---

## 🚀 Características Futuras (V2)

### Modos de Juego
- **Modo Categoría:** Elegir categoría específica
- **Modo Maratón:** Preguntas ilimitadas hasta perder
- **Modo Contrarreloj:** 60 segundos, máximas preguntas
- **Modo Multijugador:** Competir con amigos

### Mejoras de Contenido
- Expandir a 500+ preguntas
- Añadir imágenes a preguntas
- Preguntas con audio/video
- Categorías adicionales

### Progresión
- Desbloquear categorías
- Niveles de dificultad progresivos
- Ranking global
- Torneos semanales

### Social
- Compartir en redes sociales
- Desafiar amigos
- Tabla de líderes
- Logros compartibles

---

## 🔧 Arquitectura Técnica

### Archivos Principales
```
trivia-challenge/
├── trivia-challenge.html    (UI del juego)
├── trivia-challenge.js       (Lógica principal)
├── trivia-data.js            (Banco de preguntas)
└── TRIVIA-*.md               (Documentación)
```

### Dependencias
- `styles-v2.css` (de Word Snap)
- `xp-manager.js`
- `coins-manager.js`
- `achievements.js`
- `audio-manager.js`
- `ad-manager.js`
- `error-manager.js`

### Clase Principal: TriviaGame
**Propiedades:**
- `currentQuestion` - Índice de pregunta actual
- `score` - Puntuación acumulada
- `lives` - Vidas restantes
- `streak` - Racha actual
- `questions` - Array de preguntas seleccionadas

**Métodos principales:**
- `startGame()` - Iniciar nueva partida
- `loadQuestion()` - Cargar pregunta actual
- `selectAnswer(index)` - Procesar respuesta
- `handleCorrectAnswer()` - Lógica de respuesta correcta
- `handleIncorrectAnswer()` - Lógica de respuesta incorrecta
- `endGame()` - Finalizar y mostrar resultados

---

## ✅ Criterios de Calidad

### Funcionalidad
- [x] 100 preguntas variadas y correctas
- [x] Sistema de tiempo funcional
- [x] Sistema de vidas funcional
- [x] Cálculo correcto de puntuación
- [x] Integración con XP y monedas
- [x] Pantallas de inicio, juego y resultados

### UX/UI
- [x] Diseño consistente con Word Snap
- [x] Responsive en móviles
- [x] Feedback visual claro
- [x] Animaciones suaves
- [x] Accesibilidad básica

### Performance
- [x] Carga rápida (<2s)
- [x] Sin lag en interacciones
- [x] Optimizado para móviles
- [x] Manejo de errores

---

**Versión:** 1.0  
**Autor:** Kiro AI  
**Fecha:** 2025-11-27  
**Estado:** ✅ Completado
