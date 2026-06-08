import csv
import random
from datetime import datetime, timedelta

# Categories and Products
categories_products = {
    "Electronics": [
        ("Wireless Headphones", 89.99),
        ("Smart Watch", 199.99),
        ("Bluetooth Speaker", 49.99),
        ("Mechanical Keyboard", 129.99),
        ("Ergonomic Mouse", 59.99),
        ("USB-C Hub", 29.99)
    ],
    "Apparel": [
        ("Running Shoes", 110.00),
        ("Leather Jacket", 249.99),
        ("Cotton T-Shirt", 19.99),
        ("Denim Jeans", 69.99),
        ("Sport Socks (3-Pack)", 14.99),
        ("Winter Beanie", 24.99)
    ],
    "Home & Kitchen": [
        ("Air Fryer", 99.99),
        ("Coffee Maker", 79.99),
        ("Blender", 45.00),
        ("Knife Set (12-Piece)", 149.99),
        ("Non-Stick Frying Pan", 34.99),
        ("Vacuum Cleaner", 189.99)
    ],
    "Books": [
        ("Sci-Fi Novel: The Stars Above", 14.99),
        ("Python Programming Masterclass", 49.99),
        ("Healthy Cooking Recipe Book", 22.50),
        ("Historical Mystery: Silent Bells", 12.99),
        ("Personal Finance Guide", 18.00)
    ],
    "Beauty": [
        ("Moisturizer", 25.00),
        ("Face Serum", 38.00),
        ("Organic Shampoo", 16.99),
        ("Matte Lipstick", 21.00),
        ("Sunscreen SPF 50", 18.50)
    ]
}

# Review Templates based on Rating
review_templates = {
    5: [
        "Absolutely amazing! The {product} exceeded my expectations. High quality and fast delivery.",
        "Perfect purchase! Works beautifully. Highly recommend this to anyone looking for a reliable {product}.",
        "Great value for money. Built very well and does exactly what is advertised. Will buy again!",
        "Stunning quality, I am in love with this! Definitely worth every penny.",
        "Exactly what I needed! Delivery was super fast, and the customer support was top-notch."
    ],
    4: [
        "Really good {product}. It works fine, minor issues with instructions but otherwise great.",
        "Very satisfied with this purchase. Quality is solid and functions as expected.",
        "Good product for the price. Not perfect, but definitely does the job well.",
        "Decent build, matches description. Shipping took an extra day but happy with the item.",
        "Satisfied! It feels premium and looks great in my setup."
    ],
    3: [
        "It's okay, nothing special. The {product} does work, but the materials feel a bit cheap.",
        "Average product. It works fine but shipping was delayed. Standard experience.",
        "Decent, but I expected slightly better performance for this price point.",
        "It performs its basic functions, but has some annoying design flaws.",
        "Mediocre. It's not terrible, but there are better alternatives out there."
    ],
    2: [
        "Disappointed. The quality of the {product} is poor and very bad. It has issues.",
        "Not worth the price. Underperformed and the quality of this {product} is bad.",
        "Would not recommend. Cheap plastic feel, it is not worth it and feels very bad.",
        "Slightly disappointed. It broke after minimal use. Bad product and slow shipping.",
        "Missed the mark. The features are bad, lacking and it feels fragile."
    ],
    1: [
        "Terrible experience! The {product} is very bad, arrived damaged and completely unusable. Avoid!",
        "Absolute waste of money. Do not buy! This is a very bad product, worst purchase.",
        "Horrible quality. The seller is bad and unresponsive. Extremely disappointed.",
        "DO NOT BUY. This is cheap garbage. It is bad and doesn't match description.",
        "Worst purchase ever. Complete failure. Very bad product, do not recommend."
    ]
}

# Names for Customers
first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Elizabeth", "William", "Linda",
               "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

def generate_mock_data(num_records=1000):
    customers = []
    # Pre-generate 100 customers
    for i in range(1, 101):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        customers.append({
            "customer_id": f"C{i:03d}",
            "customer_name": f"{fn} {ln}",
            "email": f"{fn.lower()}.{ln.lower()}{random.randint(10, 99)}@example.com"
        })

    products = []
    # Extract products details
    p_id = 1
    for category, prod_list in categories_products.items():
        for prod_name, price in prod_list:
            products.append({
                "product_id": f"P{p_id:03d}",
                "product_name": prod_name,
                "category": category,
                "price": price
            })
            p_id += 1

    records = []
    start_date = datetime.now() - timedelta(days=180)

    for i in range(1, num_records + 1):
        cust = random.choice(customers)
        prod = random.choice(products)
        order_date = start_date + timedelta(days=random.randint(0, 180), hours=random.randint(0, 23))
        
        # Decide rating with a natural distribution (more positive/neutral than negative)
        rating = random.choices([5, 4, 3, 2, 1], weights=[40, 30, 15, 10, 5])[0]
        
        review_text = random.choice(review_templates[rating]).format(product=prod["product_name"].lower())
        
        records.append({
            "order_id": f"O{i:05d}",
            "customer_id": cust["customer_id"],
            "customer_name": cust["customer_name"],
            "email": cust["email"],
            "product_id": prod["product_id"],
            "product_name": prod["product_name"],
            "category": prod["category"],
            "price": prod["price"],
            "rating": rating,
            "review_text": review_text,
            "order_date": order_date.strftime("%Y-%m-%d %H:%M:%S")
        })

    return records

def save_to_csv(records, filename):
    keys = records[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        dict_writer = csv.DictWriter(f, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(records)

if __name__ == "__main__":
    import os
    os.makedirs(os.path.dirname("C:/Users/Chethan kalyan/.gemini/antigravity/scratch/ecommerce-review-analyzer/data/mock_reviews.csv"), exist_ok=True)
    records = generate_mock_data(1000)
    save_to_csv(records, "C:/Users/Chethan kalyan/.gemini/antigravity/scratch/ecommerce-review-analyzer/data/mock_reviews.csv")
    print(f"Generated {len(records)} records in C:/Users/Chethan kalyan/.gemini/antigravity/scratch/ecommerce-review-analyzer/data/mock_reviews.csv")
