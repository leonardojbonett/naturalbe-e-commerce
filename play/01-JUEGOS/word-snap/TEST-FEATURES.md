# 🧪 Guía de Pruebas - Features Avanzadas V3

## 🎯 Checklist de Pruebas

### ✅ TAREA 1: Palabra Oculta

**Pasos:**
1. Abrir `word-snap-campaign.html`
2. Jugar nivel 1
3. Buscar la palabra "COLOMBIA" en el grid (NO está en la lista)
4. Formar la palabra seleccionando las letras
5. **Resultado esperado:**
   - Badge dorado aparece: "💎 ¡Palabra secreta! +100 puntos"
   - Sonido especial con vibrato
   - +100 puntos al score
   - Celdas se marcan con gradiente dorado

**Otros niveles para probar:**
- Nivel 10: YESTERDAY
- Nivel 14: ARBITRO
- Nivel 50: CHATGPT
- Nivel 100: GRATITUD

**Verificar en consola:**
```javascript
localStorage.getItem('wsHiddenWordsFound') // Debe incrementar
```

---

### ✅ TAREA 2: Modo Maratón

**Pasos:**
1. Click en botón "🏃 Maratón" desde campaña
2. O abrir directamente `word-snap-marathon.html`
3. Click en "▶️ Iniciar Maratón"
4. Completar un nivel rápidamente
5. **Resultado esperado:**
   - Timer empieza en 90s
   - Al completar nivel: +20s bonus
   - Feedback rápido: "✅ ¡Nivel X completado! +20s bonus"
   - Avanza automáticamente al siguiente nivel
   - Badge muestra: "🏃 Maratón • X niveles"

**Cuando termina el tiempo:**
- Modal con resultados
- Muestra niveles completados y score total
- Si es récord: "🏆 ¡Nuevo Récord!" + confetti
- Récords guardados en localStorage

**Verificar en consola:**
```javascript
localStorage.getItem('wsMarathonBestLevels')
localStorage.getItem('wsMarathonBestScore')
```

---

### ✅ TAREA 3: Sistema de Sonido

**Pasos:**
1. Abrir cualquier modo de juego
2. Verificar botón "🔊 Sonido" en controles
3. Iniciar juego
4. **Sonidos a escuchar:**
   - **Click:** Al seleccionar cada letra (tono corto)
   - **Word:** Al encontrar palabra (ascendente)
   - **Level Complete:** Al terminar nivel (3 notas)
   - **Time Warning:** A los 20s restantes (alerta)
   - **Hidden Word:** Al encontrar palabra oculta (especial)

**Toggle de sonido:**
- Click en botón → cambia a "🔇 Sonido"
- Click de nuevo → vuelve a "🔊 Sonido"
- Preferencia se guarda entre sesiones

**Verificar en consola:**
```javascript
localStorage.getItem('wsSoundEnabled') // 'true' o 'false'
window.audioManager.enabled // true o false
```

**Probar manualmente:**
```javascript
audioManager.play('click')
audioManager.play('word')
audioManager.play('levelComplete')
audioManager.play('timeWarning')
audioManager.play('hiddenWord')
```

---

### ✅ TAREA 4: Perfil del Jugador

**Pasos:**
1. Abrir juego por primera vez
2. Abrir consola del navegador
3. Ejecutar: `console.log(game.getPlayerProfile())`
4. **Resultado esperado:**
```javascript
{
  id: "uuid-generado-automaticamente",
  maxLevel: 1,
  maxScore: 0,
  daysPlayed: 0,
  streak: 0,
  totalWords: 0,
  totalLevels: 0,
  totalTime: 0,
  hiddenWordsFound: 0
}
```

**Después de jugar varios niveles:**
- `totalWords` incrementa con cada palabra encontrada
- `totalLevels` incrementa con cada nivel completado
- `totalTime` suma el tiempo usado
- `hiddenWordsFound` incrementa al encontrar palabras ocultas

**Verificar ID único:**
```javascript
localStorage.getItem('wsPlayerID') // UUID único
```

**Stats globales:**
```javascript
localStorage.getItem('wsTotalWordsFound')
localStorage.getItem('wsTotalLevelsCompleted')
localStorage.getItem('wsTotalTimePlayed')
localStorage.getItem('wsHiddenWordsFound')
```

---

### ✅ TAREA 5: Selector de Niveles

**Pasos:**
1. Click en botón "📚 Niveles"
2. **Resultado esperado:**
   - Modal con grid de 5 columnas
   - Niveles desbloqueados con color e icono
   - Niveles bloqueados grises con 🔒
   - Nivel actual con borde azul
   - Contador: "X / 100 completados"

**Filtros de categoría:**
- Click en "⚽ Deportes" → solo muestra deportes
- Click en "📜 Historia" → solo muestra historia
- Click en "🌟 Todos" → muestra todos

