import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
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

const firebaseConfig = {
  apiKey: "AIzaSyBPpKax_7zzPteOtnnutKX6anU6xqgfoMw",
  authDomain: "el-ultimo-en-pie-matematikos.firebaseapp.com",
  projectId: "el-ultimo-en-pie-matematikos",
  storageBucket: "el-ultimo-en-pie-matematikos.firebasestorage.app",
  messagingSenderId: "984317427914",
  appId: "1:984317427914:web:c9fcf803d20186494b3433"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.db = db;


// =====================
// PANTALLAS   oculta todas las pantallas menos la que pongas en screen
// =====================
const screenMapMobile = {
  screenRoulette: "screenRanking",
  screenGlassTower: "screenRanking",
  screenSymbolZone: "screenRanking",
  screenTheLiar: "screenTheLiar"
};
function showScreen(screen) {
  // traducir solo en móvil
  if (screenMapMobile[screen]) {
    screen = screenMapMobile[screen];
  }
  ///////////////console.log("Cambiando a pantalla:", screen);
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenRanking").style.display = "none";
  document.getElementById("screenWaiting").style.display = "none";
  document.getElementById("screenWorldGuessr").style.display = "none";
  document.getElementById("screenGuessSong").style.display = "none";
  document.getElementById("screenIrrationalPrice").style.display = "none";
  document.getElementById("screenNumbersAndLetters").style.display = "none";
  document.getElementById("screenLastTheorem").style.display = "none";
  document.getElementById("screenVotes").style.display = "none";
  document.getElementById(screen).style.display = "block";
}
// =====================
// CARGAR JUGADORES
// =====================
/* async function loadPlayers() {
  const snapshot = await getDocs(collection(window.db, "players"));
  const container = document.getElementById("screenSelect");

  if (!container) return; // Evita errores si no encuentra el div
  container.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const player = docSnap.data();

    const card = document.createElement("div");
    card.style.border = "1px solid black";
    card.style.display = "inline-block";
    card.style.margin = "10px";
    card.style.padding = "10px";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <img src="${player.imgCard || ''}" 
        style="width:100px;height:100px;object-fit:cover;background:#ddd;">
      <br><b>${player.name}</b>
    `;
    card.onclick = () => selectPlayer(docSnap.id, player.name);

    container.appendChild(card);
  });
}
*/

// Variables de control para el carrusel de cromos
let arrayPersonajes = [];
let idxCartaActual = 0;

async function loadPlayers() {
  const container = document.getElementById("screenSelect");
  if (!container) return;

  try {
    const snapshot = await getDocs(collection(window.db, "players"));
    arrayPersonajes = [];

    // 1. Guardamos todos los cromos en el array
    snapshot.forEach((docSnap) => {
      arrayPersonajes.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (arrayPersonajes.length === 0) {
      container.innerHTML = "No hay personajes divinos disponibles.";
      return;
    }

    idxCartaActual = 0; // Empezamos en la primera carta
    window.renderizarCartaActual(); // Pintamos la interfaz de navegación

  } catch (error) {
    console.error("Error al cargar los cromos:", error);
  }
}

// NUEVA FUNCIÓN: Se encarga de pintar la estructura 1 a 1 en la pantalla
window.renderizarCartaActual = function() {
  const container = document.getElementById("screenSelect");
  if (!container || arrayPersonajes.length === 0) return;

  const personaje = arrayPersonajes[idxCartaActual];

  // Estructura limpia del Carrusel/Mazo
  container.innerHTML = `
    <div class="mazo-cartas-contenedor">
      
      <div class="cromo-olimpico" id="cromoAnimado">
        <img src="${personaje.imgCard || ''}" class="cromo-foto" alt="${personaje.name}">
        <div class="cromo-nombre"><b>${personaje.name}</b></div>
        
        <button class="btn-elegir-personaje" onclick="selectPlayer('${personaje.id}', '${personaje.name}')">
          🏛️ Elegir Personaje
        </button>
      </div>

      <div style="display: flex; gap: 20px; align-items: center;">
        <button class="btn-navegacion" onclick="cambiarCartaMentiroso(-1)">◀ Anterior</button>
        <span style="font-weight: bold; color: #475569;">
          ${idxCartaActual + 1} / ${arrayPersonajes.length}
        </span>
        <button class="btn-navegacion" onclick="cambiarCartaMentiroso(1)">Siguiente ▶</button>
      </div>

    </div>
  `;
};

// NUEVA FUNCIÓN: Controla los límites del mazo al pulsar Anterior o Siguiente
window.cambiarCartaMentiroso = function(direccion) {
  idxCartaActual += direccion;

  // Control de límites para que sea infinito/bucle
  if (idxCartaActual < 0) {
    idxCartaActual = arrayPersonajes.length - 1; // Si va hacia atrás del primero, salta al último
  } else if (idxCartaActual >= arrayPersonajes.length) {
    idxCartaActual = 0; // Si pasa del último, vuelve al primero
  }

  window.renderizarCartaActual();
};

// =====================
// SELECCIONAR JUGADOR
// =====================
async function selectPlayer(id, name) {
  // 1. Guardar datos en localStorage y variable global
  localStorage.setItem("playerId", id);
  localStorage.setItem("playerName", name);
  window.miJugadorId = id;

  // 2. Pintar el nombre en el Header/UI de forma directa
  const userNameHeader = document.getElementById("userNameHeader");
  if (userNameHeader) userNameHeader.innerText = name;

  // 3. Actualizar Firebase para poner active en true y asignar la pantalla inicial
  try {
    const playerRef = doc(window.db, "players", id);
    await updateDoc(playerRef, {
      active: true,
    });
  } catch (e) {
    console.warn('No se pudo marcar jugador activo en Firestore:', e);
  }

  // 4. Cambiar la UI localmente para pasar a la pantalla de espera
  showScreen("screenWaiting")

  if (typeof listenToRankingAndScore === "function") {
    listenToRankingAndScore();
  }
}
window.selectPlayer = selectPlayer;


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
  Votes: votes, // 6º
  SymbolZone: symbolZone, // 5º El de los símbolos en la espalda con pinzas y tienen que ir a su zona.s
  NumbersAndLetters: numbersAndLetters, //6º Juego Cifras y letras juego de operaciones
  TheLiar: theLiar, //7º Juego: El mentiroso con material audiovisual
  LastTheorem: lastTheorem //8º Juego: El último teorema. Ya solo juegan 5 jugadores.
};

// Función usada antes para manejar el cambio de pantalla, ahora se hace directamente con el onSnapshot pero la dejo por si quieres hacer algo más complejo al cambiar de pantalla
// Sin else if porque no estamos comparando pantallas, sino que estamos buscando.
function handleState(state) {
  console.log("Estoy en handleState:", state.screen);
  showScreen(state.screen);

  const nonGameScreens = ["screenRoulette", "screenRanking", "screenSelect", "screenWaiting"];
  if (nonGameScreens.includes(state.screen)) {
    return;
  }

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

// GuessSong

// 4. CAPTURA DE LOS ELEMENTOS DEL HTML Y ESCUCHA EN TIEMPO REAL
function guessSong() {
  console.log("Iniciando juego de GuessSong en el móvil");

  const btnEnviar = document.getElementById("btnEnviarGuessSong");
  const miPlayerId = localStorage.getItem("playerId");

  // Variables para gestionar los nuevos botones P e I
  const btnP = document.getElementById("btnOpcionP");
  const btnI = document.getElementById("btnOpcionI");
  let seleccionPI = ""; // Aquí guardaremos "P" o "I"

  // --- LÓGICA DE SELECCIÓN DE BOTONES P / I ---
  if (btnP && btnI) {
    btnP.onclick = () => {
      seleccionPI = "P";
      // Pintamos P de azul y desmarcamos I
      btnP.style.background = "#3498db";
      btnP.style.color = "white";
      btnP.style.borderColor = "#3498db";

      btnI.style.background = "white";
      btnI.style.color = "#333";
      btnI.style.borderColor = "#ccc";
    };

    btnI.onclick = () => {
      seleccionPI = "I";
      // Pintamos I de azul y desmarcamos P
      btnI.style.background = "#3498db";
      btnI.style.color = "white";
      btnI.style.borderColor = "#3498db";

      btnP.style.background = "white";
      btnP.style.color = "#333";
      btnP.style.borderColor = "#ccc";
    };
  }

  // --- BOTÓN ENVIAR ---
  if (btnEnviar) {
    btnEnviar.onclick = async () => {
      if (!miPlayerId) {
        alert("Error: No se encuentra tu ID de jugador. Reinicia la aplicación.");
        return;
      }

      const inputCancion = document.getElementById("inputMovilCancion");
      const inputAutor = document.getElementById("inputMovilAutor");

      const respuestaCancion = inputCancion ? inputCancion.value.trim() : "";
      const respuestaAutor = inputAutor ? inputAutor.value.trim() : "";

      // Validamos que complete canción, autor Y que haya elegido P o I
      if (!respuestaCancion || !respuestaAutor) {
        alert("🎵 Por favor, completa el nombre de la canción y el autor antes de enviar.");
        return;
      }

      if (!seleccionPI) {
        alert("⚠️ Por favor, selecciona una opción: 'P' o 'I' antes de enviar.");
        return;
      }

      try {
        btnEnviar.disabled = true;
        btnEnviar.innerText = "⏳ Enviando...";

        const playerRef = doc(window.db, "players", miPlayerId);

        // Enviamos los 3 datos al mapa dentro de Firebase
        await updateDoc(playerRef, {
          "respuestasSong.respuestaCancion": respuestaCancion,
          "respuestasSong.respuestaAutor": respuestaAutor,
          "respuestasSong.respuestaPI": seleccionPI // <-- NUEVO CAMPO EN FIREBASE
        });

        console.log(`✅ Respuestas guardadas con éxito en respuestasSong para: ${miPlayerId}`);

        const contenedorForm = document.getElementById("screenGuessSong");
        const contenedorEspera = document.getElementById("pantalla-espera");

        if (contenedorForm) contenedorForm.style.display = "none";
        if (contenedorEspera) contenedorEspera.style.display = "block";

      } catch (error) {
        console.error("❌ Error al enviar la respuesta a Firebase:", error);
        alert("Hubo un problema al enviar tu respuesta. Inténtalo de nuevo.");

        btnEnviar.disabled = false;
        btnEnviar.innerText = "Enviar Respuesta 🚀";
      }
    };
  }

  // ==========================================================
  // 🔥 ESCUCHADOR 1: RESETEO DE DATOS DEL JUGADOR (Ronda nueva)
  // ==========================================================
  if (miPlayerId) {
    onSnapshot(doc(window.db, "players", miPlayerId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const datosJugador = docSnapshot.data();

        if (!datosJugador.respuestasSong) {
          console.log("🧹 Datos de respuesta eliminados. Limpiando inputs y botones...");

          // 1. Limpiamos inputs de texto
          const inputCancion = document.getElementById("inputMovilCancion");
          const inputAutor = document.getElementById("inputMovilAutor");
          if (inputCancion) inputCancion.value = "";
          if (inputAutor) inputAutor.value = "";

          // 2. Limpiamos la selección y reseteamos el diseño de los botones P / I
          seleccionPI = "";
          if (btnP && btnI) {
            btnP.style.background = "white"; btnP.style.color = "#333"; btnP.style.borderColor = "#ccc";
            btnI.style.background = "white"; btnI.style.color = "#333"; btnI.style.borderColor = "#ccc";
          }

          if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Enviar Respuesta 🚀";
          }
        }
      }
    });
  }

  // ==========================================================
  // 🔥 ESCUCHADOR 2: CONTROL GLOBAL DE INTERFAZ (Tiempo / Estados)
  // ==========================================================
  onSnapshot(doc(window.db, "game", "songState"), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const datosJuego = docSnapshot.data();

      const contenedorForm = document.getElementById("screenGuessSong");
      const contenedorEspera = document.getElementById("pantalla-espera");
      const contenedorTiempoAgotado = document.getElementById("pantalla-tiempo-agotado");

      if (datosJuego.state === false) {
        console.log("🛑 Tiempo agotado. Mostrando pantalla de bloqueo...");
        if (contenedorForm) contenedorForm.style.display = "none";
        if (contenedorEspera) contenedorEspera.style.display = "none";
        if (contenedorTiempoAgotado) contenedorTiempoAgotado.style.display = "block";

      } else if (datosJuego.state === true) {
        console.log("🎵 Nueva canción en marcha. Mostrando formulario...");
        if (contenedorForm) contenedorForm.style.display = "block";
        if (contenedorEspera) contenedorEspera.style.display = "none";
        if (contenedorTiempoAgotado) contenedorTiempoAgotado.style.display = "none";
      }
    }
  });
}

