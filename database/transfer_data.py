import psycopg2

print("🔄 Attempting to transfer data to Neon...")

NEON_CONNECTION = "postgresql://neondb_owner:npg_f45xScwuUFyM@ep-misty-shadow-ad1j68j9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Connect to local database
local_conn = psycopg2.connect("postgresql://postgres:4340@localhost:5432/leetcode_db")
print("✅ Connected to local database")

# Connect to Neon
neon_conn = psycopg2.connect(NEON_CONNECTION)
print("✅ Connected to Neon")

try:
    # Get data from local with explicit column order
    local_cursor = local_conn.cursor()
    
    # Get data in the correct order matching your local schema
    local_cursor.execute("""
        SELECT id, title, description, is_premium, difficulty, 
               solution_link, acceptance_rate, frequency, url,
               discuss_count, accepted, submissions, 
               companies, related_topics, likes, dislikes, 
               rating, asked_by_faang, similar_questions
        FROM problems 
        ORDER BY id
    """)
    rows = local_cursor.fetchall()
    
    print(f"📊 Found {len(rows)} problems to transfer")
    
    # Create table in Neon (drop first to start clean)
    neon_cursor = neon_conn.cursor()
    
    neon_cursor.execute("DROP TABLE IF EXISTS problems;")
    
    neon_cursor.execute("""
        CREATE TABLE problems (
            id INTEGER PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            is_premium INTEGER DEFAULT 0,
            difficulty VARCHAR(10) NOT NULL,
            solution_link VARCHAR(255),
            acceptance_rate DECIMAL(5,2),
            frequency DECIMAL(5,2),
            url VARCHAR(255),
            discuss_count INTEGER,
            accepted VARCHAR(50),
            submissions VARCHAR(50),
            companies TEXT[],
            related_topics TEXT[],
            likes INTEGER DEFAULT 0,
            dislikes INTEGER DEFAULT 0,
            rating INTEGER,
            asked_by_faang INTEGER DEFAULT 0,
            similar_questions TEXT
        );
    """)
    
    print("📋 Created table in Neon")
    
    # Insert data with explicit column names
    insert_query = """
        INSERT INTO problems (
            id, title, description, is_premium, difficulty,
            solution_link, acceptance_rate, frequency, url,
            discuss_count, accepted, submissions,
            companies, related_topics, likes, dislikes,
            rating, asked_by_faang, similar_questions
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    # Insert in batches
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        for row in batch:
            neon_cursor.execute(insert_query, row)
        
        neon_conn.commit()
        print(f"📤 Transferred {min(i+batch_size, len(rows))}/{len(rows)} problems")
    
    # Verify
    neon_cursor.execute("SELECT COUNT(*) FROM problems")
    count = neon_cursor.fetchone()[0]
    
    print(f"🎉 SUCCESS! Transferred {count} problems to Neon")
    
    # Test a query
    neon_cursor.execute("SELECT title, difficulty FROM problems WHERE 'Google' = ANY(companies) LIMIT 3")
    sample = neon_cursor.fetchall()
    print(f"🔍 Sample Google problems: {sample}")
    
    # Create useful indexes
    neon_cursor.execute("CREATE INDEX IF NOT EXISTS idx_companies ON problems USING GIN(companies);")
    neon_cursor.execute("CREATE INDEX IF NOT EXISTS idx_topics ON problems USING GIN(related_topics);")
    neon_cursor.execute("CREATE INDEX IF NOT EXISTS idx_difficulty ON problems(difficulty);")
    print("📊 Created indexes for better performance")
    
except Exception as e:
    print(f"❌ Transfer failed: {e}")
    
finally:
    local_conn.close()
    neon_conn.close()

print("✅ Done!")