from rest_framework.decorators import api_view
from rest_framework.response import Response
from users.auth_utils import get_user_from_request
from .models import ChatSession, Message
from datetime import datetime
from bson import ObjectId
from chat.gemini_service import generate_ai_response


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