# test_api.py
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to allow importing app modules
sys.path.insert(0, str(Path(__file__).parent))

import uvicorn
from fastapi import FastAPI, Depends
from sqlalchemy import text
from app.db.database import get_db

# Create a test FastAPI app
app = FastAPI(title="API Connection Test")


@app.get("/")
async def root():
    """Root endpoint to test API is working"""
    return {"status": "ok", "message": "API is running"}


@app.get("/db-test")
async def test_db_connection(db=Depends(get_db)):
    """Test endpoint to verify database connection through dependency"""
    try:
        # Try a simple query
        query = await db.execute(text("SELECT 1"))
        result = query.scalar()
        return {"status": "ok", "message": "Database connection successful", "result": result}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}


if __name__ == "__main__":
    print("Starting test API server...")
    print("Access the API at: http://localhost:8000")
    print("Test database connection at: http://localhost:8000/db-test")
    uvicorn.run(app, host="0.0.0.0", port=8000)
