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
  document.getElementById(screen).style.display = "block"

  if (screen === "screenNumbersAndLetters") {
    cifrasLetras();
  }
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

const constGames = [
  "El viaje de Ulises",
  "El canto de Orfeo",
  "La torre de Dédalo",
  "El precio de las Moiras",
  "El veredicto de los dioses",
  "El oráculo de Delfos",
  "El cálculo de Láquesis",
  "El juicio de Epimeteo",
  "El último teorema"
];

let ruletaJuegosGirando = false;
let juegoDestinoGuardado = ""; // Guardará temporalmente a dónde ir

// A. DIBUJAR LA RULETA AUTOMÁTICAMENTE AL CARGAR EL SCRIPT

function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);

  let r = (num >> 16) + Math.round(2.55 * percent);
  let g = ((num >> 8) & 0x00FF) + Math.round(2.55 * percent);
  let b = (num & 0x0000FF) + Math.round(2.55 * percent);

  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);

  return `rgb(${r}, ${g}, ${b})`;
}

window.inicializarRuletaJuegos = function () {
  const canvas = document.getElementById("canvasRuletaJuegos");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const numSectores = constGames.length;
  const angularArco = (2 * Math.PI) / numSectores;
  const centro = canvas.width / 2;
  const radio = centro;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Colores llamativos alternos para los sectores de la ruleta
  // Paleta de colores de la Grecia Clásica para el Canvas
  const colores = [
    "#d4af37", // Oro clásico
    "#c0c0c0", // Plata
    "#cd7f32", // Bronce
    "#b87333", // Cobre
    "#e5e4e2", // Plata clara / brillo
    "#bfa46f", // Oro envejecido
    "#8c7853", // Latón antiguo
    "#f2d16b", // Oro brillante
    "#a8a8a8", // Metal acero
    "#c49a6c"  // Oro arena metálico
  ];

  constGames.forEach((game, i) => {
    const anguloInicio = i * angularArco;
    const anguloFin = anguloInicio + angularArco;

    // Pintar trozo de tarta
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(
      0, 0,
      canvas.width, canvas.height
    );

    const base = colores[i];

    gradient.addColorStop(0, base);
    gradient.addColorStop(0.5, lightenColor(base, 25));
    gradient.addColorStop(1, base);

    ctx.fillStyle = gradient;
    ctx.moveTo(centro, centro);
    ctx.arc(centro, centro, radio, anguloInicio, anguloFin);
    ctx.lineTo(centro, centro);
    ctx.fill();
    const light = ctx.createRadialGradient(
      centro, centro, 10,
      centro, centro, radio
    );

    light.addColorStop(0, "rgba(255,255,255,0.18)");
    light.addColorStop(0.3, "rgba(255,255,255,0.05)");
    light.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = light;
    ctx.fill();

    // Escribir el nombre del juego
    ctx.save();
    ctx.translate(centro, centro);
    ctx.rotate(anguloInicio + angularArco / 2);
    ctx.fillStyle = "#3b2f1a";
    ctx.font = "bold 10px Cinzel Decorative";
    ctx.textAlign = "right";
    let text = game;

    if (text.length > 12) {
      text = text.slice(0, 12) + "…";
    }

    ctx.fillText(text, radio - 15, 4);
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
  txtResultado.innerHTML = `⚖️ Destino dictado: <span style="color:#bd5332; font-weight:900;">${gameSelected}</span>`;
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

    alert(`✅ Ajuste aplicado. ${nombreJugador} ahora tiene ${scoreGlobalActual + puntosAAjustar} pts globales.`);
    inputPts.value = ""; // Limpiar input

  } catch (error) {
    console.error("Error en el ajuste manual:", error);
    alert("No se pudo actualizar la base de datos.");
  } finally {
    boton.disabled = false;
    boton.innerText = "⚙️ Aplicar";
  }
};

// =====================
// Juego WorldGuessr, que aparezca la imagen por cada tecla pulsada.
// =====================
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
let tiempoRestante = 10;  // Tiempo límite por canción
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
  }, 1000);
}

function pausarCronometro() {
  clearInterval(IDIntervalo);
  IDIntervalo = null;
}

