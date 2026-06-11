import { 
  collection, 
  getDocs, 
  addDoc, 
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  where,
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
const screenMapMobile = {
  screenRoulette: "screenRanking",
  screenGame: "screenWaiting"
  };

function showScreen(screen) {
  // traducir solo en móvil
  if (screenMapMobile[screen]) {
    screen = screenMapMobile[screen];
  }
  ///////////////console.log("Cambiando a pantalla:", screen);
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenGame").style.display = "none";
  document.getElementById("screenRanking").style.display = "none";
  document.getElementById("screenWaiting").style.display = "none";
  document.getElementById("screenWorldGuessr").style.display = "none";
 // //document.getElementById("screenRoulette").style.display = "none";
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





// =========================================================================
// RANKING EN TIEMPO REAL: JUGADORES ACTIVOS FILTRADOS EN JAVASCRIPT
// =========================================================================
function listenToRankingAndScore() {
  // CORRECCIÓN 1: Apuntamos al <tbody> (listaRankingActivos) para meter ahí las filas
  const tablaContenedor = document.getElementById("listaRankingActivos");
  
  // Si la tabla no existe en el HTML todavía, esperamos un poco y reintentamos
  if (!tablaContenedor) {
    setTimeout(listenToRankingAndScore, 50);
    return;
  } 

  // Si Firebase aún no ha cargado en window.db, esperamos un poco y reintentamos
  if (!window.db) {
    setTimeout(listenToRankingAndScore, 50);
    return;
  }

  console.log("¡Conectando con Firebase para el ranking activo!");

  const q = query(
    collection(window.db, "players"), 
    where("active", "==", true), 
    orderBy("score", "desc")
  );

  onSnapshot(q, (snapshot) => {
    // CORRECCIÓN 2: Ahora esto solo limpia las filas de los jugadores, 
    // respetando el título y las cabeceras del HTML.
    tablaContenedor.innerHTML = ""; 

    let posicion = 1;

    snapshot.forEach((docSnap) => {
      const jugador = docSnap.data();
      const fila = document.createElement("tr");
      
      fila.innerHTML = `
        <td>#${posicion}</td>
        <td>${jugador.name || "Sin nombre"}</td>
        <td>${jugador.score ?? 0} pts</td>
      `;

      tablaContenedor.appendChild(fila);
      posicion++;
    });
  });
}

// LLAMADA DIRECTA AL FINAL DEL ARCHIVO:
listenToRankingAndScore();





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
  WorldGuessr: worldGuessr, //1º Juego WorldGuessr personalizado. Falta poner el mapa o enlace a WorldGuessr
  GuessSong: guessSong, //2º Juego Adivinar quién escucha la canción
  GlassTower: glassTower, //3º Juego Torre de Cristal 
  IrrationalPrice: irrationalPrice, //4º Juego El precio Irracional, el de las unidades de lentejas
  NumbersAndLetters: numbersAndLetters, //5º Juego Cifras y letras juego de operaciones
  TruthOrLie: truthOrLie, //6º Juego: Verdad o invent, presentadores cuentan 3 historias, 1 de verdad.
  TheLiar: theLiar, //7º Juego: El mentiroso con material audiovisual
  LastTheorem: lastTheorem //8º Juego: El último teorema. Ya solo juegan 5 jugadores.
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
function worldGuessr() {
  // Lógica para el juego worldGuessr
  console.log("He llegado al WorldGuessr");
  showScreen("screenWorldGuessr");
}

function guessSong() {
  window.enviarSospechoso = async (nombreSospechoso) => {
  const miPlayerId = localStorage.getItem("myPlayerDocId"); // ej: "p1"
  
  // Firebase crea el objeto 'attempts' y la propiedad 'guessWho' automáticamente si no existen
  await updateDoc(doc(window.db, "players", miPlayerId), {
    "attemptsSong.guessWho": nombreSospechoso
  });
};

document.getElementById("sendSongBtn").onclick = async () => {
  const miPlayerId = localStorage.getItem("myPlayerDocId");
  const textoCancion = document.getElementById("mobileSongInput").value.trim();
  if(!textoCancion) return;

  // Firebase mete 'guessSong' dentro de 'attempts' sin tocar 'guessWho'
  await updateDoc(doc(window.db, "players", miPlayerId), {
    "attemptsSong.guessSong": textoCancion
  });
};
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