// Seed script using web SDK - run this in the browser console or as a Node script
// This adds sample songs to your Firestore database

const firebaseConfig = {
  apiKey: "AIzaSyC5y9r8ftqyOXe6Zio0AIoj_dCAFh_L1F4",
  authDomain: "iiit-b2441.firebaseapp.com",
  projectId: "iiit-b2441",
  storageBucket: "iiit-b2441.appspot.com",
  messagingSenderId: "700884668601",
  appId: "1:700884668601:web:87f81b4b872c9b77c98b68",
  measurementId: "G-FHW93MF8XZ"
};

// Initialize Firebase
if (typeof firebase === 'undefined') {
  console.log('Firebase SDK not found. Please run this in the browser console on the app page.');
} else {
  const db = firebase.firestore();
  
  const songs = [
    { song_id: 1, song_name: "Tum Hi Ho", artist: "Arijit Singh", genre: "Romantic", mood: "Sad" },
    { song_id: 2, song_name: "Believer", artist: "Imagine Dragons", genre: "Rock", mood: "Energetic" },
    { song_id: 3, song_name: "Perfect", artist: "Ed Sheeran", genre: "Romantic", mood: "Romantic" },
    { song_id: 4, song_name: "Senorita", artist: "Shawn Mendes", genre: "Pop", mood: "Happy" },
    { song_id: 5, song_name: "Raghav", artist: "A.R. Rahman", genre: "Classical", mood: "Peaceful" },
    { song_id: 6, song_name: "Dil Dooba", artist: "KK", genre: "Bollywood", mood: "Romantic" },
    { song_id: 7, song_name: "Kabhi Jo Badal", artist: "Arijit Singh", genre: "Romantic", mood: "Sad" },
    { song_id: 8, song_name: "Zara Zara", artist: "Bombay Jayashri", genre: "Classical", mood: "Peaceful" }
  ];
  
  async function seedSongs() {
    try {
      console.log('Starting to seed songs...');
      for (const song of songs) {
        await db.collection('songs').add({
          ...song,
          play_count: 0,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Added: ${song.song_name}`);
      }
      console.log('✓ All songs added successfully!');
      console.log('Refresh the page to see the songs.');
    } catch (err) {
      console.error('Error seeding songs:', err);
      alert('Error: ' + err.message);
    }
  }
  
  seedSongs();
}
