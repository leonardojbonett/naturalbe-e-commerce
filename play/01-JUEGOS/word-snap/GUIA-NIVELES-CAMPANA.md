# 🎮 Guía de Niveles de Campaña - Word Snap

## 📋 Resumen

Se han creado **100 niveles progresivos** para el modo campaña de Word Snap, organizados en categorías temáticas con dificultad creciente.

## 📁 Archivos

- **campaign-levels.json** - 100 niveles del modo campaña
- **themes.json** - Temas diarios rotativos + fallback

## 🎯 Estructura de Niveles

### Campos de cada nivel:
```json
{
  "nivel": 1,
  "tema": "Países del mundo",
  "icono": "🌍",
  "categoria": "Cultura general",
  "pista": "Naciones reconocidas internacionalmente",
  "palabras": ["ESPANA", "MEXICO", "ARGENTINA", ...]
}
```

## 📊 Distribución por Categoría

- **Cultura general**: 25 niveles
- **Deportes**: 15 niveles
- **Historia**: 20 niveles
- **Ciencia**: 20 niveles
- **Geografía**: 15 niveles
- **Arte y cultura**: 10 niveles
- **Tecnología**: 5 niveles

## 🔧 Correcciones Aplicadas

1. ✅ "CAMPnou" → "CAMPNOU"
2. ✅ "REACTION" → "REACCION"
3. ✅ "DANTe" → "DANTE"
4. ✅ "MISIISIPI" → "MISISIPI"
5. ✅ "CIUDADDEMEXICO" → "MEXICO"
6. ✅ Palabras compuestas simplificadas
7. ✅ Espacios eliminados en palabras
8. ✅ Añadidas pistas para cada nivel

## 💡 Mejoras Implementadas

### 1. Pistas contextuales
Cada nivel tiene una pista que ayuda al jugador sin revelar las respuestas.

### 2. Palabras optimizadas
- Eliminadas palabras excesivamente largas
- Simplificadas palabras compuestas problemáticas
- Mantenida consistencia en mayúsculas

### 3. Progresión de dificultad
- Niveles 1-20: Básico (palabras comunes)
- Niveles 21-50: Intermedio (temas específicos)
- Niveles 51-80: Avanzado (conceptos complejos)
- Niveles 81-100: Experto (cultura profunda)

## 🎮 Integración en el Juego

### Cargar niveles de campaña:
```javascript
async function loadCampaignLevels() {
  const response = await fetch('campaign-levels.json');
  const data = await response.json();
  return data.campaignLevels;
}
```

### Obtener nivel específico:
```javascript
function getLevel(levelNumber) {
  const levels = await loadCampaignLevels();
  return levels.find(l => l.nivel === levelNumber);
}
```

### Sistema de progreso:
```javascript
const gameProgress = {
  currentLevel: 1,
  maxUnlocked: 1,
  starsPerLevel: {}, // {1: 3, 2: 2, ...}
  
  unlockNextLevel() {
    if (this.currentLevel < 100) {
      this.maxUnlocked = Math.max(this.maxUnlocked, this.currentLevel + 1);
    }
  }
};
```

## 🌟 Sistema de Estrellas Sugerido

- ⭐ 1 estrella: Completar el nivel
- ⭐⭐ 2 estrellas: Completar sin pistas
- ⭐⭐⭐ 3 estrellas: Completar en tiempo récord

## 🎨 UI Recomendada

### Selector de niveles:
```
🌍 Nivel 1: Países del mundo ⭐⭐⭐
🏙️ Nivel 2: Capitales famosas ⭐⭐
🌋 Nivel 3: Maravillas naturales 🔒
```

### Pantalla de nivel:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🌍 NIVEL 1
    Países del mundo
    
    💡 Pista: Naciones reconocidas
       internacionalmente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📈 Métricas de Engagement

### Objetivos:
- Retención día 1: 60%
- Retención día 7: 30%
- Nivel promedio alcanzado: 15
- Tiempo promedio por nivel: 2-3 min

### Hitos de recompensa:
- Nivel 10: Desbloquear tema diario
- Nivel 25: Desbloquear modo rápido
- Nivel 50: Desbloquear modo multijugador
- Nivel 75: Desbloquear temas personalizados
- Nivel 100: Modo infinito + badge especial

## 🔄 Actualización de Contenido

Para añadir más niveles:
1. Mantener estructura JSON
2. Incrementar número de nivel
3. Añadir pista descriptiva
4. Validar palabras (sin espacios, mayúsculas)
5. Actualizar totalLevels en metadata

## 🎯 Próximos Pasos

1. Integrar campaign-levels.json en word-snap.js
2. Crear UI de selección de niveles
3. Implementar sistema de progreso local
4. Añadir animaciones de desbloqueo
5. Crear sistema de logros
6. Implementar leaderboard por nivel

## 📱 Compatibilidad

- ✅ Funciona offline (JSON local)
- ✅ Ligero (~50KB)
- ✅ Fácil de actualizar
- ✅ Compatible con todos los navegadores
