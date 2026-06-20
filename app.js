import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
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
  screenTheLiar: "screenRanking"
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
  document.getElementById("screenWinner").style.display = "none";

  document.getElementById(screen).style.display = "block";
}
// =====================
// FUNCIÓN: Reparar rutas relativas sin barras
// =====================
function repararRutaRelativa(ruta) {
  if (!ruta) return ruta;

  // Reemplazar patrones sin barras por rutas correctas
  const mapeoRutas = {
    'personajesIconos': '/personajesIconos/'
  };

  let rutaCorregida = ruta;
  for (const [buscar, reemplazar] of Object.entries(mapeoRutas)) {
    if (rutaCorregida.includes(buscar)) {
      rutaCorregida = rutaCorregida.replace(buscar, reemplazar);
    }
  }

  return rutaCorregida;
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
  const playerSelect = document.getElementById("playerSelect");
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

    // 2. Rellenar el SELECT con todos los jugadores
    if (playerSelect) {
      playerSelect.innerHTML = `<option value="">Opc</option>`;
      arrayPersonajes.forEach(personaje => {
        const option = document.createElement("option");
        option.value = personaje.id;
        option.textContent = personaje.name;
        playerSelect.appendChild(option);
      });

      // 3. Escuchar cambios en el select
      playerSelect.addEventListener("change", (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;

        const jugadorElegido = arrayPersonajes.find(p => p.id === selectedId);
        if (jugadorElegido) {
          selectPlayer(jugadorElegido.id, jugadorElegido.name, jugadorElegido.img);
          document.getElementById("selectorContainer").style.display = "none";
          document.getElementById("playerProfile").style.display = "flex";
        }
      });
    }

    idxCartaActual = 0; // Empezamos en la primera carta
    window.renderizarCartaActual(); // Pintamos la interfaz de navegación

  } catch (error) {
    console.error("Error al cargar los cromos:", error);
  }
}

// NUEVA FUNCIÓN: Se encarga de pintar la estructura 1 a 1 en la pantalla
window.renderizarCartaActual = function () {
  const container = document.getElementById("screenSelect");
  if (!container || arrayPersonajes.length === 0) return;

  const personaje = arrayPersonajes[idxCartaActual];

  // Estructura limpia del Carrusel/Mazo
  console.log("Personaje: " + personaje);
  console.log("imgCard:", personaje.imgCard);
  console.log("img:", personaje.img);
  container.innerHTML = `
    <div class="mazo-cartas-contenedor">
      
      <div class="cromo-olimpico" id="cromoAnimado">
        <img src="${personaje.imgCard || ''}" class="cromo-foto" alt="${personaje.name}">
        <div class="cromo-nombre"><b>${personaje.name}</b></div>
        
        <button class="btn-elegir-personaje" onclick="selectPlayer('${personaje.id}', '${personaje.name}', '${personaje.img}')">
          Elegir Personaje
        </button>
      </div>

      <div style="display: flex; gap: 20px; align-items: center;">
        <button class="btn-navegacion" onclick="cambiarCartaMentiroso(-1)">◀ Anterior</button>
        <span style="font-weight: bold; color: #132640;">
          ${idxCartaActual + 1} / ${arrayPersonajes.length}
        </span>
        <button class="btn-navegacion" onclick="cambiarCartaMentiroso(1)">Siguiente ▶</button>
      </div>

    </div>
  `;
};

