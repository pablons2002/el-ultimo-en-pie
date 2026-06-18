import {
  collection, query, orderBy, onSnapshot, getDocs, updateDoc, increment, where, getDoc, setDoc, deleteField, doc
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
// ==================================
// El orden en el que se jugarán los juegos del concurso
// ==================================
const games = ["WorldGuessr", "GuessSong", "GlassTower", "IrrationalPrice", "SymbolZone", "NumbersAndLetters", "TruthOrLie", "TheLiar", "LastTheorem"];

// ======================
// Función para que la TV cambie de pantalla y juego 
// ======================
const ref = doc(window.db, "game", "state");
async function setScreen(screen, game) {
  if (game === undefined) {
    await updateDoc(ref, { screen });
    console.log(`📺 Firebase: Pantalla cambiada a "${screen}". El juego NO se ha tocado.`);
  }
  else if (game === null) {
    await updateDoc(ref, {
      screen: screen,
      game: null
    });
    console.log(`📺 Firebase: Pantalla cambiada a "${screen}" y juego BORRADO (null).`);
  }
  else {
    await updateDoc(ref, {
      screen: screen,
      game: game
    });
    console.log(`📺 Firebase: Pantalla cambiada a "${screen}" y juego cambiado a "${game}".`);
  }
}

// =====================
// PANTALLAS   oculta todas las pantallas menos la que pongas en screen
// =====================
function showScreenTV(screen) {
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenWorldGuessr").style.display = "none";
  document.getElementById("screenRoulette").style.display = "none";
  document.getElementById("screenRanking").style.display = "none";
  document.getElementById("screenGuessSong").style.display = "none";
  document.getElementById("screenGlassTower").style.display = "none";
  document.getElementById("screenIrrationalPrice").style.display = "none";
  document.getElementById("screenSymbolZone").style.display = "none";
  document.getElementById("screenNumbersAndLetters").style.display = "none";
  document.getElementById(screen).style.display = "block"

  if (screen === "screenNumbersAndLetters") {
    cifrasLetras();
  }
}



// =====================
// Botón para empezar el concurso desde la TV. Pasa a la ruleta (falta), que lleva al Worldguessr. Aquí hay que ver cómo hacer la ruleta si meterla en cada juego o ponerla en screenGame.
// =====================
document.getElementById("startBtn").onclick = () => {
  setScreen("screenRoulette", "WorldGuessr");
  showScreenTV("screenRoulette")
};
// =======================
//  Botón para ir al ranking
// =======================
window.goToRanking = function () {
  setScreen("screenRanking");
  showScreenTV("screenRanking");
}

// =====================
// Botón para girar la ruleta y elegir juego (valor de game en firestore, previamente elegido). Falta implementar la ruleta visualmente
// =====================
let currentGame = null;
let currentScreen = null;

document.getElementById("spinBtn").onclick = async () => {
  //  girarRuleta(); // falta implementar esta función para mostrar la ruleta y animarla
  await sleep(0); // tiempo de duración de la animación de la ruleta, ((ajustar))
  const snap = await getDoc(ref);
  const data = snap.data();
  const gameSelected = data.game;
  setScreen("screen" + gameSelected, gameSelected);
  showScreenTV("screen" + gameSelected)
  onSnapshot(ref, (snap) => {
    const data = snap.data();
    currentScreen = data.screen;
    currentGame = data.game;
    console.log(currentGame)
  });
};

// =====================
// Juego WorldGuessr, que aparezca la imagen por cada tecla pulsada.
// =====================
const imagenesPorTecla = {
  "n": "images/cartasPersonajes/Alba.png",// faltan teclas
};






document.addEventListener("keydown", (e) => { // enseña las imágenes pulsando teclas
  console.log("estoy aquí")
  console.log(currentGame)
  if (currentGame !== "WorldGuessr") return;
  const key = e.key.toLowerCase();

  const img = imagenesPorTecla[key];
  console.log(img)

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
let players = [];
let selectedRanking = [];

// =====================
// Botón de terminar el juego para pasar a sumar los puntos
// =====================

document.getElementById("endGameBtn").onclick = async () => {
  // mostrar panel
  try {
    const q = query(collection(window.db, "players"), where("active", "==", true));
    const querySnapshot = await getDocs(q);

    // Limpiamos el array y metemos los nombres reales de la base de datos
    players = [];
    querySnapshot.forEach((docSnap) => {
      const playerData = docSnap.data();
      // Usamos el campo "name" del documento (o el id del documento si no tuvieras campo name)
      if (playerData.name) {
        players.push({
          name: playerData.name,
          img: playerData.img
        })
      }
    });

    console.log("👥 Jugadores activos recuperados de Firebase:", players);

    if (players.length === 0) {
      alert("⚠️ No hay ningún jugador activo (active: true) en Firebase ahora mismo.");
    }

  } catch (error) {
    console.error("❌ Error al recuperar jugadores activos:", error);
  }
  finalizeMode = true;
  document.getElementById("finalizePanel").style.display = "block";
  // render jugadores
  renderPlayers();
};

// ====================
// Renderizar players con foto
// ====================
function renderPlayers() {

  const container = document.getElementById("playersContainer");
  container.innerHTML = "";

  players.forEach(p => {

    const position = selectedRanking.indexOf(p.name);

    container.innerHTML += `
            <div class="player ${position !== -1 ? "selected" : ""}" data-player="${p.name}">
                <div class="avatar"><img src="${p.img}" alt="${p.name}" style="width: 10%; height: 10%; object-fit: cover; border-radius: 50%;"></div>
                <div>${p.name}</div>
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

// ========================
// Botón de confirmar ranking y sumar puntuaciones
// ========================
document.getElementById("confirmRanking").onclick = async () => {

  const pointsTable = [10, 8, 6, 5, 4, 3, 2, 1];
  const scores = {};

  selectedRanking.forEach((player, index) => {
    scores[player] = pointsTable[index] || 0;
  });
  try {
    const querySnapshot = await getDocs(collection(window.db, "players"));

    // Recorremos los documentos que hay en Firebase (p1, p2, p3...)
    querySnapshot.forEach(async (playerDoc) => {
      const playerData = playerDoc.data();
      const docId = playerDoc.id; // Aquí saca el "p1", "p2", etc.

      // Si el nombre de este documento está en nuestro ranking de la ronda...
      if (scores[playerData.name] !== undefined) {
        const puntosNuevos = scores[playerData.name];
        const puntosActuales = playerData.score || 0; // Si no tiene score, empieza en 0
        const puntuacionTotal = puntosActuales + puntosNuevos;

        // Actualizamos SU documento exacto (por ejemplo "players/p1") con el nuevo total
        await updateDoc(doc(window.db, "players", docId), {
          score: puntuacionTotal
        });

        console.log(`✨ ¡Puntos sumados a ${playerData.name} en ${docId}! (${puntosActuales} + ${puntosNuevos} = ${puntuacionTotal})`);
      }
    });
  } catch (error) {
    console.error("❌ Error al actualizar los scores en la colección players:", error);
  }

  // Cambiamos el estado de la pantalla para la TV
  setScreen("screenRanking",)
  showScreenTV("screenRanking")
};

// =========================================================================
// RANKING EN TIEMPO REAL: JUGADORES ACTIVOS FILTRADOS EN JAVASCRIPT
// =========================================================================
function listenToRankingAndScore() {
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

// =========================
// Botón desde Ranking para pasar a la ruleta del siguiente juego
// =========================
document.getElementById("nextGameBtn").onclick = async () => {
  // 1. Buscamos en qué posición de la lista está el juego actual
  console.log(currentGame);
  let currentIndex = games.indexOf(currentGame);
  let nextGame = null;

  // 2. Calculamos cuál es el siguiente
  if (currentIndex !== -1 && currentIndex < games.length - 1) {
    // Si encuentra el juego y no es el último, pasa al siguiente de la lista
    nextGame = games[currentIndex + 1];
  } else {
    // Si no encuentra el juego actual o ya era el último, vuelve al primero
    nextGame = games[0];
  }

  console.log(`⏩ Avanzando de ${currentGame} al siguiente juego: ${nextGame}`);

  // 3. Mandamos a la TV a la pantalla de la Ruleta y configuramos el nuevo juego en Firebase
  await setScreen("screenRoulette", nextGame);
  showScreenTV("screenRoulette")
};


// ========================
// 2º Juego GuessSong
// ========================
const songs = [
  { title: "Bloody valentine - Machine Gun Kelly", audioURL: "assets\audio\Bloody valentine - Machine Gun Kelly.mp3" },
  { title: "Disobedient - Steven Universe, Kate Mucucci, Michaela Dietz", audioURL: "assets\audio\Disobedient - Steven Universe, Kate Mucucci, Michaela Dietz.mp3" },
  { title: "Fade Into You - Mazzy Star", audioURL: "assets\audio\Fade Into You - Mazzy Star.mp3" },
  { title: "Give it up to me - Sean Paul, Keyshia", audioURL: "assets\audio\Give it up to me - Sean Paul, Keyshia.mp3" },
  { title: "In too deep - Sum41", audioURL: "assets\audio\In too deep - Sum41.mp3" },
  { title: "Jardines de Marzo  - La bien querida", audioURL: "assets\audio\Jardines de Marzo  - La bien querida.mp3" },
  { title: "Lovefool - The Cardigans", audioURL: "assets\audio\Lovefool - The Cardigans.mp3" },
  { title: "Migraine - Twenty One Pilots", audioURL: "assets\audio\Migraine - Twenty One Pilots.mp3" },
  { title: "She doesn't mind - Sean Paul", audioURL: "assets\audio\She doesn't mind - Sean Paul.mp3" },
  { title: "Sui muri - Psicologi", audioURL: "assets\audio\Sui muri - Psicologi.mp3" },
  { title: "Superestrella - Aitana", audioURL: "assets\audio\Superestrella - Aitana.mp3" },
  { title: "Today - The Smashing Pumpkins", audioURL: "assets\audio\Today - The Smashing Pumpkins.mp3" },
  { title: "Where The Hell Is My Husband - RAYE", audioURL: "assets\audio\Where The Hell Is My Husband - RAYE.mp3" },
  { title: "Wishing well - Juice WRLD", audioURL: "assets\audio\Wishing well - Juice WRLD.mp3" },
];


async function renderTvGuessSong() {
  try {

    const songSnap = await getDoc(doc(window.db, "game", "currentSong")); //añadido documento currentSong en firebase
    if (!songSnap.exists()) return;
    const songData = songSnap.data();

    const audioPlayer = document.getElementById("tvAudioPlayer"); //mira firebase el url del audio y cambia el audio si es diferente
    if (audioPlayer.src !== songData.audioURL) {
      audioPlayer.src = songData.audioURL;
      audioPlayer.load();
    }
    //si se ha dado al botón de revelar resultado (revealed true) sale el nombre del título guardado en firebase, si no sale la pregunta.
    const titleElement = document.getElementById("tvSongTitle");
    titleElement.innerText = songData.revealed ? songData.title : "🎵 ¿De quién es esta canción? 🎵";

    const container = document.getElementById("guessSongPlayersContainer");
    container.innerHTML = "";

    const playersSnap = await getDocs(query(collection(window.db, "players"), where("active", "==", true)));

    playersSnap.forEach((playerDoc) => {
      const p = playerDoc.data();
      const docId = playerDoc.id;

      // Pillamos el mapa 'attemptsSong'. Si no existe aún, se queda como objeto vacío {}
      const att = p.attemptsSong || {};

      const respuestaWho = songData.revealed ? (att.guessWho || "❌") : "❓ Sentenciado";
      const respuestaSong = songData.revealed ? (att.guessSong || "❌ No sabe") : "✍️ Escribiendo...";

      container.innerHTML += `
        <div class="player-card" data-id="${docId}" data-name="${p.name}" data-score="${p.score || 0}">
          <img src="${p.img}" class="avatar-img" style="width:50px; height:50px; border-radius:50%;">
          <h3>${p.name}</h3>
          <div class="answers-box">
            <p><strong>Sospecha de:</strong> ${respuestaWho}</p>
            <p><strong>Canción:</strong> "${respuestaSong}"</p>
          </div>
          
          <div class="presenter-controls" style="display: ${songData.revealed ? 'block' : 'none'}">
            <button onclick="sumarPuntosGuessSong('${docId}', 3)">🎯 Ambos (+3)</button>
            <button onclick="sumarPuntosGuessSong('${docId}', 2)">👤 Solo Quién (+2)</button>
            <button onclick="sumarPuntosGuessSong('${docId}', 1)">🎵 Solo Canción (+1)</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }

}


// ==============================
// Juego 3º GlassTower
// ==============================
// Variable local para saber a quién hemos hecho click en la pantalla
let jugadorSeleccionadoId = null;
let jugadorSeleccionadoNombre = "";
let currentGlassTowerRound = "Ronda 1";
let ultimoRankingCalculado = [];

export function iniciarTvVasosLibre() {
  // 1. Escuchar la Ronda actual en tiempo real
  onSnapshot(doc(window.db, "game", "towerState"), (snap) => {
    if (snap.exists()) {
      currentGlassTowerRound = snap.data().ronda || "Ronda 1";
      document.getElementById("tvRondaActual").innerText = currentGlassTowerRound;
    }
  });

  // 2. Escuchar jugadores activos para pintar sus botones y el ranking
  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), () => {
    renderizarControlesYRanking();
  });
}

iniciarTvVasosLibre();

async function renderizarControlesYRanking() {
  const playersSnap = await getDocs(query(collection(window.db, "players"), where("active", "==", true)));

  const contenedorBotones = document.getElementById("tvBotonesJugadores");
  const leaderboardDiv = document.getElementById("tvLeaderboardVasos");

  if (!contenedorBotones || !leaderboardDiv) return;

  let htmlBotones = "";
  let listaClasificacion = [];

  playersSnap.forEach((playerDoc) => {
    const p = playerDoc.data();
    const id = playerDoc.id;
    const r1 = p.vasosTimes?.round1;
    const r2 = p.vasosTimes?.round2;
    const timesText = [];

    // 1. Mostrar --- en los botones si no hay tiempo
    timesText.push(`R1: ${(typeof r1 === 'number' && r1 > 0) ? r1.toFixed(2) + 's' : '---'}`);
    timesText.push(`R2: ${(typeof r2 === 'number' && r2 > 0) ? r2.toFixed(2) + 's' : '---'}`);

    const recordedTimes = [r1, r2].filter((value) => typeof value === 'number' && value > 0);
    const bestTime = recordedTimes.length > 0 ? Math.min(...recordedTimes) : null;
    const bestText = bestTime !== null ? `Mejor: ${bestTime.toFixed(2)}s` : '';

    // Marcamos con un estilo diferente si es el jugador que tenemos seleccionado actualmente
    const claseActiva = (id === jugadorSeleccionadoId) ? "background: #007bff; border-color: #fff;" : "background: #444; border-color: #555;";

    // A) Generar botón gigante para cada jugador activo
    htmlBotones += `
      <button onclick="seleccionarJugador('${id}', '${p.name}')" style="${claseActiva} color: white; padding: 15px; font-size: 1.2rem; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: bold; border: 2px solid; text-align:left; line-height: 1.4;">
        <strong>👤 ${p.name}</strong>
        <span style="display:block; font-size:0.9rem; font-weight:normal; opacity:0.85; margin-top:8px;">
          ${timesText.join(' | ')}${bestText ? ' · ' + bestText : ''}
        </span>
      </button>
    `;

    // B) Recopilar para la clasificación si ya tienen marca
    if (bestTime !== null) {
      listaClasificacion.push({ id: id, name: p.name, time: bestTime, r1, r2 });
    }
  });

  contenedorBotones.innerHTML = htmlBotones;

  listaClasificacion.sort((a, b) => a.time - b.time);
  ultimoRankingCalculado = [...listaClasificacion];

  if (listaClasificacion.length === 0) {
    leaderboardDiv.innerHTML = `<p style="text-align:center; color:#666;">Esperando marcas...</p>`;
  } else {
    let htmlRank = "<ol style='padding-left:25px; margin:0;'>";

    // 2. CORREGIDO: Formato de la lista de clasificación derecha con guiones
    listaClasificacion.forEach((jugador) => {
      const times = [];
      times.push(`R1: ${(typeof jugador.r1 === 'number' && jugador.r1 > 0) ? jugador.r1.toFixed(2) + 's' : '---'}`);
      times.push(`R2: ${(typeof jugador.r2 === 'number' && jugador.r2 > 0) ? jugador.r2.toFixed(2) + 's' : '---'}`);

      htmlRank += `<li style='margin-bottom: 8px;'><strong>${jugador.time.toFixed(2)}s</strong> — ${jugador.name} <span style='color:#aaa; font-size:0.9rem;'>(${times.join(' | ')})</span></li>`;
    });

    htmlRank += "</ol>";
    leaderboardDiv.innerHTML = htmlRank;
  }
}
// 3. SELECCIONAR AL JUGADOR QUE VA A POLTRONA EN ESE INSTANTE
window.seleccionarJugador = function (id, name) {
  jugadorSeleccionadoId = id;
  jugadorSeleccionadoNombre = name;

  // Si había un cronómetro en marcha, lo paramos y lo reiniciamos
  if (cronoRunning) {
    clearInterval(cronoInterval);
    cronoRunning = false;
  }

  // Mostramos la caja del cronómetro personalizada
  document.getElementById("nombreSeleccionado").innerText = name;
  document.getElementById("cronometroDisplay").innerText = "0.00s";
  document.getElementById('btnStartCrono').disabled = false;
  document.getElementById('btnStopCrono').disabled = true;
  document.getElementById("zonaCronometro").style.display = "block";

  // Refrescamos los botones para que se vea cuál está iluminado en azul
  renderizarControlesYRanking();
};

// 4. GUARDAR EL TIEMPO DEL JUGADOR SELECCIONADO
let cronoInterval = null;
let cronoStart = null;
let cronoRunning = false;

window.guardarTiempoDirecto = async function () {
  // Esta función ya no se usa en el UI, pero dejamos la compatibilidad por si hay llamadas externas.
  return;
};

window.iniciarCronometro = function () {
  if (!jugadorSeleccionadoId) {
    alert('Selecciona primero un jugador.');
    return;
  }

  if (cronoRunning) return;

  cronoStart = Date.now();
  cronoRunning = true;
  document.getElementById('btnStartCrono').disabled = true;
  document.getElementById('btnStopCrono').disabled = false;

  cronoInterval = setInterval(() => {
    const elapsed = (Date.now() - cronoStart) / 1000;
    document.getElementById('cronometroDisplay').innerText = `${elapsed.toFixed(2)}s`;
  }, 50);
};

window.detenerYCargarTiempo = async function () {
  if (!cronoRunning || !jugadorSeleccionadoId) return;

  clearInterval(cronoInterval);
  cronoRunning = false;

  const elapsed = (Date.now() - cronoStart) / 1000;
  const tiempoNum = parseFloat(elapsed.toFixed(2));

  document.getElementById('cronometroDisplay').innerText = `${tiempoNum.toFixed(2)}s`;
  document.getElementById('btnStartCrono').disabled = false;
  document.getElementById('btnStopCrono').disabled = true;

  const roundKey = currentGlassTowerRound === 'Ronda 1' ? 'round1' : 'round2';
  const updateData = {
    [`vasosTimes.${roundKey}`]: tiempoNum
  };

  await updateDoc(doc(window.db, 'players', jugadorSeleccionadoId), updateData);

  document.getElementById('zonaCronometro').style.display = 'none';
  jugadorSeleccionadoId = null;
  jugadorSeleccionadoNombre = '';

  renderizarControlesYRanking();
};

// 5. CONTROL DE RONDAS DIRECTO DESDE LOS BOTONES
window.cambiarRondaDirecto = async function (nombreRonda) {
  await updateDoc(doc(window.db, 'game', 'towerState'), {
    ronda: nombreRonda
  });
  currentGlassTowerRound = nombreRonda;
  document.getElementById('tvRondaActual').innerText = nombreRonda;
};

// ==============================================================
// 🏁 RECUENTO FINAL Y REPARTO DE PUNTOS
// ==============================================================
window.finalizarJuegoVasos = async function () {
  if (ultimoRankingCalculado.length === 0) {
    alert("No hay marcas registradas para puntuar.");
    return;
  }


  // Escala de puntos [1º, 2º, 3º, 4º...]
  const tablaPuntos = [10, 8, 6, 5, 4, 3, 2, 1];

  try {
    // Recorremos el ranking guardado en tiempo real
    for (let i = 0; i < ultimoRankingCalculado.length; i++) {
      const jugador = ultimoRankingCalculado[i];
      const puntosAAgregar = tablaPuntos[i] || 0; // Si hay más de 8 jugadores, se llevan 0

      if (puntosAAgregar > 0) {
        const jugadorRef = doc(window.db, "players", jugador.id);

        // Sumamos los puntos al score que ya tengan en Firebase
        await updateDoc(jugadorRef, {
          score: increment(puntosAAgregar)
        });
      }
    }
    // Viaje directo a la pantalla del Ranking
    setScreen("screenRanking");
    showScreenTV("screenRanking");

  } catch (error) {
    console.error("Error al procesar los puntos:", error);
    alert("Hubo un problema al guardar los puntos.");
  }
}



// ==========================================
// Juego 4º: Irrational Price
// ==========================================
let jugadoresConRespuesta = [];

export function iniciarTvIrrationalPrice() {
  // Escuchar jugadores activos para saber cuántos han respondido ya
  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    const contenedorContador = document.getElementById("tvContadorRespuestasPrice");
    if (!contenedorContador) return;

    let totalActivos = 0;
    let hanRespondido = 0;
    jugadoresConRespuesta = [];

    snapshot.forEach((playerDoc) => {
      totalActivos++;
      const p = playerDoc.data();
      const id = playerDoc.id;

      // Buscamos la respuesta del jugador (por ejemplo, guardada en p.lentejasGuess)
      const respuesta = p.lentejasGuess;

      if (respuesta !== undefined && respuesta !== null && respuesta !== "") {
        hanRespondido++;
        jugadoresConRespuesta.push({
          id: id,
          name: p.name,
          guess: parseFloat(respuesta)
        });
      }
    });

    // Actualiza el marcador en la TV: "5 / 8"
    contenedorContador.innerText = `${hanRespondido} / ${totalActivos}`;
  });
}

