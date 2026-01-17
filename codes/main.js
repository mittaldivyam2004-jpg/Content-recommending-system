// Sidebar navigation actions
window.addEventListener('DOMContentLoaded', () => {
  const navHome = document.getElementById('nav-home');
  const navSearch = document.getElementById('nav-search');
  const navLibrary = document.getElementById('nav-library');
  if (navHome) {
    navHome.addEventListener('click', () => {
      showAllSongs();
      setActiveNav('nav-home');
    });
  }
  if (navSearch) {
    navSearch.addEventListener('click', () => {
      showAllSongsForSearch();
      const searchBox = document.getElementById('search');
      if (searchBox) searchBox.focus();
      setActiveNav('nav-search');
    });
  }
  if (navLibrary) {
    navLibrary.addEventListener('click', () => {
      if (typeof loadUserPlaylists === 'function') loadUserPlaylists();
      setActiveNav('nav-library');
    });
  }
});

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
// Make the logo/brand area clickable to show all songs (home)
window.addEventListener('DOMContentLoaded', () => {
  const homeLogo = document.getElementById('home-logo');
  if (homeLogo) {
    homeLogo.addEventListener('click', showAllSongs);
  }
});
// uses Firebase v8 namespaced SDK loaded by index.html and firebase-config.js which sets firebase and window.db

const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
const debug = (m, v) => console.log('[main]', m, v);

// Update the top-right user menu based on login state
function updateTopRightUserMenu(user) {
  const userMenu = window.qs('user-menu');
  const signinBtn = window.qs('signin-btn');
  if (!userMenu) return;
  
  console.log('updateTopRightUserMenu - user:', user ? { uid: user.uid, email: user.email } : 'null');
  
  if (!user) {
    // Show Sign In button when not logged in
    console.log('Showing Sign In button');
    if (signinBtn) {
      signinBtn.style.display = 'inline-block';
    }
    // Remove user info if present
    const userInfo = window.qs('user-info');
    if (userInfo) userInfo.remove();
    const dropdown = window.qs('user-dropdown');
    if (dropdown) dropdown.remove();
  } else {
    // Hide sign in button and show user info
    console.log('Showing user info for:', user.displayName || user.email);
    if (signinBtn) {
      signinBtn.style.display = 'none';
    }
    
    const name = user.displayName || user.email || 'User';
    const photo = user.photoURL || '';
    
    // Remove old user info if exists
    const oldUserInfo = window.qs('user-info');
    if (oldUserInfo) oldUserInfo.remove();
    const oldDropdown = window.qs('user-dropdown');
    if (oldDropdown) oldDropdown.remove();
    
    // Create user profile section
    const userInfo = document.createElement('div');
    userInfo.id = 'user-info';
    userInfo.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer;';
    
    if (photo) {
      const img = document.createElement('img');
      img.src = photo;
      img.style.cssText = 'width: 36px; height: 36px; border-radius: 50%;';
      userInfo.appendChild(img);
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.textContent = name;
    userInfo.appendChild(nameDiv);
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'user-dropdown';
    dropdown.className = 'user-dropdown hidden';
    dropdown.innerHTML = `
      <div class="dropdown-item">Profile</div>
      <div class="dropdown-item">Account</div>
      <div id="sign-out-btn" class="dropdown-item danger">Sign out</div>
    `;
    
    // Add to menu
    userMenu.appendChild(userInfo);
    userMenu.appendChild(dropdown);
    
    // Attach sign-out handler to the dropdown button
    const signOutBtn = dropdown.querySelector('#sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        signOutUser();
      });
    }
  }
}

// lightweight profile card renderer used above
function renderUserDetails(user) {
  if (!user) return '<div class="placeholder"><p>No user</p></div>';
  const meta = user.metadata || {};
  return `
    <div style="padding:18px">
      <h3>User Profile</h3>
      <div style="display:flex;gap:16px;align-items:center;margin-top:12px">
        ${user.photoURL ? `<img src="${user.photoURL}" style="width:80px;height:80px;border-radius:12px">` : ''}
        <div>
          <h4 style="margin:0">${user.displayName || '—'}</h4>
          <div style="color:var(--muted)">${user.email || '—'}</div>
          <div style="margin-top:8px;color:var(--muted);font-size:13px">UID: ${user.uid}</div>
          <div style="margin-top:6px;color:var(--muted);font-size:13px">Created: ${meta.creationTime || '—'}</div>
          <div style="color:var(--muted);font-size:13px">Last sign-in: ${meta.lastSignInTime || '—'}</div>
        </div>
      </div>
      <div style="margin-top:12px">
        <button id="btn-signout-2" class="btn primary">Sign out</button>
      </div>
    </div>
  `;
}