// NUEVA FUNCIÓN: Controla los límites del mazo al pulsar Anterior o Siguiente
window.cambiarCartaMentiroso = function (direccion) {
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
async function selectPlayer(id, name, img) {
  // 1. Guardar datos en localStorage y variable global
  localStorage.setItem("playerId", id);
  localStorage.setItem("playerName", name);
  window.miJugadorId = id;

  // Reparar la ruta si es relativa
  const imgCorregida = repararRutaRelativa(img);
  localStorage.setItem("playerImg", imgCorregida);

  // 2. Pintar el nombre en el Header/UI de forma directa
  const userNameHeader = document.getElementById("userNameHeader");
  if (userNameHeader) userNameHeader.innerText = name;

  // PINTAR LA IMAGEN
  console.log("Imagen original:", img);
  console.log("Imagen corregida:", imgCorregida);
  const userImgHeader = document.getElementById("userImgHeader");
  if (userImgHeader && imgCorregida) {
    userImgHeader.src = imgCorregida;          // Asigna la ruta de la imagen
    userImgHeader.style.display = "inline"; // La hace visible en el header
  }

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
// RANKING EN TIEMPO REAL CON HISTORIAL Y ORÁCULO PERSONALIZADO
// =========================================================================
function listenToRankingAndScore() {
  const tablaContenedor = document.getElementById("listaRankingActivos");
  const oraculoContenedor = document.getElementById("oraculoMensaje");

  if (!tablaContenedor || !window.db) {
    setTimeout(listenToRankingAndScore, 50);
    return;
  }

  console.log("¡Conectando con el Oráculo de Firebase para el ranking activo!");

  const q = query(
    collection(window.db, "players"),
    where("active", "==", true),
    orderBy("score", "desc")
  );

  onSnapshot(q, (snapshot) => {
    tablaContenedor.innerHTML = "";

    // Recuperar historial de posiciones previas guardadas para calcular subidas/bajadas
    let historialPosiciones = JSON.parse(localStorage.getItem("historialPosiciones") || "{}");
    let nuevoHistorial = {};

    const miIdActual = localStorage.getItem("playerId");

    let listaJugadoresProcesados = [];
    let posicion = 1;

    // 1. Mapeamos y procesamos los datos del snapshot
    snapshot.forEach((docSnap) => {
      const jugador = docSnap.data();
      const id = docSnap.id;
      listaJugadoresProcesados.push({
        id: id,
        name: jugador.name || "Sin nombre",
        score: jugador.score ?? 0,
        img: jugador.img || "images/iconoWeb.svg"
      });
    });

    // 2. Renderizar filas y calcular estados
    listaJugadoresProcesados.forEach((jugador, index) => {
      const id = jugador.id;
      nuevoHistorial[id] = posicion; // Guardamos su posición actual

      // Calcular tendencia (Subió, Bajó o Igual)
      let tendenciaIcono = "•";
      let tendenciaClase = "tendencia-igual";

      if (historialPosiciones[id]) {
        if (posicion < historialPosiciones[id]) {
          tendenciaIcono = "▲"; // Subió de puesto (número de posición menor)
          tendenciaClase = "tendencia-sube";
        } else if (posicion > historialPosiciones[id]) {
          tendenciaIcono = "▼"; // Bajó de puesto
          tendenciaClase = "tendencia-baja";
        }
      }

      // Crear fila HTML
      const fila = document.createElement("tr");
      // Si soy yo, resaltamos mi fila con diseño divino
      if (id === miIdActual) {
        fila.className = "mi-fila-divina";
      }

      fila.innerHTML = `
        <td>
          <div class="pos-celda">
            <span class="${tendenciaClase}">${tendenciaIcono}</span>
            <strong>#${posicion}</strong>
          </div>
        </td>
        <td>
          <div class="heroe-celda">
            <img src="${jugador.img}" class="avatar-ranking" onerror="this.src='images/iconoWeb.svg'">
            <span>${jugador.name}</span>
          </div>
        </td>
        <td><span class="puntos-badge">${jugador.score} pts</span></td>
      `;

      tablaContenedor.appendChild(fila);
      posicion++;
    });

    // Guardamos el nuevo orden para la próxima actualización en tiempo real
    localStorage.setItem("historialPosiciones", JSON.stringify(nuevoHistorial));

    // 3. GENERAR EL MENSAJE PERSONALIZADO DEL ORÁCULO
    if (oraculoContenedor && miIdActual) {
      const miIndex = listaJugadoresProcesados.findIndex(p => p.id === miIdActual);

      if (miIndex !== -1) {
        const miDatos = listaJugadoresProcesados[miIndex];
        const miPosicion = miIndex + 1;

        if (miPosicion === 1) {
          // Eres el líder absoluto
          oraculoContenedor.innerHTML = `
            <span class="oraculo-texto aleron-oro">
              ¡Dominas el Olimpo, <b>${miDatos.name}</b>! Estás en la posición <b>#1</b>. ¡Defiende tu trono!
            </span>`;
        } else {
          // Hay alguien por encima
          const rivalEncima = listaJugadoresProcesados[miIndex - 1];
          const diferenciaPuntos = rivalEncima.score - miDatos.score;

          oraculoContenedor.innerHTML = `
            <span class="oraculo-texto">
              Vas en posición <b>#${miPosicion}</b>. Estás a solo <b>${diferenciaPuntos} pts</b> de alcanzar a <b>${rivalEncima.name}</b>. ¡A por ellos!
            </span>`;
        }
      } else {
        oraculoContenedor.innerHTML = `<span class="oraculo-texto">Echa un vistazo al templo de puntuaciones.</span>`;
      }
    }
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
  const hiddenSel = document.getElementById("hiddenSeleccionPI");

  // --- LÓGICA DE SELECCIÓN DE BOTONES P / I ---
  if (btnP && btnI) {
    btnP.onclick = () => {
      seleccionPI = "P";
      if (hiddenSel) hiddenSel.value = "P";
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
      if (hiddenSel) hiddenSel.value = "I";
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

      // Leer selección del hidden input si existe
      const seleccionActual = (hiddenSel && hiddenSel.value) ? hiddenSel.value : seleccionPI;
      if (!seleccionActual) {
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
          "respuestasSong.respuestaPI": seleccionActual // <-- NUEVO CAMPO EN FIREBASE
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
          if (hiddenSel) hiddenSel.value = "";
          // Reset visual estado por defecto
          if (btnP) {
            btnP.style.background = "white";
            btnP.style.color = "#333";
            btnP.style.borderColor = "#ccc";
          }
          if (btnI) {
            btnI.style.background = "white";
            btnI.style.color = "#333";
            btnI.style.borderColor = "#ccc";
          }
          // --- LÓGICA DE SELECCIÓN DE BOTONES P / I GRIEGO ---
          if (btnP && btnI) {
            btnP.onclick = () => {
              seleccionPI = "P";
              if (hiddenSel) hiddenSel.value = "P";
              // Seleccionado P: Fondo dorado viejo, letras oscuras
              btnP.style.background = "#d4af37";
              btnP.style.color = "#1c2833";
              btnP.style.borderColor = "#1c2833";

              // Desmarcado I: Vuelve a su estado oscuro del templo
              btnI.style.background = "#1c2833";
              btnI.style.color = "#d4af37";
              btnI.style.borderColor = "#b89047";
            };

            btnI.onclick = () => {
              seleccionPI = "I";
              if (hiddenSel) hiddenSel.value = "I";
              // Seleccionado I: Fondo dorado viejo, letras oscuras
              btnI.style.background = "#d4af37";
              btnI.style.color = "#1c2833";
              btnI.style.borderColor = "#1c2833";

              // Desmarcado P: Vuelve a su estado oscuro del templo
              btnP.style.background = "#1c2833";
              btnP.style.color = "#d4af37";
              btnP.style.borderColor = "#b89047";
            };
          }
          // 3. Rehabilitar el botón de enviar y restaurar texto
          if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.innerText = "Enviar veredicto";
          }
        }
      }
    });
  }

  // ==========================================================
  // 🔥 ESCUCHADOR 2: CONTROL GLOBAL DE INTERFAZ (Tiempo / Estados)
  // ==========================================================
  onSnapshot(doc(window.db, "game", "songState"), (docSnapshot) => {
    (async () => {
      if (!docSnapshot.exists()) return;
      const datosJuego = docSnapshot.data();

      const contenedorForm = document.getElementById("screenGuessSong");
      const contenedorEspera = document.getElementById("pantalla-espera");
      const contenedorTiempoAgotado = document.getElementById("pantalla-tiempo-agotado");

      if (datosJuego.state === false) {
        console.log("🛑 Tiempo agotado. Comprobando si ya enviaste respuesta...");
        // Si el jugador ya envió su respuesta, mostrar la pantalla de espera en lugar de 'tiempo agotado'
        let playerSent = false;
        if (miPlayerId) {
          try {
            const playerSnap = await getDoc(doc(window.db, "players", miPlayerId));
            if (playerSnap.exists()) {
              const pd = playerSnap.data();
              if (pd && pd.respuestasSong) playerSent = true;
            }
          } catch (e) {
            console.warn("No se pudo comprobar el estado de respuestasSong:", e);
          }
        }

        if (playerSent) {
          if (contenedorForm) contenedorForm.style.display = "none";
          if (contenedorEspera) contenedorEspera.style.display = "block";
          if (contenedorTiempoAgotado) contenedorTiempoAgotado.style.display = "none";
        } else {
          console.log("🛑 Tiempo agotado. Mostrando pantalla de bloqueo...");
          if (contenedorForm) contenedorForm.style.display = "none";
          if (contenedorEspera) contenedorEspera.style.display = "none";
          if (contenedorTiempoAgotado) contenedorTiempoAgotado.style.display = "block";
        }

      } else if (datosJuego.state === true) {
        console.log("🎵 Nueva canción en marcha. Mostrando formulario...");
        if (contenedorForm) contenedorForm.style.display = "block";
        if (contenedorEspera) contenedorEspera.style.display = "none";
        if (contenedorTiempoAgotado) contenedorTiempoAgotado.style.display = "none";
      }
    })();
  });
}

// Nota: Eliminado handler duplicado de `btnEnviarGuessSong` que causaba conflictos.


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
  console.log("🎮 Iniciando juego de El Conteo de las Moiras en el móvil");

  const btnEnviar = document.getElementById("btnEnviarPrice");

  if (btnEnviar) {
    btnEnviar.onclick = async () => {
      const miPlayerId = localStorage.getItem("playerId");

      if (!miPlayerId) {
        alert("❌ Error: No se encuentra tu ID de jugador. Reinicia la aplicación.");
        return;
      }

      const inputMovil = document.getElementById("inputMovilLentejas");
      const respuestaUsuario = inputMovil ? inputMovil.value.trim() : "";

      if (!respuestaUsuario || isNaN(respuestaUsuario)) {
        alert("🔢 Por favor, introduce un número válido antes de enviar.");
        return;
      }

      try {
        btnEnviar.disabled = true;
        btnEnviar.innerText = "⏳ Guardando destino...";

        const playerRef = doc(window.db, "players", miPlayerId);
        await updateDoc(playerRef, {
          lentejasGuess: parseFloat(respuestaUsuario)
        });

        console.log(`✅ Respuesta de hilos (${respuestaUsuario}) guardada con éxito para el jugador: ${miPlayerId}`);

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
        btnEnviar.innerText = "Sellar Destino ⚡";
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
// 1. Las variables de control se quedan fuera para mantener su estado limpio
let formulaActualMovil = "";
let jugadorIdActual = "";
let numerosDisponiblesRonda = [];
let indicesNumerosUsados = [];

function numbersAndLetters() {
  jugadorIdActual = localStorage.getItem("playerId");

  if (window._cifrasListenerActive) {
    return;
  }
  window._cifrasListenerActive = true;

  const resetCifrasUI = () => {
    if (document.getElementById("formularioCifrasContenedor")) document.getElementById("formularioCifrasContenedor").style.display = "block";
    if (document.getElementById("esperaCifrasContenedor")) document.getElementById("esperaCifrasContenedor").style.display = "none";
    formulaActualMovil = "";
    indicesNumerosUsados = [];
    window.borrarTodoCifras();
  };

  resetCifrasUI();

  onSnapshot(doc(window.db, "game", "numberState"), (docSnap) => {
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    numerosDisponiblesRonda = data.cifrasDisponibles || [];
    const objetivo = data.cifrasObjetivo || 0;

    resetCifrasUI();

    const formularioCifrasContenedor = document.getElementById("formularioCifrasContenedor");
    const esperaCifrasContenedor = document.getElementById("esperaCifrasContenedor");
    if (formularioCifrasContenedor) formularioCifrasContenedor.style.display = "block";
    if (esperaCifrasContenedor) esperaCifrasContenedor.style.display = "none";

    const elObjetivo = document.getElementById("movilObjetivoCifras");
    if (elObjetivo) elObjetivo.innerText = objetivo > 0 ? objetivo : "---";

    const contenedorBotones = document.getElementById("movilBotonesNumeros");
    if (contenedorBotones) {
      if (numerosDisponiblesRonda.length === 0) {
        contenedorBotones.innerHTML = `<span style="color:#888; font-style:italic; text-align:center; width:100%;">Esperando las cifras de la Moira...</span>`;
      } else {
        contenedorBotones.innerHTML = "";
        numerosDisponiblesRonda.forEach((num, index) => {
          const btn = document.createElement("button");
          btn.innerText = num;
          btn.id = `btn-cifra-${index}`;
          btn.style.flex = "1";
          btn.style.margin = "4px";
          btn.style.background = "#1c2833";
          btn.style.color = "#d4af37";
          btn.style.border = "2px solid #b89047";
          btn.style.fontSize = "1.3rem";
          btn.style.fontWeight = "bold";
          btn.style.padding = "12px 5px";
          btn.style.borderRadius = "4px";
          btn.style.cursor = "pointer";
          btn.style.transition = "all 0.2s ease";

          if (indicesNumerosUsados.includes(index)) {
            btn.style.background = "#0b1014";
            btn.style.color = "rgba(184, 144, 71, 0.2)";
            btn.style.borderColor = "rgba(184, 144, 71, 0.2)";
            btn.style.opacity = "0.3";
          }

          btn.onclick = () => window.pulsarNumeroReto(num, index);
          contenedorBotones.appendChild(btn);
        });
      }
    }

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
        btnOp.style.background = "#2b251a";
        btnOp.style.color = "#f1e983";
        btnOp.style.border = "1px solid #b89047";
        btnOp.style.borderRadius = "4px";
        btnOp.style.fontWeight = "bold";
        btnOp.style.cursor = "pointer";

        btnOp.onclick = () => {
          formulaActualMovil += op;
          window.actualizarPantallaFormulaVisual();
        };
        contenedorOperadores.appendChild(btnOp);
      });
    }

    const instrucciones = document.getElementById("movilInstruccionesCifras");
    if (instrucciones) instrucciones.innerText = "Mide y teje la ecuación matemática exacta:";

    const btnEnviar = document.getElementById("btnEnviarCifras");
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.innerText = "Sellar Ecuación ⚡";
    }
  });
}

