from rest_framework.decorators import api_view
from rest_framework.response import Response
from users.auth_utils import get_user_from_request
from .models import ChatSession, Message
from datetime import datetime
from bson import ObjectId
from chat.gemini_service import generate_ai_response
import requests
from django.conf import settings
import math

@api_view(["POST"])
def send_message(request):
    user = get_user_from_request(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    message_text = request.data.get("message")
    chat_id = request.data.get("chat_id")

    if not message_text:
        return Response({"error": "Message is required"}, status=400)

    # 🔹 Get or create chat
    if chat_id:
        chat = ChatSession.objects(id=chat_id, user=user).first()
        if not chat:
            return Response({"error": "Chat not found"}, status=404)
    else:
        chat = ChatSession(
            user=user,
            title=message_text[:30]
        )
        chat.save()

    # 🔹 Save user message
    user_msg = Message(
        chat=chat,
        role="user",
        content=message_text
    )
    user_msg.save()

    # 🔥 Fetch full conversation (INCLUDING current message)
    previous_messages = Message.objects(chat=chat).order_by("created_at")

    conversation_history = []

    for msg in previous_messages:
        conversation_history.append({
            "role": msg.role,      # must be "user" or "assistant"
            "content": msg.content # must be "content", not "parts"
        })

    print("====== FULL MESSAGE PAYLOAD ======")
    for m in conversation_history:
        print(m["role"], ":", m["content"][:80])
    print("===================================")

    # 🔥 Call HuggingFace with FULL history
    try:
        ai_response = generate_ai_response(conversation_history)

        if isinstance(ai_response, dict) and "error" in ai_response:
            return Response(ai_response, status=500)

        ai_response_text = ai_response

    except Exception as e:
        return Response({"error": str(e)}, status=500)

    # 🔹 Save assistant reply
    ai_msg = Message(
        chat=chat,
        role="assistant",
        content=ai_response_text
    )
    ai_msg.save()

    return Response({
        "chat_id": str(chat.id),
        "reply": ai_response_text
    })

@api_view(["GET"])
def get_chat_history(request, chat_id):
    user = get_user_from_request(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    chat = ChatSession.objects(id=ObjectId(chat_id), user=user).first()

    if not chat:
        return Response({"error": "Chat not found"}, status=404)

    messages = Message.objects(chat=chat).order_by("created_at")

    data = [
        {
            "role": msg.role,
            "content": msg.content
        }
        for msg in messages
    ]

    return Response({
        "chat_id": str(chat.id),
        "messages": data
    })

@api_view(["GET"])
def list_user_chats(request):
    user = get_user_from_request(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    chats = ChatSession.objects(user=user).order_by("-created_at")

    data = [
        {
            "chat_id": str(chat.id),
            "title": chat.title,
            "created_at": chat.created_at
        }
        for chat in chats
    ]

    return Response(data)

@api_view(["DELETE"])
def delete_chat(request, chat_id):
    user = get_user_from_request(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    chat = ChatSession.objects(id=chat_id, user=user).first()

    if not chat:
        return Response({"error": "Chat not found"}, status=404)

    # Delete related messages first
    Message.objects(chat=chat).delete()

    # Delete chat session
    chat.delete()

    return Response({"message": "Chat deleted successfully"})

def get_wikipedia_image(name):
    try:
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{name}"
        res = requests.get(url)
        data = res.json()
        return data.get("thumbnail", {}).get("source")
    except:
        return None
    
def get_unsplash_image(query):
    try:
        url = "https://api.unsplash.com/photos/random"
        headers = {
            "Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"
        }
        params = {"query": query}
        res = requests.get(url, headers=headers, params=params)
        data = res.json()
        return data.get("urls", {}).get("regular")
    except:
        return None

def get_place_image(name, category):
    wiki = get_wikipedia_image(name)
    if wiki:
        return wiki
    return get_unsplash_image(category)

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km

    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))

    a = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * \
        math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return round(R * c, 2)

@api_view(["POST"])
def nearby_places(request):
    lat = request.data.get("latitude")
    lon = request.data.get("longitude")

    if lat is None or lon is None:
        return Response({"error": "Location required"}, status=400)

    url = "https://api.tomtom.com/search/2/nearbySearch/.json"

    params = {
        "lat": lat,
        "lon": lon,
        "radius": 2000,
        "categorySet": "7315,7376,7372,9362",
        "key": settings.TOMTOM_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    results = []

    for place in data.get("results", [])[:8]:
        name = place.get("poi", {}).get("name")
        categories = place.get("poi", {}).get("categories", [])
        category = categories[0] if categories else "place"

        # Normalize category for better frontend control
        if "restaurant" in category.lower() or "indian" in category.lower():
            category = "restaurant"
        elif "park" in category.lower():
            category = "park"
        elif "attraction" in category.lower():
            category = "tourist attraction"
        elif "amusement" in category.lower():
            category = "amusement park"
        latitude = place.get("position", {}).get("lat")
        longitude = place.get("position", {}).get("lon")
        distance = calculate_distance(lat, lon, latitude, longitude)

        image = get_place_image(name, category)

        results.append({
            "name": name,
            "category": category,
            "latitude": latitude,
            "longitude": longitude,
            "distance_km": distance,
            "image": image
        })

    return Response(results)

@api_view(["POST"])
def geocode_location(request):
    query = request.data.get("query")

    if not query:
        return Response({"error": "Location query required"}, status=400)

    url = "https://api.tomtom.com/search/2/geocode/.json"

    params = {
        "key": settings.TOMTOM_API_KEY,
        "query": query,
        "limit": 1
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()
    except Exception as e:
        return Response({"error": str(e)}, status=500)

    results = data.get("results", [])

    if not results:
        return Response({"error": "Location not found"}, status=404)

    position = results[0]["position"]

    return Response({
        "latitude": position["lat"],
        "longitude": position["lon"]
    })