// Llama a la inicialización (puedes meterla en tu switch de pantallas si tienes uno)
iniciarTvIrrationalPrice();

// REVELAR EL NÚMERO Y CALCULAR QUIÉN SE HA QUEDADO MÁS CERCA
window.calcularGanadoresPrice = function () {
  const inputValor = document.getElementById("inputLentejasExactas").value.trim();
  if (!inputValor) return alert("Por favor, introduce el número exacto primero.");

  const valorReal = parseFloat(inputValor);
  const resultadoDiv = document.getElementById("tvResultadoPrice");

  if (jugadoresConRespuesta.length === 0) {
    alert("Nadie ha enviado respuestas todavía.");
    return;
  }

  // Calculamos la diferencia absoluta |valorReal - respuesta| para cada uno
  // Math.abs asegura que si la respuesta es menor o mayor, la distancia sea positiva siempre
  jugadoresConRespuesta.forEach(j => {
    j.diferencia = Math.abs(valorReal - j.guess);
  });

  // Ordenamos de menor diferencia (ganador) a mayor diferencia
  jugadoresConRespuesta.sort((a, b) => a.diferencia - b.diferencia);

  // Pintamos la lista ordenada en la TV para que todos la vean
  let htmlResultados = "<h4 style='margin:0 0 10px 0; color:#ffc107;'>Resultados:</h4><ol style='padding-left:20px; margin:0;'>";

  jugadoresConRespuesta.forEach((j, index) => {
    // Si se queda a 0 de diferencia es un acierto exacto!
    const detalleDiferencia = j.diferencia === 0 ? "¡EXACTO! 🎯" : `(dif: ${j.diferencia})`;
    htmlResultados += `<li style='margin-bottom:8px;'><strong>${j.name}</strong> puso <strong>${j.guess}</strong> <span style='color:#aaa; font-size:0.85rem;'>${detalleDiferencia}</span></li>`;
  });

  htmlResultados += "</ol>";
  resultadoDiv.innerHTML = htmlResultados;
};



// =========================================================================
// BOTÓN NUEVO: Sumar puntuaciones en Firebase y mostrar los puntos sumados
// =========================================================================
window.pointsIrrationalPrice = async function () {
  // 1. Verificamos si el presentador ya pulsó el botón de calcular antes
  if (jugadoresConRespuesta.length === 0 || jugadoresConRespuesta[0].diferencia === undefined) {
    alert("❌ Primero debes pulsar en '🧮 Revelar y Calcular Ganadores' para saber las posiciones.");
    return;
  }

  const tablaPuntos = [10, 8, 6, 5, 4, 3, 2, 1];
  const resultadoDiv = document.getElementById("tvResultadoPrice");

  // 2. Modificamos el HTML en la TV para añadir la columna de puntos sumados
  let htmlResultados = "<h4 style='margin:0 0 10px 0; color:#00e676;'>🏆 ¡Puntos Sumados con Éxito!:</h4><ol style='padding-left:20px; margin:0;'>";

  console.log("🚀 Subiendo puntuaciones de Irrational Price a Firebase...");

  // 3. Creamos una copia local para evitar que el onSnapshot actualice jugadoresConRespuesta
  // mientras aún estamos procesando la suma de puntos.
  const respuestasParaSumar = jugadoresConRespuesta.slice();

  for (let index = 0; index < respuestasParaSumar.length; index++) {
    const j = respuestasParaSumar[index];
    const puntosAAsignar = tablaPuntos[index] || 0; // Si hay más de 8 jugadores, se llevan 0 pts

    const detalleDiferencia = j.diferencia === 0 ? "¡EXACTO! 🎯" : `(dif: ${j.diferencia})`;

    // Aquí generamos la línea de la tabla mostrando los puntos sumados en verde claro
    htmlResultados += `
      <li style='margin-bottom:8px;'>
        <strong>${j.name}</strong> puso <strong>${j.guess}</strong> 
        <span style='color:#aaa; font-size:0.85rem;'>${detalleDiferencia}</span>
        <strong style='color:#00e676; margin-left: 15px;'>[+${puntosAAsignar} pts asignados]</strong>
      </li>`;

    // 4. Conexión y guardado en Firestore
    try {
      const playerRef = doc(window.db, "players", j.id);

      // Sumamos los puntos de forma atómica y limpiamos el guess en el mismo update.
      await updateDoc(playerRef, {
        score: increment(puntosAAsignar),
        lentejasGuess: null
      });

      console.log(`✨ Guardado en BD: ${j.name} +${puntosAAsignar} pts`);
    } catch (error) {
      console.error(`❌ Error al subir datos de ${j.name}:`, error);
    }
  }

  htmlResultados += "</ol>";
  resultadoDiv.innerHTML = htmlResultados; // Actualizamos la lista en la tele de forma visual

  alert("🏆 ¡Las puntuaciones se han sumado y la tabla se ha actualizado!");
};