// Lógica para el juego El precio Irracional
console.log("Iniciando juego de GuessSong en el móvil");

const btnEnviar = document.getElementById("btnEnviarGuessSong");

if (btnEnviar) {
  btnEnviar.onclick = async () => {
    // 1. Recuperamos el ID del jugador desde SU localStorage
    const miPlayerId = localStorage.getItem("playerId");

    if (!miPlayerId) {
      alert("Error: No se encuentra tu ID de jugador. Reinicia la aplicación.");
      return;
    }

    // 2. Pillamos el número que ha escrito en el input del móvil
    const inputMovil = document.getElementById("inputMovilCancion");
    const respuestaUsuario = inputMovil ? inputMovil.value.trim() : "";

    try {
      // Desactivamos el botón para que no pulse 2 veces seguidas por los nervios
      btnEnviar.disabled = true;
      btnEnviar.innerText = "⏳ Enviando...";

      // 3. 🔥 MODIFICAMOS EL VALOR EN FIREBASE CORRESPONDIENTE A SU ID
      // Cambiamos 'lentejasGuess' dentro de SU propio documento en la colección 'players'
      const playerRef = doc(window.db, "players", miPlayerId);
      await updateDoc(playerRef, {
        respuestaCancion: respuestaUsuario
      });

      console.log(`✅ Respuesta (${respuestaUsuario}) guardada con éxito para el jugador: ${miPlayerId}`);

      /*
      // 4. Cambiamos la interfaz del móvil para avisarle de que ya hemos recibido el dato
      if (document.getElementById("formContenedorPrice")) {
        document.getElementById("formContenedorPrice").style.display = "none";
      }
      if (document.getElementById("esperaContenedorPrice")) {
        document.getElementById("esperaContenedorPrice").style.display = "block";
      }
      */

    } catch (error) {
      console.error("❌ Error al enviar la respuesta a Firebase:", error);
      alert("Hubo un problema al enviar tu respuesta. Inténtalo de nuevo.");
      btnEnviar.disabled = false;
      btnEnviar.innerText = "🚀 Enviar Respuesta";
    }
  };
}