async function reiniciarCronometro() {
  pausarCronometro();
  tiempoRestante = 10;
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
  return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

// 6. FASE 1 DE LA RESPUESTA: MOSTRAR TÍTULO, AUTOR LIMPIOS Y EVALUAR "P / I"
async function revelarRespuesta() {
  reproductor.pause();
  pausarCronometro();

  const cancionActual = listaCanciones[indiceActual];
  txtNombreCancion.textContent = cancionActual.nombreCancion || "Desconocido";
  txtAutor.textContent = cancionActual.autor || "Desconocido";

  contenedorRespuestasUsuarios.style.display = "none";
  btnVerRespuestas.style.display = "inline-block";

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

        // 🔥 LEER E IMPRIMIR 'scoreSong' EN LA UI DE RESPUESTAS
        const scoreSongActual = datosJugador.scoreSong || 0;
        const contenedorTexto = document.createElement('div');
        contenedorTexto.innerHTML = `👤 <strong>${datosJugador.name || "Jugador"}:</strong> "${cancionMostrar}" de <em>${autorMostrar}</em> <span style="font-size: 14px; color: #3498db; margin-left: 10px; font-weight: bold;">(Song Score: ${scoreSongActual} pts)</span>`;

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
  if (indice < listaCanciones.length) {
    pantallaRespuesta.style.display = "none";
    contenedorRespuestasUsuarios.style.display = "none";
    pantallaJuego.style.display = "block";

    reproductor.src = listaCanciones[indice].url;
    barraProgreso.value = 0;
    tiempoActualTxt.textContent = "0:00";
    reiniciarCronometro();

    botonPlay.disabled = false;
    botonPlay.textContent = "Reproducir Música 🎵";
    botonSiguiente.disabled = false;
  } else {
    pantallaRespuesta.style.display = "none";
    pantallaJuego.style.display = "block";
    reiniciarCronometro();

    juegoTerminado = true;
    botonPlay.textContent = "Ver Ranking Final 🏆";
    botonPlay.disabled = false;
    botonSiguiente.disabled = true;

    alert("¡Has terminado todas las canciones disponibles! Pulsa el botón para ver el Ranking.");
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
        listaCanciones.push(doc.data());
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
      botonPlay.textContent = "Pausar ⏸️";
      iniciarCronometro();
    } else {
      reproductor.pause();
      botonPlay.textContent = "Reproducir Música 🎵";
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
  } catch (e) {
    console.error("Error al limpiar respuestas en Firestore:", e);
  }

  botonContinuar.disabled = false;
  botonContinuar.textContent = "Siguiente Canción ➡️";

  indiceActual++;
  cargarCancion(indiceActual);
});


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
// Juego 5º Votes
// ==========================================
// --- VARIABLES GLOBALES NUEVAS PARA EL JUEGO DE VOTACIÓN ---
let jugadoresVotacion = [];  // Datos locales de los votos recibidos
let votosVisibles = false;   // Estado de privacidad en la TV

// 1. INICIALIZAR LA ESCUCHA DE LA VOTACIÓN EN TIEMPO REAL
async function iniciarEscuchaVotaciones() {
  if (document.readyState === "loading") {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }

  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    const contenedor = document.getElementById("tvListaVotos");
    if (!contenedor) return;

    // Si ya hemos aplicado puntos y cerrado, no sobreescribir el diseño final
    if (contenedor.getAttribute("data-votado-final") === "true") return;

    jugadoresVotacion = [];
    contenedor.innerHTML = "";

    snapshot.forEach((playerDoc) => {
      const p = playerDoc.data();
      // Asumimos que el móvil guardará en 'votoEnviado' el ID o Nombre del jugador elegido
      jugadoresVotacion.push({
        id: playerDoc.id,
        name: p.name,
        votoEnviado: p.votoEnviado || ""
      });
    });

    // Pintar los resultados en la urna de la TV
    jugadoresVotacion.forEach((j) => {
      const item = document.createElement("div");
      item.style.padding = "12px";
      item.style.background = "#222";
      item.style.borderRadius = "6px";
      item.style.border = j.votoEnviado ? "1px solid #e91e63" : "1px solid #444";
      item.style.marginBottom = "8px";

      if (j.votoEnviado) {
        // MODO ANÓNIMO: Muestra que votó, pero no a quién
        if (!votosVisibles) {
          item.innerHTML = `<strong>🗳️ ${j.name}:</strong> <span style="color: #e91e63; font-weight: bold;">¡Voto emitido en la urna! 🔒</span>`;
        }
        // MODO VISIBLE: Destapa el pastel
        else {
          item.innerHTML = `<strong>👤 ${j.name}:</strong> Ha votado a 👉 <code style="color: #00e676; font-size:1.1rem; font-family:sans-serif;">${j.votoEnviado}</code>`;
        }
      } else {
        item.innerHTML = `<strong>⏳ ${j.name}:</strong> <span style="color: #666; font-style: italic;">Pensando su voto...</span>`;
      }
      contenedor.appendChild(item);
    });
  });
}
iniciarEscuchaVotaciones();

// 2. BOTÓN PRESENTADOR: ABRIR O REINICIAR VOTACIONES
window.abrirVotacion = async function () {
  votosVisibles = false;
  const contenedor = document.getElementById("tvListaVotos");
  if (contenedor) contenedor.removeAttribute("data-votado-final");

  document.getElementById("tvEstadoPrivacidad").innerText = "ANÓNIMA";
  document.getElementById("tvEstadoPrivacidad").style.color = "#ffc107";

  alert("🔓 Votación abierta. Los móviles se están actualizando...");

  // Limpiar los campos de voto en Firebase para que los móviles se desbloqueen
  for (let j of jugadoresVotacion) {
    try {
      await updateDoc(doc(window.db, "players", j.id), { votoEnviado: "" });
    } catch (e) {
      console.error("Error al resetear voto de " + j.name, e);
    }
  }
};

// 3. BOTÓN PRESENTADOR: REVELAR QUIÉN VOTÓ A QUIÉN
window.revelarVotos = function () {
  votosVisibles = true;

  // Cambiar el cartel de la TV
  const privacidadEtiqueta = document.getElementById("tvEstadoPrivacidad");
  privacidadEtiqueta.innerText = "VISIBLE";
  privacidadEtiqueta.style.color = "#00e676";

  // Forzar el rediseño inmediato leyendo los datos actuales en memoria
  const contenedor = document.getElementById("tvListaVotos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  jugadoresVotacion.forEach((j) => {
    const item = document.createElement("div");
    item.style.padding = "12px";
    item.style.background = "#222";
    item.style.borderRadius = "6px";
    item.style.border = j.votoEnviado ? "1px solid #00e676" : "1px solid #444";
    item.style.marginBottom = "8px";

    if (j.votoEnviado) {
      item.innerHTML = `<strong>👤 ${j.name}:</strong> Ha votado a 👉 <strong style="color: #ffc107;">${j.votoEnviado}</strong>`;
    } else {
      item.innerHTML = `<strong>⏳ ${j.name}:</strong> <span style="color: #666; font-style: italic;">No llegó a votar</span>`;
    }
    contenedor.appendChild(item);
  });
};

