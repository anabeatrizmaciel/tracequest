"""Autenticação por token assinado (sem dependências externas)."""

import json
from functools import wraps

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Profile

User = get_user_model()
SALT = "tracequest.api.token"


def make_token(user):
    return signing.dumps({"uid": user.pk}, salt=SALT)


def user_from_token(token):
    try:
        data = signing.loads(token, salt=SALT, max_age=settings.API_TOKEN_MAX_AGE)
        return User.objects.select_related("profile").get(pk=data["uid"], is_active=True)
    except (signing.BadSignature, User.DoesNotExist, KeyError):
        return None


def serialize_user(user):
    profile = getattr(user, "profile", None)
    name = user.get_full_name() or user.username
    return {
        "id": user.pk,
        "name": name,
        "firstName": user.first_name or name.split(" ")[0],
        "email": user.email,
        "role": profile.role if profile else None,
        "subtitle": profile.subtitle if profile else "",
    }


def error(message, status=400, **extra):
    return JsonResponse({"error": message, **extra}, status=status)


def body(request):
    if not request.body:
        return {}
    try:
        data = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


def api(role=None, methods=("GET",)):
    """Decorador: exige método, token válido e (opcionalmente) o perfil."""

    def decorator(view):
        @csrf_exempt
        @wraps(view)
        def wrapper(request, *args, **kwargs):
            if request.method not in methods:
                return error("Método não permitido.", 405)
            if role is not None:
                header = request.headers.get("Authorization", "")
                token = header[7:] if header.startswith("Bearer ") else ""
                user = user_from_token(token) if token else None
                if user is None:
                    return error("Sessão expirada. Entre novamente.", 401)
                profile = getattr(user, "profile", None)
                if profile is None or profile.role != role:
                    return error("Você não tem acesso a esta área.", 403)
                request.user = user
            if request.method in ("POST", "PUT", "PATCH"):
                data = body(request)
                if data is None:
                    return error("Corpo da requisição inválido.", 400)
                request.data = data
            return view(request, *args, **kwargs)

        return wrapper

    return decorator


def student_only(methods=("GET",)):
    return api(Profile.STUDENT, methods)


def teacher_only(methods=("GET",)):
    return api(Profile.TEACHER, methods)