function glassTower() {
  /*
  // Lógica para el juego Torre de Cristal
  export function iniciarMovilVasos() {
  const miPlayerId = localStorage.getItem("myPlayerDocId"); // El ID del usuario actual (ej: "p1")
  if (!miPlayerId) return;

  // 1. ESCUCHAR LOS DATOS DE TODOS LOS JUGADORES EN TIEMPO REAL
  // Así el móvil se actualiza en cuanto el presentador guarda un tiempo en la TV
  onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
    let listaTiemposGlobales = [];
    let misDatos = null;

    snapshot.forEach((playerDoc) => {
      const p = playerDoc.data();
      const id = playerDoc.id;
      const tower = p.towerGame || { attempts: [0, 0, 0], bestTime: 0 };

      // Si es el jugador dueño de este móvil, guardamos sus datos
      if (id === miPlayerId) {
        misDatos = tower;
      }

      // Recopilamos todos los intentos del juego para el ranking general
      tower.attempts.forEach((tiempo) => {
        if (tiempo > 0) {
          listaTiemposGlobales.push({ name: p.name, time: tiempo });
        }
      });
    });

    // 2. ACTUALIZAR LA TARJETA PERSONAL DEL JUGADOR
    if (misDatos) {
      const bestTimeElement = document.getElementById("mobileBestTime");
      const attemptsListElement = document.getElementById("mobileAttemptsList");

      if (bestTimeElement) {
        bestTimeElement.innerText = misDatos.bestTime && misDatos.bestTime !== 999 
          ? `⏱️ Tu récord: ${misDatos.bestTime}s` 
          : "⏱️ Tu récord: --";
      }

      if (attemptsListElement) {
        const t1 = misDatos.attempts[0] ? `${misDatos.attempts[0]}s` : "-";
        const t2 = misDatos.attempts[1] ? `${misDatos.attempts[1]}s` : "-";
        const t3 = misDatos.attempts[2] ? `${misDatos.attempts[2]}s` : "-";
        attemptsListElement.innerText = `Intentos: [${t1}] [${t2}] [${t3}]`;
      }
    }

    // 3. ACTUALIZAR EL RANKING EN EL MÓVIL (Ordenado de menor a mayor tiempo)
    listaTiemposGlobales.sort((a, b) => a.time - b.time);
    const leaderboardElement = document.getElementById("mobileVasosLeaderboard");
    
    if (leaderboardElement) {
      if (listaTiemposGlobales.length === 0) {
        leaderboardElement.innerHTML = `<p style="text-align:center; color:#666; margin:0;">Nadie ha jugado aún esta ronda</p>`;
      } else {
        let html = "<ol style='margin: 0; padding-left: 20px; color: #fff;'>";
        listaTiemposGlobales.forEach((registro) => {
          // Si el tiempo es del propio jugador, lo resaltamos en amarillo
          const esElMio = registro.name === localStorage.getItem("myPlayerName"); // O la lógica que uses para tu nombre
          const estilo = esElMio ? "style='color: #ffc107; font-weight: bold;'" : "";
          
          html += `<li ${estilo} style="margin-bottom: 5px;"><strong>${registro.time}s</strong> - ${registro.name}</li>`;
        });
        html += "</ol>";
        leaderboardElement.innerHTML = html;
      }
    }
  });
}*/
}