// 4. BOTÓN PRESENTADOR: CALCULAR EL RECUENTO GENERAL Y SUMAR +2 A FIREBASE
window.finalizarYSumarVotos = async function () {
  // Asegurarnos de que estén visibles antes de cerrar
  window.revelarVotos();

  const contenedor = document.getElementById("tvListaVotos");
  contenedor.setAttribute("data-votado-final", "true");

  // Crear un diccionario para contar cuántos votos ha recibido cada persona
  let recuentoDeVotos = {};
  jugadoresVotacion.forEach(j => { recuentoDeVotos[j.name] = 0; });

  // Contar
  jugadoresVotacion.forEach(j => {
    if (j.votoEnviado && recuentoDeVotos[j.votoEnviado] !== undefined) {
      recuentoDeVotos[j.votoEnviado]++;
    }
  });

  contenedor.innerHTML = "<h3 style='color:#00e676; margin:0 0 15px 0; text-align:center;'>🏆 Escrutinio Final (+2 Pts por Voto):</h3>";

  // Repartir los puntos en Firebase leyendo la nube
  for (let j of jugadoresVotacion) {
    const votosRecibidos = recuentoDeVotos[j.name] || 0;
    const puntosGanadosGlobales = votosRecibidos * 2;

    // Pintar la tarjeta de resultados en la TV
    const fila = document.createElement("div");
    fila.style.padding = "10px";
    fila.style.background = votosRecibidos > 0 ? "rgba(0, 230, 118, 0.15)" : "#222";
    fila.style.borderLeft = votosRecibidos > 0 ? "4px solid #00e676" : "4px solid #444";
    fila.style.marginBottom = "8px";
    fila.style.display = "flex";
    fila.style.justifyContent = "space-between";
    fila.innerHTML = `
      <span><strong>${j.name}</strong> (Recibió ${votosRecibidos} 🗳️)</span>
      <strong style="color:#00e676;">+${puntosGanadosGlobales} Pts Globales</strong>
    `;
    contenedor.appendChild(fila);

    // Guardar en la base de datos real
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
        console.error("Error sumando votos reales a " + j.name, err);
      }
    }
  }

  alert("🏁 ¡Votos procesados y cargados al Score global con éxito!");
};



// ==========================================
// Juego 6º: Symbol Zone (Con Puntuación Local)
// ==========================================

let rondaActualSymbol = 1;
let tiempoRestanteSymbol = 60; // 1 minuto en segundos
let intervaloCronometroSymbol = null;
let listaJugadoresSymbol = []; // Guarda { id, name, equivocado: true/false }

// MARCADOR LOCAL INTERNO
let puntuacionJuegoSymbol = {}; // Guardará { idJugador: puntosAcumuladosEnJuego }

function symbolZone() {
  console.log("🔺 Iniciando juego SymbolZone en la TV");

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

      // Al empezar la nueva partida, todos los jugadores entran limpios con 0 puntos locales
      if (puntuacionJuegoSymbol[idJugador] === undefined) {
        puntuacionJuegoSymbol[idJugador] = 0;
      }

      listaJugadoresSymbol.push({
        id: idJugador,
        name: p.name,
        equivocado: false
      });
    });

    pintarPanelJugadoresSymbol();
  });
}
symbolZone();

// FUNCIÓN PARA DIBUJAR LOS JUGADORES EN EL PANEL
function pintarPanelJugadoresSymbol() {
  const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
  if (!contenedorLista) return;

  contenedorLista.innerHTML = "";
  contenedorLista.removeAttribute("data-bloqueado");

  listaJugadoresSymbol.forEach((jugador, index) => {
    const card = document.createElement("div");
    card.style.padding = "15px";
    card.style.borderRadius = "8px";
    card.style.textAlign = "center";
    card.style.fontWeight = "bold";
    card.style.cursor = "pointer";
    card.style.transition = "0.2s";
    card.style.userSelect = "none";

    if (jugador.equivocado) {
      card.style.background = "#d32f2f";
      card.style.color = "white";
      card.style.border = "2px solid #ff6666";
      card.innerHTML = `❌<br>${jugador.name}<br><span style='font-size:0.8rem;opacity:0.8;'>+0 pts</span>`;
    } else {
      card.style.background = "#2e7d32";
      card.style.color = "white";
      card.style.border = "2px solid #66bb6a";
      card.innerHTML = `✅<br>${jugador.name}<br><span style='font-size:0.8rem;opacity:0.8;'>+2 pts</span>`;
    }

    card.onclick = () => {
      listaJugadoresSymbol[index].equivocado = !listaJugadoresSymbol[index].equivocado;
      pintarPanelJugadoresSymbol();
    };

    contenedorLista.appendChild(card);
  });
}

