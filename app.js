import { 
  collection, 
  getDocs, 
  addDoc, 
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// ======================
// Poner el nombre del concursante en el header de la TV
// ======================
document.addEventListener("DOMContentLoaded", () => {

  const nombre = localStorage.getItem("playerName");

  if (nombre) {
    document.getElementById("userNameHeader").innerText = nombre;
  }

});

// =====================
// PANTALLAS   oculta todas las pantallas menos la que pongas en screen
// =====================
function showScreen(screen) {
  ///////////////console.log("Cambiando a pantalla:", screen);
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenGame").style.display = "none";
  document.getElementById("screenRanking").style.display = "none";
  document.getElementById("screenWaiting").style.display = "none";
  document.getElementById("screenWorldGuessr").style.display = "none";
  console.log("Estoy aquí", screen);
  document.getElementById(screen).style.display = "block";
}

// =====================
// CARGAR JUGADORES
// =====================
async function loadPlayers() {
  const snapshot = await getDocs(collection(window.db, "players"));
  const container = document.getElementById("screenSelect");
  ///////////////console.log("Cargando jugadores, snapshot obtenido:", snapshot);
  snapshot.forEach((docSnap) => {
    ///////////////console.log("Procesando jugador:", docSnap.id, docSnap.data());
    const player = docSnap.data();

    const card = document.createElement("div");
    card.style.border = "1px solid black";
    card.style.display = "inline-block";
    card.style.margin = "10px";
    card.style.padding = "10px";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <img src="${player.img || ''}" 
        style="width:100px;height:100px;object-fit:cover;background:#ddd;">
      <br><b>${player.name}</b>
    `;
    card.onclick = () => selectPlayer(docSnap.id, player.name);

    container.appendChild(card);
  });
}

// Espera a que cargue el DOM para cargar los jugadores.
window.addEventListener("DOMContentLoaded", () => {
  loadPlayers();
});
// =====================
// SELECCIONAR JUGADOR
// =====================
async function selectPlayer(id, name) {
  // Actualizar Firebase para poner active en true
  try {
    const playerRef = doc(window.db, "players", id);
    await updateDoc(playerRef, { active: true });
  } catch (e) {
    console.warn('No se pudo marcar jugador activo en Firestore:', e);
  }

  // Guardar en localStorage y preparar la pantalla móvil
  localStorage.setItem("playerId", id);
  localStorage.setItem("playerName", name);
  const playerNameEl = document.getElementById("playerName");
  if (playerNameEl) playerNameEl.innerText = name;

  //Esperar a que el presentador pulse el botón de empezar juego en la TV para pasar a la pantalla de espera, así se asegura que todos los jugadores han seleccionado su personaje antes de empezar el juego
  const waitingScreen = document.getElementById("screenWaiting");
  if (waitingScreen) waitingScreen.style.display = "block";

  const selectScreen = document.getElementById("screenSelect");
  if (selectScreen) selectScreen.style.display = "none";
  listenToRankingAndScore();
}

// =====================
// SCORE Y CLASIFICACIÓN EN TIEMPO REAL falta poner que solo aparezcan los que tienen active true  (falta revisar)
// =====================
function listenToRankingAndScore() {
  let playerId = localStorage.getItem("playerId");
  
  const q = query(collection(window.db, "players"), orderBy("score", "desc"));

  onSnapshot(q, (snapshot) => {
    let listaJugadores = [];
    snapshot.forEach((docSnap) => {
      listaJugadores.push({ id: docSnap.id, ...docSnap.data() });
    });

    // NUEVO ELEMENTO: Buscamos el contenedor de la tabla en el HTML
    const tablaContenedor = document.getElementById("listaRankingCompleta");
    
    // Si la tabla existe en tu HTML actual, la limpiamos y la rellenamos
    if (tablaContenedor) {
      tablaContenedor.innerHTML = ""; // Borramos el contenido viejo para actualizarlo

      listaJugadores.forEach((jugador, index) => {
        const fila = document.createElement("tr");
        
        fila.innerHTML = `
          <td>#${index + 1}</td>
          <td>${jugador.name}</td>
          <td>${jugador.score} pts</td>
        `;

        // Pequeño detalle: si la fila corresponde a mi usuario, la destacamos un poco
        if (jugador.id === playerId) {
          fila.style.backgroundColor = "#e0f7fa";
          fila.style.fontWeight = "bold";
        }

        tablaContenedor.appendChild(fila);
      });
    }

    // Encontrar qué índice ocupa el jugador actual en el array ordenado
    const miIndex = listaJugadores.findIndex(j => j.id === playerId);

    if (miIndex !== -1) {
      const misDatos = listaJugadores[miIndex];

      // 1. Mostrar puntos actuales
      document.getElementById("score").innerText = misDatos.score;
      
      // 2. Mostrar indicador numérico de posición
      document.getElementById("rankingPosition").innerText = `#${miIndex + 1}`;

      // 3. Calcular cantidad de puntos respecto al siguiente
      const infoSiguiente = document.getElementById("nextPlayerInfo");
      if (miIndex > 0) {
        const rivalArriba = listaJugadores[miIndex - 1];
        const diferencia = rivalArriba.score - misDatos.score;
        infoSiguiente.innerText = `Te faltan ${diferencia} pts para adelantar a ${rivalArriba.name} 🚀`;
      } else {
        infoSiguiente.innerText = "¡Vas en 1ª posición! Conserva el liderato 👑";
      }
    }
  });
}