// robust sign-out helper and delegated handler (fixes cases where dropdown items are rendered dynamically)
async function signOutUser() {
  const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
  try {
    if (!auth) throw new Error('Auth not available');
    await auth.signOut();
  } catch (err) {
    console.error('Sign out failed', err);
    alert('Sign out failed: ' + (err.message || err.code || 'unknown'));
    return;
  }

  try {
    localStorage.removeItem('user_id');
    // Update top menu only
    updateTopRightUserMenu(null);
  } catch (e) {
    console.warn('UI update after sign-out skipped', e);
  }

  // redirect user to login page after sign-out
  window.location.href = 'index.html';
}

// Delegated click listener for dropdown toggle
document.addEventListener('click', (e) => {
  const target = e.target;
  const userMenu = window.qs('user-menu');
  
  // If clicking on user info, toggle dropdown
  if (target.closest('#user-info')) {
    e.stopPropagation();
    const dropdown = window.qs('user-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
    return;
  }
  
  // Close dropdown when clicking outside user-menu
  if (!target.closest('#user-menu')) {
    const dropdown = window.qs('user-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  }
});

// ensure auth + db references
function ensureAuth() {
  if (window.auth) return window.auth;
  if (typeof firebase !== 'undefined' && firebase.auth) {
    window.auth = firebase.auth();
    return window.auth;
  }
  return null;
}
function ensureDb() {
  return window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
}

// fetch user profile document from Firestore users collection
async function fetchUserProfile(uid){
  try {
    const db = ensureDb();
    if (!db) throw new Error('Firestore not available');
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  } catch (err) {
    console.error('fetchUserProfile error', err);
    return null;
  }
}

// Fetch liked songs for a user from Firestore
async function fetchLikedSongs(userId) {
  // Use backend API for liked songs
  // Fetch liked song IDs from user's Firestore document
  const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
  if (!db) {
    console.error('Firestore not available');
    return [];
  }
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return [];
    const liked = userDoc.data().likedSongs || [];
    if (!liked.length) return [];
    // Fetch song details for each liked song ID
    const songs = [];
    for (const songId of liked) {
      const songDoc = await db.collection('songs').doc(String(songId)).get();
      if (songDoc.exists) songs.push({ id: songId, ...songDoc.data() });
    }
    return songs;
  } catch (err) {
    console.error('fetchLikedSongs Firestore error', err);
    return [];
  }
}

// Show liked songs in main area
async function showLikedSongs() {
  try {
    const auth = ensureAuth();
    if (!auth || !auth.currentUser) {
      alert('Please sign in to view liked songs.');
      return;
    }
    const songs = await fetchLikedSongs(auth.currentUser.uid);
    if (!songs.length) {
      showResults('<div class="placeholder"><p>No liked songs yet.</p></div>');
      return;
    }
    // Use renderTable with Remove button for liked songs
    showResults(renderTable(songs, ['song_name','artist','genre'], { showPlay: true, showAddPlaylist: true, showRemoveLiked: true }));
    setTimeout(() => {
      document.querySelectorAll('.btn-delete-liked').forEach(btn => {
        btn.onclick = () => removeFromLikedSongs(btn.dataset.songId);
      });
    }, 0);
    setTimeout(() => {
      document.querySelectorAll('.btn-remove-liked').forEach(btn => {
        btn.onclick = () => removeFromLikedSongs(btn.dataset.songId);
      });
      document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          const songId = btn.getAttribute('data-song-id');
          console.log('[LikeBtn] Clicked in liked section. songId:', songId);
          removeFromLikedSongs(songId);
        };
      });
    }, 0);
  } catch (err) {
    showResults('<div class="placeholder"><p>Failed to load liked songs.</p></div>');
  }
}
// Remove a song from liked songs
async function removeFromLikedSongs(songId) {
  const auth = ensureAuth();
  if (!auth || !auth.currentUser) {
    console.log('[removeFromLikedSongs] No auth/currentUser');
    return;
  }
  const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
  if (!db) {
    console.log('[removeFromLikedSongs] No Firestore DB');
    return;
  }
  try {
    console.log('[removeFromLikedSongs] Removing songId:', songId, 'for user:', auth.currentUser.uid);
    const userRef = db.collection('users').doc(auth.currentUser.uid);
    await userRef.update({ likedSongs: firebase.firestore.FieldValue.arrayRemove(songId) });
    showLikedSongs(); // Refresh the liked songs view
  } catch (err) {
    console.error('[removeFromLikedSongs] Error:', err);
    alert('Failed to remove song from liked songs.');
  }
}