function irrationalPrice() {
  // Lógica para el juego El precio Irracional
  console.log("🎮 Iniciando juego del Precio Irracional en el móvil");

  const btnEnviar = document.getElementById("btnEnviarPrice");

  if (btnEnviar) {
    btnEnviar.onclick = async () => {
      // 1. Recuperamos el ID del jugador desde SU localStorage
      const miPlayerId = localStorage.getItem("playerId");

      if (!miPlayerId) {
        alert("❌ Error: No se encuentra tu ID de jugador. Reinicia la aplicación.");
        return;
      }

      // 2. Pillamos el número que ha escrito en el input del móvil
      const inputMovil = document.getElementById("inputMovilLentejas");
      const respuestaUsuario = inputMovil ? inputMovil.value.trim() : "";

      if (!respuestaUsuario || isNaN(respuestaUsuario)) {
        alert("🔢 Por favor, introduce un número válido antes de enviar.");
        return;
      }

      try {
        // Desactivamos el botón para que no pulse 2 veces seguidas por los nervios
        btnEnviar.disabled = true;
        btnEnviar.innerText = "⏳ Enviando...";

        // 3. 🔥 MODIFICAMOS EL VALOR EN FIREBASE CORRESPONDIENTE A SU ID
        // Cambiamos 'lentejasGuess' dentro de SU propio documento en la colección 'players'
        const playerRef = doc(window.db, "players", miPlayerId);
        await updateDoc(playerRef, {
          lentejasGuess: parseFloat(respuestaUsuario)
        });

        console.log(`✅ Respuesta (${respuestaUsuario}) guardada con éxito para el jugador: ${miPlayerId}`);

        // 4. Cambiamos la interfaz del móvil para avisarle de que ya hemos recibido el dato
        if (document.getElementById("formContenedorPrice")) {
          document.getElementById("formContenedorPrice").style.display = "none";
        }
        if (document.getElementById("esperaContenedorPrice")) {
          document.getElementById("esperaContenedorPrice").style.display = "block";
        }

      } catch (error) {
        console.error("❌ Error al enviar la respuesta a Firebase:", error);
        alert("Hubo un problema al enviar tu respuesta. Inténtalo de nuevo.");
        btnEnviar.disabled = false;
        btnEnviar.innerText = "🚀 Enviar Respuesta";
      }
    };
  }
}

