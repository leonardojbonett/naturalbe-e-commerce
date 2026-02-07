# 🧩 Memory Flip - Documento de Diseño V1.0

## 📋 Información General

**Nombre:** Memory Flip  
**Tipo:** Juego de memoria (Match-2)  
**Plataforma:** Web (HTML5 + JavaScript)  
**Versión:** 1.0  
**Fecha:** 2025-11-27  

---

## 🎯 Concepto del Juego

Memory Flip es un juego clásico de memoria donde el jugador debe encontrar todas las parejas de cartas idénticas volteándolas de dos en dos. El objetivo es completar el tablero en el menor tiempo y con la menor cantidad de movimientos posibles.

---

## 🎮 Mecánicas de Juego

### Flujo Principal:
1. **Inicio:** Seleccionar dificultad (Fácil, Medio, Difícil)
2. **Juego:** Voltear cartas para encontrar parejas
3. **Match:** Si las cartas coinciden, quedan descubiertas
4. **No Match:** Si no coinciden, se vuelven a ocultar
5. **Victoria:** Encontrar todas las parejas antes del tiempo límite

### Sistema de Cartas:
- **Fácil:** 4x4 (16 cartas, 8 parejas)
- **Medio:** 5x4 (20 cartas, 10 parejas)
- **Difícil:** 6x5 (30 cartas, 15 parejas)

### Sistema de Tiempo:
- **Fácil:** Sin límite de tiempo
- **Medio:** 2 minutos (120 segundos)
- **Difícil:** 2:30 minutos (150 segundos)

### Sistema de Puntuación:
**Puntos base:** 1000  
**Penalizaciones:**
- -10 puntos por cada movimiento
- -2 puntos por cada segundo

**Multiplicadores:**
- Medio: x1.5
- Difícil: x2.0

**Puntuación mínima:** 100 puntos

---

## 🎨 Sets de Cartas

### 8 Sets Disponibles:
1. **Animales** 🐶 - Animales domésticos y salvajes
2. **Frutas** 🍎 - Frutas variadas
3. **Deportes** ⚽ - Equipamiento deportivo
4. **Comida** 🍕 - Comida rápida y platos
5. **Naturaleza** 🌸 - Flores y plantas
6. **Vehículos** 🚗 - Medios de transporte
7. **Espacio** 🌟 - Elementos espaciales
8. **Emojis** 😀 - Caras y expresiones

**Selección:** Aleatoria en cada partida

---

## 💰 Integración con Sistemas

### Sistema de XP (xp-manager.js):
**XP por partida:**
- Base por completar: +50 XP
- Por cada match: +1 XP
- Bonus por juego perfecto: +25 XP

**Multiplicadores:**
- Medio: x1.5
- Difícil: x2.0

**Ejemplo:**
- Juego perfecto en difícil: (50 + 15 + 25) × 2 = 180 XP

### Sistema de Monedas (coins-manager.js):
**Monedas por partida:**
- Base por completar: +25 monedas
- Por match rápido (<1s): +5 monedas
- Bonus por juego perfecto: +15 monedas

**Multiplicadores:**
- Medio: x1.5
- Difícil: x2.0

**Promedio por partida:**
- Fácil: 25-40 monedas
- Medio: 40-60 monedas
- Difícil: 60-100 monedas

### Sistema de Logros (achievements.js):
**Logros implementados:**
1. **Primer Match** - Completar primera partida
2. **Memoria de Acero** - Juego sin fallos
3. **Reloj Humano** - Terminar en <30s
4. **300 Movimientos** - Acumulado total
5. **Maestro de la Memoria** - 10 juegos perfectos

---

## 🎨 Diseño Visual