// attach auth state handler (safe + logs)
const auth = ensureAuth();
if (auth) {
  auth.onAuthStateChanged(async user => {
    debug('authStateChanged', user && user.uid);
    console.log('Auth state changed - user:', user ? { uid: user.uid, email: user.email, name: user.displayName } : 'none');
    // Update top-right menu FIRST (no delay - do it immediately)
    if (user) {
      console.log('Logged in user detected, updating menu with:', user.displayName || user.email);
      updateTopRightUserMenu(user);
    } else {
      console.log('No user logged in, showing Sign In button');
      updateTopRightUserMenu(null);
    }
    // Load playlists if user is logged in
    if (user) {
      loadUserPlaylists();
    }
    // update UI
    try {
      // renderUserPanel is no longer needed - we use top-right menu only
    } catch(e){ console.error('renderUserPanel error', e); }
    // Always show recommendations after auth state is known
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
      showAllSongs();
    }
    // load extra profile data
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      window.__USER_PROFILE = profile;
      debug('loaded profile', profile);
    } else {
      window.__USER_PROFILE = null;
    }
  });
} else {
  debug('Auth not available on page load');
  updateTopRightUserMenu(null);
}

function renderTable(items, columns, options = {}) {
  if(!items || items.length === 0) return '<div class="placeholder"><p>No results</p></div>';
  let html = '<div class="table-wrap"><table class="data"><thead><tr>';
  columns.forEach(c => html += `<th>${c}</th>`);
  html += '<th>Like</th>';
  if (options.showPlay) html += '<th>Play</th>';
  if (options.showAddPlaylist) html += '<th>Add to Playlist</th>';
  if (options.showRemove) html += '<th>Remove</th>';
  // if (options.showRemoveLiked) html += '<th>Remove</th>';
  // if (options.showDeleteLiked) html += '<th>Delete</th>';
  html += '</tr></thead><tbody>';
  items.forEach((it, idx) => {
    html += '<tr>';
    columns.forEach(c => {
      const key = c.toLowerCase().replace(/ /g,'_');
      html += `<td>${(it[key] ?? '')}</td>`;
    });
    const songId = String(it.id || it.song_id);
    const uid = localStorage.getItem('user_id') || 'guest';
    // Like button (heart)
    if (options.showRemoveLiked) {
      html += `<td><button class="btn like-btn" data-song-id="${songId}" title="Unlike">♥</button></td>`;
    } else {
      html += `<td><button class="btn like-btn" data-song-id="${songId}" title="Like">♡</button></td>`;
    }
    if (options.showPlay) {
      html += `<td><button class="btn play-btn" data-user-id="${uid}" data-song-id="${songId}">▶ Play</button></td>`;
    }
    if (options.showAddPlaylist) {
      const songName = it.song_name || it.name || 'Unknown';
      html += `<td><button class="btn ghost add-to-playlist-btn" data-song-id="${songId}" data-song-name="${songName}">+ Add</button></td>`;
    }
    if (options.showRemove) {
      const songName = it.song_name || it.name || 'Unknown';
      html += `<td><button class="btn ghost remove-btn" style="color: #ff7777;" data-playlist-id="${options.showRemove}" data-song-id="${songId}" data-song-name="${songName}">✕ Remove</button></td>`;
    }
    // if (options.showRemoveLiked) {
    //   html += `<td><button class=\"btn-remove-liked\" data-song-id=\"${songId}\" style=\"margin-left:0;background:transparent;color:#ff7675;border:2px solid #5f5fc4;border-radius:20px;padding:8px 24px;font-size:1em;display:inline-flex;align-items:center;cursor:pointer;\"><span style=\\\"color:#ff7675;font-size:1.2em;vertical-align:middle;margin-right:6px;\\\">&#10006;</span><span style=\\\"color:#ff7675;font-weight:600;\\\">Remove</span></button></td>`;
    // }
    // if (options.showDeleteLiked) {
    //   html += `<td><button class=\"btn-delete-liked\" data-song-id=\"${songId}\" style=\"margin-left:0;background:transparent;color:#e74c3c;border:2px solid #5f5fc4;border-radius:20px;padding:8px 24px;font-size:1em;display:inline-flex;align-items:center;cursor:pointer;\"><span style=\\\"color:#e74c3c;font-size:1.2em;vertical-align:middle;margin-right:6px;\\\">&#128465;</span><span style=\\\"color:#e74c3c;font-weight:600;\\\">Delete</span></button></td>`;
    // }
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  // Attach event listeners after table is rendered
  window._renderTableOptions = options;
  setTimeout(() => {
    const opts = window._renderTableOptions;
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const songId = btn.getAttribute('data-song-id');
        console.log('[LikeBtn] Clicked. songId:', songId, 'opts.showRemoveLiked:', opts.showRemoveLiked);
        if (opts.showRemoveLiked) {
          // In liked songs section, unlike removes from liked songs
          removeFromLikedSongs(songId);
        } else {
          handleLikeSong(songId, btn);
        }
      });
    });
    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const uid = btn.getAttribute('data-user-id');
        const songId = btn.getAttribute('data-song-id');
        handlePlay(uid, songId);
      });
    });
    document.querySelectorAll('.add-to-playlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const songId = btn.getAttribute('data-song-id');
        const songName = btn.getAttribute('data-song-name');
        showAddToPlaylistDialog(songId, songName);
      });
    });
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const playlistId = btn.getAttribute('data-playlist-id');
        const songId = String(btn.getAttribute('data-song-id'));
        const songName = btn.getAttribute('data-song-name');
        removeSongFromPlaylist(playlistId, songId, songName);
      });
    });
    document.querySelectorAll('.btn-remove-liked').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const songId = btn.getAttribute('data-song-id');
        removeFromLikedSongs(songId);
      });
    });
  }, 50);
  return html;
}

