# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware

app = FastAPI()

# --- CORS Configuration ---
# Define allowed origins. For local development, you'll allow your React app's URL.
# In production, you'd replace '*' with your actual frontend domain(s).
origins = [
    "http://localhost:5173", # Vite default URL (or 3000 if using Create React App)
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # List of origins that can access the API
    allow_credentials=True,         # Allow cookies to be sent with requests
    allow_methods=["*"],            # Allow all standard HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allow all headers
)
# --- End CORS Configuration ---


@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/greeting")
async def get_greeting():
    return {"message": "Greetings from the API endpoint!"}