// CONTROLADOR DEL CRONÓMETRO
window.controlarTiempoSymbol = function (accion) {
  const elReloj = document.getElementById("tvCronometroSymbol");

  if (accion === "iniciar") {
    if (intervaloCronometroSymbol) return;

    intervaloCronometroSymbol = setInterval(() => {
      if (tiempoRestanteSymbol <= 0) {
        clearInterval(intervaloCronometroSymbol);
        intervaloCronometroSymbol = null;
        if (elReloj) elReloj.style.color = "#ff3d00";
        alert("⏰ ¡Tiempo agotado! Turno de revisar los símbolos.");
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
      elReloj.style.color = "#ff3d00";
    }
    alert("⏰ ¡Tiempo finalizado manualmente por el presentador!");
  }
};

// BOTÓN: GUARDAR RONDA LOCALMENTE Y MOSTRAR MARCADOR PROVISIONAL
// BOTÓN: GUARDAR RONDA LOCALMENTE Y MOSTRAR MARCADOR PROVISIONAL
window.pointsSymbolZone = async function () {
  if (listaJugadoresSymbol.length === 0) return alert("No hay jugadores en la partida.");

  console.log(`🚀 Acumulando puntos locales de la Ronda ${rondaActualSymbol}...`);

  // 1. Sumar puntos en la estructura interna de esta partida
  listaJugadoresSymbol.forEach(j => {
    const puntosRonda = j.equivocado ? 0 : 2;
    if (puntuacionJuegoSymbol[j.id] === undefined) puntuacionJuegoSymbol[j.id] = 0;
    puntuacionJuegoSymbol[j.id] += puntosRonda;
  });

  // 2. Crear el ranking provisional del minijuego para pintarlo en pantalla
  let rankingJuego = listaJugadoresSymbol.map(j => ({
    id: j.id,
    name: j.name,
    scoreJuego: puntuacionJuegoSymbol[j.id]
  }));

  // Ordenar de mayor a menor puntuación local
  rankingJuego.sort((a, b) => b.scoreJuego - a.scoreJuego);

  // 3. Transformar temporalmente el panel del presentador en la tabla de clasificación
  const contenedorLista = document.getElementById("tvListaJugadoresSymbol");
  if (contenedorLista) {
    contenedorLista.setAttribute("data-bloqueado", "true"); // Bloqueo temporal anti-snapshot

    let tablaHtml = `
      <div style="width: 100%; background: #000; padding: 15px; border-radius: 8px; border: 1px solid #ff3d00; box-sizing: border-box; grid-column: 1 / -1;">
        <h3 style="color: #ff3d00; margin-top: 0; text-align: center; font-size: 1.2rem;">🏆 RANKING LOCAL (Ronda ${rondaActualSymbol} / 5)</h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 1rem; color: white;">
          <thead>
            <tr style="border-bottom: 2px solid #333; color: #aaa;">
              <th style="padding: 6px;">Pos</th>
              <th style="padding: 6px;">Jugador</th>
              <th style="padding: 6px; text-align: right;">Puntos Acumulados</th>
            </tr>
          </thead>
          <tbody>
    `;

    rankingJuego.forEach((jugador, index) => {
      tablaHtml += `
        <tr style="border-bottom: 1px solid #222;">
          <td style="padding: 8px; font-weight: bold; color: #ff3d00;">#${index + 1}</td>
          <td style="padding: 8px;">${jugador.name} ${index === 0 ? '👑' : ''}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #ffc107;">${jugador.scoreJuego} pts</td>
        </tr>
      `;
    });

    tablaHtml += `</tbody></table></div>`;
    contenedorLista.innerHTML = tablaHtml;
  }

  alert(`🏆 Puntos de la Ronda ${rondaActualSymbol} calculados localmente.`);

  // =========================================================================
  // EXTRAPOLACIÓN GLOBAL: SI ESTAMOS EN LA RONDA 5, REPARTIR BOTÍN REAL WITH EMPATES
  // =========================================================================
  if (rondaActualSymbol === 5) {
    alert("🏁 ¡Fin de la Ronda 5! Calculando posiciones con empates para la Clasificación General.");

    const tablaPuntosGlobales = [10, 8, 6, 5, 4, 3, 2, 1];
    let posicionReal = 1;

    for (let index = 0; index < rankingJuego.length; index++) {
      const jugadorRanking = rankingJuego[index];

      // Si empata en puntos con el jugador anterior, mantiene la misma posicionReal
      if (index > 0 && jugadorRanking.scoreJuego === rankingJuego[index - 1].scoreJuego) {
        // Mantiene la misma posicionReal
      } else {
        // Si no empata, su posición pasa a ser su índice físico real + 1
        posicionReal = index + 1;
      }

      // Sacamos los puntos que le tocan según su rango real de la tabla
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

          // Guardar e inyectar el nuevo valor escalado con justicia divina
          await updateDoc(playerRef, {
            score: scoreTorneoActual + puntosGlobalesInyeccion
          });
          console.log(`⚖️ Rango #${posicionReal} | Inyectados +${puntosGlobalesInyeccion} pts de torneo a ${jugadorRanking.name}`);
        } catch (err) {
          console.error("Error al inyectar puntos globales escalados:", err);
        }
      }
    }
    alert("🏆 ¡El Olimpo ha repartido las puntuaciones de forma justa y el torneo global está actualizado!");
  }
};

// BOTÓN: PASAR DE RONDA
window.siguienteRondaSymbol = function () {
  if (rondaActualSymbol >= 5) {
    alert("🏁 ¡Ya has completado las 5 rondas de SymbolZone!");
    return;
  }

  rondaActualSymbol++;
  reiniciarRondaInterfaceSymbol();
  alert(`🔺 Iniciando Ronda ${rondaActualSymbol}. ¡Cambiad las pinzas de la espalda!`);
};

