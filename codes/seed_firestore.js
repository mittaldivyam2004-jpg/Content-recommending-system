const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json'); // adjust if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const songs = [
  { song_id: 1, song_name: "Tum Hi Ho", artist: "Arijit", genre: "Romantic", mood: "Sad" },
  { song_id: 2, song_name: "Believer", artist: "Imagine Dragons", genre: "Rock", mood: "Energetic" },
  { song_id: 3, song_name: "Perfect", artist: "Ed Sheeran", genre: "Romantic", mood: "Romantic" },
  { song_id: 4, song_name: "Senorita", artist: "Shawn Mendes", genre: "Pop", mood: "Happy" }
];

const userHistory = [
  { user_id: "U1", song_id: 1, play_count: 10 },
  { user_id: "U1", song_id: 3, play_count: 8 },
  { user_id: "U2", song_id: 2, play_count: 15 }
];

async function seed() {
  for (const s of songs) {
    await db.collection('songs').add(s);
  }
  for (const h of userHistory) {
    await db.collection('user_history').add(h);
  }
  console.log('Seed complete');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });