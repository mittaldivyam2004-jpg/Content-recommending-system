
def get_songs_df():
    pass

# Endpoint to get liked songs for a user
@app.route('/api/liked_songs')
def api_liked_songs():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    # Assume liked songs are stored in a 'users' collection with a likedSongs array
    user_doc = db.collection('users').document(user_id).get()
    liked = []
    if user_doc.exists:
        liked = user_doc.to_dict().get('likedSongs', [])
    # Fetch song details
    liked_songs = []
    for song_id in liked:
        song_doc = db.collection('songs').document(str(song_id)).get()
        if song_doc.exists:
            liked_songs.append(song_doc.to_dict())
    return jsonify(liked_songs)
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os

# Firebase admin
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__, static_folder="frontend", static_url_path="")
CORS(app)

# Initialize Firebase Admin (expects GOOGLE_APPLICATION_CREDENTIALS env var or serviceAccount.json next to this file)
cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccount.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
db = firestore.client()

def get_songs_df():
    docs = db.collection("songs").stream()
    rows = []
    for d in docs:
        data = d.to_dict()
        song_id = data.get("song_id")
        try:
            song_id = int(song_id)
            if pd.isna(song_id):
                continue
        except (TypeError, ValueError):
            continue  # skip invalid song_id
        rows.append({
            "song_id": song_id,
            "song_name": data.get("song_name"),
            "artist": data.get("artist"),
            "genre": data.get("genre"),
            "mood": data.get("mood")
        })
    df = pd.DataFrame(rows)
    return df

def get_user_history_df():
    docs = db.collection("user_history").stream()
    rows = []
    for d in docs:
        data = d.to_dict()
        song_id = data.get("song_id")
        try:
            song_id = int(song_id)
            if pd.isna(song_id):
                continue
        except (TypeError, ValueError):
            continue  # skip invalid song_id
        rows.append({
            "user_id": data.get("user_id"),
            "song_id": song_id,
            "play_count": int(data.get("play_count", 1))
        })
    df = pd.DataFrame(rows)
    return df

def record_play_event(user_id, song_id):
    q = db.collection("user_history").where("user_id", "==", user_id).where("song_id", "==", song_id).limit(1).stream()
    found = None
    for doc in q:
        found = doc
    if found:
        ref = db.collection("user_history").document(found.id)
        ref.update({"play_count": firestore.Increment(1)})
    else:
        db.collection("user_history").add({
            "user_id": user_id,
            "song_id": song_id,
            "play_count": 1
        })

# ---------------------------
# 1. DATASET & PREPROCESSING
# ---------------------------

# Load from Firestore; fallback to sample data if Firestore is empty or missing fields
def add_songs_to_db(songs):
    """
    Adds a list of songs to the Firestore 'songs' collection.
    Each song should be a dict with keys: song_id, song_name, artist, genre, mood
    """
    for song in songs:
        db.collection("songs").add(song)

if __name__ == "__main__":
    # Generate 50 new songs
    new_songs = []
    for i in range(11, 61):
        new_songs.append({
            "song_id": i,
            "song_name": f"Song {i}",
            "artist": f"Artist {i%10+1}",
            "genre": ["Pop", "Rock", "Jazz", "Classical", "Hip-Hop"][i%5],
            "mood": ["Happy", "Sad", "Energetic", "Calm", "Romantic"][i%5]
        })
    add_songs_to_db(new_songs)
    print("50 new songs inserted into Firestore.")
def add_songs_to_db(songs):
    """
    Adds a list of songs to the Firestore 'songs' collection.
    Each song should be a dict with keys: song_id, song_name, artist, genre, mood
    """
    for song in songs:
        db.collection("songs").add(song)

if __name__ == "__main__":
    # Generate 50 new songs
    new_songs = []
    for i in range(11, 61):
        new_songs.append({
            "song_id": i,
            "song_name": f"Song {i}",
            "artist": f"Artist {i%10+1}",
            "genre": ["Pop", "Rock", "Jazz", "Classical", "Hip-Hop"][i%5],
            "mood": ["Happy", "Sad", "Energetic", "Calm", "Romantic"][i%5]
        })
    add_songs_to_db(new_songs)
    print("50 new songs inserted into Firestore.")

