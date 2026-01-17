const qs = id => document.getElementById(id);

function ensureAuth() {
  if (typeof firebase === 'undefined') throw new Error('Firebase SDK not loaded');
  return firebase.auth();
}
function ensureDb() {
  if (typeof firebase === 'undefined') return window.db || null;
  return window.db || firebase.firestore();
}

async function saveUserToFirestore(uid, profile) {
  const db = ensureDb();
  if (!db) return;
  try {
    await db.collection('users').doc(uid).set({
      uid,
      displayName: profile.displayName || null,
      email: profile.email || null,
      photoURL: profile.photoURL || null,
      last_login: firebase.firestore.FieldValue.serverTimestamp(),
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      login_count: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
  } catch (err) {
    console.error('saveUserToFirestore error', err);
  }
}

qs('btn-google').addEventListener('click', async () => {
  try {
    const auth = ensureAuth();
    const provider = new firebase.auth.GoogleAuthProvider();
    // required scopes can be added here, e.g. provider.addScope('profile');
    const res = await auth.signInWithPopup(provider);
    const user = res.user;
    if (!user) throw new Error('No user returned from Google sign-in.');
    // persist locally
    localStorage.setItem('user_id', user.uid);
    await saveUserToFirestore(user.uid, {
      displayName: user.displayName, email: user.email, photoURL: user.photoURL
    });
    // redirect to app
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Google sign-in failed', err);
    if (err.code === 'auth/unauthorized-domain') {
      alert('Unauthorized domain. Add this origin in Firebase Console → Authentication → Authorized domains.');
    } else if (err.code === 'auth/operation-not-allowed') {
      alert('Google sign-in disabled in Firebase Console. Enable Google provider.');
    } else if (err.code === 'auth/popup-blocked') {
      alert('Popup blocked. Allow popups for this site.');
    } else {
      alert('Google sign-in failed: ' + (err.message || err.code || 'unknown'));
    }
  }
});