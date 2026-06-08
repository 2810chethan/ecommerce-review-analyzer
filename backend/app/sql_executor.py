import sqlite3
import os
import re

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import DB_PATH

def execute_select_query(query: str):
    """Executes a SQL SELECT query against reviews.db safely."""
    # Simple sanitization to prevent write actions in the playground
    clean_query = query.strip()
    
    # Check if the query starts with select
    if not re.match(r'^\s*select', clean_query, re.IGNORECASE):
        return {
            "success": False,
            "error": "Only SELECT queries are allowed for security reasons."
        }
        
    # Block semi-colon injection that runs write commands
    forbidden_keywords = ["insert", "update", "delete", "drop", "create", "alter", "replace", "vacuum", "pragma"]
    for keyword in forbidden_keywords:
        # Match word boundaries to prevent matching "ordered" as "order" etc.
        if re.search(r'\b' + keyword + r'\b', clean_query, re.IGNORECASE):
            return {
                "success": False,
                "error": f"Security restriction: The command '{keyword}' is forbidden."
            }
            
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        
        # Get column names
        columns = [description[0] for description in cursor.description] if cursor.description else []
        
        # Convert rows to lists of dictionaries
        results = [dict(row) for row in rows]
        
        conn.close()
        return {
            "success": True,
            "columns": columns,
            "data": results,
            "row_count": len(results)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
