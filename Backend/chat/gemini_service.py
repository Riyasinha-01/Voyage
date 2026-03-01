import requests
from django.conf import settings

HF_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"

def generate_ai_response(conversation_messages):

    url = "https://router.huggingface.co/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {settings.HF_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = """
You are a professional AI travel planner.

Always use previous conversation context to understand the destination.
If the user refers to "there", "that place", or similar words,
assume it refers to the most recently discussed travel destination.

RULES:

1. If the user clearly asks for a trip plan and provides duration or budget,
   respond in the following structured itinerary format:

Destination:
Duration:
Estimated Budget:

Day 1:
- Activity 1
- Activity 2

Day 2:
- Activity 1
- Activity 2

Budget Breakdown:
Stay:
Food:
Transport:
Activities:

Do not use JSON.
Do not use markdown.
Do not use bold formatting.

2. If the user asks a travel-related follow-up question
   (such as transport, weather, food, safety, best time, costs, routes, etc.),
   respond naturally in concise helpful sentences.
   Do NOT use itinerary format unless explicitly requested.

3. If the question is completely unrelated to travel,
   respond with:
   "I can only help with travel planning."

Do not ask for duration or budget again if already provided earlier in the conversation.
Use conversation memory intelligently.
"""
    # Add system message at top
    messages = [{"role": "system", "content": system_prompt}] + conversation_messages

    # ✅ ADD DEBUG HERE
    print("====== FULL MESSAGE PAYLOAD ======")
    for m in messages:
        print(m["role"], ":", m["content"][:80])
    print("===================================")


    payload = {
        "model": HF_MODEL,
        "messages": messages,
        "max_tokens": 1500,
        "temperature": 0.6
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
    

    data = response.json()
    return data["choices"][0]["message"]["content"]
