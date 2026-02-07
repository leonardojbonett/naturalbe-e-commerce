# 🎨 Guía: Generador Automático de Temas Diarios

## 🎯 Objetivo
Sistema que genera automáticamente un tema nuevo cada día con palabras, dificultad, color y emoji.

---

## 🤖 Opción 1: ChatGPT API (Recomendado)

### Ventajas
- ✅ Temas creativos y variados
- ✅ Palabras relevantes y actuales
- ✅ Contexto cultural
- ✅ Fácil de implementar

### Setup

**1. Obtener API Key**
```bash
1. Ir a https://platform.openai.com/
2. Crear cuenta
3. API Keys → Create new secret key
4. Guardar key de forma segura
```

**2. Crear Generador**

```javascript
// theme-generator.js

class ThemeGenerator {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    async generateDailyTheme(date) {
        const prompt = this.createPrompt(date);
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto en cultura pop y tendencias virales. Generas temas creativos para juegos de palabras.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 300
                })
            });

            const data = await response.json();
            const themeData = JSON.parse(data.choices[0].message.content);
            
            return this.validateAndFormat(themeData);
        } catch (error) {
            console.error('Error generating theme:', error);
            return this.getFallbackTheme(date);
        }
    }

    createPrompt(date) {
        const dayOfWeek = new Date(date).toLocaleDateString('es', { weekday: 'long' });
        const month = new Date(date).toLocaleDateString('es', { month: 'long' });
        
        return `
Genera un tema viral y atractivo para un juego de sopa de letras.

Fecha: ${date} (${dayOfWeek} de ${month})
Audiencia: Jóvenes 18-35 años, hispanohablantes
Contexto: Cultura pop, memes, tendencias actuales

Genera un JSON con esta estructura exacta:
{
  "id": "tema-slug",
  "name": "Nombre del Tema",
  "emoji": "🎯",
  "color": "#667eea",
  "difficulty": "normal",
  "words": ["PALABRA1", "PALABRA2", "PALABRA3", "PALABRA4", "PALABRA5"],
  "description": "Breve descripción del tema"
}

Requisitos:
- 5 palabras entre 4-9 letras
- Solo letras mayúsculas, sin acentos ni ñ
- Palabras reconocibles y virales
- Tema relevante para la fecha o tendencias actuales
- Emoji representativo
- Color en formato hex
- Dificultad: easy, normal o hard

Responde SOLO con el JSON, sin texto adicional.
        `.trim();
    }

    validateAndFormat(themeData) {
        // Validar estructura
        if (!themeData.name || !themeData.words || themeData.words.length < 5) {
            throw new Error('Invalid theme data');
        }

        // Validar palabras
        themeData.words = themeData.words
            .map(w => w.toUpperCase().replace(/[^A-Z]/g, ''))
            .filter(w => w.length >= 4 && w.length <= 9)
            .slice(0, 5);

        if (themeData.words.length < 5) {
            throw new Error('Not enough valid words');
        }

        // Asegurar valores por defecto
        themeData.emoji = themeData.emoji || '🎯';
        themeData.color = themeData.color || '#667eea';
        themeData.difficulty = themeData.difficulty || 'normal';
        themeData.id = themeData.id || this.slugify(themeData.name);

        return themeData;
    }

    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    getFallbackTheme(date) {
        // Temas de respaldo si falla la API
        const fallbacks = [
            {
                id: 'memes-2024',
                name: 'Memes Virales 2024',
                emoji: '😂',
                color: '#f093fb',
                difficulty: 'normal',
                words: ['SKIBIDI', 'RIZZ', 'SIGMA', 'GYATT', 'OHIO'],
                description: 'Los memes más virales del momento'
            },
            {
                id: 'series-netflix',
                name: 'Series de Netflix',
                emoji: '📺',
                color: '#e50914',
                difficulty: 'normal',
                words: ['STRANGER', 'SQUID', 'CROWN', 'WITCHER', 'NARCOS'],
                description: 'Las series más populares de Netflix'
            },
            // ... más temas de respaldo
        ];

        const dayIndex = new Date(date).getDate();
        return fallbacks[dayIndex % fallbacks.length];
    }
}

// Uso
const generator = new ThemeGenerator('tu-api-key');
const theme = await generator.generateDailyTheme('2025-11-25');
```

**3. Sistema de Caché**

