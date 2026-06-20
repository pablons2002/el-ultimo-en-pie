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
const games = ["WorldGuessr", "GuessSong", "GlassTower", "IrrationalPrice", "Votes", "SymbolZone", "NumbersAndLetters", "TheLiar", "LastTheorem"];

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
  document.getElementById("screenVotes").style.display = "none";
  document.getElementById("screenTheLiar").style.display = "none";
  document.getElementById("viewWinner").style.display = "none";
  document.getElementById(screen).style.display = "block"

  if (screen === "screenNumbersAndLetters") {
    cifrasLetras();
  }
}

function getAlbumImageUrl(albumPath) {
  if (!albumPath) return "";
  const trimmed = albumPath.trim();
  if (!trimmed) return "";
  if (/^(https?:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  let normalized = trimmed.replace(/\\/g, "/");
  if (!normalized.startsWith("images/")) {
    normalized = `images/guessSong/${normalized}`;
  }
  if (!normalized.startsWith("/")) {
    normalized = normalized;
  }

  return encodeURI(normalized);
}

// ======================
// QR generator
// ======================
new QRCode(document.getElementById("qrcode"), {
  text: "https://pablons2002.github.io/el-ultimo-en-pie/movil.html",
  width: 250,
  height: 250
});

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

// =========================================================================
// 🎡 LOGICA DE LA RULETA DE SELECCIÓN DE MINIJUEGOS (TV)
// =========================================================================

const constGames = ["WorldGuessr", "GuessSong", "GlassTower", "IrrationalPrice", "Votes", "SymbolZone", "NumbersAndLetters", "TheLiar", "LastTheorem"];
let ruletaJuegosGirando = false;
let juegoDestinoGuardado = ""; // Guardará temporalmente a dónde ir

// A. DIBUJAR LA RULETA AUTOMÁTICAMENTE AL CARGAR EL SCRIPT
window.inicializarRuletaJuegos = function () {
  const canvas = document.getElementById("canvasRuletaJuegos");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const numSectores = constGames.length;
  const angularArco = (2 * Math.PI) / numSectores;
  const centro = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Colores llamativos alternos para los sectores de la ruleta
  // Paleta de colores de la Grecia Clásica para el Canvas
  const colores = [
    "#2c231e", // Negro Ático / Cerámica oscura
    "#d97d4b", // Terracota clásico
    "#9b7826", // Mármol / Crema
    "#6e8944", // Verde Oliva húmedo
    "#b89728", // Oro Viejo
    "#624513", // Azul Profundo del Egeo
    "#bd5332"  // Rojo Cerámico
  ];

  constGames.forEach((game, i) => {
    const anguloInicio = i * angularArco;
    const anguloFin = anguloInicio + angularArco;
    const gameTitle = ["Ulises", "Orfeo", "Dédalo","Moiras","Veredicto","Delfos","Láquesis","Epimeteo","Teorema"];

    // Pintar trozo de tarta
    ctx.beginPath();
    ctx.fillStyle = colores[i % colores.length];
    ctx.moveTo(centro, centro);
    ctx.arc(centro, centro, centro, anguloInicio, anguloFin);
    ctx.lineTo(centro, centro);
    ctx.fill();

    // Escribir el nombre del juego
    ctx.save();
    ctx.translate(centro, centro);
    ctx.rotate(anguloInicio + angularArco / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(gameTitle[i], centro - 20, 5); // Desfase hacia fuera
    ctx.restore();
  });
};

// Ejecutar el dibujo automáticamente al procesar el script
setTimeout(window.inicializarRuletaJuegos, 100);


// B. INTEGRACIÓN DIRECTA CON TU EVENTO ASYNC CLICK DE SPINBTN
document.getElementById("spinBtn").onclick = async () => {
  if (ruletaJuegosGirando) return;

  const canvas = document.getElementById("canvasRuletaJuegos");
  const txtResultado = document.getElementById("resultadoRuletaTV");
  const btnJugar = document.getElementById("btnIrAlJuego");

  if (!canvas) return;

  // Ocultar botón y limpiar textos de jugadas anteriores
  btnJugar.style.display = "none";
  txtResultado.style.innerText = "🎰 Girando...";

  // 1. Obtener los datos actuales de Firebase (Tu código original)
  const snap = await getDoc(ref);
  const data = snap.data();
  const gameSelected = data.game; // Ej: "TheLiar"
  juegoDestinoGuardado = gameSelected; // Lo guardamos para el botón final

  // 2. Buscar en qué posición del array está el juego de Firebase
  const indiceObjetivo = constGames.indexOf(gameSelected);

  if (indiceObjetivo === -1) {
    // Si por lo que sea el string de Firebase no coincide con el array, saltamos directo sin romper el programa
    console.warn("El juego de Firebase no coincide con el array de constantes:", gameSelected);
    ejecutarSaltoDePantallaDirecto(gameSelected);
    return;
  }

  ruletaJuegosGirando = true;

  // 3. CALCULO MATEMÁTICO DE ROTACIÓN DEL GANADOR
  const numSectores = constGames.length;
  const angularArcoDeg = 360 / numSectores;

  // Centro del sector objetivo en grados
  const centroSectorDeg = (indiceObjetivo * angularArcoDeg) + (angularArcoDeg / 2);

  // Calcular desfase para que se detenga arriba del todo (en los 270º)
  const anguloDeParada = (270 - centroSectorDeg + 360) % 360;

  // 6 vueltas completas de animación + ángulo final
  const vueltasExtras = 6 * 360;
  const rotacionTotal = vueltasExtras + anguloDeParada;

  // Aplicar la animación CSS (Duración de 4.5 segundos)
  canvas.style.transition = "transform 4.5s cubic-bezier(0.1, 0.8, 0.1, 1)";
  canvas.style.transform = `rotate(${rotacionTotal}deg)`;

  // 4. AL TERMINAR EL GIRO (Esperamos los 4.5 segundos de la animación)
  await new Promise(resolve => setTimeout(resolve, 4500));
  txtResultado.innerHTML = `Destino dictado: <span style="color:#bd5332; font-weight:900;">${gameSelected}</span>`;
  // Hacer aparecer de forma triunfal el botón de Jugar
  btnJugar.style.display = "block";

  // Dejar la ruleta fija en la posición estática final para evitar bugs visuales futuros
  canvas.style.transition = "none";
  canvas.style.transform = `rotate(${anguloDeParada}deg)`;

  ruletaJuegosGirando = false;

  // Asignar el comportamiento al botón para que haga el cambio de pantalla final
  btnJugar.onclick = () => {
    ejecutarSaltoDePantallaDirecto(juegoDestinoGuardado);
  };
};

// C. COMPORTAMIENTO POST-RULETA: TU LÓGICA DE SALTO DE PANTALLA
function ejecutarSaltoDePantallaDirecto(gameSelected) {
  setScreen("screen" + gameSelected, gameSelected);
  showScreenTV("screen" + gameSelected);

  // Escuchador pasivo en tiempo real (Tu código original)
  onSnapshot(ref, (snap) => {
    const data = snap.data();
    currentScreen = data.screen;
    currentGame = data.game;
    console.log("Cambio de pantalla registrado:", currentGame);
  });
}


// =============
// Ajuste manual de puntos
// =============
// =========================================================================
// 🔧 AJUSTE MANUAL COMPLEMENTARIO (CONTROL DE ERRORES DIRECTO A FIREBASE)
// =========================================================================

// A. FUNCIÓN INDEPENDIENTE PARA RELLENAR EL DESPLEGABLE EN CUALQUIER MOMENTO
window.cargarJugadoresAjusteManual = async function () {
  const select = document.getElementById("selectAjusteManualJugador");
  if (!select) return;

  try {
    // Hace su propia consulta limpia a Firebase para traer a los jugadores activos
    const snap = await getDocs(query(collection(window.db, "players"), where("active", "==", true)));

    // Limpiamos el selector manteniendo la opción inicial
    select.innerHTML = '<option value="">-- Seleccionar Jugador --</option>';

    snap.forEach(d => {
      const jugador = d.data();
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.innerText = jugador.name;
      select.appendChild(opt);
    });

    console.log("🔄 Desplegable de ajuste manual actualizado directamente desde Firebase.");
  } catch (error) {
    console.error("Error al cargar jugadores en el ajuste manual:", error);
  }
};

// B. FUNCIÓN PARA APLICAR LOS PUNTOS EN FIREBASE GENERAL
window.aplicarAjusteManualFirebase = async function (boton) {
  const idJugador = document.getElementById("selectAjusteManualJugador").value;
  const inputPts = document.getElementById("inputAjusteManualPuntos");
  const puntosAAjustar = parseInt(inputPts.value, 10);

  if (!idJugador) return alert("Por favor, selecciona un jugador del desplegable.");
  if (isNaN(puntosAAjustar)) return alert("Introduce un número de puntos válido (positivo o negativo).");

  try {
    boton.disabled = true;
    boton.innerText = "⏳... ";

    const playerRef = doc(window.db, "players", idJugador);

    // Consultar el puntaje que tiene actualmente en la BD
    const snap = await getDocs(query(collection(window.db, "players")));
    let scoreGlobalActual = 0;
    let nombreJugador = "Jugador";

    snap.forEach(d => {
      if (d.id === idJugador) {
        scoreGlobalActual = d.data().score ?? 0;
        nombreJugador = d.data().name;
      }
    });

    // Guardar la corrección sumando o restando directamente
    await updateDoc(playerRef, {
      score: scoreGlobalActual + puntosAAjustar
    });

    inputPts.value = ""; // Limpiar input

  } catch (error) {
    console.error("Error en el ajuste manual:", error);
    alert("No se pudo actualizar la base de datos.");
  } finally {
    boton.disabled = false;
    boton.innerText = "⚙️ Aplicar";
  }
};
// ==========================================
// Juego: El Viaje de Ulises (WorldGuessr)
// ==========================================

// Estructura de estilos inyectados para las tarjetas de tripulantes
const styleMitologia = document.createElement('style');
styleMitologia.innerHTML = `
  .player {
    background: #fffdfa;
    border: 2px solid #e3dac9;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .player:hover {
    border-color: #b89047;
    background: #fdfcf7;
  }
  .player.selected {
    border-color: #8c6d31;
    background: #faf4e8;
    box-shadow: inset 0 0 10px rgba(140,109,49,0.1);
  }
  .player .pos {
    font-size: 1.1rem;
    font-weight: bold;
    color: #8c6d31;
    font-variant: small-caps;
    min-height: 20px;
  }
`;
document.head.appendChild(styleMitologia);

const imagenesPorTecla = {
  "a": "images/fotosGeoguessr/A-Alghero.jpg",
  "c": "images/fotosGeoguessr/C-Cercedilla.jpg",
  "e": "images/fotosGeoguessr/E-Escorial Silla Felipe.jpg",
  "g": "images/fotosGeoguessr/G-Aldea.jpg",
  "i": "images/fotosGeoguessr/I-Argüelles.jpg",
  "j": "images/fotosGeoguessr/J-Jardines Marrakech.jpg",
  "m": "images/fotosGeoguessr/M-Madeira.jpg",
  "n": "images/fotosGeoguessr/N-El naranjo.jpg",
  "p": "images/fotosGeoguessr/P-Punta Galera.jpg",
  "r": "images/fotosGeoguessr/R-Roma.jpg",
  "s": "images/fotosGeoguessr/S-Segovia.jpg",
  "u": "images/fotosGeoguessr/U-Facultad Matematicas.jpg",
  "x": "images/fotosGeoguessr/X-Madrid.jpg",
  "z": "images/fotosGeoguessr/Z-Azores.jpg"
};

// Revelar visiones del mapa pulsando las llaves del destino (teclas)
document.addEventListener("keydown", (e) => {
  console.log("Invocando visiones del mapa antiguo");
  console.log(currentGame);
  if (currentGame !== "WorldGuessr") return;

  const key = e.key.toLowerCase();
  const img = imagenesPorTecla[key];
  console.log(img);

  if (!img) return;

  showImage(img);
});

function showImage(src) {
  document.getElementById("imgShow").src = src;
  document.getElementById("overlayImg").style.display = "flex";
}

// Disipar el velo de la vision con la tecla de escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("overlayImg").style.display = "none";
  }
});

let finalizeMode = false;
let players = [];
let selectedRanking = [];

// Desplegar las actas del tribunal marino al finalizar la travesia
document.getElementById("endGameBtn").onclick = async () => {
  try {
    const q = query(collection(window.db, "players"), where("active", "==", true));
    const querySnapshot = await getDocs(q);

    players = [];
    querySnapshot.forEach((docSnap) => {
      const playerData = docSnap.data();
      if (playerData.name) {
        players.push({
          name: playerData.name,
          img: playerData.img
        });
      }
    });

    console.log("Tripulantes activos convocados desde el Olimpo:", players);

    if (players.length === 0) {
      alert("No se han hallado navegantes activos en las bitacoras de destino.");
    }

  } catch (error) {
    console.error("Error al convocar a la tripulacion activa:", error);
  }

  finalizeMode = true;
  document.getElementById("finalizePanel").style.display = "block";
  renderPlayers();
};

