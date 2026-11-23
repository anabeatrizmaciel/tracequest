import csv

from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone

from . import services
from .auth import api, error, make_token, serialize_user, student_only, teacher_only
from .exercises import ValidationFailed, save_exercise, serialize_exercise
from .grading import AnswerError, challenge_payload, grade
from .models import Attempt, Exercise, ExerciseSession, Profile

User = get_user_model()


# ------------------------------------------------------------------ auth

@api(methods=("POST",))
def login(request):
    email = str(request.data.get("email", "")).strip().lower()
    password = str(request.data.get("password", ""))
    role = request.data.get("role")
    user = User.objects.filter(email__iexact=email).first() or User.objects.filter(username__iexact=email).first()
    user = authenticate(username=user.username, password=password) if user else None
    if user is None:
        return error("E-mail ou senha incorretos.", 401)
    profile = getattr(user, "profile", None)
    if profile is None:
        return error("Esta conta não possui perfil de acesso.", 403)
    if role and profile.role != role:
        who = "professora" if profile.role == Profile.TEACHER else "estudante"
        return error(f"Esta conta é de {who}. Use a área correspondente.", 403)
    return JsonResponse({"token": make_token(user), "user": serialize_user(user)})


@api(methods=("POST",))
def register(request):
    """Cadastro público apenas de estudantes."""
    d = request.data
    name = str(d.get("name", "")).strip()
    email = str(d.get("email", "")).strip().lower()
    password = str(d.get("password", ""))
    if len(name) < 2:
        return error("Informe seu nome.")
    if "@" not in email or "." not in email:
        return error("Informe um e-mail válido.")
    if len(password) < 6:
        return error("A senha precisa ter ao menos 6 caracteres.")
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        return error("Já existe uma conta com este e-mail.", 409)
    first, _, last = name.partition(" ")
    with transaction.atomic():
        user = User.objects.create_user(username=email, email=email, password=password, first_name=first, last_name=last)
        Profile.objects.create(user=user, role=Profile.STUDENT, subtitle="Pronta para investigar?")
    return JsonResponse({"token": make_token(user), "user": serialize_user(user)}, status=201)


@api(role=Profile.STUDENT)
def me_student(request):
    return JsonResponse({"user": serialize_user(request.user)})


@api(role=Profile.TEACHER)
def me_teacher(request):
    return JsonResponse({"user": serialize_user(request.user)})


# ------------------------------------------------------------- estudante

def _mission_or_error(request, exercise_id):
    missions = services.missions_for(request.user)
    mission = next((m for m in missions if m["id"] == exercise_id), None)
    if mission is None:
        return None, error("Missão não encontrada.", 404)
    if mission["status"] == "Bloqueada":
        return None, error("Conclua a missão anterior para desbloquear esta.", 403)
    return mission, None


def _next_open_order(student, exercise):
    solved = services.solved_orders(student, exercise)
    for ch in exercise.challenges.all():
        if ch.order not in solved:
            return ch.order
    return None


@student_only()
def student_home(request):
    return JsonResponse(services.student_home(request.user))


@student_only()
def student_missions(request):
    return JsonResponse({"missions": services.missions_for(request.user)})


@student_only()
def student_mission(request, exercise_id):
    mission, err = _mission_or_error(request, exercise_id)
    if err:
        return err
    exercise = Exercise.objects.get(pk=exercise_id)
    next_order = _next_open_order(request.user, exercise)
    return JsonResponse({"mission": mission, "nextOrder": next_order})


@student_only(methods=("POST",))
def student_mission_start(request, exercise_id):
    mission, err = _mission_or_error(request, exercise_id)
    if err:
        return err
    exercise = Exercise.objects.get(pk=exercise_id)
    ExerciseSession.objects.get_or_create(student=request.user, exercise=exercise)
    return JsonResponse({"nextOrder": _next_open_order(request.user, exercise)})


