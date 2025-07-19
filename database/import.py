import pandas as pd
import psycopg2
import numpy as np

# In your import script, replace the companies part with:
def clean_companies(companies_str):
    """Convert comma-separated string to clean array"""
    if pd.isna(companies_str) or companies_str == '':
        return []
    return [company.strip() for company in str(companies_str).split(',') if company.strip()]

# Read the CSV file
df = pd.read_csv('leetcode_db.csv')
print(f"Loaded {len(df)} rows from CSV")

# Clean the data - replace NaN with appropriate defaults
df = df.fillna({
    'is_premium': 0,
    'solution_link': '',
    'acceptance_rate': 0,
    'frequency': 0,
    'url': '',
    'discuss_count': 0,
    'accepted': '0',
    'submissions': '0',
    'companies': '',
    'related_topics': '',
    'likes': 0,
    'dislikes': 0,
    'rating': 0,
    'asked_by_faang': 0,
    'similar_questions': ''
})

# Connect to database
conn = psycopg2.connect(
    host="localhost",
    database="leetcode_db", 
    user="postgres",  # Use postgres since that's who owns the table
    password="4340"  # PUT YOUR ACTUAL PASSWORD HERE
)

cursor = conn.cursor()

print("Starting import...")

# Insert data row by row
for index, row in df.iterrows():
    try:
        companies_array = clean_companies(row['companies'])
        related_topics_array = clean_companies(row['related_topics'])
        cursor.execute("""
            INSERT INTO problems (
                id, title, description, is_premium, difficulty,
                solution_link, acceptance_rate, frequency, url,
                discuss_count, accepted, submissions, companies,
                related_topics, likes, dislikes, rating,
                asked_by_faang, similar_questions
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            int(row['id']),
            str(row['title']),
            str(row['description']),
            int(row['is_premium']),
            str(row['difficulty']),
            str(row['solution_link']),
            float(row['acceptance_rate']) if pd.notna(row['acceptance_rate']) else None,
            float(row['frequency']) if pd.notna(row['frequency']) else None,
            str(row['url']),
            int(row['discuss_count']) if pd.notna(row['discuss_count']) else None,
            str(row['accepted']),
            str(row['submissions']),
            companies_array,
            related_topics_array,
            int(row['likes']) if pd.notna(row['likes']) else 0,
            int(row['dislikes']) if pd.notna(row['dislikes']) else 0,
            int(row['rating']) if pd.notna(row['rating']) else None,
            int(row['asked_by_faang']) if pd.notna(row['asked_by_faang']) else 0,
            str(row['similar_questions'])
        ))
        
        if (index + 1) % 100 == 0:
            print(f"Imported {index + 1} rows...")
            
    except Exception as e:
        print(f"Error at row {index + 1}: {e}")
        print(f"Row data: {row.to_dict()}")
        break

conn.commit()
cursor.close()
conn.close()
print("Import completed!")