function renderPlayers() {
  const container = document.getElementById("playersContainer");
  container.innerHTML = "";

  players.forEach(p => {
    const position = selectedRanking.indexOf(p.name);

    container.innerHTML += `
      <div class="player ${position !== -1 ? "selected" : ""}" data-player="${p.name}">
        <div class="avatar">
          <img src="${p.img}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%; border: 2px solid #b89047;">
        </div>
        <div style="font-weight: bold; font-size: 0.95rem; color: #2c251e;">${p.name}</div>
        <div class="pos">
          ${position !== -1 ? "Puerto " + (position + 1) : ""}
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
        selectedRanking.push(name);
      } else {
        selectedRanking.splice(index, 1);
      }

      renderPlayers();
    };
  });
}

// Confirmar el orden de llegada y otorgar los favores de los Dioses
document.getElementById("confirmRanking").onclick = async () => {
  const pointsTable = [10, 8, 6, 5, 4, 3, 2, 1];
  const scores = {};

  selectedRanking.forEach((player, index) => {
    scores[player] = pointsTable[index] || 0;
  });

  try {
    const querySnapshot = await getDocs(collection(window.db, "players"));

    querySnapshot.forEach(async (playerDoc) => {
      const playerData = playerDoc.data();
      const docId = playerDoc.id;

      if (scores[playerData.name] !== undefined) {
        const puntosNuevos = scores[playerData.name];
        const puntosActuales = playerData.score || 0;
        const puntuacionTotal = puntosActuales + puntosNuevos;

        await updateDoc(doc(window.db, "players", docId), {
          score: puntuacionTotal
        });

        console.log(`Las mercedes ascienden para ${playerData.name} en la urna ${docId}. (Previo: ${puntosActuales} + Otorgado: ${puntosNuevos} = Total: ${puntuacionTotal})`);
      }
    });
  } catch (error) {
    console.error("Error al inmortalizar las puntuaciones en el Panteon:", error);
  }

  setScreen("screenRanking");
  showScreenTV("screenRanking");
};

function listenToRankingAndScore() {
  const tablaContenedor = document.getElementById("listaRankingActivos");

  if (!tablaContenedor) {
    setTimeout(listenToRankingAndScore, 50);
    return;
  }

  if (!window.db) {
    setTimeout(listenToRankingAndScore, 50);
    return;
  }
  console.log("Sincronizando el Oraculo del Ranking en tiempo real");

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
        <td>Escala #${posicion}</td>
        <td style="font-weight: bold; font-variant: small-caps;">${jugador.name || "Navegante Anonimo"}</td>
        <td style="color: #8c6d31; font-weight: bold;">${jugador.score ?? 0} mercedes</td>
      `;

      tablaContenedor.appendChild(fila);
      posicion++;
    });
  });
}

listenToRankingAndScore();

document.getElementById("nextGameBtn").onclick = async () => {
  console.log(currentGame);
  let currentIndex = games.indexOf(currentGame);
  let nextGame = null;

  if (currentIndex !== -1 && currentIndex < games.length - 1) {
    nextGame = games[currentIndex + 1];
  } else {
    nextGame = games[0];
  }

  console.log(`Girando el timon desde ${currentGame} hacia los nuevos rumbos de: ${nextGame}`);

  await setScreen("screenRoulette", nextGame);
  showScreenTV("screenRoulette");
};

// ========================
// 2º Juego GuessSong
// ========================


// 3. CAPTURA DE ELEMENTOS DEL HTML
const botonPlay = document.getElementById('btn-play');
const botonSiguiente = document.getElementById('btn-siguiente');
const reproductor = document.getElementById('mi-reproductor');
const barraProgreso = document.getElementById('barra-progreso'); // Ajustado según tu estándar
const tiempoActualTxt = document.getElementById('tiempo-actual');
const tiempoTotalTxt = document.getElementById('tiempo-total');
const segundosCronoTxt = document.getElementById('segundos-crono');

// Elementos de las pantallas de respuestas y revelación
const pantallaJuego = document.getElementById('pantalla-juego');
const pantallaRespuesta = document.getElementById('pantalla-respuesta');
const txtNombreCancion = document.getElementById('txt-nombre-cancion');
const txtAutor = document.getElementById('txt-autor');
const btnVerRespuestas = document.getElementById('btn-ver-respuestas');
const contenedorRespuestasUsuarios = document.getElementById('contenedor-respuestas-usuarios');
const listaRespuestasUI = document.getElementById('lista-respuestas-jugadores');
const botonContinuar = document.getElementById('btn-continuar');
const gameRef = doc(window.db, "game", "songState");

// 4. VARIABLES DE CONTROL DEL JUEGO Y CRONÓMETRO
let listaCanciones = [];  // Array con todas las canciones de Firestore
let indiceActual = 0;     // Posición de la canción actual
let tiempoRestante = 120;  // Tiempo límite por canción
let IDIntervalo = null;   // ID del temporizador
let juegoTerminado = false; // Controla si el juego ha llegado al final

// 5. FUNCIONES DE CONTROL DEL CRONÓMETRO
function iniciarCronometro() {
  if (IDIntervalo !== null) return;

  IDIntervalo = setInterval(async () => {
    tiempoRestante--;
    segundosCronoTxt.textContent = tiempoRestante;

    if (tiempoRestante <= 0) {
      clearInterval(IDIntervalo);
      IDIntervalo = null;
      revelarRespuesta();

      try {
        await updateDoc(gameRef, { state: false });
        console.log("🔒 Tiempo agotado: state cambiado a false");
      } catch (error) {
        console.error("Error al actualizar state (false):", error);
      }
    }
  }, 1200);
}

function pausarCronometro() {
  clearInterval(IDIntervalo);
  IDIntervalo = null;
}

async function reiniciarCronometro() {
  pausarCronometro();
  tiempoRestante = 120;
  segundosCronoTxt.textContent = tiempoRestante;

  try {
    await updateDoc(gameRef, { state: true });
    console.log("🔓 Cronómetro reiniciado: state cambiado a true");
  } catch (error) {
    console.error("Error al actualizar state (true):", error);
  }
}