### Paleta de Colores:
- **Principal:** #667eea → #764ba2 (morado/azul)
- **Carta oculta:** Degradado morado
- **Carta revelada:** Blanco con borde gris
- **Match:** Verde suave (#e8f5e9)
- **Error:** Rojo con shake

### Animaciones:
1. **Flip Card:**
   ```css
   transform: rotateY(180deg);
   transition: transform 0.4s ease;
   ```

2. **Match Pulse:**
   ```css
   animation: matchPulse 0.5s ease;
   /* Scale 1 → 1.1 → 1 */
   ```

3. **Shake (Error):**
   ```css
   animation: shake 0.5s ease;
   /* TranslateX: 0 → -10px → 10px → 0 */
   ```

4. **Grid Fade In:**
   ```css
   animation: fadeInScale 0.5s ease;
   /* Opacity 0 → 1, Scale 0.8 → 1 */
   ```

### Responsive Design:
- **Desktop:** Grid completo según dificultad
- **Tablet:** Grid ajustado
- **Móvil:** 
  - Fácil/Medio: Grid normal
  - Difícil: 4 columnas en lugar de 5

---

## 🔄 Estados del Juego

### 1. Pantalla de Inicio:
- Logo del juego
- Selector de dificultad (3 botones)
- Botón "Comenzar Juego"
- Botón "Volver al Portal"

### 2. Pantalla de Juego:
- Stats bar (Tiempo, Movimientos, Parejas)
- Grid de cartas
- Cartas con animación flip
- Timer activo

### 3. Pantalla de Resultados:
- Título (¡Completado! / Tiempo Agotado)
- Puntuación final
- Estadísticas:
  - Tiempo total
  - Movimientos
  - Precisión
  - XP ganado
  - Monedas ganadas
  - Ranking (estrellas)
- Botones: Compartir, Jugar de Nuevo

---

## 📊 Métricas y Estadísticas

### Durante el Juego:
- Tiempo transcurrido
- Movimientos realizados
- Parejas encontradas / Total

### Pantalla Final:
- **Tiempo total**
- **Movimientos totales**
- **Precisión** (parejas / movimientos × 100)
- **XP ganado**
- **Monedas ganadas**
- **Ranking** (⭐⭐⭐)

### Ranking por Estrellas:
- ⭐ - Precisión < 80%
- ⭐⭐ - Precisión 80-89%
- ⭐⭐⭐ - Precisión ≥ 90%

---

## 🚀 Características Futuras (V2)

### Modos de Juego:
- **Modo Zen:** Sin tiempo límite, sin puntuación
- **Modo Contrarreloj:** 60 segundos, máximas parejas
- **Modo Multijugador:** Competir con amigos
- **Modo Desafío:** Niveles progresivos

### Mejoras de Contenido:
- Más sets de cartas (20+ sets)
- Sets temáticos desbloqueables
- Cartas animadas
- Efectos de sonido personalizados

### Progresión:
- Desbloquear sets de cartas
- Niveles de dificultad progresivos
- Tabla de líderes
- Torneos semanales

### Social:
- Compartir en redes sociales
- Desafiar amigos
- Ranking global
- Logros compartibles

---

## 🔧 Arquitectura Técnica

### Archivos Principales:
```
memory-flip/
├── memory-flip.html    (UI del juego)
├── memory-flip.js      (Lógica principal)
└── memory-data.js      (Sets de cartas)
```

### Dependencias:
- `styles-v2.css` (de Word Snap)
- `xp-manager.js`
- `coins-manager.js`
- `achievements.js`
- `audio-manager.js`
- `error-manager.js`

### Clase Principal: MemoryGame

**Propiedades:**
- `difficulty` - Nivel seleccionado
- `cards` - Array de cartas
- `flippedCards` - Cartas actualmente volteadas
- `moves` - Movimientos realizados
- `matches` - Parejas encontradas
- `seconds` - Tiempo transcurrido

**Métodos principales:**
- `startGame()` - Iniciar nueva partida
- `flipCard(index)` - Voltear carta
- `checkMatch()` - Verificar si hay match
- `handleMatch()` - Procesar match correcto
- `handleNoMatch()` - Procesar match incorrecto
- `endGame()` - Finalizar y mostrar resultados

---

## ✅ Criterios de Calidad

### Funcionalidad:
- [x] 3 niveles de dificultad
- [x] 8 sets de cartas diferentes
- [x] Sistema de tiempo funcional
- [x] Animaciones suaves
- [x] Integración con XP y monedas
- [x] Logros implementados

### UX/UI:
- [x] Diseño consistente con otros juegos
- [x] Responsive en móviles
- [x] Feedback visual claro
- [x] Animaciones profesionales
- [x] Accesibilidad básica

### Performance:
- [x] Carga rápida (<2s)
- [x] Sin lag en animaciones
- [x] Optimizado para móviles
- [x] Manejo de errores

---

## 🎯 Diferenciadores

### vs Otros Juegos de Memoria:
1. **Integración completa** con ecosistema NaturalBe
2. **8 sets de cartas** variados
3. **3 dificultades** bien balanceadas
4. **Animaciones profesionales** con CSS3
5. **Sistema de progresión** (XP, monedas, logros)
6. **Responsive perfecto** en todos los dispositivos

---

**Versión:** 1.0  
**Autor:** Kiro AI  
**Fecha:** 2025-11-27  
**Estado:** ✅ Completado