**Interacción:**
- Hover sobre nivel desbloqueado → efecto elevación
- Click en nivel desbloqueado → carga ese nivel
- Click en nivel bloqueado → no hace nada (cursor not-allowed)

**Scroll:**
- Grid scrollable verticalmente
- Máximo 60vh de altura

---

### ✅ TAREA 6: Icono Temático Gigante

**Pasos:**
1. Iniciar cualquier nivel
2. Observar fondo del contenedor
3. **Resultado esperado:**
   - Emoji gigante del nivel actual (180px)
   - Opacidad baja (0.06)
   - Animación flotante suave
   - Rotación ligera (0-5 grados)

**Cambio de nivel:**
- Al avanzar de nivel → emoji cambia automáticamente
- Cada nivel tiene su propio emoji
- Ejemplo:
  - Nivel 1: 🌍
  - Nivel 10: 🎵
  - Nivel 14: ⚽
  - Nivel 50: 🤖

**Verificar animación:**
- El emoji se mueve arriba/abajo suavemente
- Ciclo de 4 segundos
- Rotación sutil

---

## 🔍 Pruebas de Integración

### Flujo Completo - Campaña:
1. Abrir `word-snap-campaign.html`
2. Activar sonido
3. Jugar nivel 1
4. Encontrar palabra oculta "COLOMBIA"
5. Completar nivel
6. Avanzar a nivel 2
7. Abrir selector de niveles
8. Saltar a nivel 10
9. Verificar perfil en consola

### Flujo Completo - Maratón:
1. Abrir `word-snap-marathon.html`
2. Activar sonido
3. Iniciar maratón
4. Completar 3-5 niveles seguidos
5. Observar bonus de tiempo
6. Dejar que termine el tiempo
7. Ver modal de resultados
8. Verificar récords

---

## 🐛 Casos Edge a Probar

### Palabra Oculta:
- ¿Qué pasa si encuentro la palabra oculta dos veces? → Solo cuenta la primera
- ¿Funciona en niveles sin palabra oculta? → Sí, simplemente no hay bonus

### Modo Maratón:
- ¿Qué pasa si completo nivel con 1s restante? → +20s bonus, continúa
- ¿El tiempo puede ser negativo? → No, termina en 0

### Sistema de Sonido:
- ¿Funciona sin interacción previa? → Sí, Web Audio API
- ¿Se guarda la preferencia? → Sí, en localStorage

### Selector de Niveles:
- ¿Puedo saltar a nivel bloqueado? → No, está deshabilitado
- ¿Los filtros funcionan correctamente? → Sí, ocultan/muestran

---

## 📊 Métricas a Verificar

### Después de 10 minutos de juego:

```javascript
// Ejecutar en consola:
const profile = game.getPlayerProfile();
console.table({
  'ID Jugador': profile.id,
  'Nivel Máximo': profile.maxLevel,
  'Score Máximo': profile.maxScore,
  'Días Jugados': profile.daysPlayed,
  'Racha': profile.streak,
  'Total Palabras': profile.totalWords,
  'Total Niveles': profile.totalLevels,
  'Tiempo Total (s)': profile.totalTime,
  'Palabras Ocultas': profile.hiddenWordsFound
});
```

### Récords de Maratón:

```javascript
console.table({
  'Mejor Racha': localStorage.getItem('wsMarathonBestLevels'),
  'Mejor Score': localStorage.getItem('wsMarathonBestScore')
});
```

---

## ✅ Checklist Final

- [ ] Palabra oculta funciona en nivel 1
- [ ] Modo maratón inicia correctamente
- [ ] Sonidos se reproducen al interactuar
- [ ] Perfil se genera con UUID único
- [ ] Selector de niveles muestra grid
- [ ] Icono temático flota en fondo
- [ ] Stats se guardan en localStorage
- [ ] Botón de sonido toggle funciona
- [ ] Filtros de categoría funcionan
- [ ] Récords de maratón se guardan
- [ ] Animaciones son suaves
- [ ] No hay errores en consola

---

## 🚀 Comandos de Desarrollo

```bash
# Iniciar servidor
python -m http.server 8000

# Limpiar localStorage (si necesitas reset)
# En consola del navegador:
localStorage.clear()

# Ver todas las keys guardadas:
Object.keys(localStorage).filter(k => k.startsWith('ws') || k.startsWith('wordSnap'))
```

---

## 📝 Notas Importantes

1. **Primera vez:** El sonido puede no funcionar hasta la primera interacción del usuario (política de navegadores)
2. **LocalStorage:** Los datos persisten entre sesiones
3. **UUID:** Se genera solo una vez, permanece constante
4. **Modo Maratón:** Es independiente de la campaña principal
5. **Palabras Ocultas:** Solo en 5 niveles por ahora, fácil añadir más

---

**Estado:** ✅ Listo para probar  
**Versión:** 3.0  
**Fecha:** 2025-11-27
