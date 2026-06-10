# E-commerce Product Review Analyzer

A full-stack, machine learning & data science-powered **E-commerce Product Review Analyzer** featuring a React frontend, FastAPI backend, SQLite database, and an interactive Streamlit dashboard. 

This project simulates a real-world analytics platform where customer reviews are ingested, processed, classified using a sentiment classifier (TF-IDF + Logistic Regression), and analyzed using SQL and conversational chatbot interfaces.

---

## 🌐 Live Production Deployments

Before running locally, you can view the fully deployed system live in production:
* **React Web App (Vercel)**: [https://ecommerce-review-analyzer-sandy.vercel.app/](https://ecommerce-review-analyzer-sandy.vercel.app/)
* **FastAPI Backend (Render)**: [https://ecommerce-review-analyzer-backend.onrender.com](https://ecommerce-review-analyzer-backend.onrender.com)
* **Streamlit Dashboard (Streamlit Cloud)**: [https://2810chethan-ecommerce-review-analyzer-streamlitapp-zsw3gc.streamlit.app/](https://2810chethan-ecommerce-review-analyzer-streamlitapp-zsw3gc.streamlit.app/)

---

## ✨ Features

1. **Interactive ML Sentiment Predictor**: Evaluates product reviews in real-time, outputting predicted sentiment (Positive, Neutral, Negative) along with confidence probability distributions.
2. **Interactive Chatbot (Database-Grounded)**: A speech-bubble assistant capable of executing background SQL queries to answer customer dataset questions (e.g., "*What is the average rating of books?*", "*How many negative reviews do we have?*").
3. **Safe SQL Playground**: A sandboxed terminal allowing users to write and execute custom `SELECT` statements to query the database schema directly.
4. **Mock Google OAuth Screen**: Allows quick permissions testing under custom user accounts (e.g., "Karthik") or developer presets.
5. **Traditional Authentication**: Traditional email signup and signin forms storing hashed details in the SQLite `users` table.

---

## 📂 Project Directory Structure

```text
ecommerce-review-analyzer/
├── README.md                 # Project guide
├── verify_all.py             # Script to verify API endpoints
├── data/
│   ├── generate_dataset.py   # Script generating 1,000+ mock reviews
│   ├── mock_reviews.csv      # Raw CSV dataset
│   └── reviews.db            # SQLite database with structured tables
├── backend/
│   ├── requirements.txt      # Python dependencies
│   ├── run.py                # Server startup script
│   └── app/
│       ├── main.py           # Core FastAPI API endpoints
│       ├── database.py       # DB connections & schema init
│       ├── ml_model.py       # TF-IDF Vectorizer & Logistic Regression model
│       ├── sql_executor.py   # Safe read-only SQL Sandbox executor
│       ├── chatbot.py        # SQLite database-grounded chatbot
│       └── auth.py           # Authentication services
├── frontend/
│   ├── package.json          # Node dependencies
│   ├── src/
│   │   ├── App.jsx           # Main React component (UI layout)
│   │   ├── index.css         # Glassmorphic CSS style tokens
│   │   └── main.jsx          # React entrypoint
├── streamlit/
│   ├── app.py                # Standalone Streamlit application
│   └── requirements.txt      # Streamlit dependencies
```

---

## ⚙️ How to Setup & Run Locally

### Prerequisites
* **Python**: Version 3.11.x
* **Node.js**: Version 18+ and npm

---

### 1. Backend Setup (FastAPI)
Navigate to the `backend` folder:
```bash
cd backend
```

Create a virtual environment (optional but recommended):
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the server:
```bash
python run.py
```
*Note: On startup, the backend automatically generates the dataset, builds the SQLite database, and trains the Sentiment Classification model.*
* **Local API URL**: `http://localhost:8000`
* **Swagger API Docs**: `http://localhost:8000/docs`

---

### 2. Frontend Setup (React/Vite)
Navigate to the `frontend` folder:
```bash
cd ../frontend
```

Install packages:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```
* **Local Web App URL**: `http://localhost:5173`

---

### 3. Streamlit Dashboard
From the root directory:
```bash
streamlit run streamlit/app.py
```
* **Local Dashboard URL**: `http://localhost:8501`

---

## 📊 ML Model Details
* **Features**: TF-IDF (Term Frequency-Inverse Document Frequency) capturing unigrams and bigrams.
* **Classifier**: Logistic Regression with balanced class weights.
* **Accuracy**: 93% test accuracy on mock dataset classes.
