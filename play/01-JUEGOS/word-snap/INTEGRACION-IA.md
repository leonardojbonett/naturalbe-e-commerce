# 🤖 Integración ChatGPT para Word Snap

## 📋 Objetivo
Generar automáticamente temas diarios y listas de palabras usando ChatGPT API.

## 🔑 Configuración API

### 1. Obtener API Key
```bash
# Registrarse en: https://platform.openai.com/
# Crear API key en: API Keys > Create new secret key
```

### 2. Archivo de Configuración
```javascript
// config-ai.js
const AI_CONFIG = {
    apiKey: 'TU_API_KEY_AQUI',
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7
};
```

## 💡 Prompts Optimizados

### Generar Tema Diario
```javascript
const promptTema = `
Genera un tema viral y actual para un juego de sopa de letras.
El tema debe ser:
- Relevante para audiencia latina 18-35 años
- Relacionado con cultura pop, memes, o tendencias
- Atractivo para compartir en redes sociales

Responde solo con el nombre del tema en español.
Ejemplo: "Memes Virales 2024"
`;
```

### Generar Lista de Palabras
```javascript
const promptPalabras = `
Genera exactamente 5 palabras para una sopa de letras con tema: "${tema}"

Requisitos:
- Palabras entre 4 y 9 letras
- Solo letras mayúsculas, sin acentos ni ñ
- Palabras reconocibles y virales
- Relacionadas directamente con el tema
- Separadas por comas

Ejemplo: SHAKIRA, MESSI, ROSALIA, ANUEL, MALUMA
`;
```

## 🔧 Implementación

### Función para Llamar API
```javascript
async function generarTemaConIA() {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: AI_CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en cultura pop y tendencias virales.'
                },
                {
                    role: 'user',
                    content: promptTema
                }
            ],
            max_tokens: AI_CONFIG.maxTokens,
            temperature: AI_CONFIG.temperature
        })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

async function generarPalabrasConIA(tema) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: AI_CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en crear contenido viral para juegos.'
                },
                {
                    role: 'user',
                    content: promptPalabras.replace('${tema}', tema)
                }
            ],
            max_tokens: AI_CONFIG.maxTokens,
            temperature: AI_CONFIG.temperature
        })
    });

    const data = await response.json();
    const palabrasTexto = data.choices[0].message.content.trim();
    return palabrasTexto.split(',').map(p => p.trim());
}
```

### Integrar en el Juego
```javascript
// Modificar en word-snap.js

async selectDailyTheme() {
    try {
        // Intentar generar con IA
        const tema = await generarTemaConIA();
        const palabras = await generarPalabrasConIA(tema);
        
        // Validar palabras
        const palabrasValidas = palabras.filter(p => 
            p.length >= 4 && 
            p.length <= 9 && 
            /^[A-Z]+$/.test(p)
        );
        
        if (palabrasValidas.length >= 5) {
            this.currentTheme = tema;
            this.words = palabrasValidas.slice(0, 5);
        } else {
            // Fallback a temas predefinidos
            this.usarTemaPredefinido();
        }
    } catch (error) {
        console.error('Error generando tema con IA:', error);
        this.usarTemaPredefinido();
    }
}

usarTemaPredefinido() {
    const themeNames = Object.keys(this.themes);
    const dayIndex = new Date().getDate() % themeNames.length;
    const themeName = themeNames[dayIndex];
    
    this.currentTheme = themeName;
    this.words = this.themes[themeName];
}
```

## 💾 Sistema de Caché