function formatearTiempo(segundos) {
  if (isNaN(segundos)) return "0:00";
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg < 120 ? '0' : ''}${seg}`;
}

// 6. FASE 1 DE LA RESPUESTA: MOSTRAR TÍTULO, AUTOR LIMPIOS Y EVALUAR "P / I"
async function revelarRespuesta() {
  reproductor.pause();
  pausarCronometro();

  const cancionActual = listaCanciones[indiceActual];

  txtNombreCancion.textContent = cancionActual.nombreCancion || "Desconocido";
  txtAutor.textContent = cancionActual.autor || "Desconocido";

  const imgOwner = document.getElementById("img-owner");

  // 🔥 RESET SIEMPRE (IMPORTANTE)
  imgOwner.style.display = "none";
  imgOwner.src = "";

  // 🔥 OWNER LIMPIO
  const owner = (cancionActual.owner || "").trim();

  if (owner === "I") {
    imgOwner.src = "images/personajesIconos/InesGCircle.png";
    imgOwner.style.display = "block";
  }
  else if (owner === "P") {
    imgOwner.src = "images/personajesIconos/PabloCircle.png";
    imgOwner.style.display = "block";
  }

  contenedorRespuestasUsuarios.style.display = "none";
  btnVerRespuestas.style.display = "inline-block";

  // Mostrar carátula del álbum si existe
  try {
    const imgAlbumCover = document.getElementById('img-album-cover');
    const contenedorAlbumCover = document.getElementById('contenedor-album-cover');
    const albumField = cancionActual ? cancionActual.album : null;
    const albumUrl = getAlbumImageUrl(albumField);
    console.log('🔍 revelarRespuesta album field:', albumField, 'resolved albumUrl:', albumUrl);

    if (imgAlbumCover && contenedorAlbumCover && albumUrl) {
      imgAlbumCover.src = albumUrl;
      imgAlbumCover.alt = `Carátula de ${cancionActual.nombreCancion || 'la canción'}`;
      contenedorAlbumCover.style.display = 'block';
    } else if (imgAlbumCover && contenedorAlbumCover) {
      // Ocultar si no hay carátula disponible
      imgAlbumCover.src = '';
      contenedorAlbumCover.style.display = 'none';
    }
  } catch (e) {
    console.error('Error al procesar la carátula del álbum:', e);
  }

  pantallaJuego.style.display = "none";
  pantallaRespuesta.style.display = "block";

  // ==========================================================
  // 🔥 EVALUACIÓN DEL BONO "P/I" ASIGNADO A 'scoreSong'
  // ==========================================================
  const ownerCorrecto = cancionActual.owner ? cancionActual.owner.trim() : "";

  if (ownerCorrecto) {
    console.log(`🤖 Evaluando respuestas P/I. El valor correcto es: "${ownerCorrecto}"`);

    try {
      const querySnapshot = await getDocs(collection(window.db, "players"));

      for (const jugadorDoc of querySnapshot.docs) {
        const datosJugador = jugadorDoc.data();
        const respuestasSong = datosJugador.respuestasSong || {};
        const respuestaJugadorPI = respuestasSong.respuestaPI ? respuestasSong.respuestaPI.trim() : "";

        if (respuestaJugadorPI === ownerCorrecto) {
          console.log(`🎯 ¡Acierto! ${datosJugador.name || "Jugador"} acertó P/I. Sumando 1 punto a scoreSong...`);

          const jugadorRef = doc(window.db, "players", jugadorDoc.id);
          const scoreSongActual = datosJugador.scoreSong || 0; // Usando el nuevo campo

          await updateDoc(jugadorRef, {
            scoreSong: scoreSongActual + 1
          });
        }
      }
      console.log("✅ Evaluación de bono P/I completada con éxito.");
    } catch (error) {
      console.error("❌ Error al procesar el bono automático P/I:", error);
    }
  }
}
// 7. FASE 2 DE LA RESPUESTA: EVENTO PARA CARGAR LAS RESPUESTAS Y ASIGNAR PUNTOS A 'scoreSong'
btnVerRespuestas.addEventListener('click', async () => {
  btnVerRespuestas.style.display = "none";
  listaRespuestasUI.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(window.db, "players"));

    querySnapshot.forEach((jugadorDoc) => {
      const datosJugador = jugadorDoc.data();
      const idJugador = jugadorDoc.id;
      const respuestasSong = datosJugador.respuestasSong || {};

      const cancionRespondida = respuestasSong.respuestaCancion ? respuestasSong.respuestaCancion.trim() : "";
      const autorRespondido = respuestasSong.respuestaAutor ? respuestasSong.respuestaAutor.trim() : "";

      if (cancionRespondida || autorRespondido) {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.padding = "12px 10px";
        li.style.borderBottom = "1px dashed #eee";
        li.style.fontSize = "18px";

        const cancionMostrar = cancionRespondida || "❓";
        const autorMostrar = autorRespondido || "❓";

        // 🔥 LEER E IMPRIMIR 'scoreSong' EN LA UI DE RESPUESTAS CON LA FOTO DE FIREBASE
        const scoreSongActual = datosJugador.scoreSong || 0;
        const fotoJugador = datosJugador.img || 'ruta/por/defecto.png';

        const contenedorTexto = document.createElement('div');
        contenedorTexto.style.display = "flex";
        contenedorTexto.style.alignItems = "center";
        contenedorTexto.style.gap = "8px";
        
        contenedorTexto.innerHTML = `
          <img src="${fotoJugador}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" alt="Avatar">
          <span>
            <strong>${datosJugador.name || "Jugador"}:</strong> "${cancionMostrar}" de <em>${autorMostrar}</em> 
            <span style="font-size: 14px; color: #3498db; margin-left: 10px; font-weight: bold;">(Acierto de deidad: ${scoreSongActual} pts)</span>
          </span>
        `;

        const contenedorBotones = document.createElement('div');
        contenedorBotones.style.display = "flex";
        contenedorBotones.style.gap = "8px";
        contenedorBotones.style.marginLeft = "auto";

        const puntuaciones = [0, 1, 2];

        puntuaciones.forEach((puntos) => {
          const btnPuntos = document.createElement('button');
          btnPuntos.textContent = puntos;

          btnPuntos.style.padding = "6px 14px";
          btnPuntos.style.fontSize = "16px";
          btnPuntos.style.fontWeight = "bold";
          btnPuntos.style.cursor = "pointer";
          btnPuntos.style.borderRadius = "6px";
          btnPuntos.style.border = "1px solid #ccc";
          btnPuntos.style.background = "#f8f9fa";
          btnPuntos.style.transition = "all 0.2s";

          btnPuntos.onmouseover = () => { if (!btnPuntos.disabled) btnPuntos.style.background = "#e2e8f0"; };
          btnPuntos.onmouseout = () => { if (!btnPuntos.disabled) btnPuntos.style.background = "#f8f9fa"; };

          // 🔥 SUMAR PUNTOS A 'scoreSong' AL PULSAR BOTÓN MANUAL
          btnPuntos.onclick = async () => {
            try {
              const jugadorRef = doc(window.db, "players", idJugador);

              // Re-leemos para no pisar el punto automático del bono P/I
              const snapActualizado = await getDoc(jugadorRef);
              const scoreSongBase = snapActualizado.exists() ? (snapActualizado.data().scoreSong || 0) : 0;
              const scoreSongAcumulado = scoreSongBase + puntos;

              await updateDoc(jugadorRef, {
                scoreSong: scoreSongAcumulado
              });

              contenedorBotones.querySelectorAll('button').forEach((b) => {
                b.disabled = true;
                b.style.cursor = "default";
                b.style.opacity = "0.5";
              });

              btnPuntos.style.background = "#2ecc71";
              btnPuntos.style.color = "white";
              btnPuntos.style.borderColor = "#27ae60";
              btnPuntos.style.opacity = "1";

              console.log(`✅ scoreSong actualizado para ${idJugador}: ${scoreSongAcumulado}`);
            } catch (err) {
              console.error("Error al actualizar scoreSong en Firebase:", err);
            }
          };

          contenedorBotones.appendChild(btnPuntos);
        });

        li.appendChild(contenedorTexto);
        li.appendChild(contenedorBotones);
        listaRespuestasUI.appendChild(li);
      }
    });
  } catch (error) {
    console.error("Error al traer respuestas de los jugadores:", error);
  }

  contenedorRespuestasUsuarios.style.display = "block";
});
// 8. FUNCIÓN PARA CARGAR LA SIGUIENTE CANCIÓN LOCAL
function cargarCancion(indice) {
  const imgOwner = document.getElementById("img-owner");
  if (indice < listaCanciones.length) {
    pantallaRespuesta.style.display = "none";
    contenedorRespuestasUsuarios.style.display = "none";
    pantallaJuego.style.display = "block";

    imgOwner.style.display = "none";
    imgOwner.src = "";

    reproductor.src = listaCanciones[indice].url;
    barraProgreso.value = 0;
    tiempoActualTxt.textContent = "0:00";
    reiniciarCronometro();

    botonPlay.disabled = false;
    botonPlay.textContent = "Reproducir Música";
    botonSiguiente.disabled = false;
  } else {
    pantallaRespuesta.style.display = "none";
    pantallaJuego.style.display = "block";
    reiniciarCronometro();

    juegoTerminado = true;
    botonPlay.textContent = "Ver Ranking Final";
    botonPlay.disabled = false;
    botonSiguiente.disabled = true;

  }
}

// 9. EVENTO: INICIAR JUEGO / PLAY / PAUSA / RANKING
botonPlay.addEventListener('click', async () => {
  if (juegoTerminado) {
    console.log("📊 Iniciando recuento final y reparto de puntos de música...");

    // Escala de puntos estándar
    const tablaPuntos = [10, 8, 6, 5, 4, 3, 2, 1];

    try {
      // 1. OBTENER JUGADORES FORZANDO LECTURA DIRECTA DEL SERVIDOR (Evita datos obsoletos de caché)
      // Nota: Asegúrate de tener 'getDocsFromServer' importado de firebase/firestore si 'getDocs' sigue usando caché.
      // Como alternativa limpia, hacemos una pequeña espera de 500ms para que Firestore asimile los últimos clics manuales.
      await new Promise(resolve => setTimeout(resolve, 500));

      const querySnapshot = await getDocs(collection(window.db, "players"));
      const listaJugadores = [];

      querySnapshot.forEach((jugadorDoc) => {
        const datos = jugadorDoc.data();
        if (datos.active === true) {
          const scoreSongConvertido = Number(datos.scoreSong) || 0;

          // 🔍 TEST CONSOLA: Veremos exactamente qué tiene guardado cada documento en la base de datos
          console.log(`📡 Servidor -> Jugador: ${datos.name || "Sin nombre"} | ID: ${jugadorDoc.id} | scoreSong: ${scoreSongConvertido}`);

          listaJugadores.push({
            id: jugadorDoc.id,
            name: datos.name || "Sin nombre",
            scoreSong: scoreSongConvertido
          });
        }
      });

      // 2. CONTROL DE SEGURIDAD
      if (listaJugadores.length === 0) {
        console.warn("⚠️ No se encontraron jugadores activos.");
        goToRanking();
        return;
      }

      // 3. ORDENAR DE MAYOR A MENOR SCORESONG
      listaJugadores.sort((a, b) => b.scoreSong - a.scoreSong);
      console.log("📋 Lista final ordenada para reparto:", JSON.parse(JSON.stringify(listaJugadores)));

      // 4. BUCLE DE REPARTO CON CONTENEDOR SEGURO DE POSICIÓN
      let trackerPosicion = 0;

      for (let i = 0; i < listaJugadores.length; i++) {
        const jugadorActual = listaJugadores[i];

        // Si no es el primero y empata con el anterior, hereda la posición del anterior
        if (i > 0 && jugadorActual.scoreSong === listaJugadores[i - 1].scoreSong) {
          console.log(`🤝 ${jugadorActual.name} empata con ${listaJugadores[i - 1].name} (${jugadorActual.scoreSong} pts)`);
        } else {
          // Si no hay empate, el tracker se sincroniza exactamente con el índice actual
          trackerPosicion = i;
        }

        // Buscamos los puntos exactos en la tabla
        const puntosAAgregar = tablaPuntos[trackerPosicion] || 0;

        if (puntosAAgregar > 0) {
          console.log(`🏅 [REPARTO REAL] Asignando +${puntosAAgregar} pts globales a ${jugadorActual.name} por sus ${jugadorActual.scoreSong} aciertos.`);

          const jugadorRef = doc(window.db, "players", jugadorActual.id);

          // Subida directa e individual al score general de Firestore
          await updateDoc(jugadorRef, {
            score: increment(puntosAAgregar)
          });
        }
      }
      console.log("✅ Fin del reparto de puntos en la base de datos.");

    } catch (error) {
      console.error("❌ Error crítico en el reparto de puntos:", error);
      alert("Hubo un problema al procesar las puntuaciones finales.");
    }

    // 5. SALIDA A PANTALLA RANKING
    console.log("📊 Ejecutando goToRanking()...");
    goToRanking();
    return;
  }

  try {
    // 🔥 AL EMPEZAR EL JUEGO (PRIMER CLIC): INICIALIZAR LAS CANCIONES Y EL CAMPO 'scoreSong'
    if (listaCanciones.length === 0) {
      botonPlay.textContent = "Iniciando juego...";

      // 1. Crear el campo scoreSong: 0 para todos los jugadores en la BD
      const queryJugadores = await getDocs(collection(window.db, "players"));
      for (const jugadorDoc of queryJugadores.docs) {
        const jugadorRef = doc(window.db, "players", jugadorDoc.id);
        await updateDoc(jugadorRef, {
          scoreSong: 0 // Se inicializa limpio al arrancar el juego
        });
      }
      console.log("🧹 Todos los scoreSong de los jugadores han sido inicializados en 0.");

      // 2. Descargar canciones de la base de datos
      const querySnapshot = await getDocs(collection(window.db, "GuessSong"));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📥 GuessSong loaded: id=${doc.id} album=${data.album} nombreCancion=${data.nombreCancion}`);
        listaCanciones.push(data);
      });

      if (listaCanciones.length === 0) {
        botonPlay.textContent = "No hay canciones ❌";
        alert("La colección 'GuessSong' está vacía o mal escrita en Firestore.");
        return;
      }

      indiceActual = 0;
      cargarCancion(indiceActual);
    }

    // Interruptor Play / Pausa normal durante la ronda
    if (reproductor.paused) {
      await reproductor.play();
      botonPlay.textContent = "Pausar";
      iniciarCronometro();
    } else {
      reproductor.pause();
      botonPlay.textContent = "Reproducir Música";
      pausarCronometro();
    }

  } catch (error) {
    console.error("Error en el flujo del botón Play:", error);
  }
});

// 10. EVENTO: BOTÓN REVELAR RESPUESTA DURANTE LA MÚSICA
botonSiguiente.addEventListener('click', () => {
  revelarRespuesta();
});

// 11. EVENTO: BOTÓN SIGUIENTE CANCIÓN (Borra mapa en Firebase y avanza)
botonContinuar.addEventListener('click', async () => {
  botonContinuar.disabled = true;
  botonContinuar.textContent = "Limpiando sala...";

  try {
    const querySnapshot = await getDocs(collection(window.db, "players"));

    for (const jugadorDoc of querySnapshot.docs) {
      const jugadorRef = doc(window.db, "players", jugadorDoc.id);
      await updateDoc(jugadorRef, {
        respuestasSong: deleteField() // Se borra solo el mapa, se conserva 'scoreSong' intacto
      });
    }
    console.log("✅ Respuestas limpias para la nueva ronda.");
      try {
        // Forzar notificación a clientes móviles para que refresquen UI
        await updateDoc(gameRef, { state: true, lastReset: Date.now() });
        console.log('🔁 Notificación de reinicio enviada (game.songState.lastReset actualizado).');
      } catch (notifyErr) {
        console.error('❌ No se pudo notificar el reinicio a game.songState:', notifyErr);
      }
  } catch (e) {
    console.error("Error al limpiar respuestas en Firestore:", e);
  }

  botonContinuar.disabled = false;
  botonContinuar.textContent = "Siguiente melodía";

  indiceActual++;
  cargarCancion(indiceActual);
});

// ==============================
// Juego 3º GlassTower (La Torre de Dédalo)
// ==============================
let jugadorSeleccionadoId = null;
let jugadorSeleccionadoNombre = "";
let currentGlassTowerRound = "Ronda 1";
let ultimoRankingCalculado = [];

export function iniciarTvVasosLibre() {
  onSnapshot(doc(window.db, "game", "towerState"), (snap) => {
    if (snap.exists()) {
      currentGlassTowerRound = snap.data().ronda || "Ronda 1";
      document.getElementById("tvRondaActual").innerText = currentGlassTowerRound;
    }
  });

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

    timesText.push(`R1: ${(typeof r1 === 'number' && r1 > 0) ? r1.toFixed(2) + 's' : '---'}`);
    timesText.push(`R2: ${(typeof r2 === 'number' && r2 > 0) ? r2.toFixed(2) + 's' : '---'}`);

    const recordedTimes = [r1, r2].filter((value) => typeof value === 'number' && value > 0);
    const bestTime = recordedTimes.length > 0 ? Math.min(...recordedTimes) : null;
    const bestText = bestTime !== null ? `Mejor: ${bestTime.toFixed(2)}s` : '';

    // Manejo adaptativo del avatar de imagen de Firebase
    const urlAvatar = p.img ? p.img : 'https://via.placeholder.com/40/e3dac9/8c6d31?text=H';

    // Iluminación divina clara: si está seleccionado, resalta con borde de oro brillante
    const claseActiva = (id === jugadorSeleccionadoId)
      ? "background: #fff; border-color: #b89047; box-shadow: 0 0 12px rgba(184,144,71,0.4);"
      : "background: #fdfbf7; border-color: #dcd1c4;";

    // Renderizado del botón usando la etiqueta IMG en lugar del emoji antiguo
    htmlBotones += `
      <button onclick="seleccionarJugador('${id}', '${p.name}')" style="${claseActiva} color: #3c3228; padding: 12px; font-size: 1.15rem; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: bold; border: 2px solid; text-align:left; line-height: 1.4; font-family: 'Cinzel', serif; display: flex; align-items: center; gap: 12px;">
        <img src="${urlAvatar}" alt="Avatar" style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid #b89047; object-fit: cover; background: #fff;">
        <div style="flex: 1;">
          <strong style="color: #8c6d31; display: block; font-size: 1.1rem;">${p.name}</strong>
          <span style="display:block; font-size:0.85rem; font-weight:normal; opacity:0.85; margin-top:3px; color: #6d5e4f; font-family: sans-serif;">
            ${timesText.join(' | ')}${bestText ? ' · ' + bestText : ''}
          </span>
        </div>
      </button>
    `;

    if (bestTime !== null) {
      listaClasificacion.push({ id: id, name: p.name, time: bestTime, r1, r2, avatar: urlAvatar });
    }
  });

  contenedorBotones.innerHTML = htmlBotones;

  listaClasificacion.sort((a, b) => a.time - b.time);
  ultimoRankingCalculado = [...listaClasificacion];

  if (listaClasificacion.length === 0) {
    leaderboardDiv.innerHTML = `<p style="text-align:center; color:#9c8e7e; font-family:'Cinzel', serif;">Esperando las marcas de los héroes...</p>`;
  } else {
    let htmlRank = "<div style='display: flex; flex-direction: column; gap: 10px;'>";

    listaClasificacion.forEach((jugador, index) => {
      const times = [];
      const esPrimero = index === 0 ? "background: #fdf7ec; border: 1px solid #b89047;" : "background: #fff; border: 1px solid #f4eae1;";

      times.push(`R1: ${(typeof jugador.r1 === 'number' && jugador.r1 > 0) ? jugador.r1.toFixed(2) + 's' : '---'}`);
      times.push(`R2: ${(typeof jugador.r2 === 'number' && jugador.r2 > 0) ? jugador.r2.toFixed(2) + 's' : '---'}`);

      htmlRank += `
        <div style='display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; ${esPrimero}'>
          <span style='font-weight: bold; min-width: 24px; color: #8c6d31;'>${index + 1}º</span>
          <img src="${jugador.avatar}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
          <div style='flex: 1;'>
            <span style='font-weight: bold; color: #3c3228;'>${jugador.name}</span>
            <span style='color:#7d6e5e; font-size:0.85rem; display: block; font-family: sans-serif;'>(${times.join(' | ')})</span>
          </div>
          <strong style='font-size: 1.3rem; color: #8c6d31;'>${jugador.time.toFixed(2)}s</strong>
        </div>
      `;
    });

    htmlRank += "</div>";
    leaderboardDiv.innerHTML = htmlRank;
  }
}

