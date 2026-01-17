const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json'); // place your Admin SDK JSON at this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// EDIT the song object below and run: node .\tools\add_song_admin.js
const song = {
  song_id: 5,
  song_name: "New Song Title",
  artist: "Artist Name",
  genre: "Pop",
  mood: "Happy"
};

async function run() {
  const ref = await db.collection('songs').add(song);
  console.log('Added song:', ref.id);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });