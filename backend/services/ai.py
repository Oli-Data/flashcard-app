import anthropic
import os
import json
import re

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_flashcards(chapter_text: str, num_cards: int = 10) -> list:
    prompt = f"""You are an expert educator. Given the following textbook chapter text, generate exactly {num_cards} flashcards.

Each flashcard should cover a key concept, term, or idea from the text.

For each flashcard, also include the exact sentence or phrase from the text that supports the answer. This source quote must be copied verbatim from the text below.

Return ONLY a JSON array with this exact format, no other text, no markdown, no backticks:
[
  {{
    "question": "What is...",
    "answer": "...",
    "source_quote": "exact sentence from the text that supports this answer"
  }}
]

Chapter text:
{chapter_text[:8000]}"""

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response_text = message.content[0].text.strip()
    response_text = re.sub(r'^```json\s*', '', response_text)
    response_text = re.sub(r'^```\s*', '', response_text)
    response_text = re.sub(r'\s*```$', '', response_text)
    response_text = response_text.strip()
    
    flashcards = json.loads(response_text)
    return flashcards


def generate_exam(chapter_text: str, num_questions: int = 10) -> list:
    prompt = f"""You are an expert educator. Given the following textbook chapter text, generate exactly {num_questions} multiple choice questions.

For each question, provide:
- A clear question
- The correct answer
- 3 plausible but incorrect answers that someone who didn't study might confuse with the correct answer
- The index of the correct answer (0-3) after shuffling all 4 options

Return ONLY a JSON array with this exact format, no other text, no markdown, no backticks:
[
  {{
    "question": "What is...",
    "options": ["correct answer", "wrong answer 1", "wrong answer 2", "wrong answer 3"],
    "correct_index": 0
  }}
]

Important: shuffle the position of the correct answer randomly across questions. Don't always put it first.

Chapter text:
{chapter_text[:8000]}"""

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response_text = message.content[0].text.strip()
    response_text = re.sub(r'^```json\s*', '', response_text)
    response_text = re.sub(r'^```\s*', '', response_text)
    response_text = re.sub(r'\s*```$', '', response_text)
    response_text = response_text.strip()
    
    questions = json.loads(response_text)
    return questions