import anthropic
import os
import json
import re

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_flashcards(chapter_text: str, num_cards: int = 10) -> list:
    prompt = f"""You are an expert educator. Given the following textbook chapter text, generate exactly {num_cards} flashcards.

Each flashcard should cover a key concept, term, or idea from the text.

Return ONLY a JSON array with this exact format, no other text, no markdown, no backticks:
[
  {{"question": "What is...", "answer": "..."}},
  {{"question": "Define...", "answer": "..."}}
]

Chapter text:
{chapter_text[:8000]}"""

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    response_text = message.content[0].text.strip()
    
    # Strip markdown code blocks if present
    response_text = re.sub(r'^```json\s*', '', response_text)
    response_text = re.sub(r'^```\s*', '', response_text)
    response_text = re.sub(r'\s*```$', '', response_text)
    response_text = response_text.strip()
    
    flashcards = json.loads(response_text)
    return flashcards