import os
import sqlite3
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# Try to relative import, fallback to absolute import for main runner
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db_connection, clean_text

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
MODEL_PATH = os.path.join(MODEL_DIR, "sentiment_model.pkl")

def train_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    conn = get_db_connection()
    
    # Query cleaned review text and actual sentiment (labeled from rating)
    df = pd.read_sql_query("SELECT cleaned_review_text, sentiment FROM reviews", conn)
    conn.close()
    
    if len(df) == 0:
        print("No reviews available in the database to train the model.")
        return False
        
    # Replace None/NaN in cleaned text
    df['cleaned_review_text'] = df['cleaned_review_text'].fillna('')
    
    X = df['cleaned_review_text']
    y = df['sentiment']
    
    # Split training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Feature Engineering: TF-IDF
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Model Training: Logistic Regression
    print("Training Logistic Regression model...")
    model = LogisticRegression(class_weight='balanced', max_iter=1000)
    model.fit(X_train_vec, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_vec)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save artifacts
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(model, MODEL_PATH)
    print("Model and vectorizer saved successfully.")
    
    # Bulk predict and update database
    update_all_predictions()
    return True

def load_ml_pipeline():
    if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model artifacts not found. Please train the model first.")
    
    vectorizer = joblib.load(VECTORIZER_PATH)
    model = joblib.load(MODEL_PATH)
    return vectorizer, model

def predict_sentiment(text):
    cleaned = clean_text(text)
    try:
        vectorizer, model = load_ml_pipeline()
    except FileNotFoundError:
        # Fallback if model isn't trained yet
        # If it's not trained, we return a simple rule-based sentiment or train it first
        print("Model not trained. Training model now...")
        train_model()
        vectorizer, model = load_ml_pipeline()
        
    vec = vectorizer.transform([cleaned])
    pred = model.predict(vec)[0]
    probs = model.predict_proba(vec)[0]
    
    # Get probability mapping
    classes = model.classes_
    prob_dict = {classes[i]: float(probs[i]) for i in range(len(classes))}
    
    return pred, prob_dict

def update_all_predictions():
    """Predicts sentiment for all reviews in the database and updates predicted_sentiment."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    df = pd.read_sql_query("SELECT review_id, review_text, cleaned_review_text FROM reviews", conn)
    if len(df) == 0:
        conn.close()
        return
        
    try:
        vectorizer, model = load_ml_pipeline()
    except FileNotFoundError:
        print("Model not trained yet. Cannot update predictions.")
        conn.close()
        return
        
    df['cleaned_review_text'] = df['cleaned_review_text'].fillna('')
    vec_data = vectorizer.transform(df['cleaned_review_text'])
    predictions = model.predict(vec_data)
    
    print("Updating database with predicted sentiments...")
    for index, row in df.iterrows():
        cursor.execute(
            "UPDATE reviews SET predicted_sentiment = ? WHERE review_id = ?",
            (predictions[index], int(row['review_id']))
        )
        
    conn.commit()
    conn.close()
    print("Database predictions updated successfully.")

if __name__ == "__main__":
    train_model()
