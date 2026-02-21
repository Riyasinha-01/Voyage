from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests
from .models import User
from datetime import datetime, timedelta
from django.conf import settings
import jwt
from datetime import datetime, timedelta, timezone
import time
from bson import ObjectId
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


@api_view(["POST"])
def google_login(request):
    token = request.data.get("id_token")

    if not token:
        return Response({"error": "No token provided"}, status=400)

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = idinfo["email"]
        name = idinfo.get("name")
        picture = idinfo.get("picture")

        user = User.objects(email=email).first()

        if not user:
            user = User(
                email=email,
                name=name,
                image=picture,
                created_at=datetime.utcnow()
            )
            user.save()

        # ✅ JWT payload
        payload = {
            "user_id": str(user.id),
            "email": user.email,
            "exp": int(time.time()) + (7 * 24 * 60 * 60)  # 7 days in seconds
        }

        access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

        return Response({
            "access": access_token
        })

    except Exception as e:
        print("Login Error:", e)
        return Response({"error": str(e)}, status=500)


from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import User
import jwt


@api_view(["GET"])
def profile(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return Response({"error": "Authorization header missing"}, status=401)

    try:
        token = auth_header.split()[1]
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

        user = User.objects(id=decoded["user_id"]).first()

        if not user:
            return Response({"error": "User not found"}, status=404)

        return Response({
            "email": user.email,
            "name": user.name,
            "image": user.image,
        })

    except jwt.ExpiredSignatureError:
        return Response({"error": "Token expired"}, status=401)
    except jwt.InvalidTokenError:
        return Response({"error": "Invalid token"}, status=401)
