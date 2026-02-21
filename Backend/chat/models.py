from mongoengine import Document, StringField, DateTimeField, ReferenceField
from datetime import datetime
from users.models import User


class ChatSession(Document):
    user = ReferenceField(User, required=True)
    title = StringField()
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "chat_sessions"
    }


class Message(Document):
    chat = ReferenceField(ChatSession, required=True)
    role = StringField(required=True, choices=["user", "assistant"])
    content = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "messages"
    }
