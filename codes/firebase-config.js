// Use the v8 namespaced initializer (remove ES module imports)
const firebaseConfig = {
  apiKey: "AIzaSyC5y9r8ftqyOXe6Zio0AIoj_dCAFh_L1F4",
  authDomain: "iiit-b2441.firebaseapp.com",
  projectId: "iiit-b2441",
  storageBucket: "iiit-b2441.appspot.com",
  messagingSenderId: "700884668601",
  appId: "1:700884668601:web:87f81b4b872c9b77c98b68",
  measurementId: "G-FHW93MF8XZ"
};

if (typeof firebase === 'undefined') {
  console.error('Firebase SDK missing. Ensure firebase-app.js, firebase-auth.js and firebase-firestore.js are included before this file.');
} else {
  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    try { firebase.auth().useDeviceLanguage(); } catch(e){ }
    window.auth.onAuthStateChanged(u => console.log('Auth change:', u ? { uid: u.uid, email: u.email } : null));
    console.log('Firebase initialized:', firebaseConfig.projectId, 'apps=', firebase.apps.length);
    console.log('firebase.apps', firebase.apps);
    console.log('default app name', firebase.app && firebase.app().name);
    console.log('auth exists', !!window.auth, window.auth);
  } catch (err) {
    console.error('Firebase init error', err);
  }
}