// ==========================================
// Juego 5º: Symbol Zone
// ==========================================

let rondaActualSymbol = 1;
let tiempoRestanteSymbol = 60; // 1 minuto en segundos
let intervaloCronometroSymbol = null;
let listaJugadoresSymbol = []; // Guarda { id, name, equivocado: true/false }

function symbolZone() {
  console.log("🔺 Iniciando juego SymbolZone en la TV");

  // Reiniciar estado inicial si entra al juego de primeras
  rondaActualSymbol = 1;
  reiniciarRondaInterfaceSymbol();

  // Escuchar a los jugadores activos al cargar la pantalla
  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
    if (!contenedorLista) return;

    // 1. Vaciamos la lista vieja
    listaJugadoresSymbol = [];
    contenedorLista.innerHTML = "";

    // 2. Metemos los jugadores directos de Firebase. Todos empiezan en 'false' (en verde, salvados)
    snapshot.forEach((playerDoc) => {
      const p = playerDoc.data();

      listaJugadoresSymbol.push({
        id: playerDoc.id,
        name: p.name,
        equivocado: false // Por defecto, nadie está equivocado al empezar
      });
    });

    // 3. Los pintamos en la pantalla
    pintarPanelJugadoresSymbol();
  });
}
symbolZone();
// FUNCIÓN PARA DIBUJAR LOS JUGADORES EN EL PANEL
function pintarPanelJugadoresSymbol() {
  const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
  if (!contenedorLista) return;

  contenedorLista.innerHTML = "";

  listaJugadoresSymbol.forEach((jugador, index) => {
    const card = document.createElement("div");
    card.style.padding = "15px";
    card.style.borderRadius = "8px";
    card.style.textAlign = "center";
    card.style.fontWeight = "bold";
    card.style.cursor = "pointer";
    card.style.transition = "0.2s";
    card.style.userSelect = "none";

    // Si está marcado como equivocado se pinta rojo, si no verde (salvado provisional)
    if (jugador.equivocado) {
      card.style.background = "#d32f2f";
      card.style.color = "white";
      card.style.border = "2px solid #ff6666";
      card.innerHTML = `❌<br>${jugador.name}<br><span style='font-size:0.8rem;opacity:0.8;'>0 pts</span>`;
    } else {
      card.style.background = "#2e7d32";
      card.style.color = "white";
      card.style.border = "2px solid #66bb6a";
      card.innerHTML = `✅<br>${jugador.name}<br><span style='font-size:0.8rem;opacity:0.8;'>+2 pts</span>`;
    }

    // Al hacer clic, alternamos su estado de acierto/error
    card.onclick = () => {
      listaJugadoresSymbol[index].equivocado = !listaJugadoresSymbol[index].equivocado;
      pintarPanelJugadoresSymbol(); // Refrescar visualmente la pantalla
    };

    contenedorLista.appendChild(card);
  });
}