```javascript
class ThemeCacheManager {
    constructor(generator) {
        this.generator = generator;
        this.storageKey = 'wordsnap_theme_cache';
    }

    async getThemeForDate(date) {
        // Verificar caché
        const cached = this.getCached(date);
        if (cached) {
            console.log('Using cached theme');
            return cached;
        }

        // Generar nuevo tema
        console.log('Generating new theme...');
        const theme = await this.generator.generateDailyTheme(date);
        
        // Guardar en caché
        this.saveToCache(date, theme);
        
        return theme;
    }

    getCached(date) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            return cache[date] || null;
        } catch {
            return null;
        }
    }

    saveToCache(date, theme) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            cache[date] = theme;
            
            // Limpiar temas antiguos (más de 30 días)
            this.cleanOldCache(cache);
            
            localStorage.setItem(this.storageKey, JSON.stringify(cache));
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    }

    cleanOldCache(cache) {
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        Object.keys(cache).forEach(date => {
            const themeDate = new Date(date).getTime();
            if (now - themeDate > thirtyDays) {
                delete cache[date];
            }
        });
    }
}

// Uso en el juego
const generator = new ThemeGenerator('tu-api-key');
const cacheManager = new ThemeCacheManager(generator);

async function loadDailyTheme() {
    const today = new Date().toISOString().split('T')[0];
    const theme = await cacheManager.getThemeForDate(today);
    
    // Aplicar tema al juego
    game.currentTheme = theme.name;
    game.words = theme.words;
    document.getElementById('themeBadge').textContent = `${theme.emoji} ${theme.name}`;
    document.getElementById('themeBadge').style.background = theme.color;
}
```

---

## 🔄 Opción 2: Generador Local (Sin API)

### Ventajas
- ✅ Gratis
- ✅ Sin dependencias externas
- ✅ Rápido

### Desventajas
- ❌ Menos variedad
- ❌ Requiere mantenimiento manual

### Implementación

```javascript
class LocalThemeGenerator {
    constructor() {
        this.categories = [
            {
                name: 'Memes',
                emojis: ['😂', '🤣', '💀'],
                colors: ['#f093fb', '#f5576c', '#667eea'],
                wordSets: [
                    ['SKIBIDI', 'RIZZ', 'SIGMA', 'GYATT', 'OHIO'],
                    ['BASED', 'CRINGE', 'BUSSIN', 'SLAY', 'VIBE'],
                    ['RATIO', 'COPE', 'TOUCH', 'GRASS', 'REAL']
                ]
            },
            {
                name: 'Series',
                emojis: ['📺', '🎬', '🍿'],
                colors: ['#e50914', '#00d4ff', '#764ba2'],
                wordSets: [
                    ['STRANGER', 'SQUID', 'CROWN', 'WITCHER', 'NARCOS'],
                    ['BREAKING', 'OFFICE', 'FRIENDS', 'SOPRANOS', 'WIRE'],
                    ['MANDALORIAN', 'LOKI', 'WANDAVISION', 'FALCON', 'HAWKEYE']
                ]
            },
            {
                name: 'Música',
                emojis: ['🎵', '🎤', '🎸'],
                colors: ['#1DB954', '#FF006E', '#8338EC'],
                wordSets: [
                    ['FEID', 'KAROL', 'PESO', 'PLUMA', 'BIZARRAP'],
                    ['TAYLOR', 'DRAKE', 'BEYONCE', 'WEEKND', 'ARIANA'],
                    ['ROSALIA', 'SHAKIRA', 'MALUMA', 'ANUEL', 'OZUNA']
                ]
            },
            // ... más categorías
        ];
    }

    generateForDate(date) {
        const seed = this.dateSeed(date);
        const category = this.selectCategory(seed);
        const wordSet = this.selectWordSet(category, seed);
        const emoji = this.selectEmoji(category, seed);
        const color = this.selectColor(category, seed);
        const difficulty = this.selectDifficulty(seed);

        return {
            id: `${this.slugify(category.name)}-${date}`,
            name: `${category.name} ${this.getDateSuffix(date)}`,
            emoji: emoji,
            color: color,
            difficulty: difficulty,
            words: wordSet,
            description: `Tema del día: ${category.name}`
        };
    }

    dateSeed(date) {
        // Convertir fecha a número para usar como seed
        const d = new Date(date);
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    selectCategory(seed) {
        const index = seed % this.categories.length;
        return this.categories[index];
    }

    selectWordSet(category, seed) {
        const index = Math.floor(seed / 100) % category.wordSets.length;
        return category.wordSets[index];
    }

    selectEmoji(category, seed) {
        const index = Math.floor(seed / 1000) % category.emojis.length;
        return category.emojis[index];
    }

    selectColor(category, seed) {
        const index = Math.floor(seed / 10000) % category.colors.length;
        return category.colors[index];
    }

    selectDifficulty(seed) {
        const mod = seed % 10;
        if (mod < 3) return 'easy';
        if (mod < 8) return 'normal';
        return 'hard';
    }

    getDateSuffix(date) {
        const d = new Date(date);
        const day = d.getDate();
        
        if (day % 10 === 1 && day !== 11) return `${day}º`;
        return `del ${day}`;
    }

    slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
}

// Uso
const generator = new LocalThemeGenerator();
const theme = generator.generateForDate('2025-11-25');
```