// Handle like button click
async function handleLikeSong(songId, btn) {
  try {
    const auth = ensureAuth();
    if (!auth || !auth.currentUser) {
      alert('Please sign in to like songs.');
      return;
    }
    await window.likeSong(songId, auth.currentUser.uid);
    btn.textContent = '♥'; // filled heart
    btn.classList.add('liked');
  } catch (err) {
    console.error('Like song error:', err);
    alert('Failed to like song: ' + (err.message || 'unknown error'));
  }
}

// Show dialog to add song to a playlist
async function showAddToPlaylistDialog(songId, songName) {
  try {
    const auth = ensureAuth();
    if (!auth || !auth.currentUser) {
      alert('Please sign in first');
      return;
    }
    const playlists = await window.fetchUserPlaylists(auth.currentUser.uid);
    if (playlists.length === 0) {
      alert('Please create a playlist first');
      return;
    }
    // Professional dialog markup
    let html = '<div class="playlist-select-dialog">\n';
    html += `<p>Add \"${songName}\" to:</p>\n`;
    playlists.forEach(p => {
      html += `<button class="playlist-select-btn" data-song-id="${songId}" data-playlist-id="${p.id}" data-playlist-name="${p.name}">`
        + `${p.name} (${(p.songs || []).length} songs)`
        + `</button>\n`;
    });
    html += '</div>';
    showResults(html);
    setTimeout(() => {
      document.querySelectorAll('.playlist-select-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const sid = btn.getAttribute('data-song-id');
          const pid = btn.getAttribute('data-playlist-id');
          const pname = btn.getAttribute('data-playlist-name');
          await handleAddSongToPlaylist(sid, pid, pname);
        });
      });
    }, 50);
  } catch (err) {
    console.error('showAddToPlaylistDialog error:', err);
    alert('Failed to load playlists: ' + (err.message || 'unknown error'));
  }
}

