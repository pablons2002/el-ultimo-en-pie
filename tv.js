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


// 3. CAPTURA DE ELEMENTOS DEL HTML
const botonPlay = document.getElementById('btn-play');
const botonSiguiente = document.getElementById('btn-siguiente');
const reproductor = document.getElementById('mi-reproductor');
const barraProgreso = document.getElementById('barra-progreso');
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

// 5. FUNCIONES DE CONTROL DEL CRONÓMETRO
function iniciarCronometro() {
    if (IDIntervalo !== null) return;

    // AGREGADO: 'async' antes de los parámetros () de la función del setInterval
    IDIntervalo = setInterval(async () => {
        tiempoRestante--;
        segundosCronoTxt.textContent = tiempoRestante;

        // Si se acaba el tiempo, detenemos y mostramos la solución
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

// Transforma segundos flotantes a formato MM:SS
function formatearTiempo(segundos) {
    if (isNaN(segundos)) return "0:00";
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

// 6. FASE 1 DE LA RESPUESTA: MOSTRAR TÍTULO Y AUTOR LIMPIOS
async function revelarRespuesta() {
    reproductor.pause(); 
    pausarCronometro();  

    const cancionActual = listaCanciones[indiceActual];
    txtNombreCancion.textContent = cancionActual.nombreCancion || "Desconocido";
    txtAutor.textContent = cancionActual.autor || "Desconocido";

    // Ocultamos el bloque de usuarios por ahora y aseguramos que el botón de ver respuestas aparezca
    contenedorRespuestasUsuarios.style.display = "none";
    btnVerRespuestas.style.display = "inline-block";

    pantallaJuego.style.display = "none";
    pantallaRespuesta.style.display = "block";
}

// 7. FASE 2 DE LA RESPUESTA: EVENTO PARA CARGAR LAS RESPUESTAS Y ASIGNAR PUNTOS AL SCORE
btnVerRespuestas.addEventListener('click', async () => {
    btnVerRespuestas.style.display = "none"; // Escondemos este botón intermedio
    listaRespuestasUI.innerHTML = "";        // Limpiamos respuestas de rondas anteriores

    try {
        // Consultamos la colección 'players' en Firestore
        const querySnapshot = await getDocs(collection(db, "players"));
        
        querySnapshot.forEach((jugadorDoc) => {
            const datosJugador = jugadorDoc.data();
            const idJugador = jugadorDoc.id; // ID del documento del jugador
            
            // Accedemos al mapa respuestasSong
            const respuestasSong = datosJugador.respuestasSong || {};
            
            const cancionRespondida = respuestasSong.respuestaCancion ? respuestasSong.respuestaCancion.trim() : "";
            const autorRespondido = respuestasSong.respuestaAutor ? respuestasSong.respuestaAutor.trim() : "";

            // Solo creamos la fila si el usuario escribió algo
            if (cancionRespondida || autorRespondido) {
                const li = document.createElement('li');
                
                // Estilos para alinear texto a la izquierda y botones a la derecha
                li.style.display = "flex";
                li.style.justifyContent = "between";
                li.style.alignItems = "center";
                li.style.padding = "12px 10px";
                li.style.borderBottom = "1px dashed #eee";
                li.style.fontSize = "18px";
                
                const cancionMostrar = cancionRespondida || "❓";
                const autorMostrar = autorRespondido || "❓";
                
                // Creamos la parte del texto (añadimos también una pequeña guía visual de su score actual)
                const scoreActual = datosJugador.score || 0;
                const contenedorTexto = document.createElement('div');
                contenedorTexto.innerHTML = `👤 <strong>${datosJugador.name || "Jugador Anónimo"}:</strong> "${cancionMostrar}" de <em>${autorMostrar}</em> <span style="font-size: 14px; color: #7f8c8d; margin-left: 10px;">(Score: ${scoreActual} pts)</span>`;
                
                // Creamos el contenedor de los botones de puntuación
                const contenedorBotones = document.createElement('div');
                contenedorBotones.style.display = "flex";
                contenedorBotones.style.gap = "8px"; 
                contenedorBotones.style.marginLeft = "auto"; // Empuja los botones a la derecha
                
                // Array con los botones 0, 1 y 2
                const puntuaciones = [0, 1, 2];
                
                puntuaciones.forEach((puntos) => {
                    const btnPuntos = document.createElement('button');
                    btnPuntos.textContent = puntos;
                    
                    // Estilos visuales de los botones
                    btnPuntos.style.padding = "6px 14px";
                    btnPuntos.style.fontSize = "16px";
                    btnPuntos.style.fontWeight = "bold";
                    btnPuntos.style.cursor = "pointer";
                    btnPuntos.style.borderRadius = "6px";
                    btnPuntos.style.border = "1px solid #ccc";
                    btnPuntos.style.background = "#f8f9fa";
                    btnPuntos.style.transition = "all 0.2s";

                    btnPuntos.onmouseover = () => { if(!btnPuntos.disabled) btnPuntos.style.background = "#e2e8f0"; };
                    btnPuntos.onmouseout = () => { if(!btnPuntos.disabled) btnPuntos.style.background = "#f8f9fa"; };
                    
                    // 🔥 ACCIÓN PRINCIPAL: SUMAR PUNTOS AL CLICK
                    btnPuntos.onclick = async () => {
                        console.log(`Añadiendo ${puntos} puntos al score de ${datosJugador.name}`);
                        
                        try {
                            const jugadorRef = doc(db, "players", idJugador);
                            
                            // Sumamos los nuevos puntos al score que ya tenía (si no tiene, empieza en 0)
                            const scoreAcumulado = (datosJugador.score || 0) + puntos;
                            
                            await updateDoc(jugadorRef, {
                                score: scoreAcumulado
                            });

                            // Bloqueamos los 3 botones de este jugador para evitar doble puntuación en la misma canción
                            contenedorBotones.querySelectorAll('button').forEach((b) => {
                                b.disabled = true;
                                b.style.cursor = "default";
                                b.style.opacity = "0.5";
                            });

                            // Destacamos en verde y con texto blanco el botón que elegiste
                            btnPuntos.style.background = "#2ecc71";
                            btnPuntos.style.color = "white";
                            btnPuntos.style.borderColor = "#27ae60";
                            btnPuntos.style.opacity = "1";

                            console.log(`✅ Firebase actualizado. Nuevo score para ${idJugador}: ${scoreAcumulado}`);

                        } catch (err) {
                            console.error("Error al actualizar el score en Firebase:", err);
                            alert("No se pudo guardar la puntuación. Revisa la conexión.");
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
        alert("No se pudieron cargar las respuestas. Revisa la consola.");
    }

    contenedorRespuestasUsuarios.style.display = "block";
});

// 8. FUNCIÓN PARA CARGAR LA SIGUIENTE CANCIÓN LOCAL
function cargarCancion(indice) {
    if (indice < listaCanciones.length) {
        // Regresamos a la interfaz de reproducción y ocultamos las tarjetas de respuestas
        pantallaRespuesta.style.display = "none";
        contenedorRespuestasUsuarios.style.display = "none";
        pantallaJuego.style.display = "block";

        // Reiniciamos elementos multimedia
        reproductor.src = listaCanciones[indice].url;
        barraProgreso.value = 0;
        tiempoActualTxt.textContent = "0:00";
        reiniciarCronometro();
        
        botonPlay.disabled = false;
        botonPlay.textContent = "Reproducir Música 🎵";
        botonSiguiente.disabled = false;
    } else {
        // Si no quedan más canciones en el array
        pantallaRespuesta.style.display = "none";
        pantallaJuego.style.display = "block";
        reiniciarCronometro();
        botonPlay.textContent = "¡Fin del juego! 🏆";
        botonPlay.disabled = true;
        botonSiguiente.disabled = true;
        alert("¡Has terminado todas las canciones disponibles!");
    }
}

// 9. EVENTO: INICIAR JUEGO / PLAY / PAUSA
botonPlay.addEventListener('click', async () => {
    try {
        // Descarga inicial de canciones solo en el primer clic de la partida
        if (listaCanciones.length === 0) {
            botonPlay.textContent = "Cargando canciones...";
            
            const querySnapshot = await getDocs(collection(db, "GuessSong"));
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

        // Interruptor Play / Pausa estándar
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
        // Obtenemos todos los jugadores para reiniciar sus respuestas en Firestore
        const querySnapshot = await getDocs(collection(db, "players"));
        
        // Ejecutamos la limpieza borrando el mapa respuestasSong por completo
        for (const jugadorDoc of querySnapshot.docs) {
            const jugadorRef = doc(db, "players", jugadorDoc.id);
            await updateDoc(jugadorRef, {
                // Eliminamos el mapa entero para resetear el estado del jugador
                respuestasSong: deleteField() 
            });
        }
        console.log("✅ Base de datos reseteada para la nueva ronda.");
    } catch (e) {
        console.error("Error al limpiar respuestas en Firestore:", e);
    }

    botonContinuar.disabled = false;
    botonContinuar.textContent = "Siguiente Canción ➡️";

    // Pasamos al siguiente índice de la lista y cargamos los paneles
    indiceActual++; 
    cargarCancion(indiceActual); 
});

// 12. EVENTOS AUTOMÁTICOS DE LA BARRA DE PROGRESO (Estilo Spotify)
reproductor.addEventListener('timeupdate', () => {
    if (reproductor.duration) {
        const porcentaje = (reproductor.currentTime / reproductor.duration) * 100;
        barraProgreso.value = porcentaje;
        tiempoActualTxt.textContent = formatearTiempo(reproductor.currentTime);
    }
});

reproductor.addEventListener('loadedmetadata', () => {
    tiempoTotalTxt.textContent = formatearTiempo(reproductor.duration);
});

barraProgreso.addEventListener('input', () => {
    if (reproductor.duration) {
        const nuevoSegundo = (barraProgreso.value / 100) * reproductor.duration;
        reproductor.currentTime = nuevoSegundo;
    }
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
// Selector de Navegación Rápida del Header
// ==========================================
window.navegacionRapidaJuegos = function (idPantalla) {
  if (!idPantalla) return;

  try {
    // Cambia a la pantalla seleccionada con tus funciones
    setScreen("screen" + idPantalla, idPantalla);
    showScreenTV("screen" + idPantalla);

    // Reseteamos el menú para que vuelva a poner "🎮 Saltar a..."
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

    // 3. Reset de la canción activa
    await updateDoc(doc(window.db, "game", "currentSong"), {
      title: "Ninguna",
      audioURL: "",
      revealed: false
    });
    console.log("🎵 ¡Documento currentSong inicializado!");

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


