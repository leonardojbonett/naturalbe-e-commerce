// Memory Flip - Sets de Íconos para Cartas
// Versión 1.0

const CARD_SETS = {
    ANIMALS: {
        name: 'Animales',
        icons: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵']
    },
    FRUITS: {
        name: 'Frutas',
        icons: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍐']
    },
    SPORTS: {
        name: 'Deportes',
        icons: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥊', '🥋', '⛳']
    },
    FOOD: {
        name: 'Comida',
        icons: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🍖', '🍗', '🥓', '🥚', '🍞', '🥐', '🥨', '🥯', '🥞']
    },
    NATURE: {
        name: 'Naturaleza',
        icons: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀', '🌾', '🌵', '🌴', '🌳', '🌲', '🌱', '🍁']
    },
    VEHICLES: {
        name: 'Vehículos',
        icons: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🏍️']
    },
    SPACE: {
        name: 'Espacio',
        icons: ['🌟', '⭐', '✨', '💫', '🌙', '☀️', '🌍', '🌎', '🌏', '🪐', '🌌', '🌠', '☄️', '🛸', '🚀']
    },
    EMOJIS: {
        name: 'Emojis',
        icons: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩']
    }
};

const DIFFICULTY_LEVELS = {
    EASY: {
        name: 'Fácil',
        rows: 4,
        cols: 4,
        pairs: 8,
        timeLimit: null, // ilimitado
        icon: '😊'
    },
    MEDIUM: {
        name: 'Medio',
        rows: 5,
        cols: 4,
        pairs: 10,
        timeLimit: 120, // 2 minutos
        icon: '🤔'
    },
    HARD: {
        name: 'Difícil',
        rows: 6,
        cols: 5,
        pairs: 15,
        timeLimit: 150, // 2:30 minutos
        icon: '😈'
    }
};

// Función para obtener cartas aleatorias
function getRandomCards(difficulty, setName = 'ANIMALS') {
    const level = DIFFICULTY_LEVELS[difficulty];
    const set = CARD_SETS[setName];
    
    // Seleccionar íconos aleatorios
    const shuffled = [...set.icons].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, level.pairs);
    
    // Duplicar para crear parejas
    const cards = [...selected, ...selected];
    
    // Mezclar las cartas
    return cards.sort(() => Math.random() - 0.5).map((icon, index) => ({
        id: index,
        icon: icon,
        isFlipped: false,
        isMatched: false
    }));
}

// Función para obtener set aleatorio
function getRandomSet() {
    const sets = Object.keys(CARD_SETS);
    return sets[Math.floor(Math.random() * sets.length)];
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CARD_SETS,
        DIFFICULTY_LEVELS,
        getRandomCards,
        getRandomSet
    };
}
