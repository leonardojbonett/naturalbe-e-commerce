// Trivia Challenge - Banco de Preguntas V1.0
// 100 preguntas de cultura general en 7 categorías

const TRIVIA_CATEGORIES = {
    HISTORIA: 'Historia', CIENCIA: 'Ciencia', GEOGRAFIA: 'Geografía',
    CULTURA_POP: 'Cultura Pop', DEPORTES: 'Deportes',
    TECNOLOGIA: 'Tecnología', ARTE: 'Arte y Literatura'
};

const TRIVIA_DIFFICULTY = { FACIL: 'facil', MEDIA: 'media', DIFICIL: 'dificil' };

const TRIVIA_QUESTIONS = [
    // HISTORIA (15)
    { categoria: 'Historia', dificultad: 'facil', pregunta: "¿En qué año llegó el hombre a la Luna?", opciones: ["1965", "1969", "1972", "1959"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'facil', pregunta: "¿Quién descubrió América?", opciones: ["Cristóbal Colón", "Américo Vespucio", "Magallanes", "Marco Polo"], correcta: 0 },
    { categoria: 'Historia', dificultad: 'facil', pregunta: "¿En qué año comenzó la Segunda Guerra Mundial?", opciones: ["1935", "1939", "1941", "1945"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'media', pregunta: "¿Quién fue el primer presidente de Estados Unidos?", opciones: ["Jefferson", "Franklin", "Washington", "Adams"], correcta: 2 },
    { categoria: 'Historia', dificultad: 'media', pregunta: "¿En qué año cayó el Muro de Berlín?", opciones: ["1987", "1989", "1991", "1985"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'media', pregunta: "¿Quién pintó la Capilla Sixtina?", opciones: ["Da Vinci", "Miguel Ángel", "Rafael", "Donatello"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'dificil', pregunta: "¿En qué año se firmó la Declaración de Independencia de EEUU?", opciones: ["1774", "1776", "1778", "1780"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'dificil', pregunta: "¿Quién fue el último emperador de Roma?", opciones: ["Nerón", "Calígula", "Rómulo Augústulo", "Constantino"], correcta: 2 },
    { categoria: 'Historia', dificultad: 'facil', pregunta: "¿En qué país se originó la Revolución Industrial?", opciones: ["Francia", "Alemania", "Inglaterra", "Estados Unidos"], correcta: 2 },
    { categoria: 'Historia', dificultad: 'media', pregunta: "¿Quién fue Napoleón Bonaparte?", opciones: ["Rey de Francia", "Emperador francés", "General español", "Papa"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'dificil', pregunta: "¿En qué año se fundó la ONU?", opciones: ["1942", "1945", "1948", "1950"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'facil', pregunta: "¿Quién fue Cleopatra?", opciones: ["Reina de Egipto", "Emperatriz romana", "Diosa griega", "Reina de Persia"], correcta: 0 },
    { categoria: 'Historia', dificultad: 'media', pregunta: "¿En qué siglo vivió Leonardo da Vinci?", opciones: ["Siglo XIV", "Siglo XV", "Siglo XVI", "Siglo XVII"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'dificil', pregunta: "¿Cuánto duró la Guerra de los Cien Años?", opciones: ["100 años", "116 años", "99 años", "150 años"], correcta: 1 },
    { categoria: 'Historia', dificultad: 'media', pregunta: "¿Quién fue Simón Bolívar?", opciones: ["Libertador", "Conquistador", "Explorador", "Científico"], correcta: 0 },
    
    // CIENCIA (15)
    { categoria: 'Ciencia', dificultad: 'facil', pregunta: "¿Cuál es el planeta más grande del sistema solar?", opciones: ["Marte", "Júpiter", "Saturno", "Neptuno"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'facil', pregunta: "¿Cuántos huesos tiene el cuerpo humano adulto?", opciones: ["186", "206", "226", "246"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'facil', pregunta: "¿Qué gas respiramos principalmente?", opciones: ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Hidrógeno"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'media', pregunta: "¿Quién propuso la teoría de la relatividad?", opciones: ["Newton", "Einstein", "Galileo", "Hawking"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'media', pregunta: "¿Cuál es el elemento químico más abundante en el universo?", opciones: ["Oxígeno", "Carbono", "Hidrógeno", "Helio"], correcta: 2 },
    { categoria: 'Ciencia', dificultad: 'media', pregunta: "¿A qué velocidad viaja la luz?", opciones: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correcta: 0 },
    { categoria: 'Ciencia', dificultad: 'dificil', pregunta: "¿Cuál es la partícula subatómica con carga negativa?", opciones: ["Protón", "Neutrón", "Electrón", "Positrón"], correcta: 2 },
    { categoria: 'Ciencia', dificultad: 'dificil', pregunta: "¿Qué científico descubrió la penicilina?", opciones: ["Pasteur", "Fleming", "Koch", "Curie"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'facil', pregunta: "¿Cuántos planetas hay en el sistema solar?", opciones: ["7", "8", "9", "10"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'media', pregunta: "¿Qué órgano bombea la sangre?", opciones: ["Pulmones", "Hígado", "Corazón", "Riñones"], correcta: 2 },
    { categoria: 'Ciencia', dificultad: 'dificil', pregunta: "¿Cuál es el símbolo químico del oro?", opciones: ["Go", "Au", "Or", "Gd"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'facil', pregunta: "¿Qué animal es el más rápido del mundo?", opciones: ["León", "Guepardo", "Águila", "Tiburón"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'media', pregunta: "¿Cuántos cromosomas tiene el ser humano?", opciones: ["23", "46", "48", "52"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'dificil', pregunta: "¿Qué es un agujero negro?", opciones: ["Estrella muerta", "Región del espacio", "Planeta oscuro", "Galaxia"], correcta: 1 },
    { categoria: 'Ciencia', dificultad: 'media', pregunta: "¿Qué científica descubrió el radio?", opciones: ["Marie Curie", "Rosalind Franklin", "Ada Lovelace", "Jane Goodall"], correcta: 0 },
    
    // GEOGRAFÍA (15)
    { categoria: 'Geografía', dificultad: 'facil', pregunta: "¿Cuál es la capital de Francia?", opciones: ["Londres", "París", "Berlín", "Roma"], correcta: 1 },
    { categoria: 'Geografía', dificultad: 'facil', pregunta: "¿Cuál es el río más largo del mundo?", opciones: ["Nilo", "Amazonas", "Yangtsé", "Misisipi"], correcta: 1 },
    { categoria: 'Geografía', dificultad: 'facil', pregunta: "¿En qué continente está Egipto?", opciones: ["Asia", "Europa", "África", "América"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'media', pregunta: "¿Cuál es el país más grande del mundo?", opciones: ["China", "Canadá", "Rusia", "Estados Unidos"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'media', pregunta: "¿Cuál es la montaña más alta del mundo?", opciones: ["K2", "Everest", "Kilimanjaro", "Aconcagua"], correcta: 1 },
    { categoria: 'Geografía', dificultad: 'media', pregunta: "¿Cuántos países hay en América del Sur?", opciones: ["10", "12", "13", "15"], correcta: 1 },
    { categoria: 'Geografía', dificultad: 'dificil', pregunta: "¿Cuál es la capital de Australia?", opciones: ["Sídney", "Melbourne", "Canberra", "Perth"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'dificil', pregunta: "¿Qué océano es el más grande?", opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'facil', pregunta: "¿En qué país está la Torre Eiffel?", opciones: ["Italia", "España", "Francia", "Inglaterra"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'media', pregunta: "¿Cuál es el desierto más grande del mundo?", opciones: ["Sahara", "Gobi", "Antártida", "Arábigo"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'dificil', pregunta: "¿Cuántos países comparten frontera con Brasil?", opciones: ["8", "10", "12", "14"], correcta: 1 },
    { categoria: 'Geografía', dificultad: 'facil', pregunta: "¿Cuál es el país más poblado del mundo?", opciones: ["India", "China", "Estados Unidos", "Indonesia"], correcta: 0 },
    { categoria: 'Geografía', dificultad: 'media', pregunta: "¿En qué continente está Turquía?", opciones: ["Europa", "Asia", "Ambos", "África"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'dificil', pregunta: "¿Cuál es la capital de Canadá?", opciones: ["Toronto", "Vancouver", "Ottawa", "Montreal"], correcta: 2 },
    { categoria: 'Geografía', dificultad: 'media', pregunta: "¿Qué país tiene más islas en el mundo?", opciones: ["Indonesia", "Filipinas", "Suecia", "Japón"], correcta: 2 },
    
    // CULTURA POP (15)
    { categoria: 'Cultura Pop', dificultad: 'facil', pregunta: "¿Quién interpretó a Iron Man en el MCU?", opciones: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'facil', pregunta: "¿Cuántas películas de Harry Potter hay?", opciones: ["7", "8", "9", "10"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'facil', pregunta: "¿Quién canta 'Thriller'?", opciones: ["Prince", "Michael Jackson", "Elvis", "Madonna"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'media', pregunta: "¿En qué año se estrenó la primera película de Star Wars?", opciones: ["1975", "1977", "1979", "1980"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'media', pregunta: "¿Quién dirigió 'Titanic'?", opciones: ["Spielberg", "Cameron", "Nolan", "Tarantino"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'media', pregunta: "¿Cuántos Oscars ganó 'El Señor de los Anillos: El Retorno del Rey'?", opciones: ["9", "11", "13", "15"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'dificil', pregunta: "¿Quién fue el primer ganador de American Idol?", opciones: ["Carrie Underwood", "Kelly Clarkson", "Fantasia", "Ruben Studdard"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'dificil', pregunta: "¿En qué año se lanzó el primer iPhone?", opciones: ["2005", "2007", "2009", "2010"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'facil', pregunta: "¿Quién es el creador de Los Simpsons?", opciones: ["Seth MacFarlane", "Matt Groening", "Trey Parker", "Mike Judge"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'media', pregunta: "¿Cuántas temporadas tiene Game of Thrones?", opciones: ["6", "7", "8", "9"], correcta: 2 },
    { categoria: 'Cultura Pop', dificultad: 'dificil', pregunta: "¿Quién ganó el primer Grammy al Álbum del Año?", opciones: ["Frank Sinatra", "Elvis Presley", "The Beatles", "Bob Dylan"], correcta: 0 },
    { categoria: 'Cultura Pop', dificultad: 'facil', pregunta: "¿Qué superhéroe es conocido como el 'Hombre Murciélago'?", opciones: ["Superman", "Batman", "Spider-Man", "Iron Man"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'media', pregunta: "¿Quién interpretó a Jack en Titanic?", opciones: ["Brad Pitt", "Leonardo DiCaprio", "Tom Cruise", "Johnny Depp"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'dificil', pregunta: "¿En qué año se fundó Netflix?", opciones: ["1995", "1997", "1999", "2001"], correcta: 1 },
    { categoria: 'Cultura Pop', dificultad: 'media', pregunta: "¿Quién es la 'Reina del Pop'?", opciones: ["Beyoncé", "Madonna", "Lady Gaga", "Britney Spears"], correcta: 1 },
    
    // DEPORTES (15)
    { categoria: 'Deportes', dificultad: 'facil', pregunta: "¿Cuántos jugadores hay en un equipo de fútbol?", opciones: ["9", "10", "11", "12"], correcta: 2 },
    { categoria: 'Deportes', dificultad: 'facil', pregunta: "¿En qué deporte se usa una raqueta?", opciones: ["Fútbol", "Tenis", "Natación", "Atletismo"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'facil', pregunta: "¿Cada cuántos años se celebran los Juegos Olímpicos?", opciones: ["2 años", "4 años", "5 años", "6 años"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'media', pregunta: "¿Quién tiene más Balones de Oro?", opciones: ["Cristiano Ronaldo", "Lionel Messi", "Pelé", "Maradona"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'media', pregunta: "¿En qué país se inventó el fútbol moderno?", opciones: ["Brasil", "Argentina", "Inglaterra", "España"], correcta: 2 },
    { categoria: 'Deportes', dificultad: 'media', pregunta: "¿Cuántos Grand Slams hay en tenis?", opciones: ["3", "4", "5", "6"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'dificil', pregunta: "¿Quién tiene más medallas olímpicas en la historia?", opciones: ["Usain Bolt", "Michael Phelps", "Carl Lewis", "Simone Biles"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'dificil', pregunta: "¿En qué año se celebró el primer Mundial de Fútbol?", opciones: ["1928", "1930", "1934", "1938"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'facil', pregunta: "¿Qué país ganó el Mundial 2018?", opciones: ["Brasil", "Alemania", "Francia", "Argentina"], correcta: 2 },
    { categoria: 'Deportes', dificultad: 'media', pregunta: "¿Cuántos puntos vale un touchdown en fútbol americano?", opciones: ["5", "6", "7", "8"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'dificil', pregunta: "¿Quién es el máximo goleador en la historia de los Mundiales?", opciones: ["Pelé", "Ronaldo", "Klose", "Messi"], correcta: 2 },
    { categoria: 'Deportes', dificultad: 'facil', pregunta: "¿En qué deporte destaca Rafael Nadal?", opciones: ["Fútbol", "Tenis", "Golf", "Baloncesto"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'media', pregunta: "¿Cuántos sets se necesitan ganar en Wimbledon (hombres)?", opciones: ["2", "3", "4", "5"], correcta: 1 },
    { categoria: 'Deportes', dificultad: 'dificil', pregunta: "¿Qué país ha ganado más Copas del Mundo?", opciones: ["Argentina", "Alemania", "Brasil", "Italia"], correcta: 2 },
    { categoria: 'Deportes', dificultad: 'media', pregunta: "¿Cuántos jugadores hay en un equipo de baloncesto en cancha?", opciones: ["4", "5", "6", "7"], correcta: 1 },
    
    // TECNOLOGÍA (13)
    { categoria: 'Tecnología', dificultad: 'facil', pregunta: "¿Quién fundó Microsoft?", opciones: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'facil', pregunta: "¿Qué significa WWW?", opciones: ["World Wide Web", "World Web Wide", "Web World Wide", "Wide World Web"], correcta: 0 },
    { categoria: 'Tecnología', dificultad: 'facil', pregunta: "¿Qué empresa creó el iPhone?", opciones: ["Samsung", "Apple", "Google", "Microsoft"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'media', pregunta: "¿En qué año se fundó Google?", opciones: ["1996", "1998", "2000", "2002"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'media', pregunta: "¿Qué es HTML?", opciones: ["Lenguaje de programación", "Lenguaje de marcado", "Sistema operativo", "Base de datos"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'media', pregunta: "¿Quién fundó Facebook?", opciones: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Jeff Bezos"], correcta: 2 },
    { categoria: 'Tecnología', dificultad: 'dificil', pregunta: "¿Qué significa CPU?", opciones: ["Central Process Unit", "Central Processing Unit", "Computer Process Unit", "Central Processor Unit"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'dificil', pregunta: "¿En qué año se lanzó Windows 95?", opciones: ["1994", "1995", "1996", "1997"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'facil', pregunta: "¿Qué red social usa el logo de un pájaro azul?", opciones: ["Facebook", "Instagram", "Twitter", "LinkedIn"], correcta: 2 },
    { categoria: 'Tecnología', dificultad: 'media', pregunta: "¿Qué es Bitcoin?", opciones: ["Moneda digital", "Empresa", "Red social", "Videojuego"], correcta: 0 },
    { categoria: 'Tecnología', dificultad: 'dificil', pregunta: "¿Quién inventó la World Wide Web?", opciones: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Larry Page"], correcta: 2 },
    { categoria: 'Tecnología', dificultad: 'facil', pregunta: "¿Qué empresa fabrica el Galaxy?", opciones: ["Apple", "Samsung", "Huawei", "Xiaomi"], correcta: 1 },
    { categoria: 'Tecnología', dificultad: 'media', pregunta: "¿Qué es un algoritmo?", opciones: ["Programa", "Secuencia de instrucciones", "Lenguaje", "Sistema operativo"], correcta: 1 },
    
    // ARTE Y LITERATURA (12)
    { categoria: 'Arte y Literatura', dificultad: 'facil', pregunta: "¿Quién escribió 'Don Quijote'?", opciones: ["Shakespeare", "Cervantes", "Dante", "Homero"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'facil', pregunta: "¿Quién pintó 'La Mona Lisa'?", opciones: ["Picasso", "Van Gogh", "Da Vinci", "Monet"], correcta: 2 },
    { categoria: 'Arte y Literatura', dificultad: 'facil', pregunta: "¿Quién escribió 'Romeo y Julieta'?", opciones: ["Cervantes", "Shakespeare", "Dante", "Goethe"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'media', pregunta: "¿Quién pintó 'La noche estrellada'?", opciones: ["Picasso", "Van Gogh", "Monet", "Dalí"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'media', pregunta: "¿Quién escribió '1984'?", opciones: ["Orwell", "Huxley", "Bradbury", "Asimov"], correcta: 0 },
    { categoria: 'Arte y Literatura', dificultad: 'media', pregunta: "¿Quién escribió 'Cien años de soledad'?", opciones: ["Borges", "García Márquez", "Cortázar", "Vargas Llosa"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'dificil', pregunta: "¿En qué siglo vivió Shakespeare?", opciones: ["XV", "XVI", "XVII", "XVIII"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'dificil', pregunta: "¿Quién pintó 'Guernica'?", opciones: ["Dalí", "Picasso", "Miró", "Goya"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'facil', pregunta: "¿Quién escribió 'Harry Potter'?", opciones: ["Tolkien", "Rowling", "Lewis", "Martin"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'media', pregunta: "¿Qué movimiento artístico fundó Picasso?", opciones: ["Surrealismo", "Cubismo", "Impresionismo", "Expresionismo"], correcta: 1 },
    { categoria: 'Arte y Literatura', dificultad: 'dificil', pregunta: "¿Quién escribió 'La Divina Comedia'?", opciones: ["Dante", "Petrarca", "Boccaccio", "Ariosto"], correcta: 0 },
    { categoria: 'Arte y Literatura', dificultad: 'media', pregunta: "¿Quién escribió 'El Principito'?", opciones: ["Verne", "Saint-Exupéry", "Dumas", "Hugo"], correcta: 1 }
];

// Funciones auxiliares
function getQuestionsByCategory(category) {
    return TRIVIA_QUESTIONS.filter(q => q.categoria === category);
}

function getQuestionsByDifficulty(difficulty) {
    return TRIVIA_QUESTIONS.filter(q => q.dificultad === difficulty);
}

function getRandomQuestions(count) {
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function getQuestionsByCategoryAndDifficulty(category, difficulty) {
    return TRIVIA_QUESTIONS.filter(q => q.categoria === category && q.dificultad === difficulty);
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TRIVIA_CATEGORIES,
        TRIVIA_DIFFICULTY,
        TRIVIA_QUESTIONS,
        getQuestionsByCategory,
        getQuestionsByDifficulty,
        getRandomQuestions,
        getQuestionsByCategoryAndDifficulty
    };
}