// =====================
// Para que los móviles escuchen el cambio de pantalla que se hace desde la TV
// =====================
let ref;
try {
  ref = doc(window.db, "game", "state");
} catch (e) {
  console.warn('No se pudo crear la referencia de estado:', e);
}

if (ref) {
  onSnapshot(ref, (doc) => {
    const state = doc.data();
    handleState(state);
  });
}

// Diccionario de los juegos, al leer el estado desde Firebase se ejecuta la función que corresponda al juego que toque
const games = {
  worldguessr: worldguessr, //1º Juego WorldGuessr personalizado. Falta poner el mapa o enlace a WorldGuessr
  guessSong: guessSong, //2º Juego Adivinar quién escucha la canción
  glassTower: glassTower, //3º Juego Torre de Cristal 
  irrationalPrice: irrationalPrice, //4º Juego El precio Irracional, el de las unidades de lentejas
  numbersAndLetters: numbersAndLetters, //5º Juego Cifras y letras juego de operaciones
  truthOrLie: truthOrLie, //6º Juego: Verdad o invent, presentadores cuentan 3 historias, 1 de verdad.
  theLiar: theLiar, //7º Juego: El mentiroso con material audiovisual
  lastTheorem: lastTheorem //8º Juego: El último teorema. Ya solo juegan 5 jugadores.
};

// Función usada antes para manejar el cambio de pantalla, ahora se hace directamente con el onSnapshot pero la dejo por si quieres hacer algo más complejo al cambiar de pantalla
// Sin else if porque no estamos comparando pantallas, sino que estamos buscando.
function handleState(state) {
  console.log("Estoy en handleState:", state.screen);
  showScreen(state.screen);
  if (state.screen !== "screenGame") return;

  const game = games[state.game];

  if (game) game();
};

// =====================
// Juegos
// =====================
function worldguessr() {
  // Lógica para el juego worldGuessr
  console.log("He llegado al WorldGuessr");
  showScreen("screenWorldGuessr");
}

function guessSong() {
  // Lógica para el juego Adivinar quién escucha la canción
}

function glassTower() {
  // Lógica para el juego Torre de Cristal
}

function irrationalPrice() {
  // Lógica para el juego El precio Irracional
}

function numbersAndLetters() {
  // Lógica para el juego Cifras y letras
}

function truthOrLie() {
  // Lógica para el juego Verdad o invent
}

function theLiar() {
  // Lógica para el juego El mentiroso
}

function lastTheorem() {
  // Lógica para el juego El último teorema
}

window.selectPlayer = selectPlayer;