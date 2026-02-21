import requests
from django.conf import settings

HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

def generate_ai_response(prompt_text):

    url = "https://router.huggingface.co/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {settings.HF_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = """
You are a professional travel planner.

Respond ONLY in this exact format if days and budget are provided or else based on the question say accordingly in concise sentences. Do not include any additional information or explanations.:

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
Do not use bold.
If any other question is asked, which you think is not related to travel type things, respond with "I can only help with travel planning." and do not provide any additional information. And if related to travel then reply accordingly in concise sentences.
"""

    payload = {
        "model": HF_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_text}
        ],
        "max_tokens": 600,
        "temperature": 0.6
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        return {"error": response.text}

    data = response.json()

    return data["choices"][0]["message"]["content"]