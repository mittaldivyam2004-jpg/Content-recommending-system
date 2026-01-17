const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json'); // place your service account here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const userId = 'U1';
const entries = [
  { user_id: userId, song_id: 1, play_count: 10 },
  { user_id: userId, song_id: 3, play_count: 8 },
  { user_id: userId, song_id: 5, play_count: 4 } // add or edit as needed
];

async function run() {
  for (const e of entries) {
    await db.collection('user_history').add(e);
    console.log('added', e);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });