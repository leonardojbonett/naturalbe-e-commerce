# 🏆 Guía: Leaderboard Global

## 🎯 Objetivo
Implementar un ranking global por tema del día usando servicios sin backend complejo.

---

## Opción 1: Firebase (Recomendado)

### ✅ Ventajas
- Gratis hasta 50K lecturas/día
- Tiempo real
- Fácil de implementar
- Escalable

### 📦 Setup

#### 1. Crear Proyecto Firebase
```bash
1. Ir a https://console.firebase.google.com
2. Crear nuevo proyecto "word-snap"
3. Activar Firestore Database
4. Configurar reglas de seguridad
```

#### 2. Reglas de Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{theme}/{date}/{entry} {
      // Permitir lectura a todos
      allow read: if true;
      
      // Permitir escritura solo con validación
      allow create: if request.resource.data.score is int
                    && request.resource.data.score >= 0
                    && request.resource.data.score <= 1000
                    && request.resource.data.playerName is string
                    && request.resource.data.playerName.size() <= 20
                    && request.resource.data.timestamp is timestamp;
    }
  }
}
```

#### 3. Integración en Word Snap

**Añadir Firebase SDK**
```html
<!-- En word-snap.html, antes de </body> -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<script>
// Configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "word-snap.firebaseapp.com",
  projectId: "word-snap",
  storageBucket: "word-snap.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
</script>
```

**Funciones de Leaderboard**
```javascript
// En word-snap.js

class LeaderboardManager {
    constructor(db) {
        this.db = db;
    }

    async submitScore(theme, score, playerName) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            await this.db.collection('leaderboard')
                .doc(theme)
                .collection(today)
                .add({
                    score: score,
                    playerName: playerName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    difficulty: game.difficulty
                });
            
            return true;
        } catch (error) {
            console.error('Error submitting score:', error);
            return false;
        }
    }

    async getTopScores(theme, limit = 10) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const snapshot = await this.db.collection('leaderboard')
                .doc(theme)
                .collection(today)
                .orderBy('score', 'desc')
                .limit(limit)
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting scores:', error);
            return [];
        }
    }

    async getUserRank(theme, score) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const snapshot = await this.db.collection('leaderboard')
                .doc(theme)
                .collection(today)
                .where('score', '>', score)
                .get();
            
            return snapshot.size + 1; // Posición del usuario
        } catch (error) {
            console.error('Error getting rank:', error);
            return null;
        }
    }
}

// Inicializar
const leaderboard = new LeaderboardManager(db);
```

**UI del Leaderboard**
```html
<!-- Añadir al modal en word-snap.html -->
<div class="leaderboard-section" id="leaderboardSection">
    <h3>🏆 Top 10 del Día</h3>
    <div class="leaderboard-list" id="leaderboardList">
        <!-- Se llena dinámicamente -->
    </div>
    <div class="user-rank" id="userRank">
        <!-- Tu posición -->
    </div>
</div>
```

**CSS del Leaderboard**
```css
.leaderboard-section {
    margin: 20px 0;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 15px;
}

.leaderboard-list {
    max-height: 300px;
    overflow-y: auto;
}

.leaderboard-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    margin: 5px 0;
    background: white;
    border-radius: 10px;
    transition: all 0.3s;
}

.leaderboard-item:hover {
    transform: translateX(5px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.leaderboard-rank {
    font-weight: bold;
    color: #667eea;
    min-width: 30px;
}

.leaderboard-rank.top1 { color: #FFD700; }
.leaderboard-rank.top2 { color: #C0C0C0; }
.leaderboard-rank.top3 { color: #CD7F32; }

.user-rank {
    margin-top: 15px;
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    text-align: center;
    font-weight: bold;
}
```

**Mostrar Leaderboard**
```javascript
async function displayLeaderboard() {
    const scores = await leaderboard.getTopScores(game.currentTheme);
    const listEl = document.getElementById('leaderboardList');
    
    listEl.innerHTML = scores.map((entry, index) => `
        <div class="leaderboard-item">
            <span class="leaderboard-rank ${index < 3 ? 'top' + (index + 1) : ''}">
                ${index + 1}. ${entry.playerName}
            </span>
            <span class="leaderboard-score">${entry.score} pts</span>
        </div>
    `).join('');
    
    // Mostrar posición del usuario
    const rank = await leaderboard.getUserRank(game.currentTheme, game.score);
    document.getElementById('userRank').textContent = 
        `Tu posición: #${rank} de ${scores.length + 1}`;
}

// Llamar al terminar el juego
async function gameOver(won) {
    // ... código existente ...
    
    // Pedir nombre si es top score
    if (game.score > 0) {
        const playerName = prompt('¡Entra al ranking! Tu nombre:', 'Anónimo');
        if (playerName) {
            await leaderboard.submitScore(game.currentTheme, game.score, playerName);
            await displayLeaderboard();
        }
    }
}
```

---

## Opción 2: Supabase

### ✅ Ventajas
- PostgreSQL real
- API REST automática
- Gratis hasta 500MB
- Más potente que Firebase

### 📦 Setup

#### 1. Crear Proyecto
```bash
1. Ir a https://supabase.com
2. Crear proyecto "word-snap"
3. Crear tabla "leaderboard"
```

#### 2. Schema SQL
```sql
CREATE TABLE leaderboard (
    id BIGSERIAL PRIMARY KEY,
    theme TEXT NOT NULL,
    date DATE NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 1000),
    CONSTRAINT valid_name CHECK (LENGTH(player_name) <= 20)
);

-- Índices para performance
CREATE INDEX idx_leaderboard_theme_date ON leaderboard(theme, date);
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);

-- Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard"
    ON leaderboard FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert scores"
    ON leaderboard FOR INSERT
    WITH CHECK (true);
```

#### 3. Integración
```html
<!-- Añadir Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<script>
const supabase = window.supabase.createClient(
    'https://tu-proyecto.supabase.co',
    'tu-anon-key'
);
</script>
```

```javascript
class SupabaseLeaderboard {
    constructor(client) {
        this.client = client;
    }

    async submitScore(theme, score, playerName) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await this.client
            .from('leaderboard')
            .insert([{
                theme: theme,
                date: today,
                player_name: playerName,
                score: score,
                difficulty: game.difficulty
            }]);
        
        return !error;
    }

    async getTopScores(theme, limit = 10) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await this.client
            .from('leaderboard')
            .select('*')
            .eq('theme', theme)
            .eq('date', today)
            .order('score', { ascending: false })
            .limit(limit);
        
        return data || [];
    }

    async getUserRank(theme, score) {
        const today = new Date().toISOString().split('T')[0];
        
        const { count } = await this.client
            .from('leaderboard')
            .select('*', { count: 'exact', head: true })
            .eq('theme', theme)
            .eq('date', today)
            .gt('score', score);
        
        return (count || 0) + 1;
    }
}

const leaderboard = new SupabaseLeaderboard(supabase);
```

---

## Opción 3: Google Sheets API (Más Simple)

### ✅ Ventajas
- Gratis ilimitado
- Fácil de ver/editar datos
- No requiere backend

### ⚠️ Desventajas
- Más lento
- Límite de 100 requests/100s
- Menos seguro

### 📦 Setup

#### 1. Crear Google Sheet
```
1. Crear hoja "Word Snap Leaderboard"
2. Columnas: Fecha | Tema | Nombre | Puntos | Dificultad
3. Compartir como "Cualquiera con el link puede editar"
```

#### 2. Usar SheetDB
```bash
1. Ir a https://sheetdb.io
2. Conectar tu Google Sheet
3. Obtener API endpoint
```

#### 3. Integración
```javascript
class SheetsLeaderboard {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async submitScore(theme, score, playerName) {
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [{
                    Fecha: today,
                    Tema: theme,
                    Nombre: playerName,
                    Puntos: score,
                    Dificultad: game.difficulty
                }]
            })
        });
        
        return response.ok;
    }

    async getTopScores(theme, limit = 10) {
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(
            `${this.apiUrl}/search?Fecha=${today}&Tema=${theme}`
        );
        
        const data = await response.json();
        return data
            .sort((a, b) => b.Puntos - a.Puntos)
            .slice(0, limit);
    }
}

const leaderboard = new SheetsLeaderboard('https://sheetdb.io/api/v1/tu-id');
```

---

## 🎨 UI Mejorada del Leaderboard

```html
<div class="leaderboard-modal" id="leaderboardModal">
    <div class="leaderboard-content">
        <button class="close-btn" onclick="closeLeaderboard()">✕</button>
        
        <h2>🏆 Ranking del Día</h2>
        <p class="theme-name">${currentTheme}</p>
        
        <div class="podium">
            <div class="podium-place second">
                <div class="medal">🥈</div>
                <div class="player-name">${player2}</div>
                <div class="player-score">${score2}</div>
            </div>
            <div class="podium-place first">
                <div class="medal">🥇</div>
                <div class="player-name">${player1}</div>
                <div class="player-score">${score1}</div>
            </div>
            <div class="podium-place third">
                <div class="medal">🥉</div>
                <div class="player-name">${player3}</div>
                <div class="player-score">${score3}</div>
            </div>
        </div>
        
        <div class="leaderboard-list">
            <!-- 4-10 posiciones -->
        </div>
        
        <div class="your-position">
            <span>Tu posición: #${rank}</span>
            <span>${yourScore} pts</span>
        </div>
    </div>
</div>
```

---

## 📊 Comparación de Opciones

| Característica | Firebase | Supabase | Sheets |
|---------------|----------|----------|--------|
| **Costo** | Gratis 50K/día | Gratis 500MB | Gratis ilimitado |
| **Velocidad** | ⚡⚡⚡ | ⚡⚡⚡ | ⚡ |
| **Facilidad** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Tiempo Real** | ✅ | ✅ | ❌ |
| **SQL** | ❌ | ✅ | ❌ |

### Recomendación
- **Prototipo rápido**: Google Sheets
- **Producción pequeña**: Firebase
- **Producción grande**: Supabase

---

## 🚀 Próximos Pasos

1. Elegir opción (Firebase recomendado)
2. Crear proyecto
3. Integrar código
4. Probar con datos de prueba
5. Lanzar en producción

**Tiempo estimado**: 2-4 horas
**Costo**: $0 (tier gratuito)
