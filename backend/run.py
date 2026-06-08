import uvicorn
import os

if __name__ == "__main__":
    # Ensure current directory is backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("Starting E-commerce Review Analyzer API Server...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
