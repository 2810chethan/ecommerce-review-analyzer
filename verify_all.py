import urllib.request
import json

def test_get(url):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error GET {url}: {e}")
        return None

def test_post(url, data):
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error POST {url}: {e}")
        return None

def verify():
    base_url = "http://127.0.0.1:8000"
    
    print("=== Testing Stats Endpoint ===")
    stats = test_get(f"{base_url}/api/stats")
    if stats:
        print(f"[OK] Stats obtained successfully.")
        print(f"  Total Reviews: {stats['total_reviews']}")
        print(f"  Total Products: {stats['total_products']}")
        print(f"  Total Customers: {stats['total_customers']}")
        print(f"  Model Match Rate: {stats['model_accuracy']}%")
    else:
        print("[ERROR] Failed to get stats.")
        
    print("\n=== Testing ML Predict Endpoint ===")
    pred = test_post(f"{base_url}/api/ml/predict", {"text": "This watch is absolutely amazing! Outstanding quality."})
    if pred:
        print(f"[OK] ML prediction succeeded.")
        print(f"  Input: \"{pred['review_text']}\"")
        print(f"  Predicted Sentiment: {pred['predicted_sentiment']}")
        print(f"  Probabilities: {pred['probabilities']}")
    else:
        print("[ERROR] Failed to get ML prediction.")
        
    print("\n=== Testing Chatbot Message Endpoint ===")
    chat = test_post(f"{base_url}/api/chatbot/message", {"message": "How many reviews do we have in the database?"})
    if chat:
        print(f"[OK] Chatbot response obtained.")
        print(f"  Reply: \"{chat['reply']}\"")
    else:
        print("[ERROR] Failed to get Chatbot response.")
        
    print("\n=== Testing SQL Playground Endpoint ===")
    sql = test_post(f"{base_url}/api/sql/run", {"query": "SELECT category, COUNT(*) as count FROM products GROUP BY category;"})
    if sql:
        print(f"[OK] SQL Sandbox Query executed successfully.")
        print(f"  Columns: {sql['columns']}")
        print(f"  Returned Row Count: {sql['row_count']}")
        print(f"  Sample Rows: {sql['data']}")
    else:
        print("[ERROR] Failed to run SQL Query.")

if __name__ == "__main__":
    verify()