window.seleccionarJugador = function (id, name) {
  jugadorSeleccionadoId = id;
  jugadorSeleccionadoNombre = name;

  document.getElementById("aviso-jugador-vacio").style.display = "none";

  if (cronoRunning) {
    clearInterval(cronoInterval);
    cronoRunning = false;
  }

  document.getElementById("nombreSeleccionado").innerText = name;
  document.getElementById("cronometroDisplay").innerText = "0.00s";
  document.getElementById('btnStartCrono').disabled = false;
  document.getElementById('btnStopCrono').disabled = true;
  document.getElementById("zonaCronometro").style.display = "block";

  renderizarControlesYRanking();
};

let cronoInterval = null;
let cronoStart = null;
let cronoRunning = false;

window.guardarTiempoDirecto = async function () {
  return;
};

window.iniciarCronometro = function () {
  if (!jugadorSeleccionadoId) {
    document.getElementById("aviso-jugador-vacio").style.display = "block";
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

window.cambiarRondaDirecto = async function (nombreRonda) {
  await updateDoc(doc(window.db, 'game', 'towerState'), {
    ronda: nombreRonda
  });
  currentGlassTowerRound = nombreRonda;
  document.getElementById('tvRondaActual').innerText = nombreRonda;
};

window.finalizarJuegoVasos = async function () {
  if (ultimoRankingCalculado.length === 0) {
    document.getElementById("aviso-marcas-vacias").style.display = "block";
    return;
  }

  const tablaPuntos = [10, 8, 6, 5, 4, 3, 2, 1];

  try {
    for (let i = 0; i < ultimoRankingCalculado.length; i++) {
      const jugador = ultimoRankingCalculado[i];
      const puntosAAgregar = tablaPuntos[i] || 0;

      if (puntosAAgregar > 0) {
        const jugadorRef = doc(window.db, "players", jugador.id);

        await updateDoc(jugadorRef, {
          score: increment(puntosAAgregar)
        });
      }
    }

    setScreen("screenRanking");
    showScreenTV("screenRanking");

  } catch (error) {
    console.error("Error al procesar los puntos:", error);
  }
}// ==========================================
// Juego 4º: Irrational Price (El conteo de las Moiras)
// ==========================================
let jugadoresConRespuesta = [];
// El número definitivo fijado por los dioses
const VALOR_FIJO_LENTEJAS = 1037;

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

      // Buscamos la respuesta del jugador guardada en p.lentejasGuess
      const respuesta = p.lentejasGuess;

      if (respuesta !== undefined && respuesta !== null && respuesta !== "") {
        hanRespondido++;
        jugadoresConRespuesta.push({
          id: id,
          name: p.name,
          guess: parseFloat(respuesta),
          avatar: p.img ? p.img : 'https://via.placeholder.com/30/e3dac9/8c6d31?text=H' // Trae su avatar de firebase
        });
      }
    });

    // Actualiza el marcador sagrado en la TV
    contenedorContador.innerText = `${hanRespondido} / ${totalActivos}`;
  });
}

iniciarTvIrrationalPrice();

// REVELAR EL NÚMERO Y CALCULAR DIRECTAMENTE CON 1037
window.calcularGanadoresPrice = function () {
  const resultadoDiv = document.getElementById("tvResultadoPrice");

  if (jugadoresConRespuesta.length === 0) {
    alert("Ningún Dios ha enviado sus profecías todavía.");
    return;
  }

  // Calculamos la diferencia absoluta con la cifra inmutable de 1037
  jugadoresConRespuesta.forEach(j => {
    j.diferencia = Math.abs(VALOR_FIJO_LENTEJAS - j.guess);
  });

  // Ordenamos de menor diferencia (ganador más cercano) a mayor diferencia
  jugadoresConRespuesta.sort((a, b) => a.diferencia - b.diferencia);

  // Pintamos la lista ordenada con diseño olímpico e imágenes
  let htmlResultados = `
    <div style='text-align: center; margin-bottom: 15px;'>
      <span style='font-size: 0.9rem; letter-spacing:1px; color:#7d6e5e; display:block;'>CIFRA DIVINA</span>
      <strong style='font-size: 2.2rem; color:#b89047; font-family: monospace;'>${VALOR_FIJO_LENTEJAS}</strong>
    </div>
    <div style='display: flex; flex-direction: column; gap: 8px;'>
  `;

  jugadoresConRespuesta.forEach((j, index) => {
    const esPrimero = index === 0 ? "background: #fdf7ec; border: 1px solid #b89047;" : "background: #fff; border: 1px solid #f4eae1;";
    const detalleDiferencia = j.diferencia === 0 ? "¡EXACTO! 🎯" : `(dif: ${j.diferencia})`;

    htmlResultados += `
      <div style='display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; ${esPrimero}'>
        <span style='font-weight: bold; min-width: 24px; color: #8c6d31;'>${index + 1}º</span>
        <img src="${j.avatar}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
        <div style='flex: 1; text-align: left;'>
          <span style='font-weight: bold; color: #3c3228;'>${j.name}</span>
          <span style='color:#7d6e5e; font-size:0.85rem; display: block; font-family: sans-serif;'>Puso: ${j.guess}</span>
        </div>
        <strong style='font-size: 0.95rem; color: #8c6d31; font-family:sans-serif;'>${detalleDiferencia}</strong>
      </div>
    `;
  });

  htmlResultados += "</div>";
  resultadoDiv.innerHTML = htmlResultados;
};

// GUARDAR PUNTUACIONES DEFINITIVAS
window.pointsIrrationalPrice = async function () {
  if (jugadoresConRespuesta.length === 0 || jugadoresConRespuesta[0].diferencia === undefined) {
    alert("❌ Primero debes pulsar en 'Revelar Sentencia Divina' para computar las posiciones.");
    return;
  }

  const tablaPuntos = [10, 8, 6, 5, 4, 3, 2, 1];
  const resultadoDiv = document.getElementById("tvResultadoPrice");

  let htmlResultados = `
    <div style='text-align: center; margin-bottom: 15px;'>
      <strong style='font-size: 1.2rem; color:#6d8c31;'>PROFECÍAS REGISTRADAS EN EL OLIMPO</strong>
    </div>
    <div style='display: flex; flex-direction: column; gap: 8px;'>
  `;

  const respuestasParaSumar = jugadoresConRespuesta.slice();

  for (let index = 0; index < respuestasParaSumar.length; index++) {
    const j = respuestasParaSumar[index];
    const puntosAAsignar = tablaPuntos[index] || 0;
    const detalleDiferencia = j.diferencia === 0 ? "¡EXACTO! 🎯" : `(dif: ${j.diferencia})`;

    htmlResultados += `
      <div style='display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; background: #f4fdf0; border: 1px solid #6d8c31;'>
        <span style='font-weight: bold; min-width: 24px; color: #6d8c31;'>${index + 1}º</span>
        <img src="${j.avatar}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #6d8c31; object-fit: cover;">
        <div style='flex: 1; text-align: left;'>
          <span style='font-weight: bold; color: #3c3228;'>${j.name}</span>
          <span style='color:#7d6e5e; font-size:0.85rem; display: block; font-family: sans-serif;'>Puso: ${j.guess} ${detalleDiferencia}</span>
        </div>
        <strong style='font-size: 1.1rem; color: #4e6c1e;'>+${puntosAAsignar} PTS</strong>
      </div>
    `;

    try {
      const playerRef = doc(window.db, "players", j.id);
      await updateDoc(playerRef, {
        score: increment(puntosAAsignar),
        lentejasGuess: null // Limpiamos el campo para próximas partidas
      });
    } catch (error) {
      console.error(`❌ Error al otorgar gracia divina a ${j.name}:`, error);
    }
  }

  htmlResultados += "</div>";
  resultadoDiv.innerHTML = htmlResultados;

};
// ==========================================
// Juego 5º: El Veredicto de los Dioses
// ==========================================
let jugadoresVotacion = [];  // Datos locales de las bendiciones recibidas
let votosVisibles = false;   // Estado de privacidad en el Consejo

// 1. INICIALIZAR LA ESCUCHA EN TIEMPO REAL EN EL ÁGORA
async function iniciarEscuchaVotaciones() {
  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    const contenedor = document.getElementById("tvListaVotos");
    if (!contenedor) return;

    if (contenedor.getAttribute("data-votado-final") === "true") return;

    jugadoresVotacion = [];
    contenedor.innerHTML = "";

    snapshot.forEach((playerDoc) => {
      const p = playerDoc.data();
      jugadoresVotacion.push({
        id: playerDoc.id,
        name: p.name,
        votoEnviado: p.votoEnviado || "",
        avatar: p.img ? p.img : 'https://via.placeholder.com/30/e3dac9/8c6d31?text=Ω'
      });
    });

    // Pintar las ofrendas en el Ágora
    jugadoresVotacion.forEach((j) => {
      const item = document.createElement("div");
      item.style.padding = "12px 16px";
      item.style.background = "#fdfbf7";
      item.style.borderRadius = "8px";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.gap = "12px";
      item.style.transition = "all 0.3s ease";
      item.style.border = j.votoEnviado ? "1px solid #b89047" : "1px solid #e8e4d8";

      let htmlContenido = `
        <img src="${j.avatar}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
        <div style="flex: 1; text-align: left;">
          <strong style="color: #3c3228; font-size: 1.05rem;">${j.name}</strong>
        </div>
      `;

      if (j.votoEnviado) {
        if (!votosVisibles) {
          htmlContenido += `<span style="color: #b89047; font-weight: bold; font-size: 0.95rem;">Ofrenda sellada en la urna 🔒</span>`;
        } else {
          htmlContenido += `<span style="color: #7d6e5e; font-size: 0.95rem;">Bendijo a: <strong style="color: #8c6d31; background: #f4eae1; padding: 3px 8px; border-radius: 4px;">${j.votoEnviado}</strong></span>`;
        }
      } else {
        htmlContenido += `<span style="color: #a89e94; font-style: italic; font-size: 0.9rem;">Consultando a las deidades... ⏳</span>`;
      }

      item.innerHTML = htmlContenido;
      contenedor.appendChild(item);
    });
  });
}
iniciarEscuchaVotaciones();

// 2. ABRIR CONSEJO DE DIOSES
window.abrirVotacion = async function () {
  votosVisibles = false;
  const contenedor = document.getElementById("tvListaVotos");
  if (contenedor) contenedor.removeAttribute("data-votado-final");

  const privacidadEtiqueta = document.getElementById("tvEstadoPrivacidad");
  privacidadEtiqueta.innerText = "BAJO EL MANTO DE HADES";
  privacidadEtiqueta.style.color = "#aa7c11";


  for (let j of jugadoresVotacion) {
    try {
      await updateDoc(doc(window.db, "players", j.id), { votoEnviado: "" });
    } catch (e) {
      console.error("Error al resetear ofrenda de " + j.name, e);
    }
  }
};

// 3. INVOCAR LUZ DE APOLO (REVELAR QUIÉN BENDIJO A QUIÉN)
window.revelarVotos = function () {
  votosVisibles = true;

  const privacidadEtiqueta = document.getElementById("tvEstadoPrivacidad");
  privacidadEtiqueta.innerText = "BAJO LA LUZ DE APOLO";
  privacidadEtiqueta.style.color = "#8c6d31";

  const contenedor = document.getElementById("tvListaVotos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  jugadoresVotacion.forEach((j) => {
    const item = document.createElement("div");
    item.style.padding = "12px 16px";
    item.style.background = "#fdfbf7";
    item.style.borderRadius = "8px";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "12px";
    item.style.border = j.votoEnviado ? "1px solid #8c6d31" : "1px solid #e8e4d8";

    let htmlContenido = `
      <img src="${j.avatar}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
      <div style="flex: 1; text-align: left;">
        <strong style="color: #3c3228;">${j.name}</strong>
      </div>
    `;

    if (j.votoEnviado) {
      htmlContenido += `<span style="color: #7d6e5e; font-size: 0.95rem;">Entregó su favor a <strong style="color: #8c6d31; background: #f4eae1; padding: 4px 10px; border-radius: 4px;">${j.votoEnviado}</strong></span>`;
    } else {
      htmlContenido += `<span style="color: #a89e94; font-style: italic; font-size: 0.9rem;">El hilo del destino se cortó sin su voto</span>`;
    }

    item.innerHTML = htmlContenido;
    contenedor.appendChild(item);
  });
};