// CONTROLADOR DEL CRONÓMETRO (Iniciar / Pausar)
window.controlarTiempoSymbol = function (accion) {
  const elReloj = document.getElementById("tvCronometroSymbol");

  if (accion === "iniciar") {
    if (intervaloCronometroSymbol) return; // Evitar duplicar intervalos

    intervaloCronometroSymbol = setInterval(() => {
      if (tiempoRestanteSymbol <= 0) {
        clearInterval(intervaloCronometroSymbol);
        intervaloCronometroSymbol = null;
        if (elReloj) elReloj.style.color = "#ff3d00"; // Se pone rojo al acabar
        alert("⏰ ¡Tiempo agotado! Turno de revisar los símbolos.");
        return;
      }

      tiempoRestanteSymbol--;

      // Formatear los segundos a formato MM:SS
      const minutos = String(Math.floor(tiempoRestanteSymbol / 60)).padStart(2, '0');
      const segundos = String(tiempoRestanteSymbol % 60).padStart(2, '0');
      if (elReloj) elReloj.innerText = `${minutos}:${segundos}`;
    }, 1000);

  } else if (accion === "pausar") {
    clearInterval(intervaloCronometroSymbol);
    intervaloCronometroSymbol = null;
  }
  else if (accion === "acabar") {
    clearInterval(intervaloCronometroSymbol);
    intervaloCronometroSymbol = null;
    tiempoRestanteSymbol = 0;
    if (elReloj) {
      elReloj.innerText = "00:00";
      elReloj.style.color = "#ff3d00";
    }
    alert("⏰ ¡Tiempo finalizado manualmente por el presentador!");
  }
};

// BOTÓN: GUARDAR RONDA Y APLICAR PUNTOS (+2 a los no marcados)
window.pointsSymbolZone = async function () {
  if (listaJugadoresSymbol.length === 0) return alert("No hay jugadores en la partida.");

  console.log(`🚀 Repartiendo puntos de la Ronda ${rondaActualSymbol}...`);

  for (let i = 0; i < listaJugadoresSymbol.length; i++) {
    const j = listaJugadoresSymbol[i];

    // Si NO está marcado como equivocado, suma 2 puntos. Si falló, suma 0.
    const puntosAAsignar = j.equivocado ? 0 : 2;

    try {
      const playerRef = doc(window.db, "players", j.id);

      // Traer puntuación acumulada actual
      const snapshotActual = await getDocs(query(collection(window.db, "players")));
      let scoreActual = 0;
      snapshotActual.forEach((d) => {
        if (d.id === j.id) scoreActual = d.data().score ?? 0;
      });

      // Guardar el nuevo total en Firebase
      await updateDoc(playerRef, {
        score: scoreActual + puntosAAsignar
      });

      console.log(`✨ ${j.name} procesado: +${puntosAAsignar} pts.`);
    } catch (error) {
      console.error(`❌ Error guardando puntos para ${j.name}:`, error);
    }
  }

  alert(`🏆 ¡Puntos de la Ronda ${rondaActualSymbol} aplicados con éxito!`);
};

// BOTÓN: PASAR DE RONDA Y REINICIAR EL MINUTO
window.siguienteRondaSymbol = function () {
  if (rondaActualSymbol >= 5) {
    alert("🏁 ¡Ya has completado las 5 rondas de SymbolZone!");
    return;
  }

  rondaActualSymbol++;
  reiniciarRondaInterfaceSymbol();
  alert(`🔺 Iniciando Ronda ${rondaActualSymbol}. ¡Cambiad las pinzas de la espalda!`);
};

// FUNCIÓN AUXILIAR PARA REINICIAR CONTADORES DE RONDA
function reiniciarRondaInterfaceSymbol() {
  // Parar el reloj antiguo si seguía corriendo
  clearInterval(intervaloCronometroSymbol);
  intervaloCronometroSymbol = null;

  // Valores por defecto (1 minuto)
  tiempoRestanteSymbol = 60;

  // Actualizar textos en la UI
  const elReloj = document.getElementById("tvCronometroSymbol");
  if (elReloj) {
    elReloj.innerText = "01:00";
    elReloj.style.color = "#fff";
  }

  const elTextoRonda = document.getElementById("tvRondaSymbol");
  if (elTextoRonda) elTextoRonda.innerText = `Ronda ${rondaActualSymbol} / 5`;

  // Limpiar las marcas de fallado de la ronda anterior para que todos empiecen limpios
  listaJugadoresSymbol.forEach(j => j.equivocado = false);
  pintarPanelJugadoresSymbol();
}






// ==========================================
// Juego 6º: Cifras y Letras
// ==========================================
let cifrasDeLaRonda = []; // Guardará los 6 números generados (ej: [2, 5, 8, 10, 25, 6])
let objetivoDeLaRonda = 0; // El número al que tienen que llegar (ej: 432)
let jugadoresCifras = [];  // Datos locales de las respuestas recibidas
let rondaActualCifras = 0;       // Contador de rondas (de 0 a 5)
let puntuacionJuegoCifras = {};  // Guardará los puntos internos { idJugador: puntos }

async function cifrasLetras() {
  // Esperar a que el DOM se haya cargado y existan los elementos necesarios
  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  const numerosContenedor = document.getElementById("tvNumerosDisponibles");
  const objetivoElemento = document.getElementById("tvNumeroObjetivo");
  const respuestasContenedor = document.getElementById("tvListaRespuestasCifras");

  if (!numerosContenedor || !objetivoElemento || !respuestasContenedor) {
    console.warn("Cifras y Letras: falta algún elemento del DOM para inicializar.");
    return;
  }

  // Limpiar interfaz
  numerosContenedor.innerHTML = `<span style="color: #666; font-style: italic;">Pulsa generar...</span>`;
  objetivoElemento.innerText = "---";
  respuestasContenedor.innerHTML = `<p style="color: #666; text-align: center;">Genera un reto para empezar.</p>`;

  // Escuchamos en tiempo real si van respondiendo
  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    console.log("Cifras y Letras: snapshot recibido. jugadores activos=", snapshot.size);
    const contenedor = document.getElementById("tvListaRespuestasCifras");
    if (!contenedor) {
      console.warn("Cifras y Letras: contenedor de respuestas no está disponible.");
      return;
    }

    // --- CANDADO VISUAL ---
    // Si la pantalla ya está mostrando los resultados validados, ignoramos el snapshot
    // para que Firebase no machaque la interfaz al limpiar los móviles.
    if (contenedor.getAttribute("data-validado") === "true") {
      console.log("Cifras y Letras: Snapshot ignorado para proteger la pantalla de resultados.");
      return;
    }

    jugadoresCifras = [];
    contenedor.innerHTML = "";

    snapshot.forEach((playerDoc) => {
      const p = playerDoc.data();
      const formulaEnviada = p.cifrasFormula || "";

      jugadoresCifras.push({
        id: playerDoc.id,
        name: p.name,
        formula: formulaEnviada.trim()
      });

      if (cifrasDeLaRonda.length === 0) {
        contenedor.innerHTML = `<p style="color: #666; text-align: center;">Esperando a que generes el reto...</p>`;
        return;
      }

      // Crear línea visual en la TV (Tiempo real de quién está pensando o ya respondió)
      const item = document.createElement("div");
      item.style.padding = "10px";
      item.style.background = "#222";
      item.style.borderRadius = "6px";
      item.style.border = "1px solid #444";
      item.style.marginBottom = "8px";

      const estado = formulaEnviada ? "📝 Respondido" : "⏳ Pensando...";
      const colorEstado = formulaEnviada ? "#00e676" : "#ffc107";

      item.innerHTML = `<strong>${p.name}</strong>: <span style="color: ${colorEstado}; font-weight:bold;">${estado}</span>`;
      contenedor.appendChild(item);
    });
  });
}
cifrasLetras();