// 3. EXPOSICIÓN GLOBAL DE FUNCIONES DE CONTROL ACTUALIZADAS CON LOS COLORES DIVINOS
window.pulsarNumeroReto = function (numero, index) {
  if (indicesNumerosUsados.includes(index)) return;

  formulaActualMovil += numero.toString();
  indicesNumerosUsados.push(index);

  const btn = document.getElementById(`btn-cifra-${index}`);
  if (btn) {
    btn.style.background = "#0b1014";
    btn.style.color = "rgba(184, 144, 71, 0.2)";
    btn.style.borderColor = "rgba(184, 144, 71, 0.2)";
    btn.style.opacity = "0.3";
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
        btn.style.background = "#1c2833";
        btn.style.color = "#d4af37";
        btn.style.borderColor = "#b89047";
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
      btn.style.background = "#1c2833";
      btn.style.color = "#d4af37";
      btn.style.borderColor = "#b89047";
      btn.style.opacity = "1";
    }
  });
  window.actualizarPantallaFormulaVisual();
};

window.actualizarPantallaFormulaVisual = function () {
  const pantalla = document.getElementById("movilPantallaFormula");
  if (pantalla) {
    pantalla.innerText = formulaActualMovil || "Tu ecuación...";
    pantalla.style.color = formulaActualMovil ? "#f1e983" : "#555";
  }
};

window.enviarFormulaAlPresentador = async function () {
  if (!formulaActualMovil) return; // Quitamos alert silenciosamente
  if (!jugadorIdActual) return;

  try {
    const btnEnviar = document.getElementById("btnEnviarCifras");
    if (btnEnviar) {
      btnEnviar.disabled = true;
      btnEnviar.innerText = "⏳ Enlazando destino...";
    }

    const playerRef = doc(window.db, "players", jugadorIdActual);
    await updateDoc(playerRef, { cifrasFormula: formulaActualMovil });

    console.log("✨ Fórmula enviada con éxito a Láquesis.");

    // INTERCAMBIO DE CONTENEDORES SIN ALERTAS FEAS
    if (document.getElementById("formularioCifrasContenedor")) {
      document.getElementById("formularioCifrasContenedor").style.display = "none";
    }
    if (document.getElementById("esperaCifrasContenedor")) {
      document.getElementById("esperaCifrasContenedor").style.display = "block";
    }

  } catch (error) {
    console.error("Error enviando fórmula a Firebase:", error);
    const btnEnviar = document.getElementById("btnEnviarCifras");
    if (btnEnviar) {
      btnEnviar.disabled = false;
      btnEnviar.innerText = "Sellar Ecuación ⚡";
    }
  }
};