### Guardar Temas Generados
```javascript
class ThemeCache {
    constructor() {
        this.storageKey = 'wordsnap_themes';
    }

    guardarTema(fecha, tema, palabras) {
        const cache = this.obtenerCache();
        cache[fecha] = { tema, palabras, timestamp: Date.now() };
        localStorage.setItem(this.storageKey, JSON.stringify(cache));
    }

    obtenerTema(fecha) {
        const cache = this.obtenerCache();
        return cache[fecha] || null;
    }

    obtenerCache() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    limpiarCache() {
        // Eliminar temas de más de 30 días
        const cache = this.obtenerCache();
        const ahora = Date.now();
        const treintaDias = 30 * 24 * 60 * 60 * 1000;

        Object.keys(cache).forEach(fecha => {
            if (ahora - cache[fecha].timestamp > treintaDias) {
                delete cache[fecha];
            }
        });

        localStorage.setItem(this.storageKey, JSON.stringify(cache));
    }
}

// Uso en el juego
const themeCache = new ThemeCache();

async selectDailyTheme() {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Verificar si ya existe tema para hoy
    const temaCache = themeCache.obtenerTema(hoy);
    
    if (temaCache) {
        this.currentTheme = temaCache.tema;
        this.words = temaCache.palabras;
        return;
    }

    // Generar nuevo tema
    try {
        const tema = await generarTemaConIA();
        const palabras = await generarPalabrasConIA(tema);
        
        // Guardar en caché
        themeCache.guardarTema(hoy, tema, palabras);
        
        this.currentTheme = tema;
        this.words = palabras;
    } catch (error) {
        this.usarTemaPredefinido();
    }
}
```

## 📊 Optimización de Costos

### Estrategia de Uso
1. **Generar 1 tema por día**: ~$0.001 por tema
2. **Cachear resultados**: Evitar llamadas repetidas
3. **Fallback a temas predefinidos**: Si falla la API
4. **Batch generation**: Generar temas para toda la semana

### Generar Temas Semanales
```javascript
async function generarTemasSemanal() {
    const prompt = `
    Genera 7 temas virales diferentes para una sopa de letras, uno para cada día de la semana.
    
    Para cada tema, incluye:
    - Nombre del tema
    - 5 palabras (4-9 letras, mayúsculas, sin acentos)
    
    Formato JSON:
    [
      {
        "dia": "Lunes",
        "tema": "Memes 2024",
        "palabras": ["SKIBIDI", "RIZZ", "SIGMA", "GYATT", "OHIO"]
      },
      ...
    ]
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Eres un experto en cultura viral.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.8
        })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}
```

## 🎯 Temas Sugeridos por Categoría

### Para Solicitar a ChatGPT
```javascript
const categorias = [
    'Memes virales actuales',
    'Series de Netflix populares',
    'Artistas de reggaeton',
    'Celebridades latinas',
    'Videojuegos populares',
    'Tendencias de TikTok',
    'Equipos de fútbol',
    'Películas de Marvel',
    'Anime popular',
    'Grupos de K-Pop',
    'YouTubers famosos',
    'Marcas de moda',
    'Comida internacional',
    'Destinos turísticos',
    'Aplicaciones móviles'
];
```

## 🔒 Seguridad

### Proteger API Key
```javascript
// NO hacer esto (expone la key):
const apiKey = 'sk-abc123...';

// HACER esto (usar backend):
async function llamarAPI(prompt) {
    const response = await fetch('/api/generar-tema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    return response.json();
}
```

### Backend Simple (Node.js)
```javascript
// server.js
const express = require('express');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/generar-tema', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150
        });

        res.json({ 
            resultado: completion.choices[0].message.content 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error generando tema' });
    }
});

app.listen(3000);
```

## 📈 Monitoreo

### Tracking de Uso
```javascript
class AIUsageTracker {
    constructor() {
        this.storageKey = 'ai_usage';
    }

    registrarLlamada(tipo, tokens, costo) {
        const uso = this.obtenerUso();
        uso.llamadas.push({
            tipo,
            tokens,
            costo,
            fecha: new Date().toISOString()
        });
        localStorage.setItem(this.storageKey, JSON.stringify(uso));
    }

    obtenerEstadisticas() {
        const uso = this.obtenerUso();
        return {
            totalLlamadas: uso.llamadas.length,
            totalTokens: uso.llamadas.reduce((sum, l) => sum + l.tokens, 0),
            costoTotal: uso.llamadas.reduce((sum, l) => sum + l.costo, 0)
        };
    }

    obtenerUso() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : { llamadas: [] };
    }
}
```

---

**Costo estimado**: $0.30 - $1.00 por mes (generando 1 tema diario)
**Alternativa gratuita**: Usar solo temas predefinidos y actualizar manualmente cada semana