// 1. GENERAR RETO (6 números aleatorios y 1 objetivo)
window.generarRetoCifras = async function () {
  // Quitamos el candado visual para que la pantalla vuelva a escuchar en tiempo real
  const contenedor = document.getElementById("tvListaRespuestasCifras");
  if (contenedor) contenedor.removeAttribute("data-validado");
  rondaActualCifras++;
  // Si es la ronda 1 (o si nos habíamos pasado de 5), reiniciamos el minijuego
  if (rondaActualCifras === 1 || rondaActualCifras > 5) {
    rondaActualCifras = 1;
    puntuacionJuegoCifras = {}; // Vaciamos el marcador local
    jugadoresCifras.forEach(j => {
      puntuacionJuegoCifras[j.id] = 0; // Todos empiezan con 0 puntos internos
    });
  }
  let opciones = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 25, 50, 75, 100];
  cifrasDeLaRonda = [];

  // Seleccionar exactamente 6 números sin repetir tarjetas
  for (let i = 0; i < 6; i++) {
    const randomIdx = Math.floor(Math.random() * opciones.length);
    const numeroElegido = opciones.splice(randomIdx, 1)[0];
    cifrasDeLaRonda.push(numeroElegido);
  }

  // Generar número objetivo (entre 101 y 999)
  objetivoDeLaRonda = Math.floor(Math.random() * 899) + 101;

  // Pintar en la TV
  const contenedorCifras = document.getElementById("tvNumerosDisponibles");
  contenedorCifras.innerHTML = cifrasDeLaRonda.map(num => `
    <span style="background:#ffc107; color:black; font-size:1.8rem; font-weight:bold; padding:5px 15px; border-radius:5px; box-shadow:0 2px 4px rgba(0,0,0,0.5); margin: 0 5px;">${num}</span>
  `).join("");

  document.getElementById("tvNumeroObjetivo").innerText = objetivoDeLaRonda;
  console.log(cifrasDeLaRonda, objetivoDeLaRonda);

  // Subir reto a Firebase
  try {
    await updateDoc(doc(window.db, "game", "numberState"), {
      cifrasDisponibles: cifrasDeLaRonda,
      cifrasObjetivo: objetivoDeLaRonda
    });
  } catch (e) {
    console.error("Error subiendo reto a Firebase:", e);
  }
};

// 2. 🔥 FUNCIÓN DE VALIDACIÓN MATEMÁTICA (Modificada para aceptar aproximaciones)
function analizarFormula(formulaString, numerosPermitidos, resultadoObjetivo) {
  const formulalimpia = formulaString.replace(/\s+/g, "");
  if (!formulalimpia) return { valido: false, motivo: "Fórmula vacía" };

  const caracteresPermitidos = /^[0-9+\-*/().]+$/;
  if (!caracteresPermitidos.test(formulalimpia)) {
    return { valido: false, motivo: "Contiene caracteres inválidos o letras" };
  }

  const numerosUsados = formulalimpia.match(/\d+/g).map(Number);
  let copiaPermitidos = [...numerosPermitidos];

  for (let num of numerosUsados) {
    const idx = copiaPermitidos.indexOf(num);
    if (idx === -1) {
      return { valido: false, motivo: `El número ${num} no está en la lista o lo has usado de más` };
    }
    copiaPermitidos.splice(idx, 1);
  }

  try {
    const calcular = new Function(`return ${formulalimpia}`);
    const resultadoReal = calcular();

    if (isNaN(resultadoReal) || resultadoReal === Infinity) {
      return { valido: false, motivo: "Resultado matemático indefinido o erróneo" };
    }

    // Si la matemática es correcta la damos por válida. La distancia al objetivo se mide en el ranking.
    return { valido: true, resultado: resultadoReal };

  } catch (error) {
    return { valido: false, motivo: "Error de sintaxis en la ecuación (paréntesis, etc.)" };
  }
}