---

## 🎨 Opción 3: Híbrido (Recomendado para Producción)

Combina ambos enfoques:

```javascript
class HybridThemeGenerator {
    constructor(apiKey) {
        this.aiGenerator = new ThemeGenerator(apiKey);
        this.localGenerator = new LocalThemeGenerator();
        this.cacheManager = new ThemeCacheManager(this.aiGenerator);
    }

    async getThemeForDate(date) {
        try {
            // Intentar con IA primero
            const theme = await this.cacheManager.getThemeForDate(date);
            return theme;
        } catch (error) {
            console.warn('AI generation failed, using local generator');
            // Fallback a generador local
            return this.localGenerator.generateForDate(date);
        }
    }

    async preGenerateWeek() {
        // Pre-generar temas para la semana
        const themes = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            try {
                const theme = await this.aiGenerator.generateDailyTheme(dateStr);
                this.cacheManager.saveToCache(dateStr, theme);
                themes.push(theme);
            } catch (error) {
                console.error(`Failed to generate theme for ${dateStr}`);
            }
        }
        
        return themes;
    }
}

// Uso
const generator = new HybridThemeGenerator('tu-api-key');

// Cargar tema del día
const theme = await generator.getThemeForDate('2025-11-25');

// Pre-generar temas de la semana (ejecutar una vez al día)
await generator.preGenerateWeek();
```

---

## 🤖 Opción 4: Cron Job + Backend

Para producción a gran escala:

**Backend (Node.js)**

```javascript
// server.js
const express = require('express');
const cron = require('node-cron');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let dailyTheme = null;

// Generar tema cada día a las 00:00
cron.schedule('0 0 * * *', async () => {
    console.log('Generating daily theme...');
    dailyTheme = await generateTheme();
    console.log('Theme generated:', dailyTheme.name);
});

async function generateTheme() {
    const today = new Date().toISOString().split('T')[0];
    
    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: 'Eres un experto en cultura pop y tendencias virales.'
            },
            {
                role: 'user',
                content: `Genera un tema viral para ${today}...`
            }
        ]
    });

    return JSON.parse(completion.choices[0].message.content);
}

// API endpoint
app.get('/api/theme/today', (req, res) => {
    if (!dailyTheme) {
        return res.status(503).json({ error: 'Theme not ready' });
    }
    res.json(dailyTheme);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
    // Generar tema inicial
    generateTheme().then(theme => dailyTheme = theme);
});
```

**Frontend**

```javascript
async function loadDailyTheme() {
    try {
        const response = await fetch('https://tu-api.com/api/theme/today');
        const theme = await response.json();
        
        game.currentTheme = theme.name;
        game.words = theme.words;
        // ... aplicar tema
    } catch (error) {
        console.error('Error loading theme:', error);
        // Usar tema de fallback
    }
}
```

---

## 📊 Comparación de Opciones

| Opción | Costo | Variedad | Mantenimiento | Escalabilidad |
|--------|-------|----------|---------------|---------------|
| **ChatGPT API** | $0.30/mes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Local** | $0 | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Híbrido** | $0.30/mes | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Cron + Backend** | $5/mes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Recomendación

### Para Empezar
**Opción 2 (Local)**: Gratis, fácil, suficiente para MVP

### Para Crecer
**Opción 3 (Híbrido)**: Mejor de ambos mundos

### Para Escalar
**Opción 4 (Cron + Backend)**: Profesional, confiable, escalable

---

## ✅ Implementación Paso a Paso

1. **Semana 1**: Implementar generador local
2. **Semana 2**: Añadir ChatGPT API con caché
3. **Semana 3**: Crear sistema híbrido
4. **Mes 2**: Migrar a backend con cron job

**Tiempo total**: 1 mes
**Costo**: $0-5/mes
**Resultado**: Temas frescos cada día automáticamente
