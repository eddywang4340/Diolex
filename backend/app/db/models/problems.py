# app/db/models/problems.py
from sqlalchemy import Column, Integer, String, Text, Numeric, ARRAY
from sqlalchemy.orm import declarative_base
from app.db.database import Base

class Problem(Base):
    __tablename__ = "problems"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic problem information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_premium = Column(Integer, default=0)  # 0 for false, 1 for true
    difficulty = Column(String(10), nullable=False)
    solution_link = Column(String(255), nullable=True)
    

    # URLs and discussion
    url = Column(String(255), nullable=True)

    
    # Arrays for companies and related topics (PostgreSQL specific)
    companies = Column(ARRAY(Text), nullable=True)
    related_topics = Column(ARRAY(Text), nullable=True)
    
    
    # Similar questions
    similar_questions = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<Problem(id={self.id}, title='{self.title}', difficulty='{self.difficulty}')>"
    
