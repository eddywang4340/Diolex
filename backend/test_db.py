# test_db.py
import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to allow importing app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import engine, Base
from app.db.models.user import User
from sqlalchemy import text


async def test_connection():
    """Test database connection by executing a simple query"""
    print("Testing database connection...")
    
    try:
        # Connect and execute a simple query
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            value = result.scalar()
            
            if value == 1:
                print("✅ Successfully connected to the database!")
            else:
                print("❌ Connection test failed: Unexpected response")
                
    except Exception as e:
        print(f"❌ Connection error: {str(e)}")
        print("\nPlease check:")
        print("1. Your DATABASE_URL in .env file")
        print("2. Database server is running")
        print("3. Network connectivity to database")
        print("4. Credentials are correct")
        return False
    
    return True


async def create_tables():
    """Create database tables from models"""
    print("\nCreating database tables...")
    
    try:
        # Create all tables defined in models
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        return False


async def run_tests():
    """Run all database tests"""
    print("=== DATABASE CONNECTION TEST ===")
    connection_ok = await test_connection()
    
    if connection_ok:
        print("\n=== DATABASE SCHEMA TEST ===")
        await create_tables()
    
    print("\nTests completed!")


if __name__ == "__main__":
    asyncio.run(run_tests())