function reiniciarRondaInterfaceSymbol() {
  clearInterval(intervaloCronometroSymbol);
  intervaloCronometroSymbol = null;

  tiempoRestanteSymbol = 60;

  const elReloj = document.getElementById("tvCronometroSymbol");
  if (elReloj) {
    elReloj.innerText = "01:00";
    elReloj.style.color = "#fff";
  }

  const elTextoRonda = document.getElementById("tvRondaSymbol");
  if (elTextoRonda) elTextoRonda.innerText = `Ronda ${rondaActualSymbol} / 5`;

  // Limpiar selecciones visuales de fallos para la siguiente ronda, manteniendo el marcador intacto
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


// --- VARIABLES GLOBALES EL MENTIROSO ---
let listaSospechososRonda = [];   // Los 4 sospechosos seleccionados
let todosLosActivosMentiroso = []; // Cache de todos los jugadores de la sala
let indiceVerdadero = -1;         // Quién dice la verdad (0 a 3)
let puntosLocalesMentiroso = {};  // Puntuación del minijuego { idJugador: puntos }
let rondaActualMentiroso = 0;     // Contador de rondas ejecutadas

// CARGAR Y REPRODUCIR VIDEOS DE LA CARPETA assets/videosMentiroso
window.loadVideosMentiroso = async function () {
  const cont = document.getElementById("tvMultimediaMentiroso");
  if (!cont) return;

  try {
    const resp = await fetch('assets/videosMentiroso/list.json');
    if (!resp.ok) throw new Error('No se pudo leer el manifiesto de videos');
    const lista = await resp.json();
    if (!Array.isArray(lista) || lista.length === 0) return;

    // Guardamos la lista y el índice globalmente para control manual
    window._mentirosoVideosList = lista;
    window._mentirosoVideoIdx = 0;

    // Crear un único elemento <video> que reproducirá el archivo actual
    const video = document.createElement('video');
    video.id = 'videoMentirosoPlayer';
    video.style.maxWidth = '100%';
    video.style.maxHeight = '180px';
    video.style.borderRadius = '6px';
    video.style.border = '2px solid #38bdf8';
    video.controls = true;

    const basePath = 'assets/videosMentiroso/';

    function cargarIndice(i) {
      if (!window._mentirosoVideosList) return;
      if (i < 0 || i >= window._mentirosoVideosList.length) return;
      video.src = basePath + window._mentirosoVideosList[i];
      video.load();
    }

    // Inicializar con el primer video
    cargarIndice(0);

    // Vaciar contenedor y añadir video
    cont.innerHTML = '';
    cont.appendChild(video);

  } catch (e) {
    console.error('Error cargando videos del mentiroso:', e);
  }
};

// Función que avanza manualmente a la siguiente evidencia (llamada desde el botón en el HTML)
window.siguienteEvidenciaMentiroso = function () {
  if (!window._mentirosoVideosList) return alert('No hay evidencias cargadas.');
  window._mentirosoVideoIdx = (window._mentirosoVideoIdx || 0) + 1;
  if (window._mentirosoVideoIdx >= window._mentirosoVideosList.length) {
    window._mentirosoVideoIdx = window._mentirosoVideosList.length - 1;
    return alert('No hay más evidencias.');
  }
  const video = document.getElementById('videoMentirosoPlayer');
  if (!video) return;
  video.src = 'assets/videosMentiroso/' + window._mentirosoVideosList[window._mentirosoVideoIdx];
  video.load();
  video.play().catch(() => { });
};

// Inicializar la carga (intento silencioso al arrancar el script)
window.loadVideosMentiroso();

// 1. ELEGIR SOSPECHOSOS AL AZAR E INICIALIZAR ESTRUCTURAS SELECTORAS
window.elegirSospechososAlAzar = async function () {
  try {
    rondaActualMentiroso++;
    window.ocultarVerdadMentiroso(); // Empezamos con la solución oculta

    const contenedor = document.getElementById("tvSospechososContenedor");

    // Obtener los jugadores activos en tiempo real
    const snap = await getDocs(query(collection(window.db, "players"), where("active", "==", true)));
    todosLosActivosMentiroso = [];
    snap.forEach(d => { todosLosActivosMentiroso.push({ id: d.id, ...d.data() }); });

    if (todosLosActivosMentiroso.length < 4) {
      return alert(`Faltan jugadores activos en la sala. Mínimo 4 (Hay: ${todosLosActivosMentiroso.length})`);
    }

    // Inicializar el marcador local del minijuego si es la primera ronda
    todosLosActivosMentiroso.forEach(j => {
      if (puntosLocalesMentiroso[j.id] === undefined) puntosLocalesMentiroso[j.id] = 0;
    });

    // Seleccionar 4 sospechosos al azar
    let copiaActivos = [...todosLosActivosMentiroso];
    listaSospechososRonda = [];
    for (let i = 0; i < 4; i++) {
      const randomIdx = Math.floor(Math.random() * copiaActivos.length);
      listaSospechososRonda.push(copiaActivos.splice(randomIdx, 1)[0]);
    }

    indiceVerdadero = Math.floor(Math.random() * 4);
    console.log("Sospechosos escogidos:", listaSospechososRonda, "Verdadero:", indiceVerdadero);

    // Dibujar los 4 paneles de sospechosos con una zona interactiva selectiva para añadir quién los votó
    contenedor.innerHTML = "";
    listaSospechososRonda.forEach((jugador, index) => {

      // Generar las opciones del selector de votos (todos los de la sala menos el propio sospechoso)
      let opcionesSelectHtml = `<option value="">-- Añadir Voto de... --</option>`;
      todosLosActivosMentiroso.forEach(activo => {
        if (activo.id !== jugador.id) {
          opcionesSelectHtml += `<option value="${activo.id}">${activo.name}</option>`;
        }
      });

      const card = document.createElement("div");
      card.id = `cardSospechoso-${index}`;
      card.style.background = "#1e293b";
      card.style.padding = "15px";
      card.style.borderRadius = "10px";
      card.style.textAlign = "center";
      card.style.border = "2px solid #334155";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "10px";

      card.innerHTML = `
        <div>
          <div style="font-size: 1.2rem; font-weight: bold; color: #fff;">${jugador.name}</div>
          <div id="rol-${index}" style="color: #38bdf8; font-weight: bold; font-size: 0.85rem; margin-top: 4px;">🤫 SOSPECHOSO</div>
        </div>

        <div style="background: #0f172a; padding: 8px; border-radius: 6px; border: 1px dashed #475569;">
          <select id="selectVotante-${index}" onchange="registrarVotoHaciaSospechoso(${index}, this)" style="background:#1e293b; color:white; border:1px solid #475569; padding:4px; font-size:0.85rem; width:100%; border-radius:4px;">
            ${opcionesSelectHtml}
          </select>
          <div id="listaVotosRecibidos-${index}" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; justify-content:center;">
            </div>
        </div>
      `;
      contenedor.appendChild(card);
    });

    // Reiniciar la evidencia al comienzo de la ronda
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
    console.error("Error iniciando ronda de Mentiroso:", e);
  }
};

// 2. REGISTRAR EL VOTO EN EL PANEL VISUAL
window.registrarVotoHaciaSospechoso = function (indiceSospechoso, selectElement) {
  const jugadorId = selectElement.value;
  if (!jugadorId) return;

  const jugadorObjeto = todosLosActivosMentiroso.find(j => j.id === jugadorId);
  if (!jugadorObjeto) return;

  const contenedorFichas = document.getElementById(`listaVotosRecibidos-${indiceSospechoso}`);

  // Evitar duplicar el voto de un mismo jugador en esta ronda
  if (document.getElementById(`votoFicha-${jugadorId}`)) {
    alert("Este jugador ya ha emitido su voto en la pizarra.");
    selectElement.value = "";
    return;
  }

  // Crear la etiqueta del voto asignado
  const ficha = document.createElement("span");
  ficha.id = `votoFicha-${jugadorId}`;
  ficha.setAttribute("data-votante-id", jugadorId);
  ficha.style.background = "#38bdf8";
  ficha.style.color = "#0f172a";
  ficha.style.padding = "2px 6px";
  ficha.style.borderRadius = "4px";
  ficha.style.fontSize = "0.8rem";
  ficha.style.fontWeight = "bold";
  ficha.style.cursor = "pointer";
  ficha.title = "Haz clic para retirar el voto";
  ficha.innerText = `🗳️ ${jugadorObjeto.name}`;

  // Si se pulsa encima por error, se borra de la lista
  ficha.onclick = () => { ficha.remove(); };

  contenedorFichas.appendChild(ficha);
  selectElement.value = ""; // Reseteamos el desplegable
};

// 3. REVELAR LA VERDAD
window.revelarVerdadMentiroso = function () {
  if (listaSospechososRonda.length === 0) return alert("No hay sospechosos en juego.");

  const ganador = listaSospechososRonda[indiceVerdadero];
  const cartelSolucion = document.getElementById("tvSolucionMentiroso");
  cartelSolucion.innerText = `¡${ganador.name} DICE LA VERDAD!`;
  cartelSolucion.style.color = "#22c55e";

  listaSospechososRonda.forEach((j, index) => {
    const card = document.getElementById(`cardSospechoso-${index}`);
    const rolTexto = document.getElementById(`rol-${index}`);

    if (index === indiceVerdadero) {
      if (card) card.style.borderColor = "#22c55e";
      if (card) card.style.background = "rgba(34, 197, 94, 0.1)";
      if (rolTexto) { rolTexto.innerText = "😇 DICE LA VERDAD"; rolTexto.style.color = "#22c55e"; }
    } else {
      if (card) card.style.borderColor = "#ef4444";
      if (card) card.style.opacity = "0.6";
      if (rolTexto) { rolTexto.innerText = "🤥 MENTIROSO"; rolTexto.style.color = "#ef4444"; }
    }
  });

  document.getElementById("tvMultimediaOculta").style.display = "none";
  document.getElementById("tvMultimediaMentiroso").style.display = "block";
  const v = document.getElementById('videoMentirosoPlayer');
  if (v) v.play().catch(() => { });
};

// 4. OCULTAR LA VERDAD
window.ocultarVerdadMentiroso = function () {
  const cartelSolucion = document.getElementById("tvSolucionMentiroso");
  cartelSolucion.innerText = "OCULTA";
  cartelSolucion.style.color = "#ffc107";

  listaSospechososRonda.forEach((j, index) => {
    const card = document.getElementById(`cardSospechoso-${index}`);
    const rolTexto = document.getElementById(`rol-${index}`);
    if (card) {
      card.style.borderColor = "#334155";
      card.style.background = "#1e293b";
      card.style.opacity = "1";
    }
    if (rolTexto) { rolTexto.innerText = "🤫 SOSPECHOSO"; rolTexto.style.color = "#38bdf8"; }
  });

  document.getElementById("tvMultimediaMentiroso").style.display = "none";
  document.getElementById("tvMultimediaOculta").style.display = "flex";
  const v = document.getElementById('videoMentirosoPlayer');
  if (v) { try { v.pause(); v.currentTime = 0; } catch (e) { } }
};

// 5. EVALUAR LA PIZARRA DE VOTOS (REGLAS DE REPARTO COMPLEJAS DE LA RONDA)
window.validarVotosYAcertantesMentiroso = function () {
  if (listaSospechososRonda.length === 0 || indiceVerdadero === -1) return alert("No hay ninguna ronda activa.");

  // Forzar que se revele visualmente en la TV
  window.revelarVerdadMentiroso();

  const idGanadorVerdadero = listaSospechososRonda[indiceVerdadero].id;

  let recuentoVotosPorSospechoso = {}; // { indiceSospechoso: cantidadDeVotos }
  let totalVotosEnMentiras = 0;
  let totalVotosEnVerdad = 0;
  let desgloseAlert = "📊 Escrutinio de la Ronda:\n\n";

  // --- PASO 1: Contar cuántos votos tiene cada una de las 4 tarjetas ---
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

  // --- PASO 2: Repartir los puntos locales basándonos en las reglas ---
  listaSospechososRonda.forEach((sospechoso, index) => {

    // CASO A: Es uno de los Mentirosos
    if (index !== indiceVerdadero) {
      const votosEngañados = recuentoVotosPorSospechoso[index];
      if (votosEngañados > 0) {
        puntosLocalesMentiroso[sospechoso.id] += votosEngañados;
        desgloseAlert += `🤥 Mentiroso [${sospechoso.name}]: +${votosEngañados} pt(s) por engañar a ${votosEngañados} jugador(es).\n`;
      }
    }
    // CASO B: Es el que dice la Verdad
    else {
      // Fórmula: +1 por cada voto a favor - 1 por cada voto que se fue a una mentira
      const puntosCalculadosVerdad = totalVotosEnVerdad - totalVotosEnMentiras;
      puntosLocalesMentiroso[sospechoso.id] += puntosCalculadosVerdad;
      desgloseAlert += `😇 Verdadero [${sospechoso.name}]: Got ${totalVotosEnVerdad} votos y hubo ${totalVotosEnMentiras} fallos. Neto: ${puntosCalculadosVerdad >= 0 ? '+' : ''}${puntosCalculadosVerdad} pt(s).\n`;
    }

    // CASO C: Premiar a los votantes individuales de la caja correcta (+1 pt por acertar)
    if (index === indiceVerdadero) {
      const contenedorCorrecto = document.getElementById(`listaVotosRecibidos-${indiceVerdadero}`);
      const fichasCorrectas = contenedorCorrecto.querySelectorAll("[data-votante-id]");

      if (fichasCorrectas.length > 0) desgloseAlert += `\n🎯 Acertantes (+1 pt):\n`;
      fichasCorrectas.forEach(ficha => {
        const idVotante = ficha.getAttribute("data-votante-id");
        if (puntosLocalesMentiroso[idVotante] !== undefined) {
          puntosLocalesMentiroso[idVotante] += 1;

          // Conseguimos su nombre para el resumen de la alerta
          const pObj = todosLosActivosMentiroso.find(p => p.id === idVotante);
          desgloseAlert += ` - ${pObj ? pObj.name : 'Jugador'}\n`;
        }
      });
    }
  });

  // Actualizar la tabla visual derecha en la TV
  window.actualizarPizarraRankingLocal();

  // Mostrar resumen emergente en el PC/TV del desglose
  alert(desgloseAlert);
};
// 6. PINTAR EL MARCADOR DEL MINIJUEGO EN LA TV
window.actualizarPizarraRankingLocal = function () {
  const listaContenedor = document.getElementById("listaPuntosLocalesMentiroso");
  if (!listaContenedor) return;

  let rankingOrdenado = Object.keys(puntosLocalesMentiroso).map(id => {
    const player = todosLosActivosMentiroso.find(p => p.id === id);
    return {
      id: id,
      name: player ? player.name : "Desconocido",
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
      <div style="display:flex; justify-content:space-between; background:#0f172a; padding:6px 10px; border-radius:4px; border:1px solid #1e293b;">
        <span>#${rank} ${jugador.name}</span>
        <strong style="color:#ffc107;">${jugador.pts} pts</strong>
      </div>
    `;
  }
};

// 7. BOTÓN FINALIZAR MINIJUEGO: VOLCAR LA ESCALA CON CONTROL DE EMPATES A FIREBASE GLOBAL
window.finalizarMinijuegoMentiroso = async function () {
  if (Object.keys(puntosLocalesMentiroso).length === 0) return alert("No hay datos locales guardados.");

  const confirmar = confirm("¿Quieres cerrar el minijuego de El Mentiroso y transferir la escala de puntos globales a la Base de Datos?");
  if (!confirmar) return;

  // Ordenar de mayor a menor puntuación obtenida en el minijuego
  let rankingFinal = Object.keys(puntosLocalesMentiroso).map(id => ({
    id: id,
    ptsLocales: puntosLocalesMentiroso[id]
  })).sort((a, b) => b.ptsLocales - a.ptsLocales);

  const tablaEscalaGlobal = [10, 8, 6, 5, 4, 3, 2, 1];

  let prevPts = null;
  let puntosAsignadosTorneo = 0;

  // Transferir los puntos correspondientes a Firebase calculando empates
  for (let i = 0; i < rankingFinal.length; i++) {
    const jRank = rankingFinal[i];

    // Si coincide en puntos con el anterior, se lleva exactamente los mismos puntos
    if (i > 0 && jRank.ptsLocales === prevPts) {
      // Mantiene los puntos asignados en la iteración anterior
    } else {
      // Si no es un empate, toma los puntos que le corresponden por su índice en la tabla
      puntosAsignadosTorneo = tablaEscalaGlobal[i] || 0;
    }

    // Guardamos el puntaje local actual para la comparativa de la siguiente iteración
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

        console.log(`Sincronizado: ${jRank.id} recibe +${puntosAsignadosTorneo} pts.`);
      } catch (error) {
        console.error("Error al transferir puntos finales:", error);
      }
    }
  }

  alert("🏆 ¡Torneo cerrado con éxito! Las posiciones calculadas con empates se han guardado en Firebase.");

  // Resetear el estado del minijuego
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

// Diccionario de reglas traducidas (Asegúrate de tener este elemento 'textoRegla' en tu HTML)
const textosReglas = {
  "1": "1 jugador eliminado: Si dos o más jugadores eligen el mismo número, serán descalificados de la ronda y cada uno perderá un punto.",
  "2": "2 jugadores eliminados: Elegir el número exacto correcto hará que los demás jugadores pierdan dos puntos en lugar de uno.",
  "3": "3 jugadores eliminados: Si un jugador elige 0, el otro jugador puede ganar eligiendo 100."
};

let jugadoresActivosIds = [];

// --- NAVEGACIÓN Y REINICIO INICIAL ---

btnEmpezar.addEventListener("click", async () => {
  btnEmpezar.disabled = true;
  btnEmpezar.textContent = "Reiniciando partida...";

  try {
    // Buscamos todos los jugadores de la colección que estén activos
    const playersRef = collection(window.db, "players");
    const q = query(playersRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);

    // Reseteamos sus atributos para empezar limpios de cero
    for (const documento of querySnapshot.docs) {
      const jugadorRef = doc(window.db, "players", documento.id);
      await updateDoc(jugadorRef, {
        "tenbin.score": 0,
        "tenbin.isAlive": true,
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
          "tenbin.score": increment(-1),
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

    // Decidir navegación de pantallas en la TV
    viewRespuestas.style.display = "none";

    if (jugadoresMuertos.length > 0) {
      // Si hubo muertes, mostramos la pantalla de eliminación y reseteamos el texto informativo de las reglas
      const textoRegla = document.getElementById("textoRegla");
      if (textoRegla) {
        textoRegla.textContent = "Haz clic en una regla para ver los detalles.";
      }
      mensajeMuerte.innerHTML = `Ha muerto el jugador: <br><span style="color: #ff4a4a;">${jugadoresMuertos.join(", ")}</span>`;
      viewMuerte.style.display = "block";
    } else {
      // Si nadie murió, volvemos a la pantalla de espera de números
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
    let hayJugadoresVivos = false;
    let sumaNumeros = 0;
    let totalJugadoresConNumero = 0;

    querySnapshot.forEach((documento) => {
      const data = documento.data();

      // FILTRO EXTRA: Si tenbin.isAlive es explícitamente false, lo ignoramos por completo
      if (data.tenbin && data.tenbin.isAlive === false) {
        return;
      }

      hayJugadoresVivos = true;
      const jugadorId = documento.id;
      const nombreJugador = data.name || `Jugador (${jugadorId.substring(0, 5)})`;
      const scoreActual = data.tenbin && data.tenbin.score !== undefined ? data.tenbin.score : 0;

      const numeroActual = data.tenbin && data.tenbin.currentNumber !== undefined
        ? Number(data.tenbin.currentNumber)
        : null;

      if (numeroActual !== null && !isNaN(numeroActual)) {
        sumaNumeros += numeroActual;
        totalJugadoresConNumero++;
      }

      jugadoresActivosIds.push(jugadorId);

      // Mostramos Nombre, Número y el Score solicitado
      htmlContenido += `
        <label style='display: flex; align-items: center; justify-content: space-between; background: #222; padding: 10px; border-radius: 4px; cursor: pointer;'>
          <div style='display: flex; align-items: center; gap: 10px;'>
            <input type='checkbox' id='chk-${jugadorId}' style='transform: scale(1.2);'>
            <span><strong>${nombreJugador}:</strong> ${numeroActual !== null ? numeroActual : "Sin número"}</span>
          </div>
          <span style='background: #444; padding: 2px 8px; border-radius: 12px; font-size: 14px;'>Score: ${scoreActual}</span>
        </label>
      `;
    });

    htmlContenido += "</div>";

    // Cálculo de la Media * 0.8
    if (totalJugadoresConNumero > 0) {
      const media = sumaNumeros / totalJugadoresConNumero;
      const resultadoFinal = media * 0.8;
      contenedorMedia.innerHTML = `
        <span style="font-size: 14px; text-transform: uppercase; color: #aaa; letter-spacing: 1px;">Media × 0.8</span>
        <div style="font-size: 48px; font-weight: bold; color: #ff4a4a; margin-top: 5px;">${resultadoFinal.toFixed(2)}</div>
      `;
    } else {
      contenedorMedia.innerHTML = "<span>No hay números suficientes para calcular la media.</span>";
    }

    if (!hayJugadoresVivos) {
      htmlContenido = "<p>No hay jugadores vivos y activos en este momento.</p>";
      btnSiguienteRonda.style.display = "none";
    } else {
      btnSiguienteRonda.style.display = "inline-block";
    }

    listaRespuestas.innerHTML = htmlContenido;

  } catch (error) {
    console.error("Error al obtener datos de Firebase:", error);
    listaRespuestas.innerHTML = "<p style='color: red;'>Error al cargar las respuestas.</p>";
  }
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


