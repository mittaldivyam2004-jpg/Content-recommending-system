


# Music Recommender System — Student Project

## Project Overview
This project is a web-based music recommender system developed as part of my coursework. The goal was to learn about recommendation algorithms, backend/frontend integration, and cloud authentication. The system recommends songs to users based on their preferences using both content-based and collaborative filtering techniques.

## Technologies Used
- **Backend:** Python (Flask)
- **Frontend:** HTML, CSS, JavaScript
- **Database & Auth:** Firebase (Firestore, Authentication)
- **Data Science:** pandas, scikit-learn

## Features
- User registration and login (Firebase Authentication)
- Like/unlike songs and view your liked songs
- Personalized recommendations:
	- Content-based filtering (song features)
	- Collaborative filtering (user similarity)
- Admin tools for seeding songs and users (see `tools/`)

## How to Run the Project

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/music-recommender.git
cd music-recommender
```

### 2. Set Up Python Environment
It is recommended to use a virtual environment:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
This will install Flask, pandas, scikit-learn, firebase-admin, flask-cors, etc.

### 4. Configure Firebase
- Place your Firebase service account JSON as `serviceAccount.json` in the project root (not included for security).
- Update `frontend/firebase-config.js` with your Firebase web config (from Firebase console).

### 5. Start the Flask Backend
```bash
python app.py
```
The backend will run on http://127.0.0.1:5000 by default.

### 6. Start the Frontend
For best results, use a local server:
```bash
cd frontend
python -m http.server 5500
# Open http://127.0.0.1:5500 in your browser
```

## Project Structure
- `app.py` — Flask backend
- `frontend/` — HTML, CSS, JS files
- `tools/` — Scripts for seeding Firestore
- `requirements.txt` — Python dependencies
- `serviceAccount.json` — Firebase admin credentials (not included)

## Learning Outcomes
- Gained hands-on experience with recommendation algorithms
- Integrated Python backend with a modern frontend
- Used Firebase for authentication and database
- Practiced full-stack development and deployment

## Notes
- Firebase setup (Firestore and Authentication) is required for full functionality.
- For troubleshooting, check the browser console and Flask server logs.

---
*This project was completed as part of my academic coursework. Please contact me for any questions or feedback.*
