import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# Read the CSV file
df = pd.read_csv('leetcode_db.csv')
print(f"Loaded {len(df)} rows from CSV")

# Connect to database
conn = psycopg2.connect(
    host="localhost",
    database="leetcode_db", 
    user="postgres",  # Use postgres since that's who owns the table
    password="4340"  # PUT YOUR ACTUAL PASSWORD HERE
)

cursor = conn.cursor()

# Clean data and insert
for _, row in df.iterrows():
    cursor.execute("""
        INSERT INTO problems (id, title, description, is_premium, difficulty, 
                            solution_link, acceptance_rate, frequency, url,
                            discuss_count, accepted, submissions, companies,
                            related_topics, likes, dislikes, rating, 
                            asked_by_faang, similar_questions)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        row['id'], row['title'], row['description'], 
        row.get('is_premium', 0), row['difficulty'],
        row.get('solution_link', ''), row.get('acceptance_rate', 0),
        row.get('frequency', 0), row.get('url', ''),
        row.get('discuss_count', 0), row.get('accepted', ''),
        row.get('submissions', ''), row.get('companies', ''),
        row.get('related_topics', ''), row.get('likes', 0),
        row.get('dislikes', 0), row.get('rating', 0),
        row.get('asked_by_faang', 0), row.get('similar_questions', '')
    ))

conn.commit()
cursor.close()
conn.close()
print("Import completed!")