// 3. BOTÓN: CALCULAR RANKING LOCAL, ASIGNAR PUNTOS Y PINTAR CLASIFICACIÓN GENERAL PERMANENTE
window.validarRespuestasCifras = async function () {
  if (jugadoresCifras.length === 0) return alert("No hay respuestas que validar.");

  const contenedor = document.getElementById("tvListaRespuestasCifras");
  contenedor.setAttribute("data-validado", "true");
  
  contenedor.innerHTML = `<h4 style='color:#ffc107; margin:0 0 5px 0;'>Resultados Ronda ${rondaActualCifras} / 5:</h4>`;

  // Asegurar que todos los jugadores activos existan en el marcador local
  jugadoresCifras.forEach(j => {
    if (puntuacionJuegoCifras[j.id] === undefined) puntuacionJuegoCifras[j.id] = 0;
  });

  // 1. Evaluar matemáticamente las fórmulas
  let jugadoresEvaluados = jugadoresCifras.map(j => {
    const verificacion = analizarFormula(j.formula, cifrasDeLaRonda, objetivoDeLaRonda);
    let resultadoReal = verificacion.resultado;
    let distancia = Infinity;

    if (verificacion.valido && j.formula !== "") {
      distancia = Math.abs(objetivoDeLaRonda - resultadoReal);
    }

    return {
      ...j,
      valido: verificacion.valido && j.formula !== "",
      resultado: resultadoReal || 0,
      distancia: distancia,
      motivo: verificacion.motivo || "Sin respuesta enviada"
    };
  });

  // 2. Comprobar condiciones de puntuación de la ronda
  const alguienAcertoExacto = jugadoresEvaluados.some(j => j.valido && j.distancia === 0);
  
  // Encontrar la menor distancia conseguida por alguien válido
  let menorDistanciaRonda = Infinity;
  jugadoresEvaluados.forEach(j => {
    if (j.valido && j.distancia < menorDistanciaRonda) {
      menorDistanciaRonda = j.distancia;
    }
  });

  // 3. Asignar puntos del minijuego (+2 o +1) y pintar el intento en pantalla
  jugadoresEvaluados.forEach(j => {
    let puntosRondaLocal = 0;
    let lineaHtml = "";

    if (j.valido) {
      const esExacto = j.distancia === 0;

      if (esExacto) {
        puntosRondaLocal = 2; // Regla: Acierto exacto = 2 puntos
      } else if (!alguienAcertoExacto && j.distancia === menorDistanciaRonda) {
        puntosRondaLocal = 1; // Regla: Nadie exacto, el más cercano = 1 punto
      }

      // Sumamos al marcador de este juego interno
      puntuacionJuegoCifras[j.id] += puntosRondaLocal;

      const colorTexto = esExacto ? "#00e676" : "#ffb300";
      lineaHtml = `
        <div style="padding:10px; background:#1b5e20; border-radius:6px; margin-bottom:8px;">
          <strong>🟢 ${j.name}:</strong> <code>${j.formula}</code> = <strong>${j.resultado}</strong> 
          <br><span style="color:${colorTexto}; font-size:0.9rem;">(${esExacto ? '¡CORRECTO EXACTO! +2' : `Más cercano a ${j.distancia} u. +1`})</span>
          <strong style="float:right; color:#ffc107;">Esta ronda: +${puntosRondaLocal} pts</strong>
        </div>`;
    } else {
      lineaHtml = `
        <div style="padding:10px; background:#b71c1c; border-radius:6px; margin-bottom:8px; opacity: 0.7;">
          <strong>🔴 ${j.name}:</strong> <code>${j.formula || "N/A"}</code>
          <br><span style="font-size:0.85rem; color:#ffcdd2;">❌ Incorrecto: ${j.motivo}</span>
        </div>`;
    }

    contenedor.innerHTML += lineaHtml;
  });

  // 4. Limpiar las fórmulas en Firebase para dejar los móviles listos sin alterar puntuaciones globales aún
  for (let j of jugadoresCifras) {
    try {
      await updateDoc(doc(window.db, "players", j.id), { cifrasFormula: "" });
    } catch (err) {
      console.error("Error limpiando pantalla móvil:", err);
    }
  }

  // 5. Construir el ranking interno actual de este juego para mostrarlo en la tabla
  let listaRankingJuego = jugadoresCifras.map(j => ({
    id: j.id,
    name: j.name,
    scoreJuego: puntuacionJuegoCifras[j.id]
  }));

  // Ordenamos de mayor a menor puntuación del juego interno
  listaRankingJuego.sort((a, b) => b.scoreJuego - a.scoreJuego);

  // Pintar la tabla de clasificación interna en la TV
  let tablaHtml = `
    <div style="margin-top: 20px; background: #000; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
      <h3 style="color: #ffc107; margin-top: 0; text-align: center; font-size: 1.2rem;">🏆 CLASIFICACIÓN DEL JUEGO (Ronda ${rondaActualCifras}/5)</h3>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 1.05rem;">
        <thead>
          <tr style="border-bottom: 2px solid #333; color: #aaa;">
            <th style="padding: 6px;">Pos</th>
            <th style="padding: 6px;">Jugador</th>
            <th style="padding: 6px; text-align: right;">Puntos Juego</th>
          </tr>
        </thead>
        <tbody>
  `;

  listaRankingJuego.forEach((jugador, index) => {
    tablaHtml += `
      <tr style="border-bottom: 1px solid #222;">
        <td style="padding: 8px; font-weight: bold;">#${index + 1}</td>
        <td style="padding: 8px;">${jugador.name} ${index === 0 ? '👑' : ''}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #ffc107;">${jugador.scoreJuego} pts</td>
      </tr>
    `;
  });

  tablaHtml += `</tbody></table></div>`;
  contenedor.innerHTML += tablaHtml;

  // ==========================================
  // FINAL DEL JUEGO: SI LLEGAMOS A LA RONDA 5, REPARTIMOS EN FIREBASE GLOBAL
  // ==========================================
  if (rondaActualCifras === 5) {
    alert("🏁 ¡Fin de la Ronda 5! Calculando posiciones finales para transferir puntos a la clasificación general.");
    
    const tablaPuntosGlobales = [10, 8, 6, 5, 4, 3, 2, 1];
    
    for (let index = 0; index < listaRankingJuego.length; index++) {
      const jugadorRanking = listaRankingJuego[index];
      const puntosParaFirebase = tablaPuntosGlobales[index] || 0;

      if (puntosParaFirebase > 0) {
        try {
          const playerRef = doc(window.db, "players", jugadorRanking.id);
          const snap = await getDocs(query(collection(window.db, "players")));
          let scoreGlobalActual = 0;
          
          snap.forEach(d => { 
            if (d.id === jugadorRanking.id) scoreGlobalActual = d.data().score ?? 0; 
          });

          // Sumamos la recompensa a su cuenta real de Firebase
          await updateDoc(playerRef, {
            score: scoreGlobalActual + puntosParaFirebase
          });
          console.log(`Transferidos +${puntosParaFirebase} pts globales a ${jugadorRanking.name}`);
        } catch (err) {
          console.error("Error al transferir puntos finales a Firebase:", err);
        }
      }
    }
    alert("🏆 ¡Puntos de torneo asignados en la base de datos global con éxito! El juego se reiniciará en el próximo reto.");
  } else {
    alert(`Ronda ${rondaActualCifras} validada. ¡Siguiente reto listo para generar!`);
  }
};














// ==========================================
// Selector de Navegación Rápida del Header
// ==========================================
window.navegacionRapidaJuegos = function (idPantalla) {
  if (!idPantalla) return;
  try {
    setScreen("screen" + idPantalla, idPantalla);
    showScreenTV("screen" + idPantalla);
    document.getElementById("selectorJuegosRapidos").value = "";
  } catch (error) {
    console.error("Error al saltar a la pantalla " + idPantalla + ":", error);
  }
};

// =====================
// Reseteo llamado autodestrucción. Puede ser que vaya aumentado las colecciones en Firebase y no se suficiente
// =====================
// Función para resetear el estado del juego a los valores iniciales
async function resetGame() {
  const ok = confirm("⚠️ Esto borrará puntuaciones y reiniciará el juego. ¿Continuar?");
  if (!ok) return;

  try {
    // 1. Reset estado global
    await setScreen("screenSelect", null);
    showScreenTV("screenSelect");

    // 2. Reset TODOS los jugadores
    const snap = await getDocs(collection(window.db, "players"));
    const promises = [];

    snap.forEach((playerDoc) => {
      const playerData = playerDoc.data();

      const datosUpdate = {
        score: 0,
        active: false,
        vasosTimes: { round1: 0, round2: 0 },
        lentejasGuess: null
      };

      if (playerData.attemptsSong !== undefined) {
        datosUpdate.attemptsSong = deleteField();
      }

      const playerRef = doc(window.db, "players", playerDoc.id);
      promises.push(updateDoc(playerRef, datosUpdate));
    });

    await Promise.all(promises); // Esperar a que se completen todos los updates


  } catch (error) {
    console.error("❌ Error durante el reset total del juego:", error);
  }
  // Reset de la ronda de GlassTower
  await updateDoc(doc(window.db, "game", "towerState"), {
    ronda: "Ronda 1"
  });
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