// Add song to a selected playlist (UI handler)
async function handleAddSongToPlaylist(songId, playlistId, playlistName) {
  try {
    await window.addSongToPlaylist(playlistId, songId);
    alert(`Added to "${playlistName}"!`);
  } catch (err) {
    console.error('addSongToPlaylist error:', err);
    alert('Failed to add song: ' + (err.message || 'unknown error'));
  }
}

// Remove song from a playlist
async function removeSongFromPlaylist(playlistId, songId, songName) {
  try {
    const displayName = songName && songName !== 'undefined' ? songName : 'this song';
    if (!confirm(`Remove "${displayName}" from this playlist?`)) return;
    await window.removeSongFromPlaylist(playlistId, songId);
    alert(`Removed from playlist!`);
    // Refresh the view by reloading the playlist
    const auth = ensureAuth();
    if (auth && auth.currentUser) {
      await loadUserPlaylists();
    }
  } catch (err) {
    console.error('removeSongFromPlaylist error:', err);
    alert('Failed to remove song: ' + (err.message || 'unknown error'));
  }
}

function showResults(html){ 
  const resultsEl = window.qs('results');
  if (resultsEl) {
    resultsEl.innerHTML = `<div class="header"><h3>Results</h3></div>${html}`;
  }
}

// handlePlay: call recordPlayEvent and update UI
async function handlePlay(user_id, song_id){
  try {
    if (!song_id) throw new Error('No song_id');
    // optimistic UI update
    showResults(`<div class="placeholder"><p>Playing song ${song_id}…</p></div>`);
    // record in Firestore
    await window.recordPlayEvent(user_id, song_id);
    // refresh user history panel if shown
    if (user_id) {
      const history = await window.fetchHistoryFromFirestore(user_id, 20);
      // show small history preview
      showResults(renderTable(history.map(h => ({ played: h.ts, song: h.song_snapshot?.song_name || h.song_id })), ['song'], { title: 'Recent plays' }));
    }
  } catch (err) {
    console.error('handlePlay error', err);
    alert('Failed to record play: ' + (err.message || err));
  }
}

// UI: create playlist flow
async function uiCreatePlaylist(){
  const user = (window.auth && window.auth.currentUser) || null;
  const uid = user ? user.uid : localStorage.getItem('user_id');
  if (!uid) { alert('Please sign in first'); return; }
  const name = prompt('Playlist name');
  if (!name) return;
  try {
    const res = await window.createPlaylist(uid, name);
    alert('Playlist created: ' + res.id);
    // Refresh playlist list
    await loadUserPlaylists();
  } catch (err) {
    console.error('Failed to create playlist', err);
    // show helpful message to user
    alert('Failed to create playlist: ' + (err.message || err.code || 'unknown error') + '. See console for details.');
  }
}

// Load and display user's playlists in sidebar
async function loadUserPlaylists() {
  try {
    const auth = ensureAuth();
    if (!auth || !auth.currentUser) {
      const list = window.qs('playlists-list');
      if (list) list.innerHTML = '<li class="placeholder">Sign in to see your playlists</li>';
      return;
    }
    
    const playlists = await window.fetchUserPlaylists(auth.currentUser.uid);
    const list = window.qs('playlists-list');
    
    if (!list) return;
    
    if (playlists.length === 0) {
      list.innerHTML = '<li class="placeholder">No playlists yet. Create one!</li>';
      return;
    }
    
    list.innerHTML = playlists.map(p => `
      <li class="playlist-item" data-id="${p.id}" style="cursor: pointer; padding: 8px; border-radius: 6px; transition: background 0.2s;">
        ${p.name}
        <small style="display: block; color: var(--muted); font-size: 12px;">${(p.songs || []).length} songs</small>
      </li>
    `).join('');
    
    // Add click handlers to each playlist
    list.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', async () => {
        const playlistId = item.getAttribute('data-id');
        await viewPlaylistSongs(playlistId, item.querySelector('strong')?.textContent || item.textContent.trim().split('\n')[0]);
      });
      // Hover effect
      item.addEventListener('mouseenter', () => item.style.background = 'var(--glass)');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    });
  } catch (err) {
    console.error('loadUserPlaylists error:', err);
    const list = window.qs('playlists-list');
    if (list) list.innerHTML = '<li class="placeholder">Error loading playlists</li>';
  }
}

