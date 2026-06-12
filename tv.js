import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
  where,
  getDoc,
  setDoc,
  deleteField,
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
// ==================================
// El orden en el que se jugarán los juegos del concurso
// ==================================
const games = ["WorldGuessr", "GuessSong", "GlassTower", "IrrationalPrice", "NumbersAndLetters", "TruthOrLie", "TheLiar", "LastTheorem"];

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

  document.getElementById(screen).style.display = "block"
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
function goToRanking() {
  setScreen(screenRanking);
  showScreen(screenRanking);
}

// =====================
// Botón para girar la ruleta y elegir juego (valor de game en firestore, previamente elegido). Falta implementar la ruleta visualmente
// =====================
let currentGame = null;
let currentScreen = null;

document.getElementById("spinBtn").onclick = async () => {
  //  girarRuleta(); // falta implementar esta función para mostrar la ruleta y animarla
  await sleep(5000); // tiempo de duración de la animación de la ruleta, ((ajustar))
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
  { title: "Los Jardines de marzo - La bien querida", audioURL: "assets/audio/" },
  { title: "Killing An Arab - The Cure", audioURL: "assets/audio/Killing An Arab - The Cure (320k).mp3" },
  { title: "Where The Hell Is My Husband - RAYE", audioURL: "assets/audio/Where The Hell Is My Husband.m4a" }
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
window.guardarIntentoVaso = async function(playerId, numIntento) {
  const inputId = `Tiempo-${playerId}-${numIntento}`;
  const tiempoTexto = document.getElementById(inputId).value.trim();
  
  if(!tiempoTexto) return alert("Introduce un tiempo válido (ej: 12.4)");
  const tiempo = parseFloat(tiempoTexto.replace(",", ".")); // Por si pones comas

  try {
    const playerRef = doc(window.db, "players", playerId);
    
    // Conseguimos los datos actuales del jugador para actualizar el array
    const playersSnap = await getDocs(query(collection(window.db, "players")));
    let datosPlayer = null;
    playersSnap.forEach(d => { if(d.id === playerId) datosPlayer = d.data(); });

    let currentAttempts = (datosPlayer.towerGame && datosPlayer.towerGame.attempts) ? [...datosPlayer.towerGame.attempts] : [0, 0, 0];
    
    // Guardamos el tiempo en la posición correspondiente (intento 1 = índice 0)
    currentAttempts[numIntento - 1] = tiempo;

    // Filtramos los intentos que no sean 0 para sacar el mejor tiempo real
    const intentosValidos = currentAttempts.filter(t => t > 0);
    const mejorTiempo = intentosValidos.length > 0 ? Math.min(...intentosValidos) : 999;

    // Actualizamos Firebase
    await updateDoc(playerRef, {
      "towerGame.attempts": currentAttempts,
      "towerGame.bestTime": mejorTiempo
    });

    alert(`Intento ${numIntento} guardado: ${tiempo}s`);
    renderTvVasos(); // Renderiza de nuevo para actualizar el Ranking
  } catch (err) {
    console.error(err);
  }
};

// 2. RENDERIZAR LA PANTALLA (PANEL DE CONTROL + RANKING DE TIEMPOS)
async function renderTvVasos() {
  const containerControls = document.getElementById("vasosControlsContainer");
  const containerLeaderboard = document.getElementById("vasosLeaderboard");
  if (!containerControls || !containerLeaderboard) return;

  const playersSnap = await getDocs(query(collection(window.db, "players"), where("active", "==", true)));
  
  let htmlControls = "";
  let listaTiempos = []; // Aquí meteremos todos los tiempos para ordenarlos

  playersSnap.forEach((playerDoc) => {
    const p = playerDoc.data();
    const id = playerDoc.id;
    const tower = p.towerGame || { attempts: [0, 0, 0], bestTime: 0 };

    // A) Generar los inputs para el Presentador
    htmlControls += `
      <div class="player-vasos-row" style="margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px;">
        <strong style="font-size: 1.2rem;">👤 ${p.name}</strong> (Mejor: ${tower.bestTime ? tower.bestTime + 's' : '---'})
        <div style="margin-top: 5px;">
          Intento 1: <input type="number" step="0.01" id="time-${id}-1" value="${tower.attempts[0] || ''}" style="width:60px;"> <button onclick="guardarIntentoVaso('${id}', 1)">💾</button> | 
          Intento 2: <input type="number" step="0.01" id="time-${id}-2" value="${tower.attempts[1] || ''}" style="width:60px;"> <button onclick="guardarIntentoVaso('${id}', 2)">💾</button> | 
          Intento 3: <input type="number" step="0.01" id="time-${id}-3" value="${tower.attempts[2] || ''}" style="width:60px;"> <button onclick="guardarIntentoVaso('${id}', 3)">💾</button>
        </div>
        <div style="margin-top: 5px;">
          <button onclick="sumarPuntosGlobales('${id}', 3)" style="background:#28a745; color:white;">🏆 +3 pts</button>
          <button onclick="sumarPuntosGlobales('${id}', 2)" style="background:#ffc107;">🥈 +2 pts</button>
          <button onclick="sumarPuntosGlobales('${id}', 1)" style="background:#17a2b8; color:white;">🥉 +1 pt</button>
        </div>
      </div>
    `;

    // B) Recopilar todos los intentos individuales para el Ranking General de mejores tiempos
    tower.attempts.forEach((tiempo) => {
      if (tiempo > 0) {
        listaTiempos.push({ name: p.name, time: tiempo });
      }
    });
  });

  // Ordenar la lista de tiempos de MENOR a MAYOR (El más rápido arriba)
  listaTiempos.sort((a, b) => a.time - b.time);

  // C) Dibujar el Ranking de tiempos (Permite duplicados de nombres si hacen varias marcas buenas)
  let htmlLeaderboard = "<ol>";
  listaTiempos.forEach((registro) => {
    htmlLeaderboard += `<li style="font-size: 1.3rem; margin-bottom: 5px;"><strong>${registro.time}s</strong> - ${registro.name}</li>`;
  });
  htmlLeaderboard += "</ol>";

  containerControls.innerHTML = htmlControls;
  containerLeaderboard.innerHTML = listaTiempos.length > 0 ? htmlLeaderboard : "<p>Esperando los primeros tiempos...</p>";
}

// 3. ASIGNAR LOS PUNTOS FINALES QUE TÚ DECIDAS
window.sumarPuntosGlobales = async function(playerId, puntos) {
  try {
    await updateDoc(doc(window.db, "players", playerId), {
      score: increment(puntos)
    });
    alert("Puntos sumados al marcador global.");
    renderTvVasos();
  } catch(err) { console.error(err); }
};


// =====================
// Reseteo llamado autodestrucción. Puede ser que vaya aumentado las colecciones en Firebase y no se suficiente
// =====================
// Función para resetear el estado del juego a los valores iniciales
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
      const playerData = playerDoc.data(); // 🟢 CORREGIDO: Declaramos playerData para poder leer los campos
      
      const datosUpdate = {
        score: 0,
        active: false
      };
      
      if (playerData.attemptsSong !== undefined) {
        datosUpdate.attemptsSong = deleteField();
      }
      
      const playerRef = doc(window.db, "players", playerDoc.id);
      promises.push(updateDoc(playerRef, datosUpdate));
    });

    await Promise.all(promises); // Esperar a que se completen todos los updates
    
    // 3. Reset de la canción activa
    await updateDoc(doc(window.db, "game", "currentSong"), {
      title: "Ninguna",
      audioUrl: "",
      revealed: false
    });
    console.log("🎵 ¡Documento currentSong inicializado!");

  } catch (error) {
    console.error("❌ Error durante el reset total del juego:", error);
  }
}

// Funcionalidad al botón autodestrucción para resetear el juego
document.getElementById("selfDestruct").onclick = () => {
  resetGame();
};
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