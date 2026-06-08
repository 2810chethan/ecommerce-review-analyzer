import re
import sqlite3
import os

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import DB_PATH, get_db_connection
from ml_model import predict_sentiment

def query_db_scalar(query, params=()):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        res = cursor.fetchone()
        conn.close()
        return res[0] if res else None
    except Exception as e:
        print(f"Error querying scalar: {e}")
        return None

def process_chat_message(message: str) -> str:
    msg = message.lower().strip()
    
    # 1. Check for greeting
    if any(greet in msg for greet in ["hello", "hi", "hey", "greetings", "good morning", "good evening"]):
        return (
            "Hello! I am your E-commerce Review Analyzer assistant. 🤖\n\n"
            "I can help you with:\n"
            "1. **Explaining the pipeline** (type 'explain workflow' or 'how it works')\n"
            "2. **Answering dataset questions** (try 'how many reviews do we have?' or 'what is the average rating of books?')\n"
            "3. **Real-time Sentiment Analysis** (type 'analyze review: [your review text here]')\n\n"
            "How can I assist you today?"
        )
        
    # 2. Check for explanation requests
    if any(keyword in msg for keyword in ["explain", "workflow", "how it works", "pipeline", "process"]):
        return (
            "Here is how this system works step-by-step:\n\n"
            "1. **Data Collection**: We generated an e-commerce reviews dataset (`mock_reviews.csv`) with details about customers, products, orders, and reviews.\n"
            "2. **Data Preprocessing**: Review texts are cleaned by removing punctuation, converting to lowercase, and filtering out common stopwords.\n"
            "3. **Database Setup**: Cleaned reviews are stored in structured SQLite tables (`customers`, `products`, `orders`, `reviews`).\n"
            "4. **ML Feature Engineering**: We convert text to numerical values using a **TF-IDF Vectorizer** (captures word importance).\n"
            "5. **Model Training**: A **Logistic Regression** classifier is trained on the TF-IDF vectors using ratings as sentiment labels:\n"
            "   - Star Rating $\ge$ 4 $\rightarrow$ Positive\n"
            "   - Star Rating = 3 $\rightarrow$ Neutral\n"
            "   - Star Rating $\le$ 2 $\rightarrow$ Negative\n"
            "6. **Evaluation & Storage**: The model classifies sentiments for all reviews, and results are written back to the database for SQL analysis & visualization!"
        )

    # 3. Check for Real-time Review Analysis
    if msg.startswith("analyze review:") or msg.startswith("predict review:") or msg.startswith("analyze:"):
        # Extract the review text
        prefix_len = len("analyze review:") if msg.startswith("analyze review:") else (len("predict review:") if msg.startswith("predict review:") else len("analyze:"))
        review_text = message[prefix_len:].strip()
        if not review_text:
            return "Please provide some text to analyze. E.g., `analyze review: This watch is incredibly good!`"
            
        sentiment, probs = predict_sentiment(review_text)
        
        prob_str = ", ".join([f"**{k}**: {v*100:.1f}%" for k, v in probs.items()])
        emoji = "😊" if sentiment == "Positive" else ("😐" if sentiment == "Neutral" else "😞")
        
        return (
            f"**Real-time Review Analysis Result:**\n\n"
            f"**Review Text**: \"{review_text}\"\n"
            f"**Predicted Sentiment**: **{sentiment}** {emoji}\n\n"
            f"**Confidence Probabilities**:\n{prob_str}"
        )

    # 4. Database-grounded Q&A (Matches natural language questions, runs SQL to answer)
    
    # 4a. Count of all reviews
    if re.search(r'how many reviews|total reviews|number of reviews', msg):
        cnt = query_db_scalar("SELECT COUNT(*) FROM reviews;")
        return f"We have a total of **{cnt:,}** customer reviews in the database."
        
    # 4b. Count of all products
    if re.search(r'how many products|total products|number of products', msg):
        cnt = query_db_scalar("SELECT COUNT(*) FROM products;")
        return f"There are **{cnt}** unique products across our store catalog."

    # 4c. Count of all customers
    if re.search(r'how many customers|total customers|number of customers', msg):
        cnt = query_db_scalar("SELECT COUNT(*) FROM customers;")
        return f"We have **{cnt}** registered customers in our database."

    # 4d. Average rating of all reviews
    if re.search(r'average rating|avg rating|mean rating', msg) and not any(cat in msg for cat in ["book", "electronic", "apparel", "home", "beauty"]):
        avg = query_db_scalar("SELECT AVG(rating) FROM reviews;")
        return f"The average rating across all products is **{avg:.2f} / 5.0**."

    # 4e. Category specific questions: Average rating, review count
    category_map = {
        "books": "Books", "book": "Books",
        "electronics": "Electronics", "electronic": "Electronics",
        "apparel": "Apparel", "clothing": "Apparel", "clothes": "Apparel",
        "home": "Home & Kitchen", "kitchen": "Home & Kitchen",
        "beauty": "Beauty", "cosmetics": "Beauty"
    }
    
    matched_cat = None
    for keyword, cat_name in category_map.items():
        if keyword in msg:
            matched_cat = cat_name
            break
            
    if matched_cat:
        if "average rating" in msg or "avg rating" in msg or "rating" in msg:
            avg = query_db_scalar(
                "SELECT AVG(rating) FROM reviews r JOIN products p ON r.product_id = p.product_id WHERE p.category = ?;",
                (matched_cat,)
            )
            return f"The average rating for products in the **{matched_cat}** category is **{avg:.2f} / 5.0**."
        elif "how many" in msg or "count" in msg or "reviews" in msg:
            cnt = query_db_scalar(
                "SELECT COUNT(*) FROM reviews r JOIN products p ON r.product_id = p.product_id WHERE p.category = ?;",
                (matched_cat,)
            )
            return f"There are **{cnt}** reviews in the **{matched_cat}** category."

    # 4f. Sentiment distribution counts
    if "positive reviews" in msg or "how many positive" in msg:
        cnt = query_db_scalar("SELECT COUNT(*) FROM reviews WHERE sentiment = 'Positive';")
        total = query_db_scalar("SELECT COUNT(*) FROM reviews;")
        pct = (cnt / total) * 100 if total else 0
        return f"There are **{cnt}** positive reviews, representing **{pct:.1f}%** of all reviews."
        
    if "negative reviews" in msg or "how many negative" in msg:
        cnt = query_db_scalar("SELECT COUNT(*) FROM reviews WHERE sentiment = 'Negative';")
        total = query_db_scalar("SELECT COUNT(*) FROM reviews;")
        pct = (cnt / total) * 100 if total else 0
        return f"There are **{cnt}** negative reviews, representing **{pct:.1f}%** of all reviews."

    if "neutral reviews" in msg or "how many neutral" in msg:
        cnt = query_db_scalar("SELECT COUNT(*) FROM reviews WHERE sentiment = 'Neutral';")
        total = query_db_scalar("SELECT COUNT(*) FROM reviews;")
        pct = (cnt / total) * 100 if total else 0
        return f"There are **{cnt}** neutral reviews, representing **{pct:.1f}%** of all reviews."

    # 4g. Top rated product
    if "best product" in msg or "top product" in msg or "highest rated product" in msg:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.product_name, AVG(r.rating) as avg_rating, COUNT(r.review_id) as count
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            GROUP BY p.product_id
            HAVING count >= 5
            ORDER BY avg_rating DESC
            LIMIT 1;
        """)
        res = cursor.fetchone()
        conn.close()
        if res:
            return f"The highest-rated product (with at least 5 reviews) is **{res[0]}** with an average rating of **{res[1]:.2f} / 5.0** ({res[2]} reviews)."
        return "Unable to calculate the best product currently."

    # Fallback response
    return (
        "I'm not sure I understand that query. You can ask me questions like:\n"
        "- *'How many reviews do we have?'*\n"
        "- *'What is the average rating of books?'*\n"
        "- *'How many negative reviews are in the database?'*\n"
        "- *'Explain workflow'*\n"
        "- *'Analyze review: [text]'* to test my sentiment model!"
    )