// 4. DICTAR SENTENCIA DE ZEUS Y SUBIR AL MARCADOR
window.finalizarYSumarVotos = async function () {
  window.revelarVotos();

  const contenedor = document.getElementById("tvListaVotos");
  contenedor.setAttribute("data-votado-final", "true");

  let recuentoDeVotos = {};
  jugadoresVotacion.forEach(j => { recuentoDeVotos[j.name] = 0; });

  jugadoresVotacion.forEach(j => {
    if (j.votoEnviado && recuentoDeVotos[j.votoEnviado] !== undefined) {
      recuentoDeVotos[j.votoEnviado]++;
    }
  });

  contenedor.innerHTML = "<h3 style='color:#8c6d31; margin:0 0 20px 0; text-align:center; font-family: \"Cinzel Decorative\", serif;'>Escrutinio Divino (Favor del Olimpo Concedido):</h3>";

  for (let j of jugadoresVotacion) {
    const votosRecibidos = recuentoDeVotos[j.name] || 0;
    const puntosGanadosGlobales = votosRecibidos * 2;

    const fila = document.createElement("div");
    fila.style.padding = "12px 16px";
    fila.style.background = votosRecibidos > 0 ? "#fdf7ec" : "#fdfbf7";
    fila.style.border = votosRecibidos > 0 ? "1px solid #b89047" : "1px solid #e8e4d8";
    fila.style.borderRadius = "8px";
    fila.style.marginBottom = "8px";
    fila.style.display = "flex";
    fila.style.alignItems = "center";
    fila.style.justifyContent = "space-between";

    fila.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${j.avatar}" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
        <span style="color: #3c3228;"><strong>${j.name}</strong> (Consiguió ${votosRecibidos} voto/s)</span>
      </div>
      <strong style="color: #8c6d31; font-size: 1.1rem;">+${puntosGanadosGlobales} PTS</strong>
    `;
    contenedor.appendChild(fila);

    if (puntosGanadosGlobales > 0) {
      try {
        const playerRef = doc(window.db, "players", j.id);
        const snap = await getDocs(query(collection(window.db, "players")));
        let currentScore = 0;
        snap.forEach(d => { if (d.id === j.id) currentScore = d.data().score ?? 0; });

        await updateDoc(playerRef, {
          score: currentScore + puntosGanadosGlobales
        });
      } catch (err) {
        console.error("Error ascendiendo puntos a " + j.name, err);
      }
    }
  }

};

// ==========================================
// Juego 6º: Symbol Zone (Con Puntuación Local)
// ==========================================
// ==========================================
// Juego 6º: El Oráculo de Delfos
// ==========================================

let rondaActualSymbol = 1;
let tiempoRestanteSymbol = 60;
let intervaloCronometroSymbol = null;
let listaJugadoresSymbol = [];

// MARCADOR LOCAL INTERNO
let puntuacionJuegoSymbol = {};

function symbolZone() {
  console.log("🏛️ Iniciando El Oráculo de Delfos en la TV");

  // 🔥 SOLUCIÓN: Vaciamos por completo el marcador local para la nueva partida
  puntuacionJuegoSymbol = {};

  rondaActualSymbol = 1;
  reiniciarRondaInterfaceSymbol();

  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
    if (!contenedorLista) return;

    if (contenedorLista.getAttribute("data-bloqueado") === "true") return;

    listaJugadoresSymbol = [];
    contenedorLista.innerHTML = "";

    snapshot.forEach((playerDoc) => {
      const p = playerDoc.data();
      const idJugador = playerDoc.id;

      if (puntuacionJuegoSymbol[idJugador] === undefined) {
        puntuacionJuegoSymbol[idJugador] = 0;
      }

      // Guardar avatar proveniente de Firestore (campo `img`) con fallback
      const avatarUrl = p.img ? p.img : 'images/personajesIconos/default.png';

      listaJugadoresSymbol.push({
        id: idJugador,
        name: p.name,
        equivocado: false,
        avatar: avatarUrl
      });
    });

    pintarPanelJugadoresSymbol();
  });
}
symbolZone();

function pintarPanelJugadoresSymbol() {
  const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
  if (!contenedorLista) return;

  contenedorLista.innerHTML = "";
  contenedorLista.removeAttribute("data-bloqueado");

  listaJugadoresSymbol.forEach((jugador, index) => {
    const card = document.createElement("div");
    card.style.padding = "15px 10px";
    card.style.borderRadius = "8px";
    card.style.textAlign = "center";
    card.style.fontWeight = "bold";
    card.style.cursor = "pointer";
    card.style.transition = "0.2s";
    card.style.userSelect = "none";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.gap = "6px";

    if (jugador.equivocado) {
      card.style.background = "#fdf0f0";
      card.style.color = "#9e2a2b";
      card.style.border = "2px solid #9e2a2b";
      card.innerHTML = `
        <img src="${jugador.avatar}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 50%; border: 2px solid #9e2a2b; margin-bottom: 4px; background: #fff;">
        <span style="font-size: 1.05rem; letter-spacing: 0.5px;">Traicionado</span>
        <span style='font-size:0.85rem; color: #7d6e5e; font-weight: normal;'>${jugador.name}</span>
      `;
    } else {
      card.style.background = "#f4fdf0";
      card.style.color = "#4e6c1e";
      card.style.border = "2px solid #6d8c31";
      card.innerHTML = `
        <img src="${jugador.avatar}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 50%; border: 2px solid #6d8c31; margin-bottom: 4px; background: #fff;">
        <span style="font-size: 1.05rem; letter-spacing: 0.5px;">Supo la verdad</span>
        <span style='font-size:0.85rem; color: #4e4031; font-weight: normal;'>${jugador.name}</span>
      `;
    }

    card.onclick = () => {
      listaJugadoresSymbol[index].equivocado = !listaJugadoresSymbol[index].equivocado;
      pintarPanelJugadoresSymbol();
    };

    contenedorLista.appendChild(card);
  });
}

window.controlarTiempoSymbol = function (accion) {
  const elReloj = document.getElementById("tvCronometroSymbol");

  if (accion === "iniciar") {
    if (intervaloCronometroSymbol) return;

    intervaloCronometroSymbol = setInterval(() => {
      if (tiempoRestanteSymbol <= 0) {
        clearInterval(intervaloCronometroSymbol);
        intervaloCronometroSymbol = null;
        if (elReloj) elReloj.style.color = "#9e2a2b";
        return;
      }
      tiempoRestanteSymbol--;
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
      elReloj.style.color = "#9e2a2b";
    }

  }
};

window.pointsSymbolZone = async function () {
  if (listaJugadoresSymbol.length === 0) return alert("No hay mortales en la partida.");

  console.log(`🚀 Computando puntos locales de la Profecía ${rondaActualSymbol}...`);

  listaJugadoresSymbol.forEach(j => {
    const puntosRonda = j.equivocado ? 0 : 2;
    if (puntuacionJuegoSymbol[j.id] === undefined) puntuacionJuegoSymbol[j.id] = 0;
    puntuacionJuegoSymbol[j.id] += puntosRonda;
  });

  let rankingJuego = listaJugadoresSymbol.map(j => ({
    id: j.id,
    name: j.name,
    scoreJuego: puntuacionJuegoSymbol[j.id]
  }));

  rankingJuego.sort((a, b) => b.scoreJuego - a.scoreJuego);

  const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
  if (contenedorLista) {
    contenedorLista.setAttribute("data-bloqueado", "true"); // Bloqueo temporal anti-snapshot

    let tablaHtml = `
      <div style="width: 100%; background: #fdfbf7; padding: 15px; border-radius: 8px; border: 1px solid #b89047; box-sizing: border-box; grid-column: 1 / -1;">
        <h3 style="color: #8c6d31; margin-top: 0; text-align: center; font-size: 1.2rem; letter-spacing: 1px;"> CRÓNICA PROVISIONAL (Profecía ${rondaActualSymbol} / 5)</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 1rem; color: #3c3228;">
          <thead>
            <tr style="border-bottom: 2px solid #e3dac9; color: #7d6e5e;">
              <th style="padding: 6px;">Pos</th>
              <th style="padding: 6px;">Dios</th>
              <th style="padding: 6px; text-align: right;">Favor Acumulado</th>
            </tr>
          </thead>
          <tbody>
    `;

    rankingJuego.forEach((jugador, index) => {
      tablaHtml += `
        <tr style="border-bottom: 1px solid #f4eae1;">
          <td style="padding: 8px; font-weight: bold; color: #8c6d31;">#${index + 1}</td>
          <td style="padding: 8px;">
            <span>${jugador.name} ${index === 0 ? '👑' : ''}</span>
          </td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #b89047;">${jugador.scoreJuego} PTS</td>
        </tr>
      `;
    });

    tablaHtml += `</tbody></table></div>`;
    contenedorLista.innerHTML = tablaHtml;
  }

  if (rondaActualSymbol === 5) {


    const tablaPuntosGlobales = [10, 8, 6, 5, 4, 3, 2, 1];
    let posicionReal = 1;

    for (let index = 0; index < rankingJuego.length; index++) {
      const jugadorRanking = rankingJuego[index];

      // Si empata en puntos con el jugador anterior, mantiene la misma posicionReal
      if (index > 0 && jugadorRanking.scoreJuego === rankingJuego[index - 1].scoreJuego) {
        // Mantiene empate
      } else {
        posicionReal = index + 1;
      }

      const puntosGlobalesInyeccion = tablaPuntosGlobales[posicionReal - 1] || 0;

      if (puntosGlobalesInyeccion > 0) {
        try {
          const playerRef = doc(window.db, "players", jugadorRanking.id);

          // Traer la puntuación real acumulada del torneo en Firebase
          const snap = await getDocs(query(collection(window.db, "players")));
          let scoreTorneoActual = 0;

          snap.forEach(d => {
            if (d.id === jugadorRanking.id) scoreTorneoActual = d.data().score ?? 0;
          });

          await updateDoc(playerRef, {
            score: scoreTorneoActual + puntosGlobalesInyeccion
          });
          console.log(`⚖️ Destino #${posicionReal} | Concedidos +${puntosGlobalesInyeccion} pts divinos a ${jugadorRanking.name}`);
        } catch (err) {
          console.error("Error al inyectar puntos globales:", err);
        }
      }
    }

  }
};

window.siguienteRondaSymbol = function () {
  if (rondaActualSymbol >= 5) {

    return;
  }

  rondaActualSymbol++;
  reiniciarRondaInterfaceSymbol();

};

function reiniciarRondaInterfaceSymbol() {
  clearInterval(intervaloCronometroSymbol);
  intervaloCronometroSymbol = null;
  tiempoRestanteSymbol = 60;

  const elReloj = document.getElementById("tvCronometroSymbol");
  if (elReloj) {
    elReloj.innerText = "01:00";
    elReloj.style.color = "#3c3228";
  }

  const elTextoRonda = document.getElementById("tvRondaSymbol");
  if (elTextoRonda) elTextoRonda.innerText = `Profecía ${rondaActualSymbol} / 5`;

  listaJugadoresSymbol.forEach(j => j.equivocado = false);
  pintarPanelJugadoresSymbol();
}

// ==========================================
// Juego 7º: El Cálculo de Láquesis (Cifras y Letras)
// ==========================================
let cifrasDeLaRonda = [];
let objetivoDeLaRonda = 0;
let jugadoresCifras = [];
let rondaActualCifras = 0;
let puntuacionJuegoCifras = {};

let tiempoRestanteCifras = 120; // 2 minutos exactos
let intervaloCronometroCifras = null;

async function cifrasLetras() {
  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  const numerosContenedor = document.getElementById("tvNumerosDisponibles");
  const objetivoElemento = document.getElementById("tvNumeroObjetivo");
  const respuestasContenedor = document.getElementById("tvListaRespuestasCifras");

  if (!numerosContenedor || !objetivoElemento || !respuestasContenedor) {
    console.warn("Láquesis: Faltan elementos estructurales en el DOM.");
    return;
  }

  numerosContenedor.innerHTML = `<span style="color: #9c8e7f; font-style: italic;">Esperando el designio de las Moiras...</span>`;
  objetivoElemento.innerText = "---";
  respuestasContenedor.innerHTML = `<p style="color: #9c8e7f; text-align: center;">Mueve el telar para iniciar el proceso sagrado.</p>`;

  // Escucha en tiempo real de Firebase
  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    console.log("Láquesis: Datos de mortales sincronizados =", snapshot.size);
    const contenedor = document.getElementById("tvListaRespuestasCifras");
    if (!contenedor) return;

    // Candado para no borrar la pantalla si ya se le dio a validar
    if (contenedor.getAttribute("data-validado") === "true") {
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
        contenedor.innerHTML = `<p style="color: #9c8e7f; text-align: center;">Las Moiras están preparando las materias numéricas...</p>`;
        return;
      }

      const item = document.createElement("div");
      item.style.padding = "10px";
      item.style.background = "#fffdf9";
      item.style.border = "1px solid #e3dac9";
      item.style.marginBottom = "8px";

      const estado = formulaEnviada ? "Pergamino Entregado" : "Calculando Destino...";
      const colorEstado = formulaEnviada ? "#2e4225" : "#a37a1a";

      item.innerHTML = `<strong>${p.name}</strong>: <span style="color: ${colorEstado}; font-weight:bold; font-variant: small-caps;">${estado}</span>`;
      contenedor.appendChild(item);
    });
  });
}
cifrasLetras();