// View songs in a specific playlist
async function viewPlaylistSongs(playlistId, playlistName) {
  try {
    const songs = await window.fetchPlaylistSongs(playlistId);
    if (songs.length === 0) {
      showResults(`<div class="placeholder"><p>No songs in "${playlistName}" yet</p></div>`);
      return;
    }
    // Add "Remove from Playlist" button for playlist view
    let html = `<div class="header"><h3>${playlistName}</h3></div>`;
    html += '<div style="margin-bottom: 12px; font-size: 12px; color: var(--muted);">' + songs.length + ' songs</div>';
    html += renderTable(songs, ['song_name','artist','genre'], { 
      showPlay: true,
      showRemove: playlistId 
    });
    showResults(html);
  } catch (err) {
    console.error('viewPlaylistSongs error:', err);
    alert('Failed to load playlist: ' + (err.message || 'unknown error'));
  }
}

// Fetch and display liked songs when button is clicked
async function onLikedSongsButtonClick() {
  const auth = ensureAuth();
  if (!auth || !auth.currentUser) {
    alert('Please sign in to view liked songs.');
    return;
  }
  const songs = await fetchLikedSongs(auth.currentUser.uid);
  if (!songs.length) {
    showResults('<div class="placeholder"><p>No liked songs yet.</p></div>');
    return;
  }
  showResults(renderTable(songs, ['song_name','artist','genre'], { showPlay: true, showAddPlaylist: true, showRemoveLiked: true}));
}

// Show all songs in the database in the results area
// --- Bag of Words Cosine Similarity ---
function textToVector(text) {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return freq;
}