function votes() {
  // --- LÓGICA DE VOTACIÓN PARA EL MÓVIL ---

  window.inicializarVotacionMovil = function () {
    const miIdLocal = localStorage.getItem("playerId");

    if (!miIdLocal) {
      console.error("Votación Móvil: No se encuentra el ID del jugador local registrado.");
      return;
    }

    const contenedorLista = document.getElementById("moListaParaVotar");
    const bloqueConfirmacion = document.getElementById("moMensajeVotoEnviado");

    let idRivalSeleccionado = null;

    onSnapshot(query(collection(window.db, "players"), where("active", "==", true)), (snapshot) => {
      if (!contenedorLista) return;

      let compañerosAptos = [];
      let yaHeVotado = false;

      snapshot.forEach((docSnap) => {
        const datos = docSnap.data();
        const idJugador = docSnap.id;

        if (idJugador === miIdLocal) {
          if (datos.votoEnviado && datos.votoEnviado !== "") {
            yaHeVotado = true;
          }
        } else {
          // Preferimos cargar imagen del jugador desde Firebase. Si no existe, usamos fallback local.
          let iconoUrl = datos.img ? repararRutaRelativa(datos.img) : "";
          if (!iconoUrl && datos.img) {
            iconoUrl = repararRutaRelativa(datos.img);
          }
          if (!iconoUrl) {
            iconoUrl = "images/personajesIconos/PabloCircle.png";
            if (datos.name && (datos.name.toLowerCase().includes("ines") || datos.name.toLowerCase().includes("inés"))) {
              iconoUrl = "images/personajesIconos/InesGCircle.png";
            }
          }

          compañerosAptos.push({
            id: idJugador,
            name: datos.name,
            icon: iconoUrl
          });
        }
      });

      if (yaHeVotado) {
        contenedorLista.style.display = "none";
        if (bloqueConfirmacion) bloqueConfirmacion.style.display = "block";
        return;
      }

      contenedorLista.style.display = "flex";
      if (bloqueConfirmacion) bloqueConfirmacion.style.display = "none";
      contenedorLista.innerHTML = "";

      if (compañerosAptos.length === 0) {
        contenedorLista.innerHTML = `<p style="color: #666; font-style: italic; text-align: center;">No hay otros competidores desafiando tu destino...</p>`;
        return;
      }

      compañerosAptos.forEach((rival) => {
        const botonVoto = document.createElement("button");

        // Estructura interna del botón: Imagen de avatar + Contenedor de Texto
        botonVoto.innerHTML = `
          <img src="${rival.icon}" style="width: 26px; height: 26px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
          <span class="txt-voto">${rival.name}</span>
        `;

        // Estilos base divinos y CENTRADOS
        botonVoto.style.background = "#1c2833";
        botonVoto.style.color = "#d4af37";
        botonVoto.style.border = "2px solid #b89047";
        botonVoto.style.padding = "12px 15px";
        botonVoto.style.borderRadius = "4px";
        botonVoto.style.fontSize = "1.05rem";
        botonVoto.style.fontWeight = "bold";
        botonVoto.style.cursor = "pointer";

        // Flexbox para centrar todo el contenido del botón perfectamente
        botonVoto.style.display = "inline-flex";
        botonVoto.style.alignItems = "center";
        botonVoto.style.justifyContent = "center";
        botonVoto.style.gap = "10px";

        botonVoto.style.width = "100%";
        botonVoto.style.boxSizing = "border-box";
        botonVoto.style.transition = "all 0.2s ease";

        botonVoto.onclick = async () => {

          if (idRivalSeleccionado !== rival.id) {
            idRivalSeleccionado = rival.id;

            // Limpiar y resetear los demás botones al estado original
            Array.from(contenedorLista.children).forEach((btn, index) => {
              const rivalOriginal = compañerosAptos[index];
              if (rivalOriginal && rivalOriginal.id !== rival.id) {
                btn.style.background = "#1c2833";
                btn.style.color = "#d4af37";
                btn.style.borderColor = "#b89047";

                // Restauramos la estructura limpia con su nombre original e icono
                btn.innerHTML = `
                  <img src="${rivalOriginal.icon}" style="width: 26px; height: 26px; border-radius: 50%; border: 1px solid #b89047; object-fit: cover;">
                  <span class="txt-voto">${rivalOriginal.name}</span>
                `;
              }
            });

            // Destello dorado y actualización de texto centrada
            botonVoto.style.background = "#d4af37";
            botonVoto.style.color = "#1c2833";
            botonVoto.style.borderColor = "#f1e983";

            // Cambiamos la imagen del icono de borde para que resalte sobre el fondo oro
            const imgIcono = botonVoto.querySelector("img");
            if (imgIcono) imgIcono.style.borderColor = "#1c2833";

            botonVoto.querySelector(".txt-voto").innerText = `¿Confirmar voto a ${rival.name}?`;
            return;
          }

          // Enviar voto definitivo a Firebase si se pulsa por segunda vez
          try {
            botonVoto.disabled = true;
            botonVoto.querySelector(".txt-voto").innerText = "⏳ Entregando veredicto...";

            const miReferencia = doc(window.db, "players", miIdLocal);
            await updateDoc(miReferencia, {
              votoEnviado: rival.name
            });

            console.log(`Voto registrado con éxito hacia: ${rival.name}`);
          } catch (error) {
            console.error("Error al procesar el voto desde el móvil:", error);
            alert("Hubo un error al enviar el voto. Inténtalo de nuevo.");
            idRivalSeleccionado = null;
            botonVoto.disabled = false;
            botonVoto.style.background = "#1c2833";
            botonVoto.style.color = "#d4af37";

            const imgIcono = botonVoto.querySelector("img");
            if (imgIcono) imgIcono.style.borderColor = "#b89047";

            botonVoto.querySelector(".txt-voto").innerText = `${rival.name}`;
          }
        };

        contenedorLista.appendChild(botonVoto);
      });
    });
  };
  window.inicializarVotacionMovil();
}
function theLiar() {

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

// =====================
// Ganador
// =====================
function finalWinnerScreen(nombreGanadorGlobal, rankingJugadores) {
  console.log("🏛️ Renderizando pantalla final del Olimpo en el móvil");
  
  const miIdLocal = localStorage.getItem("playerId");
  
  // 1. Pintamos el nombre del ganador de la partida en el banner superior
  const txtGanador = document.getElementById("movilNombreGanador");
  if (txtGanador) {
    txtGanador.innerText = `🏆 ${nombreGanadorGlobal.toUpperCase()}`;
  }

  // 2. Buscamos nuestra propia información en el ranking que manda la TV o Firebase
  // rankingJugadores debe ser un Array ordenado de objetos: [{id: "123", name: "Inés", puntos: 50, imgCard: "images/..."}, ...]
  if (rankingJugadores && rankingJugadores.length > 0) {
    
    // Buscamos en qué índice (posición) nos hemos quedado
    const miIndex = rankingJugadores.findIndex(p => p.id === miIdLocal);
    const miPuestoNum = miIndex + 1; // El índice 0 es el 1º puesto
    
    const txtPosicion = document.getElementById("movilMiPosicion");
    const imgCarta = document.getElementById("movilMiCartaFinal");

    if (miIndex !== -1) {
      const misDatos = rankingJugadores[miIndex];

      // Seteamos la ruta de tu imgCard que viene de la base de datos
      if (imgCarta && misDatos.imgCard) {
        imgCarta.src = misDatos.imgCard;
      }

      // Personalizamos el mensaje según si has ganado o has quedado abajo
      if (txtPosicion) {
        if (miPuestoNum === 1) {
          txtPosicion.innerHTML = `👑 ¡Has ascendido al Olimpo! Eres el Dios supremo con ${misDatos.puntos} puntos.`;
          txtPosicion.style.color = "#f1e983"; // Dorado resplandeciente
        } else {
          txtPosicion.innerHTML = `Has quedado en la posición <span style="color:#d4af37; font-size:1.4rem;">#${miPuestoNum}</span> con ${misDatos.puntos} puntos.`;
        }
      }
    }
  }
}







// ======================
// Escucha la autodestrucción de la TV y resetea el localStorage
// ======================
window.addEventListener("DOMContentLoaded", async () => {
  // Esperar a que se carguen los jugadores y se pueble el select
  try {
    await loadPlayers();
  } catch (e) {
    console.warn('Error cargando jugadores en DOMContentLoaded:', e);
  }

  // 2. Recuperar datos de sesión de localStorage
  const savedId = localStorage.getItem("playerId");
  const savedName = localStorage.getItem("playerName");
  const savedImg = localStorage.getItem("playerImg");

  const playerProfile = document.getElementById("playerProfile");
  const selectorContainer = document.getElementById("selectorContainer");
  const playerSelect = document.getElementById("playerSelect");

  // Si hay jugador guardado mostramos su perfil, pero sólo ocultamos el selector
  // si el select ya está correctamente poblado (para evitar ocultarlo prematuramente)
  if (savedId && savedName && savedImg) {
    window.miJugadorId = savedId;
    const nameEl = document.getElementById("userNameHeader");
    const imgEl = document.getElementById("userImgHeader");
    if (nameEl) nameEl.innerText = savedName;
    if (imgEl) imgEl.src = savedImg;

    const hasPlayers = playerSelect && playerSelect.options && playerSelect.options.length > 1;
    if (hasPlayers) {
      if (playerProfile) playerProfile.style.display = "flex";
      if (selectorContainer) selectorContainer.style.display = "none";
    } else {
      if (playerProfile) playerProfile.style.display = "none";
      if (selectorContainer) selectorContainer.style.display = "inline-block";
    }
  } else {
    if (playerProfile) playerProfile.style.display = "none";
    if (selectorContainer) selectorContainer.style.display = "inline-block";
  }
});