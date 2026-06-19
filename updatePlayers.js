const admin = require('firebase-admin');

// Reemplaza esta ruta por la ubicación real de tu archivo de credenciales JSON
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const playerData = {
  active: true,
  img: 'images/personajesIconos/AlbaCircle.png',
  imgCard: 'images/cartasPersonajes/Alba.png',
  lentejasGuess: null,
  name: 'Alba',
  score: 0,
  scoreSong: 0,
  tenbin: {
    currentNumber: null,
    isAlive: true,
    score: 0
  },
  vasosTimes: {
    round1: 0,
    round2: 0
  }
};

async function updateSelectedPlayers() {
  const documentIds = ['p11', 'p12', 'p13', 'p14', 'p15'];

  try {
    for (const docId of documentIds) {
      const docRef = db.collection('players').doc(docId);
      await docRef.set(playerData, { merge: true });
      console.log(`Documento ${docId} actualizado con éxito.`);
    }
    console.log('¡Proceso completado! Se han actualizado p11 a p15.');
  } catch (error) {
    console.error('Error al actualizar los documentos en Firestore:', error);
  }
}

updateSelectedPlayers();