def _challenge_or_error(request, exercise_id, order):
    mission, err = _mission_or_error(request, exercise_id)
    if err:
        return None, err
    exercise = Exercise.objects.get(pk=exercise_id)
    challenge = exercise.challenges.filter(order=order).first()
    if challenge is None:
        return None, error("Desafio não encontrado.", 404)
    solved = services.solved_orders(request.user, exercise)
    if any(c.order not in solved for c in exercise.challenges.filter(order__lt=order)):
        return None, error("Resolva o desafio anterior primeiro.", 403, nextOrder=_next_open_order(request.user, exercise))
    return challenge, None


@student_only()
def student_challenge(request, exercise_id, order):
    challenge, err = _challenge_or_error(request, exercise_id, order)
    if err:
        return err
    ExerciseSession.objects.get_or_create(student=request.user, exercise=challenge.exercise)
    payload = challenge_payload(challenge, request.user)
    payload["solved"] = order in services.solved_orders(request.user, challenge.exercise)
    return JsonResponse(payload)


@student_only(methods=("POST",))
def student_challenge_submit(request, exercise_id, order):
    challenge, err = _challenge_or_error(request, exercise_id, order)
    if err:
        return err
    exercise = challenge.exercise
    answer = request.data.get("answer")
    if not isinstance(answer, dict):
        return error("Resposta inválida.")
    try:
        result = grade(challenge, answer)
    except AnswerError as exc:
        return error(str(exc))

    before = {a["id"] for a in services.achievements_for(request.user) if a["earned"]}
    attempt = Attempt.objects.create(
        student=request.user,
        exercise=exercise,
        challenge=challenge,
        kind=challenge.kind,
        order=challenge.order,
        answer=answer,
        correct=result["correct"],
        feedback=result["feedback"],
    )
    session, _ = ExerciseSession.objects.get_or_create(student=request.user, exercise=exercise)
    completed_now = False
    if result["correct"] and session.completed_at is None and _next_open_order(request.user, exercise) is None:
        session.completed_at = timezone.now()
        session.xp_awarded = exercise.xp
        session.save()
        completed_now = True
    after = [a for a in services.achievements_for(request.user) if a["earned"] and a["id"] not in before]
    return JsonResponse(
        {
            "correct": result["correct"],
            "feedback": result["feedback"],
            "attemptId": attempt.pk,
            "completed": completed_now,
            "newAchievements": after,
        }
    )


@student_only()
def student_challenge_feedback(request, exercise_id, order):
    """Último feedback registrado (permite recarregar a página de feedback)."""
    challenge, err = _challenge_or_error(request, exercise_id, order)
    if err:
        return err
    attempt = Attempt.objects.filter(student=request.user, exercise=challenge.exercise, order=order).last()
    if attempt is None:
        return error("Ainda não há resposta para este desafio.", 404)
    exercise = challenge.exercise
    total = exercise.challenges.count()
    next_order = _next_open_order(request.user, exercise)
    return JsonResponse(
        {
            "correct": attempt.correct,
            "feedback": attempt.feedback,
            "order": order,
            "total": total,
            "exercise": {"id": exercise.pk, "title": exercise.title},
            "nextOrder": next_order,
            "isLast": attempt.correct and next_order is None,
        }
    )


@student_only()
def student_mission_result(request, exercise_id):
    mission, err = _mission_or_error(request, exercise_id)
    if err:
        return err
    exercise = Exercise.objects.get(pk=exercise_id)
    session = ExerciseSession.objects.filter(student=request.user, exercise=exercise).first()
    if not session or not session.completed_at:
        return error("A missão ainda não foi concluída.", 409, nextOrder=_next_open_order(request.user, exercise))
    stats = services.challenge_scores(request.user, exercise)
    ach = [a for a in services.achievements_for(request.user) if a["earned"]]
    return JsonResponse(
        {
            "title": exercise.title,
            "xp": session.xp_awarded,
            "challengesSolved": sum(1 for i in stats["items"] if i["solved"]),
            "challengesTotal": stats["total"],
            "score": stats["score"],
            "achievements": ach,
            "latestAchievement": ach[-1] if ach else None,
        }
    )