function symbolZone() {
  // Lógica para el juego El último teorema

}
// ==========================================
// Lógica Móvil: Cifras y Letras
// ==========================================

// 1. Las variables de control se quedan fuera para mantener su estado limpio
let formulaActualMovil = "";
let jugadorIdActual = "";
let numerosDisponiblesRonda = [];
let indicesNumerosUsados = [];


function numbersAndLetters() {
  console.log("📱 Inicializando entorno de Cifras y Letras en el Móvil");
  // Vinculamos la función de arranque a window para que el HTML o Firebase puedan activarla
  window.iniciarMovilCifrasYLetras = function () {
    jugadorIdActual = localStorage.getItem("playerId");
    window.borrarTodoCifras();

    // Escuchamos el estado del reto numérico en Firebase usando "numberState"
    onSnapshot(doc(window.db, "game", "numberState"), (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      numerosDisponiblesRonda = data.cifrasDisponibles || [];
      console.log(numerosDisponiblesRonda)
      const objetivo = data.cifrasObjetivo || 0;

      // Actualizamos el número objetivo en el móvil
      const elObjetivo = document.getElementById("movilObjetivoCifras");
      if (elObjetivo) elObjetivo.innerText = objetivo > 0 ? objetivo : "---";

      // RENDERIZAR BOTONES DE NÚMEROS DEL RETO
      const contenedorBotones = document.getElementById("movilBotonesNumeros");
      if (contenedorBotones) {
        if (numerosDisponiblesRonda.length === 0) {
          contenedorBotones.innerHTML = `<span style="color:#666; font-style:italic;">Esperando números...</span>`;
          return;
        }

        contenedorBotones.innerHTML = "";
        numerosDisponiblesRonda.forEach((num, index) => {
          const btn = document.createElement("button");
          btn.innerText = num;
          btn.id = `btn-cifra-${index}`;
          btn.style.flex = "1";
          btn.style.margin = "4px";
          btn.style.background = "#ffc107";
          btn.style.color = "black";
          btn.style.fontSize = "1.3rem";
          btn.style.fontWeight = "bold";
          btn.style.border = "none";
          btn.style.padding = "12px 5px";
          btn.style.borderRadius = "6px";
          btn.style.cursor = "pointer";

          // Conectamos el click a la función de window
          btn.onclick = () => window.pulsarNumeroReto(num, index);

          contenedorBotones.appendChild(btn);
        });
      }

      // RENDERIZAR TECLADO DE OPERADORES
      const contenedorOperadores = document.getElementById("movilBotonesOperadores");
      if (contenedorOperadores && contenedorOperadores.children.length === 0) {
        const ops = ['+', '-', '*', '/', '(', ')'];
        contenedorOperadores.innerHTML = "";
        contenedorOperadores.style.display = "grid";
        contenedorOperadores.style.gridTemplateColumns = "repeat(6, 1fr)";
        contenedorOperadores.style.gap = "5px";
        contenedorOperadores.style.marginTop = "10px";

        ops.forEach(op => {
          const btnOp = document.createElement("button");
          btnOp.innerText = op === '*' ? '×' : op === '/' ? '÷' : op;
          btnOp.style.padding = "12px 5px";
          btnOp.style.fontSize = "1.3rem";
          btnOp.style.background = "#444";
          btnOp.style.color = "white";
          btnOp.style.border = "none";
          btnOp.style.borderRadius = "6px";
          btnOp.style.fontWeight = "bold";

          btnOp.onclick = () => {
            formulaActualMovil += op;
            window.actualizarPantallaFormulaVisual();
          };
          contenedorOperadores.appendChild(btnOp);
        });
      }

      document.getElementById("movilInstruccionesCifras").innerText = "¡Arma tu operación con los botones!";
      document.getElementById("btnEnviarCifras").disabled = false;
      document.getElementById("btnEnviarCifras").style.opacity = "1";
    });
  };

  iniciarMovilCifrasYLetras();
}