// Generar Reto e iniciar cuenta atrás automáticamente
window.generarRetoCifras = async function () {
  const contenedor = document.getElementById("tvListaRespuestasCifras");
  if (contenedor) contenedor.removeAttribute("data-validado");

  rondaActualCifras++;
  if (rondaActualCifras === 1 || rondaActualCifras > 5) {
    rondaActualCifras = 1;
    puntuacionJuegoCifras = {};
    jugadoresCifras.forEach(j => {
      puntuacionJuegoCifras[j.id] = 0;
    });
  }

  // Reinicializar el Reloj de Arena
  reiniciarCronometroCifrasInterface();
  controlarTiempoCifras('iniciar');

  let opciones = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 25, 50, 75, 100];
  cifrasDeLaRonda = [];

  for (let i = 0; i < 6; i++) {
    const randomIdx = Math.floor(Math.random() * opciones.length);
    const numeroElegido = opciones.splice(randomIdx, 1)[0];
    cifrasDeLaRonda.push(numeroElegido);
  }

  objetivoDeLaRonda = Math.floor(Math.random() * 899) + 101;

  const contenedorCifras = document.getElementById("tvNumerosDisponibles");
  contenedorCifras.innerHTML = cifrasDeLaRonda.map(num => `
    <span style="background:#fffdf9; color:#8c6d31; font-size:1.8rem; font-weight:bold; padding:5px 15px; border: 2px solid #b89047; box-shadow:2px 2px 5px rgba(0,0,0,0.05); margin: 0 5px; font-family: monospace;">${num}</span>
  `).join("");

  document.getElementById("tvNumeroObjetivo").innerText = objetivoDeLaRonda;

  try {
    await updateDoc(doc(window.db, "game", "numberState"), {
      cifrasDisponibles: cifrasDeLaRonda,
      cifrasObjetivo: objetivoDeLaRonda
    });
  } catch (e) {
    console.error("Error al asentar el reto en el Olimpo Firebase:", e);
  }
};

// Sistema de control de la arena del tiempo
window.controlarTiempoCifras = function (accion) {
  const elReloj = document.getElementById("tvCronometroCifras");

  if (accion === "iniciar") {
    if (intervaloCronometroCifras) return;

    intervaloCronometroCifras = setInterval(() => {
      if (tiempoRestanteCifras <= 0) {
        clearInterval(intervaloCronometroCifras);
        intervaloCronometroCifras = null;
        if (elReloj) elReloj.style.color = "#912b2b";
        return;
      }
      tiempoRestanteCifras--;
      const minutos = String(Math.floor(tiempoRestanteCifras / 60)).padStart(2, '0');
      const segundos = String(tiempoRestanteCifras % 60).padStart(2, '0');
      if (elReloj) elReloj.innerText = `${minutos}:${segundos}`;
    }, 1000);

  } else if (accion === "pausar") {
    clearInterval(intervaloCronometroCifras);
    intervaloCronometroCifras = null;
  }
  else if (accion === "acabar") {
    clearInterval(intervaloCronometroCifras);
    intervaloCronometroCifras = null;
    tiempoRestanteCifras = 0;
    if (elReloj) {
      elReloj.innerText = "00:00";
      elReloj.style.color = "#912b2b";
    }

  }
};

function reiniciarCronometroCifrasInterface() {
  clearInterval(intervaloCronometroCifras);
  intervaloCronometroCifras = null;
  tiempoRestanteCifras = 120;

  const elReloj = document.getElementById("tvCronometroCifras");
  if (elReloj) {
    elReloj.innerText = "02:00";
    elReloj.style.color = "#2c221e";
  }
}

function analizarFormula(formulaString, numerosPermitidos, resultadoObjetivo) {
  const formulalimpia = formulaString.replace(/\s+/g, "");
  if (!formulalimpia) return { valido: false, motivo: "Pergamino en blanco" };

  const caracteresPermitidos = /^[0-9+\-*/().]+$/;
  if (!caracteresPermitidos.test(formulalimpia)) {
    return { valido: false, motivo: "Caracteres profanos introducidos" };
  }

  const numerosUsados = formulalimpia.match(/\d+/g).map(Number);
  let copiaPermitidos = [...numerosPermitidos];

  for (let num of numerosUsados) {
    const idx = copiaPermitidos.indexOf(num);
    if (idx === -1) {
      return { valido: false, motivo: `El numero ${num} viola las leyes del Telar Sagrado` };
    }
    copiaPermitidos.splice(idx, 1);
  }

  try {
    const calcular = new Function(`return ${formulalimpia}`);
    const resultadoReal = calcular();

    if (isNaN(resultadoReal) || resultadoReal === Infinity) {
      return { valido: false, motivo: "Resultado matematico indefinido" };
    }

    return { valido: true, resultado: resultadoReal };
  } catch (error) {
    return { valido: false, motivo: "Sintaxis erronea en las uniones aritmeticas" };
  }
}

window.validarRespuestasCifras = async function () {
  if (jugadoresCifras.length === 0) return alert("Las urnas estan vacias de votos.");

  // Detener el reloj automáticamente durante la evaluación
  clearInterval(intervaloCronometroCifras);
  intervaloCronometroCifras = null;

  const contenedor = document.getElementById("tvListaRespuestasCifras");
  contenedor.setAttribute("data-validado", "true");

  contenedor.innerHTML = `<h4 style='color:#8c6d31; margin:0 0 12px 0; font-variant: small-caps;'>Juicio de la Ronda ${rondaActualCifras} / 5:</h4>`;

  jugadoresCifras.forEach(j => {
    if (puntuacionJuegoCifras[j.id] === undefined) puntuacionJuegoCifras[j.id] = 0;
  });

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
      motivo: verificacion.motivo || "Voto ausente"
    };
  });

  const alguienAcertoExacto = jugadoresEvaluados.some(j => j.valido && j.distancia === 0);

  let menorDistanciaRonda = Infinity;
  jugadoresEvaluados.forEach(j => {
    if (j.valido && j.distancia < menorDistanciaRonda) {
      menorDistanciaRonda = j.distancia;
    }
  });

  jugadoresEvaluados.forEach(j => {
    let puntosRondaLocal = 0;
    let lineaHtml = "";

    if (j.valido) {
      const esExacto = j.distancia === 0;

      if (esExacto) {
        puntosRondaLocal = 2;
      } else if (!alguienAcertoExacto && j.distancia === menorDistanciaRonda) {
        puntosRondaLocal = 1;
      }

      puntuacionJuegoCifras[j.id] += puntosRondaLocal;

      const colorTexto = esExacto ? "#2e4225" : "#a37a1a";
      lineaHtml = `
        <div style="padding:10px; background:#f4f7f1; border-left: 4px solid #2e4225; margin-bottom:8px; color: #2c221e;">
          <strong>Ofrenda de ${j.name}:</strong> <code style="background:#fff; padding:2px 4px; border:1px solid #e3dac9;">${j.formula}</code> = <strong>${j.resultado}</strong> 
          <br><span style="color:${colorTexto}; font-size:0.9rem; font-weight: bold; font-variant: small-caps;">(${esExacto ? 'Calculo exacto bendecido con +2' : `Proximidad al destino concedida a ${j.distancia} unidades.`})</span>
          <strong style="float:right; color:#8c6d31; font-variant: small-caps;">+${puntosRondaLocal} Favor</strong>
        </div>`;
    } else {
      lineaHtml = `
        <div style="padding:10px; background:#fff2f2; border-left: 4px solid #912b2b; margin-bottom:8px; opacity: 0.8; color: #2c221e;">
          <strong>Ofrenda de ${j.name}:</strong> <code>${j.formula || "N/A"}</code>
          <br><span style="font-size:0.85rem; color:#912b2b; font-weight: bold; font-variant: small-caps;">Rechazado por las Moiras: ${j.motivo}</span>
        </div>`;
    }

    contenedor.innerHTML += lineaHtml;
  });

  for (let j of jugadoresCifras) {
    try {
      await updateDoc(doc(window.db, "players", j.id), { cifrasFormula: "" });
    } catch (err) {
      console.error("Error al purgar pergaminos antiguos:", err);
    }
  }

  let listaRankingJuego = jugadoresCifras.map(j => ({
    id: j.id,
    name: j.name,
    scoreJuego: puntuacionJuegoCifras[j.id]
  }));

  listaRankingJuego.sort((a, b) => b.scoreJuego - a.scoreJuego);

  let tablaHtml = `
    <div style="margin-top: 25px; background: #fffdf5; padding: 15px; border: 2px solid #b89047;">
      <h3 style="color: #8c6d31; margin-top: 0; text-align: center; font-size: 1.15rem; font-variant: small-caps; letter-spacing: 1px;">Favor Acumulado en el Altar (Ronda ${rondaActualCifras}/5)</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 1.05rem;">
        <thead>
          <tr style="border-bottom: 2px solid #e3dac9; color: #6e5d4f; font-variant: small-caps;">
            <th style="padding: 6px;">Pos</th>
            <th style="padding: 6px;">Dios</th>
            <th style="padding: 6px; text-align: right;">Puntuación</th>
          </tr>
        </thead>
        <tbody>
  `;

  listaRankingJuego.forEach((jugador, index) => {
    tablaHtml += `
      <tr style="border-bottom: 1px solid #f5ede4;">
        <td style="padding: 8px; font-weight: bold; color: #8c6d31;">#${index + 1}</td>
        <td style="padding: 8px; font-weight: bold;">${jugador.name} ${index === 0 ? '(Elegido)' : ''}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #b89047;">${jugador.scoreJuego} Fv</td>
      </tr>
    `;
  });

  tablaHtml += `</tbody></table></div>`;
  contenedor.innerHTML += tablaHtml;

  if (rondaActualCifras === 5) {
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

          await updateDoc(playerRef, {
            score: scoreGlobalActual + puntosParaFirebase
          });
        } catch (err) {
          console.error("Error al asentar favor final en el firmamento:", err);
        }
      }
    }

  }
};

//========================================
// ==========================================
// Juego: El Juicio de Epimeteo
// ==========================================
let listaSospechososRonda = [];
let todosLosActivosMentiroso = [];
let indiceVerdadero = -1;
let puntosLocalesMentiroso = {};
let rondaActualMentiroso = 0;

window.loadVideosMentiroso = async function () {
  const cont = document.getElementById("tvMultimediaMentiroso");
  if (!cont) return;

  try {
    const resp = await fetch('assets/videosMentiroso/list.json');
    if (!resp.ok) throw new Error('No se pudo leer el manifiesto de videos');
    const lista = await resp.json();
    if (!Array.isArray(lista) || lista.length === 0) return;

    window._mentirosoVideosList = lista;
    window._mentirosoVideoIdx = 0;

    const video = document.createElement('video');
    video.id = 'videoMentirosoPlayer';
    video.style.maxWidth = '100%';
    video.style.maxHeight = '180px';
    video.style.borderRadius = '4px';
    video.style.border = '2px solid #b89047';
    video.controls = true;

    const basePath = 'assets/videosMentiroso/';

    function cargarIndice(i) {
      if (!window._mentirosoVideosList) return;
      if (i < 0 || i >= window._mentirosoVideosList.length) return;
      video.src = basePath + window._mentirosoVideosList[i];
      video.load();
    }

    cargarIndice(0);
    cont.innerHTML = '';
    cont.appendChild(video);

  } catch (e) {
    console.error('Error cargando los testimonios sagrados:', e);
  }
};

window.siguienteEvidenciaMentiroso = function () {
  if (!window._mentirosoVideosList) return alert('No hay pruebas procesadas por el oráculo.');
  window._mentirosoVideoIdx = (window._mentirosoVideoIdx || 0) + 1;
  if (window._mentirosoVideoIdx >= window._mentirosoVideosList.length) {
    window._mentirosoVideoIdx = window._mentirosoVideosList.length - 1;
    return alert('Se han agotado las pruebas del oraculo.');
  }
  const video = document.getElementById('videoMentirosoPlayer');
  if (!video) return;
  video.src = 'assets/videosMentiroso/' + window._mentirosoVideosList[window._mentirosoVideoIdx];
  video.load();
  video.play().catch(() => { });
};

window.loadVideosMentiroso();