@student_only()
def student_progress(request):
    return JsonResponse(services.student_progress(request.user))


@student_only()
def student_achievements(request):
    items = services.achievements_for(request.user)
    return JsonResponse({"achievements": items, "earned": sum(1 for a in items if a["earned"])})


# ------------------------------------------------------------- professora

@teacher_only()
def teacher_dashboard(request):
    return JsonResponse(services.teacher_dashboard())


@teacher_only()
def teacher_exercises(request):
    return JsonResponse({"exercises": [serialize_exercise(e) for e in Exercise.objects.all()]})


@teacher_only(methods=("POST",))
def teacher_exercise_create(request):
    try:
        ex = save_exercise(request.data, request.user)
    except ValidationFailed as exc:
        return error(exc.problems[0], 400, details=exc.problems)
    return JsonResponse(serialize_exercise(ex, full=True), status=201)


@teacher_only(methods=("GET", "PUT"))
def teacher_exercise_detail(request, exercise_id):
    ex = Exercise.objects.filter(pk=exercise_id).first()
    if ex is None:
        return error("Exercício não encontrado.", 404)
    if request.method == "PUT":
        try:
            ex = save_exercise(request.data, request.user, instance=ex)
        except ValidationFailed as exc:
            return error(exc.problems[0], 400, details=exc.problems)
    return JsonResponse(serialize_exercise(ex, full=True))


@teacher_only(methods=("POST",))
def teacher_exercise_status(request, exercise_id):
    ex = Exercise.objects.filter(pk=exercise_id).first()
    if ex is None:
        return error("Exercício não encontrado.", 404)
    publish = bool(request.data.get("publish"))
    if publish:
        full = serialize_exercise(ex, full=True)
        full["publish"] = True
        try:
            ex = save_exercise(full, request.user, instance=ex)
        except ValidationFailed as exc:
            return error(exc.problems[0], 400, details=exc.problems)
    else:
        ex.status = Exercise.DRAFT
        ex.save(update_fields=["status"])
    return JsonResponse(serialize_exercise(ex))


@teacher_only()
def teacher_results(request):
    exercise = None
    raw = request.GET.get("exercise")
    if raw:
        exercise = Exercise.objects.filter(pk=raw).first()
        if exercise is None:
            return error("Exercício não encontrado.", 404)
    rows = services.student_rows(exercise)
    count = len(rows)
    total_questions = sum(r["total"] for r in rows)
    return JsonResponse(
        {
            "exercises": [{"id": e.pk, "title": e.title} for e in Exercise.objects.filter(status=Exercise.PUBLISHED)],
            "selected": exercise.pk if exercise else None,
            "summary": {
                "participants": count,
                "average": round(sum(r["score"] for r in rows) / count) if count else 0,
                "firstTry": round(sum(r["firstTry"] for r in rows) / count, 1) if count else 0,
                "questions": round(total_questions / count, 1) if count else 0,
                "minutes": round(sum(r["minutes"] for r in rows) / count) if count else 0,
            },
            "students": rows,
        }
    )


@teacher_only()
def teacher_results_csv(request):
    exercise = Exercise.objects.filter(pk=request.GET.get("exercise")).first() if request.GET.get("exercise") else None
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="resultados-tracequest.csv"'
    response.write("\ufeff")
    writer = csv.writer(response, delimiter=";")
    writer.writerow(["Estudante", "Nota", "Acertos de primeira", "Total de desafios", "Tempo (min)", "Maior dificuldade"])
    for r in services.student_rows(exercise):
        writer.writerow([r["name"], r["score"], r["firstTry"], r["total"], r["minutes"], r["difficulty"]])
    return response


@teacher_only()
def teacher_student(request, student_id):
    student = User.objects.filter(pk=student_id, profile__role=Profile.STUDENT).first()
    if student is None:
        return error("Estudante não encontrado.", 404)
    data = services.student_detail(student)
    data["answers"] = services.student_answers(student)
    return JsonResponse(data)
