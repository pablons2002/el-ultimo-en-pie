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
  screenSymbolZone: "screenRanking"
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
  //document.getElementById("screenRoulette").style.display = "none";
  console.log("Estoy aquí", screen);
  document.getElementById(screen).style.display = "block";
}
// =====================
// CARGAR JUGADORES
// =====================
async function loadPlayers() {
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
      <img src="${player.img || ''}" 
        style="width:100px;height:100px;object-fit:cover;background:#ddd;">
      <br><b>${player.name}</b>
    `;
    card.onclick = () => selectPlayer(docSnap.id, player.name);

    container.appendChild(card);
  });
}

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
  SymbolZone: symbolZone, // 5º El de los símbolos en la espalda con pinzas y tienen que ir a su zona.
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







// ======================
// Escucha la autodestrucción de la TV y resetea el localStorage
// ======================
window.addEventListener("DOMContentLoaded", () => {
  loadPlayers();

  // 1. Recuperar sesión si refrescan la pantalla de forma normal
  const savedId = localStorage.getItem("playerId");
  if (savedId) {
    window.miJugadorId = savedId;
    conectarEscuchaPantalla(savedId);
  }
})