window.elegirSospechososAlAzar = async function () {
  try {
    rondaActualMentiroso++;
    window.ocultarVerdadMentiroso();

    const contenedor = document.getElementById("tvSospechososContenedor");

    const snap = await getDocs(query(collection(window.db, "players"), where("active", "==", true)));
    todosLosActivosMentiroso = [];
    snap.forEach(d => { todosLosActivosMentiroso.push({ id: d.id, ...d.data() }); });

    if (todosLosActivosMentiroso.length < 4) {
      return alert(`Se requiere la presencia de mas almas en el tribunal. Minimo 4 (Actuales: ${todosLosActivosMentiroso.length})`);
    }

    todosLosActivosMentiroso.forEach(j => {
      if (puntosLocalesMentiroso[j.id] === undefined) puntosLocalesMentiroso[j.id] = 0;
    });

    let copiaActivos = [...todosLosActivosMentiroso];
    listaSospechososRonda = [];
    for (let i = 0; i < 4; i++) {
      const randomIdx = Math.floor(Math.random() * copiaActivos.length);
      listaSospechososRonda.push(copiaActivos.splice(randomIdx, 1)[0]);
    }

    indiceVerdadero = Math.floor(Math.random() * 4);
    console.log("Acusados en el estrado:", listaSospechososRonda, "Portador de la verdad:", indiceVerdadero);

    contenedor.innerHTML = "";
    listaSospechososRonda.forEach((jugador, index) => {

      let opcionesSelectHtml = `<option value="">Depositar voto</option>`;
      todosLosActivosMentiroso.forEach(activo => {
        if (activo.id !== jugador.id) {
          opcionesSelectHtml += `<option value="${activo.id}">${activo.name}</option>`;
        }
      });

      const card = document.createElement("div");
      card.id = `cardSospechoso-${index}`;
      card.style.background = "#fffdfa";
      card.style.padding = "15px";
      card.style.border = "2px solid #e3dac9";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "10px";

      card.innerHTML = `
        <div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #2c251e; font-variant: small-caps;">${jugador.name}</div>
          <div id="rol-${index}" style="color: #8c6d31; font-weight: bold; font-size: 0.85rem; margin-top: 4px; font-variant: small-caps; letter-spacing: 1px;">SOSPECHOSO</div>
        </div>

        <div style="background: #faf8f2; padding: 8px; border: 1px dashed #b89047;">
          <select id="selectVotante-${index}" onchange="registrarVotoHaciaSospechoso(${index}, this)" style="background:#fffdfa; color:#2c251e; border:1px solid #b89047; padding:4px; font-family:inherit; font-size:0.85rem; width:100%;">
            ${opcionesSelectHtml}
          </select>
          <div id="listaVotosRecibidos-${index}" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; justify-content:center;">
          </div>
        </div>
      `;
      contenedor.appendChild(card);
    });

    if (window._mentirosoVideosList && window._mentirosoVideosList.length > 0) {
      window._mentirosoVideoIdx = 0;
      const vid = document.getElementById('videoMentirosoPlayer');
      if (vid) {
        vid.src = 'assets/videosMentiroso/' + window._mentirosoVideosList[0];
        vid.load();
      }
    }

    window.actualizarPizarraRankingLocal();

  } catch (e) {
    console.error("Error al abrir el tribunal de Epimeteo:", e);
  }
};

window.registrarVotoHaciaSospechoso = function (indiceSospechoso, selectElement) {
  const jugadorId = selectElement.value;
  if (!jugadorId) return;

  const jugadorObjeto = todosLosActivosMentiroso.find(j => j.id === jugadorId);
  if (!jugadorObjeto) return;

  const contenedorFichas = document.getElementById(`listaVotosRecibidos-${indiceSospechoso}`);

  if (document.getElementById(`votoFicha-${jugadorId}`)) {
    alert("Esta alma ya ha depositado su voto en la pizarra.");
    selectElement.value = "";
    return;
  }

  const ficha = document.createElement("span");
  ficha.id = `votoFicha-${jugadorId}`;
  ficha.setAttribute("data-votante-id", jugadorId);
  ficha.style.background = "#8c6d31";
  ficha.style.color = "white";
  ficha.style.padding = "2px 6px";
  ficha.style.fontSize = "0.8rem";
  ficha.style.fontWeight = "bold";
  ficha.style.fontVariant = "small-caps";
  ficha.style.cursor = "pointer";
  ficha.title = "Retirar voto de la urna";
  ficha.innerText = `Voto: ${jugadorObjeto.name}`;

  ficha.onclick = () => { ficha.remove(); };

  contenedorFichas.appendChild(ficha);
  selectElement.value = "";
};

window.revelarVerdadMentiroso = function () {
  if (listaSospechososRonda.length === 0) return alert("No hay acusados bajo el dictamen del tribunal.");

  const ganador = listaSospechososRonda[indiceVerdadero];
  const cartelSolucion = document.getElementById("tvSolucionMentiroso");
  cartelSolucion.innerText = `${ganador.name.toUpperCase()} CUSTODIA LA VERDAD`;
  cartelSolucion.style.color = "#2e4225";

  listaSospechososRonda.forEach((j, index) => {
    const card = document.getElementById(`cardSospechoso-${index}`);
    const rolTexto = document.getElementById(`rol-${index}`);

    if (index === indiceVerdadero) {
      if (card) {
        card.style.borderColor = "#2e4225";
        card.style.background = "#f4f7f1";
      }
      if (rolTexto) {
        rolTexto.innerText = "HONESTO";
        rolTexto.style.color = "#2e4225";
      }
    } else {
      if (card) {
        card.style.borderColor = "#912b2b";
        card.style.opacity = "0.6";
      }
      if (rolTexto) {
        rolTexto.innerText = "MENTIROSO";
        rolTexto.style.color = "#912b2b";
      }
    }
  });

  document.getElementById("tvMultimediaOculta").style.display = "none";
  document.getElementById("tvMultimediaMentiroso").style.display = "block";
  const v = document.getElementById('videoMentirosoPlayer');
  if (v) v.play().catch(() => { });
};

window.ocultarVerdadMentiroso = function () {
  const cartelSolucion = document.getElementById("tvSolucionMentiroso");
  cartelSolucion.innerText = "OCULTO";
  cartelSolucion.style.color = "#a37a1a";

  listaSospechososRonda.forEach((j, index) => {
    const card = document.getElementById(`cardSospechoso-${index}`);
    const rolTexto = document.getElementById(`rol-${index}`);
    if (card) {
      card.style.borderColor = "#e3dac9";
      card.style.background = "#fffdfa";
      card.style.opacity = "1";
    }
    if (rolTexto) {
      rolTexto.innerText = "SOSPECHOSO";
      rolTexto.style.color = "#8c6d31";
    }
  });

  document.getElementById("tvMultimediaMentiroso").style.display = "none";
  document.getElementById("tvMultimediaOculta").style.display = "flex";
  const v = document.getElementById('videoMentirosoPlayer');
  if (v) { try { v.pause(); v.currentTime = 0; } catch (e) { } }
};

window.validarVotosYAcertantesMentiroso = function () {
  if (listaSospechososRonda.length === 0 || indiceVerdadero === -1) return alert("No hay causas abiertas en esta ronda.");

  window.revelarVerdadMentiroso();

  const idGanadorVerdadero = listaSospechososRonda[indiceVerdadero].id;

  let recuentoVotosPorSospechoso = {};
  let totalVotosEnMentiras = 0;
  let totalVotosEnVerdad = 0;
  let desgloseAlert = "Escrutinio del Tribunal de Epimeteo:\n\n";

  listaSospechososRonda.forEach((sospechoso, index) => {
    const contenedorVotos = document.getElementById(`listaVotosRecibidos-${index}`);
    const fichas = contenedorVotos.querySelectorAll("[data-votante-id]");

    recuentoVotosPorSospechoso[index] = fichas.length;

    if (index === indiceVerdadero) {
      totalVotosEnVerdad += fichas.length;
    } else {
      totalVotosEnMentiras += fichas.length;
    }
  });

  listaSospechososRonda.forEach((sospechoso, index) => {

    if (index !== indiceVerdadero) {
      const votosEngañados = recuentoVotosPorSospechoso[index];
      if (votosEngañados > 0) {
        puntosLocalesMentiroso[sospechoso.id] += votosEngañados;
        desgloseAlert += `Mentiroso [${sospechoso.name}]: +${votosEngañados} punto(s) de favor por confundir a las almas.\n`;
      }
    }
    else {
      const puntosCalculadosVerdad = totalVotosEnVerdad - totalVotosEnMentiras;
      puntosLocalesMentiroso[sospechoso.id] += puntosCalculadosVerdad;
      desgloseAlert += `Honesto [${sospechoso.name}]: Recibio ${totalVotosEnVerdad} votos frente a ${totalVotosEnMentiras} Herejias. Balance Neto: ${puntosCalculadosVerdad >= 0 ? '+' : ''}${puntosCalculadosVerdad} punto(s).\n`;
    }

    if (index === indiceVerdadero) {
      const contenedorCorrecto = document.getElementById(`listaVotosRecibidos-${indiceVerdadero}`);
      const fichasCorrectas = contenedorCorrecto.querySelectorAll("[data-votante-id]");

      if (fichasCorrectas.length > 0) desgloseAlert += `\nAlmas Justas que acertaron (+1 Favor):\n`;
      fichasCorrectas.forEach(ficha => {
        const idVotante = ficha.getAttribute("data-votante-id");
        if (puntosLocalesMentiroso[idVotante] !== undefined) {
          puntosLocalesMentiroso[idVotante] += 1;

          const pObj = todosLosActivosMentiroso.find(p => p.id === idVotante);
          desgloseAlert += ` - ${pObj ? pObj.name : 'Alma'} \n`;
        }
      });
    }
  });

  window.actualizarPizarraRankingLocal();
};

window.actualizarPizarraRankingLocal = function () {
  const listaContenedor = document.getElementById("listaPuntosLocalesMentiroso");
  if (!listaContenedor) return;

  let rankingOrdenado = Object.keys(puntosLocalesMentiroso).map(id => {
    const player = todosLosActivosMentiroso.find(p => p.id === id);
    return {
      id: id,
      name: player ? player.name : "Alma Perdida",
      pts: puntosLocalesMentiroso[id]
    };
  });

  rankingOrdenado.sort((a, b) => b.pts - a.pts);

  listaContenedor.innerHTML = "";
  let prevPts = null;
  let prevRank = 0;
  for (let i = 0; i < rankingOrdenado.length; i++) {
    const jugador = rankingOrdenado[i];
    let rank = 0;
    if (i === 0) {
      rank = 1;
    } else {
      if (jugador.pts === prevPts) rank = prevRank; else rank = i + 1;
    }
    prevPts = jugador.pts;
    prevRank = rank;

    listaContenedor.innerHTML += `
      <div style="display:flex; justify-content:space-between; background:#faf8f2; padding:6px 10px; border:1px solid #e3dac9;">
        <span style="font-weight:bold;">Pos ${rank}: ${jugador.name}</span>
        <strong style="color:#8c6d31;">${jugador.pts} Fv</strong>
      </div>
    `;
  }
};

window.finalizarMinijuegoMentiroso = async function () {
  if (Object.keys(puntosLocalesMentiroso).length === 0) return alert("Las actas del tribunal estan vacias.");

  const confirmar = confirm("¿Deseas concluir el Juicio de Epimeteo y transferir las mercedes de favor al firmamento global?");
  if (!confirmar) return;

  let rankingFinal = Object.keys(puntosLocalesMentiroso).map(id => ({
    id: id,
    ptsLocales: puntosLocalesMentiroso[id]
  })).sort((a, b) => b.ptsLocales - a.ptsLocales);

  const tablaEscalaGlobal = [10, 8, 6, 5, 4, 3, 2, 1];

  let prevPts = null;
  let puntosAsignadosTorneo = 0;

  for (let i = 0; i < rankingFinal.length; i++) {
    const jRank = rankingFinal[i];

    if (i > 0 && jRank.ptsLocales === prevPts) {
      // Se mantiene por el empate
    } else {
      puntosAsignadosTorneo = tablaEscalaGlobal[i] || 0;
    }

    prevPts = jRank.ptsLocales;

    if (puntosAsignadosTorneo > 0) {
      try {
        const playerRef = doc(window.db, "players", jRank.id);
        const snap = await getDocs(query(collection(window.db, "players")));
        let scoreGlobalActual = 0;

        snap.forEach(d => { if (d.id === jRank.id) scoreGlobalActual = d.data().score ?? 0; });

        await updateDoc(playerRef, {
          score: scoreGlobalActual + puntosAsignadosTorneo
        });

        console.log(`Consagrado: ${jRank.id} asciende con +${puntosAsignadosTorneo} de Gracia.`);
      } catch (error) {
        console.error("Error al elevar los puntos globales al Olimpo:", error);
      }
    }
  }

  puntosLocalesMentiroso = {};
  rondaActualMentiroso = 0;
  window.ocultarVerdadMentiroso();
};
// ==========================================
// Juego 9º: El último teorema (TELEVISIÓN)
// ==========================================

// Referencias a las pantallas
const viewInicio = document.getElementById("viewInicio");
const viewInput = document.getElementById("viewInput");
const viewRespuestas = document.getElementById("viewRespuestas");
const viewMuerte = document.getElementById("viewMuerte"); // Nueva