// 3. EXPOSICIÓN GLOBAL DE FUNCIONES DE CONTROL (Fuera de la caja para que los botones las vean)
window.pulsarNumeroReto = function (numero, index) {
  if (indicesNumerosUsados.includes(index)) return;

  formulaActualMovil += numero.toString();
  indicesNumerosUsados.push(index);

  const btn = document.getElementById(`btn-cifra-${index}`);
  if (btn) {
    btn.style.background = "#333";
    btn.style.color = "#666";
    btn.style.opacity = "0.4";
  }

  window.actualizarPantallaFormulaVisual();
};

window.borrarUltimoCifras = function () {
  if (formulaActualMovil.length === 0) return;

  for (let i = indicesNumerosUsados.length - 1; i >= 0; i--) {
    const idxOriginal = indicesNumerosUsados[i];
    const valorNum = numerosDisponiblesRonda[idxOriginal].toString();

    if (formulaActualMovil.endsWith(valorNum)) {
      formulaActualMovil = formulaActualMovil.substring(0, formulaActualMovil.length - valorNum.length);
      indicesNumerosUsados.splice(i, 1);
      const btn = document.getElementById(`btn-cifra-${idxOriginal}`);
      if (btn) {
        btn.style.background = "#ffc107";
        btn.style.color = "black";
        btn.style.opacity = "1";
      }
      window.actualizarPantallaFormulaVisual();
      return;
    }
  }

  formulaActualMovil = formulaActualMovil.slice(0, -1);
  window.actualizarPantallaFormulaVisual();
};

window.borrarTodoCifras = function () {
  formulaActualMovil = "";
  indicesNumerosUsados = [];
  numerosDisponiblesRonda.forEach((_, index) => {
    const btn = document.getElementById(`btn-cifra-${index}`);
    if (btn) {
      btn.style.background = "#ffc107";
      btn.style.color = "black";
      btn.style.opacity = "1";
    }
  });
  window.actualizarPantallaFormulaVisual();
};

window.actualizarPantallaFormulaVisual = function () {
  const pantalla = document.getElementById("movilPantallaFormula");
  if (pantalla) {
    pantalla.innerText = formulaActualMovil || "Escribe tu fórmula...";
    pantalla.style.color = formulaActualMovil ? "#ffc107" : "#555";
  }
};

window.enviarFormulaAlPresentador = async function () {
  if (!formulaActualMovil) return alert("Escribe alguna operación antes de enviar.");
  if (!jugadorIdActual) return alert("Error: No se detecta tu ID de jugador.");

  try {
    const playerRef = doc(window.db, "players", jugadorIdActual);
    await updateDoc(playerRef, { cifrasFormula: formulaActualMovil });

    document.getElementById("btnEnviarCifras").disabled = true;
    document.getElementById("btnEnviarCifras").style.opacity = "0.5";
    document.getElementById("movilInstruccionesCifras").innerText = "🚀 ¡Fórmula enviada!";
    alert("✨ Operación enviada con éxito.");
  } catch (error) {
    console.error("Error enviando fórmula a Firebase:", error);
    alert("❌ Error al enviar la respuesta.");
  }
};

