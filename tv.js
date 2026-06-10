import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Escuchar la colección "players" ordenada por "score" de mayor a menor de forma masiva
/*
const q = query(collection(window.db, "players"), orderBy("score", "desc"));

onSnapshot(q, (snapshot) => {
  const listaContenedor = document.getElementById("tvRankingLista");
  listaContenedor.innerHTML = ""; // Vaciar tabla antigua

  snapshot.forEach((docSnap) => {
    const player = docSnap.data();
    
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${player.img || ''}" class="avatar-tv" style="background:#666;">
      <strong>${player.name}</strong> — <span style="color: #00e676;">${player.score} pts</span>
    `;
    
    listaContenedor.appendChild(li);
  });
});
*/

// ======================
// Función para que la TV cambie de pantalla y juego 
// ======================
const ref = doc(window.db, "game", "state");
async function setScreen(screen, game = null) {
  await updateDoc(ref, {
    screen,
    game
  });
}

// =====================
// PANTALLAS   oculta todas las pantallas menos la que pongas en screen
// =====================
function showScreenTV(screen) {
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenWorldGuessr").style.display = "none";
  document.getElementById("screenRoulette").style.display = "none";
  console.log("screenG:", screen);
  console.log("type:", typeof screen);
  document.getElementById(screen).style.display = "block"
}



// =====================
// Botón para empezar el concurso desde la TV. Pasa a la ruleta (falta), que lleva al Worldguessr. Aquí hay que ver cómo hacer la ruleta si meterla en cada juego o ponerla en screenGame.
// =====================
document.getElementById("startBtn").onclick = () => {
  setScreen("screenRoulette", "WorldGuessr");
  showScreenTV("screenRoulette")
};

// =====================
// Botón para girar la ruleta y elegir juego (valor de game en firestore, previamente elegido). Falta implementar la ruleta visualmente
// =====================
document.getElementById("spinBtn").onclick = async () => {
  //  girarRuleta(); // falta implementar esta función para mostrar la ruleta y animarla
  await sleep(5000); // tiempo de duración de la animación de la ruleta, ((ajustar))
  const snap = await getDoc(ref);
  const data = snap.data();
  const gameSelected = data.game;
  setScreen("screenGame", gameSelected);
  showScreenTV("screen" + gameSelected)
};

// =====================
// Juego WorldGuessr, que aparezca la imagen por cada tecla pulsada.
// =====================
const imagenesPorTecla = {
  "n": "images/WorldGuessr/elNaranjo.jpg",
  "g": "images/WorldGuessr/puntaGalera.jpg",
  "3": "images/WorldGuessr/elPlatano.jpg",
  "4": "images/WorldGuessr/laSandia.jpg",
  "5": "images/WorldGuessr/elMelon.jpg",
  "6": "images/WorldGuessr/laUva.jpg",
  "7": "images/WorldGuessr/laPera.jpg",
  "8": "images/WorldGuessr/laCereza.jpg",
  "9": "images/WorldGuessr/laDurazno.jpg",
  "0": "images/WorldGuessr/laFresa.jpg",
  "q": "images/WorldGuessr/laPiña.jpg",
  "w": "images/WorldGuessr/laMango.jpg",
  "e": "images/WorldGuessr/laPapaya.jpg",
  "r": "images/WorldGuessr/laSandia.jpg"
};
/*
let currentGame = null;
let currentScreen = null;

onSnapshot(ref, (snap) => {
    const data = snap.data();
    currentScreen = data.screen;
    currentGame = data.game;
    showScreenTV(data.screen);
});
*/
document.addEventListener("keydown", (e) => { // enseña las imágenes pulsando teclas

  if (currentGame !== "WorldGuessr") return;
  const key = e.key.toLowerCase();

  const img = imagenesPorTecla[key];

  if (!img) return; // si no existe esa tecla, ignorar

  showImage(img);

});
function showImage(src) { // función para mostrar la imagen en pantalla, con un overlay
  document.getElementById("imgShow").src = src;
  document.getElementById("overlayImg").style.display = "flex";
}
document.addEventListener("keydown", (e) => { // cerrar la imagen al pulsar Escape
  if (e.key === "Escape") {
    document.getElementById("overlayImg").style.display = "none";
  }
});

// =====================
// Suma de puntos 1º WorldGuessr
// =====================
let finalizeMode = false;

document.getElementById("endGameBtn").onclick = () => {
  // mostrar panel
  finalizeMode = true;
  document.getElementById("finalizePanel").style.display = "block";
  // render jugadores
  renderPlayers();
};

const players = ["Ana", "Luis", "Carlos", "Marta"];

let selectedRanking = [];

function renderPlayers() {

  const container = document.getElementById("playersContainer");
  container.innerHTML = "";

  players.forEach(p => {

    const position = selectedRanking.indexOf(p);

    container.innerHTML += `
            <div class="player ${position !== -1 ? "selected" : ""}" 
                 data-player="${p}">
                 
                <div class="avatar">👤</div>
                <div>${p}</div>
                <div class="pos">
                    ${position !== -1 ? position + 1 : ""}
                </div>

            </div>
        `;
  });

  addClickEvents();
}


function addClickEvents() {

  document.querySelectorAll(".player").forEach(el => {

    el.onclick = () => {
      if (!finalizeMode) return;
      const name = el.dataset.player;

      const index = selectedRanking.indexOf(name);

      if (index === -1) {
        // añadir al ranking
        selectedRanking.push(name);
      } else {
        // quitar del ranking
        selectedRanking.splice(index, 1);
      }

      renderPlayers();
    };
  });
}

document.getElementById("confirmRanking").onclick = async () => {

  const pointsTable = [5000, 3000, 2000, 1000, 500];

  const scores = {};

  selectedRanking.forEach((player, index) => {
    scores[player] = pointsTable[index] || 0;
  });

  await setDoc(doc(window.db, "game", "results"), {
    ranking: selectedRanking,
    scores
  });

  await updateDoc(doc(window.db, "game", "state"), {
    screen: "screenRanking"
  });
};


// =====================
// Reseteo llamado autodestrucción. Puede ser que vaya aumentado las colecciones en Firebase y no se suficiente
// =====================
// Función para resetear el estado del juego a los valores iniciales
async function resetGame() {
  const ok = confirm("⚠️ Esto borrará puntuaciones y reiniciará el juego. ¿Continuar?");
  if (!ok) return;

  // 1. Reset estado global
  setScreen("screenSelect", null);
  showScreenTV("screenSelect");

  // 2. Reset TODOS los jugadores
  const snap = await getDocs(collection(window.db, "players"));
  const promises = [];
  snap.forEach(async (playerDoc) => {
    promises.push(
      await updateDoc(doc(window.db, "players", playerDoc.id), {
        score: 0,
        active: false
      }));
  });
  await Promise.all(promises); // Esperar a que se completen todos los updates
}
// Funcionalidad al botón autodestrucción para resetear el juego
document.getElementById("selfDestruct").onclick = () => {
  resetGame();
};




// =====================
// Función para esperar milisegundos
// =====================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}