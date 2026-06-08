import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

try:
    from app.database import get_db_connection, init_db, load_data, clean_text
    from app.ml_model import predict_sentiment, train_model, update_all_predictions
    from app.sql_executor import execute_select_query
    from app.chatbot import process_chat_message
    from app.auth import GoogleLoginRequest, verify_google_token, RegisterRequest, LoginRequest, register_user, login_user
except ImportError:
    from database import get_db_connection, init_db, load_data, clean_text
    from ml_model import predict_sentiment, train_model, update_all_predictions
    from sql_executor import execute_select_query
    from chatbot import process_chat_message
    from auth import GoogleLoginRequest, verify_google_token, RegisterRequest, LoginRequest, register_user, login_user

app = FastAPI(
    title="E-commerce Product Review Analyzer API",
    description="Backend API for Sentiment Prediction, SQL Analysis, and Chatbot Assistance",
    version="1.0.0"
)

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: initialize DB if needed
@app.on_event("startup")
def startup_event():
    # If reviews.db doesn't exist, create and populate it
    db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "reviews.db"))
    if not os.path.exists(db_file):
        print("Database not found. Initializing...")
        init_db()
        try:
            load_data()
            train_model()
        except Exception as e:
            print(f"Error seeding database: {e}")

class SQLRequest(BaseModel):
    query: str

class PredictRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str

@app.post("/api/auth/register", tags=["Authentication"])
def register(payload: RegisterRequest):
    res = register_user(payload)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@app.post("/api/auth/login", tags=["Authentication"])
def login(payload: LoginRequest):
    session = login_user(payload)
    if not session.authenticated:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return session

@app.post("/api/auth/google", tags=["Authentication"])
def google_auth(payload: GoogleLoginRequest):
    session = verify_google_token(payload)
    if not session.authenticated:
        raise HTTPException(status_code=401, detail="Invalid Google OAuth token representation.")
    return session

@app.get("/api/stats", tags=["Dashboard"])
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Total counts
        cursor.execute("SELECT COUNT(*) FROM reviews")
        total_reviews = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products")
        total_products = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM customers")
        total_customers = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(rating) FROM reviews")
        avg_rating = cursor.fetchone()[0] or 0.0
        
        # Sentiment distribution
        cursor.execute("SELECT sentiment, COUNT(*) FROM reviews GROUP BY sentiment")
        sentiment_dist = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Predicted sentiment distribution
        cursor.execute("SELECT predicted_sentiment, COUNT(*) FROM reviews GROUP BY predicted_sentiment")
        pred_sentiment_dist = {row[0] or "Unclassified": row[1] for row in cursor.fetchall()}
        
        # Average rating per product category
        cursor.execute("""
            SELECT p.category, AVG(r.rating) as avg_rating, COUNT(r.review_id) as count
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            GROUP BY p.category
        """)
        category_stats = [{"category": row[0], "avg_rating": round(row[1], 2), "count": row[2]} for row in cursor.fetchall()]
        
        # Top products
        cursor.execute("""
            SELECT p.product_name, p.category, AVG(r.rating) as avg_rating, COUNT(r.review_id) as count
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            GROUP BY p.product_id
            ORDER BY avg_rating DESC, count DESC
            LIMIT 5
        """)
        top_products = [{"product_name": row[0], "category": row[1], "avg_rating": round(row[2], 2), "count": row[3]} for row in cursor.fetchall()]
        
        # Model performance metric (Match rate between sentiment and predicted_sentiment)
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN sentiment = predicted_sentiment THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
            FROM reviews
            WHERE predicted_sentiment IS NOT NULL
        """)
        model_accuracy = cursor.fetchone()[0] or 0.0
        
        conn.close()
        
        return {
            "total_reviews": total_reviews,
            "total_products": total_products,
            "total_customers": total_customers,
            "avg_rating": round(avg_rating, 2),
            "sentiment_distribution": {
                "Positive": sentiment_dist.get("Positive", 0),
                "Neutral": sentiment_dist.get("Neutral", 0),
                "Negative": sentiment_dist.get("Negative", 0)
            },
            "predicted_sentiment_distribution": {
                "Positive": pred_sentiment_dist.get("Positive", 0),
                "Neutral": pred_sentiment_dist.get("Neutral", 0),
                "Negative": pred_sentiment_dist.get("Negative", 0)
            },
            "category_stats": category_stats,
            "top_products": top_products,
            "model_accuracy": round(model_accuracy, 1)
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.post("/api/sql/run", tags=["SQL Playground"])
def run_sql(payload: SQLRequest):
    result = execute_select_query(payload.query)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/ml/predict", tags=["Machine Learning"])
def predict(payload: PredictRequest):
    try:
        sentiment, probs = predict_sentiment(payload.text)
        return {
            "review_text": payload.text,
            "predicted_sentiment": sentiment,
            "probabilities": probs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/retrain", tags=["Machine Learning"])
def retrain():
    try:
        success = train_model()
        if not success:
            raise HTTPException(status_code=400, detail="Retraining failed. No reviews present.")
        return {"success": True, "message": "ML Model retrained and database updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatbot/message", tags=["Chatbot"])
def chat(payload: ChatRequest):
    try:
        reply = process_chat_message(payload.message)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews", tags=["Dashboard"])
def get_reviews(
    category: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT r.review_id, r.rating, r.review_text, r.sentiment, r.predicted_sentiment,
               p.product_name, p.category, c.customer_name
        FROM reviews r
        JOIN products p ON r.product_id = p.product_id
        JOIN customers c ON r.customer_id = c.customer_id
        WHERE 1=1
    """
    params = []
    
    if category:
        query += " AND p.category = ?"
        params.append(category)
    if sentiment:
        query += " AND r.sentiment = ?"
        params.append(sentiment)
        
    # Get total count first for pagination
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]
    
    # Add pagination and order
    query += " ORDER BY r.review_id DESC LIMIT ? OFFSET ?"
    params.extend([page_size, (page - 1) * page_size])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    reviews = []
    for row in rows:
        reviews.append({
            "review_id": row[0],
            "rating": row[1],
            "review_text": row[2],
            "sentiment": row[3],
            "predicted_sentiment": row[4],
            "product_name": row[5],
            "category": row[6],
            "customer_name": row[7]
        })
        
    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
        "reviews": reviews
    }
