import os
import sqlite3
import pandas as pd
import re
import string

# Database Path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "reviews.db"))
CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "mock_reviews.csv"))

# Custom Stopwords (excluding negation and sentiment modifiers)
STOPWORDS = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
    "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", 
    "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", 
    "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", 
    "been", "being", "have", "has", "had", "having", "a", "an", "the", "and", "if", "or", 
    "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "between", 
    "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", 
    "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", 
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", 
    "more", "most", "other", "some", "such", "own", "same", "so", "than", "s", "t", "now"
}

def clean_text(text):
    if not isinstance(text, str):
        return ""
    # Lowercase
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove stopwords
    words = text.split()
    cleaned_words = [w for w in words if w not in STOPWORDS]
    return " ".join(cleaned_words)

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        auth_provider TEXT NOT NULL,
        picture TEXT
    );
    """)
    
    # Create Customers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        customer_id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    );
    """)
    
    # Create Products Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        product_id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL
    );
    """)
    
    # Create Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        price REAL NOT NULL,
        order_date TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
        FOREIGN KEY (product_id) REFERENCES products (product_id)
    );
    """)
    
    # Create Reviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        review_text TEXT,
        cleaned_review_text TEXT,
        sentiment TEXT NOT NULL,
        predicted_sentiment TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
        FOREIGN KEY (product_id) REFERENCES products (product_id)
    );
    """)
    
    conn.commit()
    conn.close()
    print("Database schema initialized successfully.")

def load_data():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Mock reviews file not found at {CSV_PATH}. Run data/generate_dataset.py first.")
        
    df = pd.read_csv(CSV_PATH)
    
    # Handle missing values
    df['review_text'] = df['review_text'].fillna('')
    df = df.dropna(subset=['customer_id', 'product_id', 'order_id'])
    
    # Remove duplicates
    df = df.drop_duplicates(subset=['order_id'])
    
    # Clean text
    df['cleaned_review_text'] = df['review_text'].apply(clean_text)
    
    # Label sentiment based on rating
    # Rating >= 4 -> Positive, Rating = 3 -> Neutral, Rating <= 2 -> Negative
    def label_sentiment(rating):
        if rating >= 4:
            return "Positive"
        elif rating == 3:
            return "Neutral"
        else:
            return "Negative"
            
    df['sentiment'] = df['rating'].apply(label_sentiment)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert customers
    print("Loading customers...")
    customers_df = df[['customer_id', 'customer_name', 'email']].drop_duplicates()
    for _, row in customers_df.iterrows():
        cursor.execute("""
        INSERT OR IGNORE INTO customers (customer_id, customer_name, email)
        VALUES (?, ?, ?)
        """, (row['customer_id'], row['customer_name'], row['email']))
        
    # Insert products
    print("Loading products...")
    products_df = df[['product_id', 'product_name', 'category', 'price']].drop_duplicates()
    for _, row in products_df.iterrows():
        cursor.execute("""
        INSERT OR IGNORE INTO products (product_id, product_name, category, price)
        VALUES (?, ?, ?, ?)
        """, (row['product_id'], row['product_name'], row['category'], row['price']))
        
    # Insert orders
    print("Loading orders...")
    orders_df = df[['order_id', 'customer_id', 'product_id', 'price', 'order_date']].drop_duplicates()
    for _, row in orders_df.iterrows():
        cursor.execute("""
        INSERT OR IGNORE INTO orders (order_id, customer_id, product_id, price, order_date)
        VALUES (?, ?, ?, ?, ?)
        """, (row['order_id'], row['customer_id'], row['product_id'], row['price'], row['order_date']))
        
    # Insert reviews
    print("Loading reviews...")
    for _, row in df.iterrows():
        cursor.execute("""
        INSERT INTO reviews (order_id, customer_id, product_id, rating, review_text, cleaned_review_text, sentiment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (row['order_id'], row['customer_id'], row['product_id'], int(row['rating']), 
              row['review_text'], row['cleaned_review_text'], row['sentiment']))
              
    conn.commit()
    conn.close()
    print("Data loaded successfully.")

if __name__ == "__main__":
    init_db()
    load_data()