"""
Example usage:
new_songs = [
    {"song_id": 9, "song_name": "Blinding Lights", "artist": "The Weeknd", "genre": "Pop", "mood": "Energetic"},
    {"song_id": 10, "song_name": "Levitating", "artist": "Dua Lipa", "genre": "Pop", "mood": "Happy"}
]
add_songs_to_db(new_songs)
"""
songs = get_songs_df()
user_history = get_user_history_df()

if songs.empty:
    songs = pd.DataFrame({
        "song_id": [1, 2, 3, 4, 5, 6, 7, 8],
        "song_name": ["Tum Hi Ho", "Believer", "Perfect", "Senorita",
                      "Shape of You", "Numb", "Kesariya", "Thunder"],
        "artist": ["Arijit", "Imagine Dragons", "Ed Sheeran", "Shawn Mendes",
                   "Ed Sheeran", "Linkin Park", "Arijit", "Imagine Dragons"],
        "genre": ["Romantic", "Rock", "Romantic", "Pop",
                  "Pop", "Rock", "Romantic", "Rock"],
        "mood": ["Sad", "Energetic", "Romantic", "Happy",
                 "Happy", "Angry", "Romantic", "Energetic"]
    })

if user_history.empty:
    user_history = pd.DataFrame({
        "user_id": ["U1", "U1", "U2", "U2", "U3", "U3"],
        "song_id": [1, 3, 2, 6, 4, 5],
        "play_count": [10, 8, 15, 12, 9, 7]
    })

# ensure types
if "song_id" in songs.columns:
    songs["song_id"] = songs["song_id"].astype(int)

# Feature column
songs["features"] = songs["genre"].fillna("") + " " + songs["mood"].fillna("") + " " + songs["artist"].fillna("")

vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(songs["features"])
similarity_matrix = cosine_similarity(tfidf_matrix)

# ---------------------------
# 2. HELPER FUNCTIONS
# ---------------------------
def recommend_by_mood(mood):
    df = songs[songs["mood"] == mood][["song_id", "song_name", "artist", "genre"]]
    return df.to_dict(orient="records")

def genre_playlist(genre):
    df = songs[songs["genre"] == genre][["song_id", "song_name", "artist", "mood"]]
    return df.to_dict(orient="records")

def recommend_personal(user_id, top_n=3):
    listened = user_history[user_history["user_id"] == user_id]["song_id"]
    if listened.empty:
        return songs.sample(top_n)[["song_id", "song_name", "artist", "genre"]].to_dict(orient="records")

    # adjust indices for zero-based iloc (assuming song_id is 1..N)
    song_indices = (listened - 1).values
    scores = similarity_matrix[song_indices].mean(axis=0)
    recommended_indices = scores.argsort()[::-1]
    recommended = songs.iloc[recommended_indices]
    recommended = recommended[~recommended["song_id"].isin(listened)]
    return recommended.head(top_n)[["song_id", "song_name", "artist", "genre"]].to_dict(orient="records")

# ---------------------------
# 3. ROUTES
# ---------------------------
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/api/songs')
def api_songs():
    return jsonify(songs.drop(columns=['features']).to_dict(orient='records'))

@app.route('/api/user_history')
def api_history():
    return jsonify(user_history.to_dict(orient='records'))

@app.route('/api/recommend/personal')
def api_recommend_personal():
    user_id = request.args.get('user_id')
    top_n = int(request.args.get('top_n', 3))
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    return jsonify(recommend_personal(user_id, top_n))

@app.route('/api/recommend/mood')
def api_recommend_mood():
    mood = request.args.get('mood')
    if not mood:
        return jsonify({'error': 'mood required'}), 400
    return jsonify(recommend_by_mood(mood))

@app.route('/api/recommend/genre')
def api_recommend_genre():
    genre = request.args.get('genre')
    if not genre:
        return jsonify({'error': 'genre required'}), 400
    return jsonify(genre_playlist(genre))

# Optional: endpoint to record a play event (frontend should call this when a user plays a song)
@app.route('/api/play', methods=['POST'])
def api_play():
    data = request.get_json() or {}
    user_id = data.get('user_id') or request.args.get('user_id')
    song_id = data.get('song_id') or request.args.get('song_id')
    if not user_id or not song_id:
        return jsonify({'error': 'user_id and song_id required'}), 400
    try:
        sid = int(song_id)
    except:
        return jsonify({'error': 'song_id must be integer'}), 400
    record_play_event(user_id, sid)
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8501))
    app.run(host='0.0.0.0', port=port, debug=True)