function votes() {
  // --- LOGICA DE VOTACIÓN PARA EL MÓVIL ---

  window.inicializarVotacionMovil = function () {
    const miIdLocal = localStorage.getItem("playerId");
    const miNombreLocal = localStorage.getItem("playerName");

    if (!miIdLocal) {
      console.error("Votación Móvil: No se encuentra el ID del jugador local registrado.");
      return;
    }

    const contenedorLista = document.getElementById("moListaParaVotar");
    const bloqueConfirmacion = document.getElementById("moMensajeVotoEnviado");

    // Escuchamos en tiempo real la lista de jugadores activos
    onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
      console.log("Ya estoy aquí")
      if (!contenedorLista) return;

      let compañerosAptos = [];
      let yaHeVotado = false;

      snapshot.forEach((docSnap) => {
        const datos = docSnap.data();
        const idJugador = docSnap.id;

        // 1. CONTROL EXCLUSIÓN: Si es mi propio ID, reviso si ya voté y no me meto en la lista
        if (idJugador === miIdLocal) {
          if (datos.votoEnviado && datos.votoEnviado !== "") {
            yaHeVotado = true;
          }
        }
        // 2. Si es un rival, lo guardamos para construir los botones
        else {
          compañerosAptos.push({
            id: idJugador,
            name: datos.name
          });
        }
      });

      // --- INTERFAZ ESTADO 1: YA HA EMITIDO EL VOTO ---
      if (yaHeVotado) {
        contenedorLista.style.display = "none";
        if (bloqueConfirmacion) bloqueConfirmacion.style.display = "block";
        return;
      }

      // --- INTERFAZ ESTADO 2: PANEL ABIERTO PARA ELEGIR ---
      contenedorLista.style.display = "flex";
      if (bloqueConfirmacion) bloqueConfirmacion.style.display = "none";
      contenedorLista.innerHTML = "";

      if (compañerosAptos.length === 0) {
        contenedorLista.innerHTML = `<p style="color: #666; font-style: italic;">No hay otros compañeros conectados...</p>`;
        return;
      }

      // Crear un botón interactivo por cada rival de la sala
      compañerosAptos.forEach((rival) => {
        const botonVoto = document.createElement("button");
        botonVoto.innerText = `👤 ${rival.name}`;

        // Estilos del botón
        botonVoto.style.background = "#222";
        botonVoto.style.color = "white";
        botonVoto.style.border = "1px solid #333";
        botonVoto.style.padding = "14px";
        botonVoto.style.borderRadius = "8px";
        botonVoto.style.fontSize = "1.1rem";
        botonVoto.style.fontWeight = "bold";
        botonVoto.style.cursor = "pointer";
        botonVoto.style.textAlign = "left";
        botonVoto.style.transition = "all 0.2s ease";

        // Evento Hover visual simple
        botonVoto.onmouseenter = () => botonVoto.style.borderColor = "#e91e63";
        botonVoto.onmouseleave = () => botonVoto.style.borderColor = "#333";

        // EVENTO CLICK: El móvil envía el voto a Firebase
        botonVoto.onclick = async () => {
          const confirmar = confirm(`¿Estás seguro de que quieres votar a ${rival.name}? No podrás cambiarlo.`);
          if (!confirmar) return;

          try {
            // Deshabilitamos el botón para evitar clics dobles fantasmas
            botonVoto.disabled = true;
            botonVoto.innerText = "⏳ Enviando voto...";

            // Actualizamos el documento del jugador local guardando a quién ha votado
            const miReferencia = doc(window.db, "players", miIdLocal);
            await updateDoc(miReferencia, {
              votoEnviado: rival.name // Enviamos el nombre, que es lo que procesa la TV
            });

            console.log(`Voto registrado con éxito hacia: ${rival.name}`);
          } catch (error) {
            console.error("Error al procesar el voto desde el móvil:", error);
            alert("Hubo un error al enviar el voto. Inténtalo de nuevo.");
            botonVoto.disabled = false;
            botonVoto.innerText = `👤 ${rival.name}`;
          }
        };

        contenedorLista.appendChild(botonVoto);
      });
    });
  };
  window.inicializarVotacionMovil();
}

