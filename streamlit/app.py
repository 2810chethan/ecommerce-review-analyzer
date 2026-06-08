import streamlit as tf
import pandas as pd
import sqlite3
import plotly.express as px
import os
import re

# Set page configuration
tf.set_page_config(
    page_title="E-commerce Product Review Analyzer",
    page_icon="🛍️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Database Path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "reviews.db"))

def get_db_connection():
    if not os.path.exists(DB_PATH):
        tf.error(f"Database not found at {DB_PATH}. Please make sure the backend initialization has run first.")
        return None
    conn = sqlite3.connect(DB_PATH)
    return conn

# Helper to run queries safely
def run_query(query, conn):
    try:
        return pd.read_sql_query(query, conn)
    except Exception as e:
        tf.error(f"Query Error: {e}")
        return None

# App Title
tf.title("🛍️ E-commerce Product Review Analyzer")
tf.markdown("### Customer Satisfaction Metrics & SQL Analytics Dashboard")
tf.markdown("---")

conn = get_db_connection()

if conn:
    # Sidebar
    tf.sidebar.header("Navigation & Filters")
    page = tf.sidebar.radio("Go to", ["Dashboard Overview", "Review Explorer", "SQL Query Playground"])
    
    # Fetch lists for filters
    categories = ["All"] + list(run_query("SELECT DISTINCT category FROM products ORDER BY category", conn)["category"])
    
    if page == "Dashboard Overview":
        tf.subheader("📊 Key Performance Indicators")
        
        # Calculate stats
        total_reviews = run_query("SELECT COUNT(*) as count FROM reviews", conn).iloc[0]["count"]
        total_products = run_query("SELECT COUNT(*) as count FROM products", conn).iloc[0]["count"]
        total_customers = run_query("SELECT COUNT(*) as count FROM customers", conn).iloc[0]["count"]
        avg_rating = run_query("SELECT AVG(rating) as avg FROM reviews", conn).iloc[0]["avg"]
        
        # Display KPIs
        col1, col2, col3, col4 = tf.columns(4)
        col1.metric("Total Reviews", f"{total_reviews:,}")
        col2.metric("Products Catalog", f"{total_products}")
        col3.metric("Registered Customers", f"{total_customers:,}")
        col4.metric("Average Star Rating", f"{avg_rating:.2f} / 5.0")
        
        tf.markdown("---")
        
        # Two-column layout for charts
        col_left, col_right = tf.columns(2)
        
        with col_left:
            tf.markdown("#### 🌟 Actual Sentiment Distribution (from Ratings)")
            sentiment_df = run_query(
                "SELECT sentiment, COUNT(*) as count FROM reviews GROUP BY sentiment", conn
            )
            fig_pie = px.pie(
                sentiment_df, 
                values='count', 
                names='sentiment', 
                color='sentiment',
                color_discrete_map={'Positive': '#10B981', 'Neutral': '#F59E0B', 'Negative': '#EF4444'},
                hole=0.4
            )
            tf.plotly_chart(fig_pie, use_container_width=True)
            
        with col_right:
            tf.markdown("#### 🤖 Model Predicted Sentiment Distribution")
            pred_sentiment_df = run_query(
                "SELECT predicted_sentiment as sentiment, COUNT(*) as count FROM reviews GROUP BY predicted_sentiment", conn
            )
            fig_pie_pred = px.pie(
                pred_sentiment_df, 
                values='count', 
                names='sentiment', 
                color='sentiment',
                color_discrete_map={'Positive': '#3B82F6', 'Neutral': '#8B5CF6', 'Negative': '#EC4899'},
                hole=0.4
            )
            tf.plotly_chart(fig_pie_pred, use_container_width=True)
            
        tf.markdown("---")
        
        # Category rating chart
        tf.markdown("#### 📈 Average Product Rating & Review Count by Category")
        cat_df = run_query("""
            SELECT p.category, AVG(r.rating) as avg_rating, COUNT(r.review_id) as count
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            GROUP BY p.category
            ORDER BY avg_rating DESC
        """, conn)
        
        fig_bar = px.bar(
            cat_df, 
            x='category', 
            y='avg_rating', 
            text='avg_rating',
            labels={'avg_rating': 'Average Rating', 'category': 'Product Category'},
            color='avg_rating',
            color_continuous_scale='Blues'
        )
        fig_bar.update_traces(texttemplate='%{text:.2f}', textposition='outside')
        tf.plotly_chart(fig_bar, use_container_width=True)
        
        # Top-performing products table
        tf.markdown("#### 🏆 Top 5 Best-Selling & Best-Reviewed Products")
        top_prod_df = run_query("""
            SELECT p.product_name, p.category, p.price, AVG(r.rating) as avg_rating, COUNT(r.review_id) as reviews_count
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            GROUP BY p.product_id
            ORDER BY avg_rating DESC, reviews_count DESC
            LIMIT 5
        """, conn)
        tf.dataframe(top_prod_df, use_container_width=True)
        
    elif page == "Review Explorer":
        tf.subheader("🔍 E-commerce Reviews Explorer")
        
        # Filters in columns
        f_col1, f_col2, f_col3 = tf.columns(3)
        with f_col1:
            sel_cat = tf.selectbox("Filter by Category", categories)
        with f_col2:
            sel_sentiment = tf.selectbox("Filter by Sentiment", ["All", "Positive", "Neutral", "Negative"])
        with f_col3:
            sel_rating = tf.selectbox("Filter by Star Rating", ["All", 5, 4, 3, 2, 1])
            
        # Build query dynamically
        query = """
            SELECT r.review_id, r.rating, r.review_text, r.sentiment, r.predicted_sentiment,
                   p.product_name, p.category, c.customer_name, o.order_date
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN orders o ON r.order_id = o.order_id
            WHERE 1=1
        """
        
        if sel_cat != "All":
            query += f" AND p.category = '{sel_cat}'"
        if sel_sentiment != "All":
            query += f" AND r.sentiment = '{sel_sentiment}'"
        if sel_rating != "All":
            query += f" AND r.rating = {sel_rating}"
            
        query += " ORDER BY r.review_id DESC"
        
        reviews_data = run_query(query, conn)
        
        if reviews_data is not None:
            tf.write(f"Showing **{len(reviews_data)}** matching reviews.")
            tf.dataframe(reviews_data, use_container_width=True)
            
    elif page == "SQL Query Playground":
        tf.subheader("💻 SQL Query Playground")
        tf.markdown("Write and execute custom SELECT queries against the database schema.")
        
        # Display schema diagram/columns in details expander
        with tf.expander("📂 View Database Schema (Tables and Columns)"):
            tf.markdown("""
            - **`customers`**
              - `customer_id` (TEXT, PK)
              - `customer_name` (TEXT)
              - `email` (TEXT)
            - **`products`**
              - `product_id` (TEXT, PK)
              - `product_name` (TEXT)
              - `category` (TEXT)
              - `price` (REAL)
            - **`orders`**
              - `order_id` (TEXT, PK)
              - `customer_id` (TEXT, FK)
              - `product_id` (TEXT, FK)
              - `price` (REAL)
              - `order_date` (TEXT)
            - **`reviews`**
              - `review_id` (INTEGER, PK)
              - `order_id` (TEXT, FK)
              - `customer_id` (TEXT, FK)
              - `product_id` (TEXT, FK)
              - `rating` (INTEGER)
              - `review_text` (TEXT)
              - `cleaned_review_text` (TEXT)
              - `sentiment` (TEXT)
              - `predicted_sentiment` (TEXT)
            """)
            
        # Example queries selection
        sample_query = tf.selectbox(
            "Select a sample query to load:",
            [
                "Custom Query...",
                "SELECT * FROM products LIMIT 5;",
                "SELECT category, COUNT(*) as product_count, AVG(price) as avg_price FROM products GROUP BY category;",
                "SELECT rating, sentiment, COUNT(*) as count FROM reviews GROUP BY rating, sentiment;",
                "SELECT c.customer_name, count(r.review_id) as review_count FROM reviews r JOIN customers c ON r.customer_id = c.customer_id GROUP BY c.customer_id ORDER BY review_count DESC LIMIT 5;",
                "SELECT predicted_sentiment, AVG(rating) FROM reviews GROUP BY predicted_sentiment;"
            ]
        )
        
        default_query = "SELECT * FROM reviews LIMIT 10;"
        if sample_query != "Custom Query...":
            default_query = sample_query
            
        user_query = tf.text_area("SQL SELECT Command", value=default_query, height=150)
        
        if tf.button("Execute Query", type="primary"):
            # Clean and sanitize select check
            clean_q = user_query.strip()
            if not re.match(r'^\s*select', clean_q, re.IGNORECASE):
                tf.error("Only SELECT statements are allowed for safety and security.")
            else:
                forbidden = ["insert", "update", "delete", "drop", "create", "alter", "replace", "vacuum"]
                if any(re.search(r'\b' + word + r'\b', clean_q, re.IGNORECASE) for word in forbidden):
                    tf.error("Security restriction: Write/modification keywords are forbidden.")
                else:
                    results = run_query(user_query, conn)
                    if results is not None:
                        tf.success(f"Query executed successfully! Returned **{len(results)}** rows.")
                        tf.dataframe(results, use_container_width=True)

    conn.close()
