from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load words data
with open(ROOT_DIR / 'words_data.json', 'r', encoding='utf-8') as f:
    WORDS_DATA = json.load(f)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class GuessRequest(BaseModel):
    word: str
    target_word: str

class GuessResponse(BaseModel):
    result: List[str]  # ['correct', 'present', 'absent']
    is_valid: bool
    is_correct: bool

class GameStart(BaseModel):
    round: int  # 1 or 2

class GameStartResponse(BaseModel):
    words: List[dict]  # [{"length": 4, "first_letter": "K"}, ...]

@api_router.get("/")
async def root():
    return {"message": "Lingo Türkiye API"}

@api_router.post("/game/start", response_model=GameStartResponse)
async def start_game(game_start: GameStart):
    """Start a new game round and return the word list"""
    if game_start.round == 1:
        # Round 1: 3x 4-letter + 3x 5-letter
        words_4 = random.sample(WORDS_DATA["4"], 3)
        words_5 = random.sample(WORDS_DATA["5"], 3)
        words = [{"length": 4, "word": w, "first_letter": w[0]} for w in words_4] + \
                [{"length": 5, "word": w, "first_letter": w[0]} for w in words_5]
    elif game_start.round == 2:
        # Round 2: 3x 5-letter + 3x 6-letter
        words_5 = random.sample(WORDS_DATA["5"], 3)
        words_6 = random.sample(WORDS_DATA["6"], 3)
        words = [{"length": 5, "word": w, "first_letter": w[0]} for w in words_5] + \
                [{"length": 6, "word": w, "first_letter": w[0]} for w in words_6]
    else:
        raise HTTPException(status_code=400, detail="Invalid round number")
    
    return GameStartResponse(words=words)

@api_router.post("/game/check", response_model=GuessResponse)
async def check_guess(guess_request: GuessRequest):
    """Check if a guessed word is valid and return feedback"""
    guess = guess_request.word.upper()
    target = guess_request.target_word.upper()
    
    # Check if word length matches
    if len(guess) != len(target):
        return GuessResponse(result=[], is_valid=False, is_correct=False)
    
    # Simple validation: check if word exists in our database
    word_length = str(len(guess))
    is_valid = guess in WORDS_DATA.get(word_length, [])
    
    # Calculate feedback
    result = []
    target_chars = list(target)
    guess_chars = list(guess)
    
    # First pass: mark correct positions
    for i in range(len(guess)):
        if guess_chars[i] == target_chars[i]:
            result.append('correct')
            target_chars[i] = None
            guess_chars[i] = None
        else:
            result.append('')
    
    # Second pass: mark present but wrong position
    for i in range(len(guess)):
        if result[i] == '':
            if guess_chars[i] in target_chars:
                result[i] = 'present'
                target_chars[target_chars.index(guess_chars[i])] = None
            else:
                result[i] = 'absent'
    
    is_correct = guess == target
    
    return GuessResponse(result=result, is_valid=is_valid, is_correct=is_correct)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()