function theLiar() {
  // Lógica para el juego El mentiroso
}


function lastTheorem() {
  console.log("🎮 Iniciando juego de El Último Teorema en el móvil");

  const jugadorIdActual = localStorage.getItem("playerId");

  if (!jugadorIdActual) {
    alert("❌ Error: No se encuentra tu ID de jugador. Reinicia la aplicación.");
    return;
  }

  // Referencias a los componentes del móvil
  const inputNumber = document.getElementById("inputNumber");
  const btnEnviarNumero = document.getElementById("btnEnviarNumero");
  const statusMessage = document.getElementById("statusMessage");

  const jugadorRef = doc(window.db, "players", jugadorIdActual);

  // ========================================================
  // 1. ESCUCHA EN TIEMPO REAL (RESET CUANDO LA TV PASA DE RONDA)
  // ========================================================
  onSnapshot(jugadorRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const tenbin = data.tenbin;

      // SI EL JUGADOR HA MUERTO: Bloqueamos la interfaz por completo
      if (tenbin && tenbin.isAlive === false) {
        if (statusMessage) {
          statusMessage.innerHTML = `<span style="color: #ff4a4a; font-weight: bold;">💀 ¡HAS MUERTO! 💀</span><br>Has alcanzado los -10 puntos y has sido eliminado.`;
        }
        if (inputNumber) inputNumber.style.display = "none";
        if (btnEnviarNumero) btnEnviarNumero.style.display = "none";
        return;
      }

      // NUEVA RONDA: Si la TV limpió el número (es null o vacío) -> DESBLOQUEAMOS EL MÓVIL
      const numeroEnServidor = tenbin?.currentNumber;
      if (numeroEnServidor === undefined || numeroEnServidor === null || numeroEnServidor === "") {
        if (inputNumber) {
          inputNumber.value = "";        // Vaciamos el campo anterior
          inputNumber.disabled = false;  // Permitimos escribir de nuevo
        }
        if (btnEnviarNumero) {
          btnEnviarNumero.disabled = false; // Habilitamos el botón
          btnEnviarNumero.textContent = "Enviar Número";
        }
        if (statusMessage) {
          statusMessage.textContent = "Introduce tu número para esta ronda (0 a 100):";
        }
      }
    }
  });

  // ========================================================
  // 2. LÓGICA DEL BOTÓN ENVIAR
  // ========================================================
  if (btnEnviarNumero) {
    btnEnviarNumero.onclick = async () => {
      const numeroIngresado = inputNumber.value.trim();

      // Validaciones básicas antes de enviar
      if (numeroIngresado === "") {
        alert("Por favor, introduce un número antes de enviar.");
        return;
      }

      const numero = Number(numeroIngresado);
      if (isNaN(numero) || numero < 0 || numero > 100) {
        alert("Por favor, introduce un número válido entre 0 y 100.");
        return;
      }

      // Cuadro de confirmación para el jugador
      const seguro = confirm(`¿Estás seguro de enviar el número ${numero}? No podrás cambiarlo en esta ronda.`);

      if (seguro) {
        // Bloqueamos temporalmente para evitar doble envío instantáneo
        btnEnviarNumero.disabled = true;
        btnEnviarNumero.textContent = "Enviando...";
        inputNumber.disabled = true;

        try {
          // Guardar en la subpropiedad tenbin.currentNumber
          await updateDoc(jugadorRef, {
            "tenbin.currentNumber": numero
          });

          // Interfaz en modo espera
          statusMessage.innerHTML = `<span style="color: #4aff4a; font-weight: bold;">¡Número ${numero} enviado con éxito!</span><br>⏳ Esperando que la TV muestre los resultados y pase de ronda...`;
          btnEnviarNumero.textContent = "Número enviado";

        } catch (error) {
          console.error("Error al enviar el número a Firebase:", error);
          alert("Hubo un error de conexión al enviar tu respuesta. Inténtalo de nuevo.");

          // Reestablecer solo si falló el envío
          btnEnviarNumero.disabled = false;
          btnEnviarNumero.textContent = "Enviar Número";
          inputNumber.disabled = false;
        }
      }
    };
  }
}






// ======================
// Escucha la autodestrucción de la TV y resetea el localStorage
// ======================
window.addEventListener("DOMContentLoaded", () => {
  loadPlayers();

  // 1. Recuperar sesión si refrescan la pantalla de forma normal
  const savedId = localStorage.getItem("playerId");
  if (savedId) {
    window.miJugadorId = savedId;
    //conectarEscuchaPantalla(savedId);
  }
})