// firestore-api.js - Firestore helper functions
// Dependencies: firebase-config.js (must load first), Firebase 8.10.0
// This file assumes window.db and window.firebase are set by firebase-config.js

const API_BASE = '';

// Expose to window so main.js can use them
window.qs = function(id){ return document.getElementById(id); };
function setYear(){ window.qs('year') && (window.qs('year').textContent = new Date().getFullYear()); }

// Fetch all songs from Firestore 'songs' collection (caches in window.__SONGS)
async function fetchSongsFromFirestore(){
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    const snaps = await db.collection('songs').get();
    const songs = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
    window.__SONGS = songs;
    return songs;
  } catch (err) {
    console.error('fetchSongsFromFirestore error', err);
    return window.__SONGS || [];
  }
}

// Fetch listening history for a user (newest first)
async function fetchHistoryFromFirestore(user_id, limit = 50){
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    const q = await db.collection('history')
      .where('user_id','==', user_id)
      .orderBy('ts', 'desc')
      .limit(limit)
      .get();
    return q.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('fetchHistoryFromFirestore error', err);
    return [];
  }
}

// Record a play event: writes to 'history' and increments play_count on song doc (optional)
async function recordPlayEvent(user_id, song_id){
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    const songRef = db.collection('songs').doc(String(song_id));
    // snapshot song data for history (optional, non-authoritative)
    const songSnap = await songRef.get();
    const songData = songSnap.exists ? songSnap.data() : { song_id, song_name: null };

    const histRef = await db.collection('history').add({
      user_id,
      song_id,
      song_snapshot: songData,
      ts: firebase.firestore.FieldValue.serverTimestamp()
    });

    // increment play_count on song doc (safe merge)
    await songRef.set({
      play_count: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    return { historyId: histRef.id };
  } catch (err) {
    console.error('recordPlayEvent error', err);
    throw err;
  }
}

// Create a playlist document for a user
async function createPlaylist(user_id, name){
  try {
    if (!user_id) throw new Error('No user_id provided');
    if (!name || !name.trim()) throw new Error('Playlist name required');
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available (window.db missing). Ensure firebase-config.js initialized before this file.');
    const ref = await db.collection('playlists').add({
      name: name.trim(),
      owner: user_id,
      songs: [],
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: ref.id };
  } catch (err) {
    console.error('createPlaylist error:', err);
    // rethrow so caller can show message
    throw err;
  }
}

// Add a song id to a playlist
async function addSongToPlaylist(playlistId, songId){
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    if (!playlistId || !songId) throw new Error('Missing playlistId or songId');
    
    const ref = db.collection('playlists').doc(playlistId);
    
    // Store the song's document ID (or the ID passed in)
    const songIdToAdd = String(songId);
    
    await ref.update({
      songs: firebase.firestore.FieldValue.arrayUnion(songIdToAdd)
    });
    return true;
  } catch (err) {
    console.error('addSongToPlaylist error:', err);
    throw err;
  }
}

// Remove a song id from a playlist
async function removeSongFromPlaylist(playlistId, songId){
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    if (!playlistId || !songId) throw new Error('Missing playlistId or songId');
    
    const ref = db.collection('playlists').doc(playlistId);
    const songIdToRemove = String(songId);
    
    await ref.update({
      songs: firebase.firestore.FieldValue.arrayRemove(songIdToRemove)
    });
    return true;
  } catch (err) {
    console.error('removeSongFromPlaylist error', err);
    throw err;
  }
}

// Fetch all playlists for a user
async function fetchUserPlaylists(userId) {
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    const snap = await db.collection('playlists').where('owner', '==', userId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('fetchUserPlaylists error:', err);
    return [];
  }
}

// Fetch songs in a specific playlist
async function fetchPlaylistSongs(playlistId) {
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    const snap = await db.collection('playlists').doc(playlistId).get();
    if (!snap.exists) return [];
    const playlistData = snap.data();
    const songIds = playlistData.songs || [];
    
    // Fetch full song details from songs collection
    const songs = [];
    for (const songId of songIds) {
      const songSnap = await db.collection('songs').doc(songId).get();
      if (songSnap.exists) {
        songs.push({ id: songSnap.id, ...songSnap.data() });
      }
    }
    return songs;
  } catch (err) {
    console.error('fetchPlaylistSongs error:', err);
    return [];
  }
}

// Simple search helper: searches cached songs (falls back to fetching)
async function searchSongs(q){
  try {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    const songs = window.__SONGS && window.__SONGS.length ? window.__SONGS : await fetchSongsFromFirestore();
    return songs.filter(s =>
      (s.song_name || '').toLowerCase().includes(q) ||
      (s.artist || '').toLowerCase().includes(q) ||
      (s.genre || '').toLowerCase().includes(q)
    );
  } catch (err) {
    console.error('searchSongs error', err);
    return [];
  }
}

// Like a song: add songId to user's likedSongs array
async function likeSong(songId, userId) {
  try {
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) throw new Error('Firestore not available');
    if (!userId || !songId) throw new Error('Missing userId or songId');
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      likedSongs: firebase.firestore.FieldValue.arrayUnion(String(songId))
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('likeSong error:', err);
    throw err;
  }
}

// expose functions to global so UI can call them
(function __firestoreExports__(){
  try {
    window.fetchSongsFromFirestore = (typeof fetchSongsFromFirestore === 'function') ? fetchSongsFromFirestore : undefined;
    window.fetchHistoryFromFirestore = (typeof fetchHistoryFromFirestore === 'function') ? fetchHistoryFromFirestore : undefined;
    window.recordPlayEvent = (typeof recordPlayEvent === 'function') ? recordPlayEvent : undefined;
    window.createPlaylist = (typeof createPlaylist === 'function') ? createPlaylist : undefined;
    window.addSongToPlaylist = (typeof addSongToPlaylist === 'function') ? addSongToPlaylist : undefined;
    window.removeSongFromPlaylist = (typeof removeSongFromPlaylist === 'function') ? removeSongFromPlaylist : undefined;
    window.fetchUserPlaylists = (typeof fetchUserPlaylists === 'function') ? fetchUserPlaylists : undefined;
    window.fetchPlaylistSongs = (typeof fetchPlaylistSongs === 'function') ? fetchPlaylistSongs : undefined;
    window.searchSongs = (typeof searchSongs === 'function') ? searchSongs : undefined;
    window.likeSong = (typeof likeSong === 'function') ? likeSong : undefined;
    window.likeSong = (typeof likeSong === 'function') ? likeSong : undefined;
    console.log('firestore-api exports:', {
      createPlaylist: typeof window.createPlaylist,
      recordPlayEvent: typeof window.recordPlayEvent
    });
  } catch (err) {
    console.error('firestore-api export wrapper error', err);
  }
})();

async function init(){
  try {
    setYear();
    
    console.log('Fetching songs from Firestore...');
    const songs = await fetchSongsFromFirestore();
    console.log('Songs fetched:', songs.length);
    
    if(!songs || songs.length === 0) {
      console.warn('No songs found in database');
      return;
    }

    // Cache songs globally
    window.__SONGS = songs;
    console.log('Cached songs:', window.__SONGS.length);
  } catch (err) {
    console.error('init() error:', err);
  }
}

// Wait for DOM to load before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('firestore-api.js loaded. Functions available:', {
  createPlaylist: typeof window.createPlaylist,
  recordPlayEvent: typeof window.recordPlayEvent,
  fetchSongsFromFirestore: typeof window.fetchSongsFromFirestore
});