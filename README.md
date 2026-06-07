# El último en pie

## Herramientas utilizadas
+ Firebase
+ Chat GPT
+ Gemini (para generación de imágenes)
+ Worldguessr
+ Javascript


## Funcionamiento
Se divide en dos pantallas, una la de la TV/ordenador, que será el que gestione el juego.

| Paso | TV | Móvil |
| -- | -- | -- |
| 1 | Intro en la TV (en index.html). |  | 
| 2 | Aparece QR para acceder desde el móvil a movil.html | Acceden al QR |
| 3 | Pantalla de espera mientras aparecen los usuarios que ya han elegido personaje y un botón de empezar el juego | Intro (pack opening) y selección de personaje. Pantalla de espera hasta que pulsen botón en TV |
| 4 | Pulsa botón de empezar juego y cambia valor de screen en Firestore a game. | Cambia a screenGame, pantalla de espera con el ranking |
| 5 | Tiro de ruleta para elegir juego (simulado) |
| 6 | Empieza juego **Geoguessr personalizado**. Intro | Enlace a Worldguessr, empiezan a jugar |
| 7 | Una vez finalizada cada ronda, aparece una imagen nueva (del grupo en el sitio) en un collage | |
| 8 | Acaba el juego, suma de puntos para "score" según la clasificación  * | 
| 9 | Ranking global y cambio de screen a rankingScreen | Vuelta al ranking (suma interactiva de puntos) |
| 10 | Botón de volver a girar la ruleta y cambio de screen a gameScreen | |