// Referencias a los componentes
const btnEmpezar = document.getElementById("btnEmpezar");
const btnMostrarRespuestas = document.getElementById("btnMostrarRespuestas");
const btnSiguienteRonda = document.getElementById("btnSiguienteRonda");
const btnMuerteSiguiente = document.getElementById("btnMuerteSiguiente"); // Nueva
const listaRespuestas = document.getElementById("listaRespuestas");
const contenedorMedia = document.getElementById("contenedorMedia");
const mensajeMuerte = document.getElementById("mensajeMuerte"); // Nueva
const btnFinalizarJuego = document.getElementById("btnFinalizarJuego");

const viewVideo = document.getElementById("viewVideo");
const viewWinner = document.getElementById("viewWinner");
const videoFinal = document.getElementById("videoFinal");
const textoGanador = document.getElementById("textoGanador");

btnFinalizarJuego.addEventListener("click", async () => {
  viewMuerte.style.display = "none";

  viewVideo.style.display = "block";

  videoFinal.play();

  abrirFullscreen();
});

const video = document.getElementById("videoFinal");

// Evita pausa con click
video.addEventListener("pause", () => {
  video.play();
});

// Evita interacción con teclado
document.addEventListener("keydown", (e) => {
  if (video.style.display !== "none") {
    e.preventDefault();
  }
});

function abrirFullscreen() {
  const elem = document.getElementById("viewVideo");

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

let videoStarted = false;
videoFinal.addEventListener("play", () => {
  videoStarted = true;
});

/*
videoFinal.addEventListener("ended", async () => {
  const ganador = await obtenerGanador();

  viewVideo.style.display = "none";
  viewWinner.style.display = "block";

  const img = document.getElementById("winnerImg");
  const texto = document.getElementById("textoGanador");

  img.src = ganador.img || "default.png";
  texto.innerHTML = ganador.name;
});
*/

// Diccionario de reglas traducidas (Asegúrate de tener este elemento 'textoRegla' en tu HTML)
const textosReglas = {
  "1": "1 jugador eliminado: Si dos o más jugadores eligen el mismo número, serán descalificados de la ronda y cada uno perderá un punto.",
  "2": "2 jugadores eliminados: Elegir el número exacto correcto hará que los demás jugadores pierdan dos puntos en lugar de uno.",
  "3": "3 jugadores eliminados: Si un jugador elige 0, el otro jugador puede ganar eligiendo 100."
};

let jugadoresActivosIds = [];
let penalizacionSeleccionada = -1;

// --- NAVEGACIÓN Y REINICIO INICIAL ---

btnEmpezar.addEventListener("click", async () => {
  btnEmpezar.disabled = true;
  btnEmpezar.textContent = "Reiniciando partida...";

  try {
    const checks = document.querySelectorAll(".chkJugador");

    // 1. SOLO definimos vivos/muertos según checkbox
    for (const check of checks) {
      const jugadorRef = doc(window.db, "players", check.dataset.id);

      await updateDoc(jugadorRef, {
        "tenbin.isAlive": check.checked
      });
    }

    // 2. TODOS los jugadores activos resetean partida (pero NO resucitamos nadie aquí)
    const playersRef = collection(window.db, "players");
    const querySnapshot = await getDocs(
      query(playersRef, where("active", "==", true))
    );

    for (const docSnap of querySnapshot.docs) {
      const jugadorRef = doc(window.db, "players", docSnap.id);

      await updateDoc(jugadorRef, {
        "tenbin.score": 0,
        "tenbin.currentNumber": null
      });
    }

    viewInicio.style.display = "none";
    viewInput.style.display = "block";

  } catch (error) {
    console.error("Error al reiniciar los jugadores:", error);
    alert("Hubo un error al iniciar el juego en Firebase.");
  } finally {
    btnEmpezar.disabled = false;
    btnEmpezar.textContent = "Empezar juego";
  }
});

document.getElementById("penal1").onclick = () => {
  penalizacionSeleccionada = -1;
};

document.getElementById("penal2").onclick = () => {
  penalizacionSeleccionada = -2;
};

btnMostrarRespuestas.addEventListener("click", () => {
  viewInput.style.display = "none";
  viewRespuestas.style.display = "block";
  btnSiguienteRonda.style.display = "none";
  cargarRespuestasFirebase();
});

// Botón de la pantalla de muerte: Regresa a la pantalla de introducir número
btnMuerteSiguiente.addEventListener("click", () => {
  viewMuerte.style.display = "none";
  viewInput.style.display = "block";
});

// Asignar eventos para los botones de las reglas en la pantalla de muerte
document.querySelectorAll(".btn-regla").forEach(boton => {
  boton.addEventListener("click", (e) => {
    const numeroRegla = e.target.getAttribute("data-regla");
    const textoRegla = document.getElementById("textoRegla");
    if (textoRegla) {
      textoRegla.textContent = textosReglas[numeroRegla];
    }
  });
});

// --- LOGICA DE ACTUALIZACIÓN Y DETECCIÓN DE MUERTE ---

btnSiguienteRonda.addEventListener("click", async () => {
  btnSiguienteRonda.disabled = true;
  btnSiguienteRonda.textContent = "Actualizando puntos...";

  try {
    let jugadoresMuertos = [];

    for (const jugadorId of jugadoresActivosIds) {
      const checkbox = document.getElementById(`chk-${jugadorId}`);
      const jugadorRef = doc(window.db, "players", jugadorId);

      if (checkbox && !checkbox.checked) {
        // Restamos punto si no estaba seleccionado y limpiamos el número para la siguiente ronda
        await updateDoc(jugadorRef, {
          "tenbin.score": increment(penalizacionSeleccionada),
          "tenbin.currentNumber": null
        });

        // Recuperamos los datos actualizados para ver si el jugador muere
        const snapActualizado = await getDoc(jugadorRef);
        const dataActualizada = snapActualizado.data();
        const scoreActual = dataActualizada.tenbin?.score ?? 0;
        const nombreJugador = dataActualizada.name || `Jugador (${jugadorId.substring(0, 5)})`;

        if (scoreActual <= -10) {
          await updateDoc(jugadorRef, {
            "tenbin.isAlive": false
          });
          jugadoresMuertos.push(nombreJugador);
        }
      } else {
        // Si el jugador se salvó (marcado), también hay que limpiarle el número para la siguiente ronda
        await updateDoc(jugadorRef, {
          "tenbin.currentNumber": null
        });
      }
    }

    const vivosRestantes = await comprobarVivos();

    // Decidir navegación de pantallas en la TV
    // Decidir navegación de pantallas en la TV
    viewRespuestas.style.display = "none";

    btnFinalizarJuego.style.display = "none";

    if (vivosRestantes <= 1) {
      viewInput.style.display = "none";
      viewMuerte.style.display = "block";

      mensajeMuerte.innerHTML = `
      <span style="color:#ff4a4a; font-size: 20px;">
        🎉 El juego ha terminado
      </span><br>
      <span>Queda un único jugador vivo</span>
    `;

      btnFinalizarJuego.style.display = "inline-block";
    }
    else if (jugadoresMuertos.length > 0) {

      const textoRegla = document.getElementById("textoRegla");
      if (textoRegla) {
        textoRegla.textContent = "Haz clic en una regla para ver los detalles.";
      }

      mensajeMuerte.innerHTML = `Ha muerto el jugador: <br><span style="color: #ff4a4a;">${jugadoresMuertos.join(", ")}</span>`;
      viewMuerte.style.display = "block";

    }
    else {
      viewInput.style.display = "block";
    }

  } catch (error) {
    console.error("❌ Error al actualizar los puntajes en la ronda:", error);
    alert("Hubo un error al procesar la ronda.");
  } finally {
    btnSiguienteRonda.disabled = false;
    btnSiguienteRonda.textContent = "Siguiente ronda";
  }
});

// --- MOSTRAR RESPUESTAS Y FILTRAR CON ISALIVE ---

async function cargarRespuestasFirebase() {
  try {
    listaRespuestas.innerHTML = "Cargando respuestas...";
    contenedorMedia.innerHTML = "Calculando media...";
    jugadoresActivosIds = [];

    const playersRef = collection(window.db, "players");
    const q = query(playersRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);

    let htmlContenido = "<div style='display: flex; flex-direction: column; gap: 10px;'>";

    let sumaNumeros = 0;
    let totalJugadoresConNumero = 0;
    let resultadoFinal = 0;

    // ==============================
    // 1. PRIMER PASO: calcular media
    // ==============================
    const jugadoresData = [];

    querySnapshot.forEach((documento) => {
      const data = documento.data();

      if (data.tenbin && data.tenbin.isAlive === false) return;

      const jugadorId = documento.id;
      const nombreJugador = data.name || `Jugador (${jugadorId.substring(0, 5)})`;
      const scoreActual = data.tenbin?.score ?? 0;

      const numeroActual = (data.tenbin && data.tenbin.currentNumber !== undefined)
        ? Number(data.tenbin.currentNumber)
        : null;

      if (numeroActual !== null && !isNaN(numeroActual)) {
        sumaNumeros += numeroActual;
        totalJugadoresConNumero++;
      }

      jugadoresData.push({
        jugadorId,
        nombreJugador,
        scoreActual,
        numeroActual
      });
    });

    // ==============================
    // 2. calcular resultadoFinal UNA VEZ
    // ==============================
    if (totalJugadoresConNumero > 0) {
      const media = sumaNumeros / totalJugadoresConNumero;
      resultadoFinal = +(media * 0.8).toFixed(2);
    }

    // ==============================
    // 3. SEGUNDO PASO: render UI
    // ==============================
    jugadoresData.forEach((j) => {
      const distanciaMedia =
        (j.numeroActual !== null && !isNaN(j.numeroActual))
          ? Math.abs(j.numeroActual - resultadoFinal)
          : null;

      jugadoresActivosIds.push(j.jugadorId);

      htmlContenido += `
        <label style='display: flex; align-items: center; justify-content: space-between; background: #222; padding: 10px; border-radius: 4px; cursor: pointer;'>
          <div style='display: flex; align-items: center; gap: 10px;'>
            <input type='checkbox' id='chk-${j.jugadorId}' style='transform: scale(1.2);'>
            <span>
              <strong>${j.nombreJugador}:</strong>
              ${j.numeroActual !== null ? j.numeroActual : "Sin número"}
              ${distanciaMedia !== null ? ` · Δ ${distanciaMedia.toFixed(2)}` : ""}
            </span>
          </div>

          <span style='background: #444; padding: 2px 8px; border-radius: 12px; font-size: 14px;'>
            Score: ${j.scoreActual}
          </span>
        </label>
      `;
    });

    htmlContenido += "</div>";

    // ==============================
    // 4. mostrar media
    // ==============================
    if (totalJugadoresConNumero > 0) {
      contenedorMedia.innerHTML = `
        <span style="font-size: 14px; text-transform: uppercase; color: #aaa; letter-spacing: 1px;">
          Media × 0.8
        </span>
        <div style="font-size: 48px; font-weight: bold; color: #ff4a4a; margin-top: 5px;">
          ${resultadoFinal}
        </div>
      `;
    } else {
      contenedorMedia.innerHTML =
        "<span>No hay números suficientes para calcular la media.</span>";
    }

    // ==============================
    // 5. UI final
    // ==============================
    if (jugadoresData.length === 0) {
      htmlContenido = "<p>No hay jugadores vivos y activos en este momento.</p>";
      btnSiguienteRonda.style.display = "none";
    } else {
      btnSiguienteRonda.style.display = "inline-block";
    }

    listaRespuestas.innerHTML = htmlContenido;

  } catch (error) {
    console.error("Error al obtener datos de Firebase:", error);
    listaRespuestas.innerHTML =
      "<p style='color: red;'>Error al cargar las respuestas.</p>";
  }
}

async function cargarSeleccionJugadores() {

  const playersRef = collection(window.db, "players");
  const snapshot = await getDocs(playersRef);

  let html = "";

  snapshot.forEach(docSnap => {

    const data = docSnap.data();

    html += `
      <div>
        <label>
          <input
            type="checkbox"
            data-id="${docSnap.id}"
            class="chkJugador"
            ${data.tenbin?.isAlive ? "checked" : ""}
          >
          ${data.name}
        </label>
      </div>
    `;
  });

  document.getElementById("listaSeleccionJugadores").innerHTML = html;
}

cargarSeleccionJugadores();

async function comprobarVivos() {
  const playersRef = collection(window.db, "players");
  const snapshot = await getDocs(playersRef);

  let vivos = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.active && data.tenbin?.isAlive) {
      vivos++;
    }
  });

  return vivos;
}

async function obtenerGanador() {
  const playersRef = collection(window.db, "players");
  const snapshot = await getDocs(playersRef);

  let ganador = null;
  let mejorScore = -Infinity;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (!data.tenbin?.isAlive) return;

    const score = data.tenbin?.score ?? 0;

    if (score > mejorScore) {
      mejorScore = score;
      ganador = {
        name: data.name,
        img: data.imgCard || ""
      };
    }
  });

  return ganador;
}










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
        lentejasGuess: null,
        cifrasFormula: null,
        votoEnviado: null
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
  await updateDoc(doc(window.db, "game", "numberState"), {
    cifrasDisponibles: null,
    cifrasObjetivo: null
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