function cosineSimilarity(vecA, vecB) {
  const allWords = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  allWords.forEach(w => {
    const a = vecA[w] || 0;
    const b = vecB[w] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// --- Collaborative Filtering (User-based, simple) ---
async function getUserSongMatrix(db) {
  const usersSnap = await db.collection('users').get();
  const songsSnap = await db.collection('songs').get();
  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const songs = songsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Build user-song matrix: { userId: Set(songId) }
  const matrix = {};
  users.forEach(u => {
    matrix[u.id] = new Set((u.likedSongs || []).map(String));
  });
  return { matrix, users, songs };
}

function getSimilarUsers(targetId, matrix) {
  // Jaccard similarity
  const targetSet = matrix[targetId] || new Set();
  const sims = [];
  for (const [uid, songSet] of Object.entries(matrix)) {
    if (uid === targetId) continue;
    const inter = new Set([...targetSet].filter(x => songSet.has(x)));
    const union = new Set([...targetSet, ...songSet]);
    const sim = union.size === 0 ? 0 : inter.size / union.size;
    sims.push({ uid, sim });
  }
  return sims.sort((a, b) => b.sim - a.sim);
}

async function showAllSongs() {
  try {
    const auth = ensureAuth();
    let userId = null;
    if (auth && auth.currentUser) userId = auth.currentUser.uid;
    let html = '';
    if (userId) {
      const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
      if (!db) {
        html += '<div class="placeholder"><p>Firestore not available.</p></div>';
        showResults(html);
        return;
      }
      // Fetch all songs and user info
      const userDoc = await db.collection('users').doc(userId).get();
      const likedIds = (userDoc.exists && userDoc.data().likedSongs) ? userDoc.data().likedSongs.map(String) : [];
      const snaps = await db.collection('songs').get();
      const allSongs = snaps.docs.map(d => ({ id: d.id, ...d.data() }));

      // Bag of Words Cosine Similarity with duplicate filtering and diversity
      let userProfileText = '';
      for (const songId of likedIds) {
        const song = allSongs.find(s => String(s.id) === String(songId));
        if (song) {
          userProfileText += ' ' + [song.song_name, song.artist, song.genre].join(' ');
        }
      }
      const userVec = textToVector(userProfileText);
      // Remove duplicates by song_name, artist, genre
      const uniqueSongsMap = {};
      allSongs.forEach(song => {
        const key = [song.song_name, song.artist, song.genre].join('||');
        if (!uniqueSongsMap[key]) uniqueSongsMap[key] = song;
      });
      const uniqueSongs = Object.values(uniqueSongsMap);
      // Score and sort
      let scoredSongs = uniqueSongs
        .filter(song => !likedIds.includes(String(song.id)))
        .map(song => {
          const songText = [song.song_name, song.artist, song.genre].join(' ');
          const songVec = textToVector(songText);
          return { ...song, score: cosineSimilarity(userVec, songVec) };
        })
        .sort((a, b) => b.score - a.score);
      // Take top 10, but if not enough diversity, add from other genres
      let topSongs = scoredSongs.slice(0, 10);
      if (topSongs.length < 10) {
        // Add songs from other genres not in user's liked genres
        const likedGenres = new Set();
        for (const songId of likedIds) {
          const song = allSongs.find(s => String(s.id) === String(songId));
          if (song && song.genre) likedGenres.add(song.genre);
        }
        const extraSongs = uniqueSongs.filter(song => !likedIds.includes(String(song.id)) && !likedGenres.has(song.genre));
        for (const song of extraSongs) {
          if (topSongs.length >= 10) break;
          topSongs.push(song);
        }
      }

      // Collaborative Filtering (also filter duplicates)
      const { matrix } = await getUserSongMatrix(db);
      const similarUsers = getSimilarUsers(userId, matrix).filter(u => u.sim > 0);
      console.log('[Collaborative] User:', userId, 'Similar users:', similarUsers);
      let collabSongs = [];
      if (similarUsers.length > 0) {
        const topUser = similarUsers[0].uid;
        const topUserSongs = matrix[topUser];
        console.log('[Collaborative] Top similar user:', topUser, 'Songs:', Array.from(topUserSongs));
        // Remove duplicates
        const collabUnique = {};
        allSongs.forEach(song => {
          const key = [song.song_name, song.artist, song.genre].join('||');
          if (topUserSongs.has(String(song.id)) && !likedIds.includes(String(song.id))) {
            if (!collabUnique[key]) collabUnique[key] = song;
          }
        });
        collabSongs = Object.values(collabUnique).slice(0, 10);
        console.log('[Collaborative] Recommended songs:', collabSongs);
      } else {
        console.log('[Collaborative] No similar users found.');
      }

      html += '<h3>Recommended For You (Content-Based)</h3>';
      if (topSongs.length) {
        html += renderTable(topSongs, ['song_name','artist','genre'], { showPlay: true, showAddPlaylist: true });
      } else {
        html += '<div class="placeholder"><p>No content-based recommendations found.</p></div>';
      }
      html += '<h3>Recommended For You (Collaborative)</h3>';
      if (collabSongs.length) {
        html += renderTable(collabSongs, ['song_name','artist','genre'], { showPlay: true, showAddPlaylist: true });
      } else {
        html += '<div class="placeholder"><p>No collaborative recommendations found.</p></div>';
      }
    } else {
      html += '<div class="placeholder"><p>Please sign in to see recommendations.</p></div>';
    }
    showResults(html);
  } catch (err) {
    showResults('<div class="placeholder"><p>Failed to load songs.</p></div>');
  }
}

// Show all songs for search
async function showAllSongsForSearch() {
  try {
    const songs = window.__SONGS || (await window.fetchSongsFromFirestore());
    if (!songs || !songs.length) {
      showResults('<div class="placeholder"><p>No songs found in the database.</p></div>');
      return;
    }
    showResults(renderTable(songs, ['song_name','artist','genre'], { showPlay: true, showAddPlaylist: true }));
  } catch (err) {
    showResults('<div class="placeholder"><p>Failed to load songs.</p></div>');
  }
}

// Show all songs on page load if on home
window.addEventListener('DOMContentLoaded', () => {
  // Only show all songs if the search box is empty and on the home page
  const searchBox = document.getElementById('search');
  if (searchBox && (!searchBox.value || searchBox.value.trim() === '')) {
    showAllSongs();
  }
});

// Wire up event listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: Setting up event listeners');
  
  // Note: Auth state is handled by auth.onAuthStateChanged() listener above
  // Don't initialize user menu here - let the auth listener do it
  
  // "Your Playlist" button - show all user playlists
  const yourPlaylistsBtn = window.qs('your-playlists-btn');
  if (yourPlaylistsBtn) {
    yourPlaylistsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const auth = ensureAuth();
      if (!auth || !auth.currentUser) {
        alert('Please sign in first');
        return;
      }
      showResults('<div class="header"><h3>Your Playlists</h3></div><div id="playlists-view"></div>');
      // Load playlists into results area
      window.fetchUserPlaylists(auth.currentUser.uid).then(playlists => {
        const view = window.qs('playlists-view') || document.querySelector('#playlists-view');
        if (!view) return;
        
        if (playlists.length === 0) {
          view.innerHTML = '<div class="placeholder"><p>No playlists yet. Create one!</p></div>';
          return;
        }
        
        view.innerHTML = playlists.map(p => `
          <div class="playlist-card" data-id="${p.id}" style="padding: 12px; margin: 8px 0; background: var(--glass); border-radius: 8px; cursor: pointer;">
            <h4 style="margin: 0 0 4px 0;">${p.name}</h4>
            <small style="color: var(--muted);">${(p.songs || []).length} songs</small>
          </div>
        `).join('');
        
        // Add click handlers
        view.querySelectorAll('.playlist-card').forEach(card => {
          card.addEventListener('click', async () => {
            const playlistId = card.getAttribute('data-id');
            const playlistName = card.querySelector('h4').textContent;
            await viewPlaylistSongs(playlistId, playlistName);
          });
        });
      });
    });
  }
  
  // create playlist button(s) - from nav
  document.querySelectorAll('.nav-cta').forEach(btn => {
    if (btn.id === 'your-playlists-btn') return; // Skip "Your Playlist" button
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const btnText = btn.textContent.toLowerCase();
      if (btnText.includes('create')) {
        uiCreatePlaylist();
      }
    });
  });

  // search input (if exists) — use searchSongs
  const searchInput = window.qs('search');
  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      const q = e.target.value || '';
      if (!q.trim()) {
        showResults('<div class="placeholder"><p>Type to search songs...</p></div>');
        return;
      }
      const results = await window.searchSongs(q);
      if (results.length === 0) {
        showResults('<div class="placeholder"><p>No songs found</p></div>');
        return;
      }
      const auth = ensureAuth();
      const showAddBtn = auth && auth.currentUser;
      showResults(renderTable(results, ['song_name','artist','genre'], { showPlay: true, showAddPlaylist: showAddBtn }));
    });
  }

  // hero play button
  const playBtns = document.querySelectorAll('.hero-actions .btn.primary');
  playBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showResults('<div class="placeholder"><p>Select a song to play</p></div>');
    });
  });

  // hero shuffle button
  const shuffleBtns = document.querySelectorAll('.hero-actions .btn.ghost');
  shuffleBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const songs = window.__SONGS;
      if (!songs || songs.length === 0) {
        alert('No songs available');
        return;
      }
      const random = songs[Math.floor(Math.random() * songs.length)];
      const uid = (window.auth && window.auth.currentUser && window.auth.currentUser.uid) || localStorage.getItem('user_id') || 'guest';
      await handlePlay(uid, random.song_id);
    });
  });

  // delegate play buttons in rendered tables
  document.addEventListener('click', (ev) => {
    const playBtn = ev.target.closest('.btn');
    if (!playBtn || !playBtn.textContent.includes('Play')) return;
    
    // Find the row to get song_id
    const row = playBtn.closest('tr');
    if (!row) return;
    
    const songIdCell = row.querySelector('td:first-child');
    if (!songIdCell) return;
    
    const songId = songIdCell.textContent.trim();
    const uid = (window.auth && window.auth.currentUser && window.auth.currentUser.uid) || localStorage.getItem('user_id') || 'guest';
    handlePlay(uid, songId);
  });
  
  // Fetch and display liked songs when button is clicked
  const likedBtn = document.getElementById('liked-songs-btn');
  if (likedBtn) {
    likedBtn.addEventListener('click', onLikedSongsButtonClick);
  }
});