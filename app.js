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

// =====================
// PANTALLAS   oculta todas las pantallas menos la que pongas en screen
// =====================
function showScreen(screen) {
  document.getElementById("screenSelect").style.display = "none";
  document.getElementById("screenGame").style.display = "none";
  document.getElementById("screenRanking").style.display = "none";

  document.getElementById(screen).style.display = "block";
}

// =====================
// CARGAR JUGADORES
// =====================
async function loadPlayers() {
  const snapshot = await getDocs(collection(window.db, "players"));
  const container = document.getElementById("screenSelect");

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

loadPlayers();
// =====================
// SELECCIONAR JUGADOR
// =====================
async function selectPlayer(id, name) {
  // Actualizar Firebase para poner inGame en true. (Acordarse de ponerlo en false al salir o al iniciar el juego)
  const playerRef = doc(window.db, "players", id);
  await updateDoc(playerRef, {
    active: true
  });

function selectPlayer(id, name) {
  localStorage.setItem("playerId", id);
  localStorage.setItem("playerName", name); 

  document.getElementById("playerName").innerText = name;
  showScreen("screenWaiting");
  
  listenToRankingAndScore(); 
}

// =====================
// SCORE Y CLASIFICACIÓN EN TIEMPO REAL falta poner que solo aparezcan los que tienen inGame true
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
onSnapshot(ref, (doc) => {
  const state = doc.data();

  handleState(state); 
});
// Función usada antes para manejar el cambio de pantalla, ahora se hace directamente con el onSnapshot pero la dejo por si quieres hacer algo más complejo al cambiar de pantalla
function handleState(state) {

  if (state.screen === "lobby") {
    showScreen("screenSelect"); //pantalla de selección de personaje, una vez elegido se pasa a screenWaiting hasta que se pulse el botón de empezar en la TV
  }

  if (state.screen === "game") {
    showScreen("screenGame"); //Intro juegos + ruleta para elegir juego
    //1º Juego GeoGuessr personalizado. Falta poner el mapa o enlace a WorldGuessr
    if (state.game === "geoguessr") { 
      startGame(geoguessr);
    }
    //2º Juego Adivinar quién escucha la canción
    else if (state.game === "guessSong") {
      startGame(guessSong);
    }
    //3º Juego Torre de Cristal 
    else if (state.game === "glassTower") {
      startGame(glassTower);
    }
    //4º Juego El precio Irracional, el de las unidades de lentejas
    else if (state.game === "irrationalPrice") {
      startGame(irrationalPrice);
    }
    //5º Juego Cifras y letras juego de operaciones
    else if (state.game === "numbersAndLetters") {
      startGame(numbersAndLetters);
    }
    //6º Juego: Verdad o invent, presentadores cuentan 3 historias, 1 de verdad.
    else if (state.game === "truthOrLie") {
      startGame(truthOrLie);
    }
    //7º Juego: El mentiroso con material audiovisual
    else if (state.game === "theLiar") {
      startGame(theLiar);
    }
    //8º Juego: El último teorema. Ya solo juegan 5 jugadores.
    else {
      startGame(lastTheorem);
    }

  }
  if (state.screen === "ranking") {
    showScreen("screenRanking");
  }
};

window.selectPlayer = selectPlayer;