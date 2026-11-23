"""Regras de negócio: progresso do estudante, conquistas e estatísticas da turma."""

import math
from collections import Counter, defaultdict
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone

from .grading import KIND_DESCRIPTION, KIND_LABEL
from .models import Attempt, Challenge, Exercise, ExerciseSession, Profile

User = get_user_model()
TONES = ["mint", "lavender", "yellow", "pink"]
MINUTES_PER_CHALLENGE = 3
KIND_ORDER = [Challenge.ASSOCIATION, Challenge.COVERAGE, Challenge.MISSING]


def top_kind(counter):
    """Tipo de desafio com mais erros (empates seguem a ordem dos desafios)."""
    return max(KIND_ORDER, key=lambda k: (counter.get(k, 0), -KIND_ORDER.index(k)))


# ------------------------------------------------------------ estudante

def published_exercises():
    return list(Exercise.objects.filter(status=Exercise.PUBLISHED).prefetch_related("challenges"))


def solved_orders(student, exercise):
    return set(
        Attempt.objects.filter(student=student, exercise=exercise, correct=True).values_list("order", flat=True)
    )


def is_completed(student, exercise):
    return ExerciseSession.objects.filter(student=student, exercise=exercise, completed_at__isnull=False).exists()


def missions_for(student):
    """Lista de missões publicadas com status calculado (sequencial)."""
    exercises = published_exercises()
    sessions = {s.exercise_id: s for s in ExerciseSession.objects.filter(student=student)}
    attempted = set(Attempt.objects.filter(student=student).values_list("exercise_id", flat=True))
    result, previous_done = [], True
    for idx, ex in enumerate(exercises):
        session = sessions.get(ex.pk)
        done = bool(session and session.completed_at)
        if done:
            status = "Concluída"
        elif not previous_done:
            status = "Bloqueada"
        elif session or ex.pk in attempted:
            status = "Em andamento"
        else:
            status = "Disponível"
        total = len(ex.challenges.all())
        result.append(
            {
                "id": ex.pk,
                "number": ex.mission_order,
                "title": ex.title,
                "subtitle": ex.subtitle or ex.description,
                "description": ex.description,
                "level": ex.level,
                "status": status,
                "xp": ex.xp,
                "tone": TONES[idx % len(TONES)],
                "challenges": total,
                "minutes": max(1, total) * MINUTES_PER_CHALLENGE,
            }
        )
        previous_done = previous_done and done
    return result


def streak_days(student):
    days = {
        timezone.localtime(dt).date()
        for dt in Attempt.objects.filter(student=student).values_list("created_at", flat=True)
    }
    if not days:
        return 0
    today = timezone.localdate()
    cursor = today if today in days else today - timedelta(days=1)
    if cursor not in days:
        return 0
    count = 0
    while cursor in days:
        count += 1
        cursor -= timedelta(days=1)
    return count


def wrong_before_solve(student, exercise, order):
    """Nº de tentativas erradas antes do primeiro acerto (ou total, se nunca acertou)."""
    wrong = 0
    for att in Attempt.objects.filter(student=student, exercise=exercise, order=order):
        if att.correct:
            return wrong, True
        wrong += 1
    return wrong, False


ACHIEVEMENTS = [
    ("first_trace", "Primeiro Rastro", "Concluiu sua primeira missão.", "✓"),
    ("perfect_link", "Conexão Perfeita", "Relacionou todos os RF e CT sem erros.", "↔"),
    ("coverage_detective", "Detetive de Cobertura", "Encontrou uma lacuna de cobertura.", "★"),
    ("evidence_hunter", "Caçador de Evidências", "Encontrou o teste que faltava.", "⌕"),
    ("streak3", "Sequência de 3", "Estude por três dias seguidos.", "🔥"),
    ("master", "Mestre da Trilha", "Conclua todas as missões.", "♛"),
]


def achievements_for(student):
    attempts = list(Attempt.objects.filter(student=student))
    completed = ExerciseSession.objects.filter(student=student, completed_at__isnull=False).count()
    published = Exercise.objects.filter(status=Exercise.PUBLISHED).count()

    perfect = False
    for ex_id, order in {(a.exercise_id, a.order) for a in attempts if a.kind == Challenge.ASSOCIATION}:
        rows = [a for a in attempts if a.exercise_id == ex_id and a.order == order]
        if rows and rows[0].correct:
            perfect = True
    earned = {
        "first_trace": completed >= 1,
        "perfect_link": perfect,
        "coverage_detective": any(a.correct and a.kind == Challenge.COVERAGE for a in attempts),
        "evidence_hunter": any(a.correct and a.kind == Challenge.MISSING for a in attempts),
        "streak3": streak_days(student) >= 3,
        "master": published > 0 and completed >= published,
    }
    return [
        {"id": key, "title": title, "text": text, "icon": icon, "earned": earned[key]}
        for key, title, text, icon in ACHIEVEMENTS
    ]


def total_xp(student):
    return sum(ExerciseSession.objects.filter(student=student).values_list("xp_awarded", flat=True))


def student_home(student):
    missions = missions_for(student)
    done = sum(1 for m in missions if m["status"] == "Concluída")
    next_mission = next((m for m in missions if m["status"] in ("Em andamento", "Disponível")), None)
    ach = achievements_for(student)
    return {
        "missionsDone": done,
        "missionsTotal": len(missions),
        "xp": total_xp(student),
        "streak": streak_days(student),
        "achievements": sum(1 for a in ach if a["earned"]),
        "progress": round(100 * done / len(missions)) if missions else 0,
        "next": next_mission,
    }


def scored_attempts(student):
    """Tentativas que contam como avaliação: de cada desafio, todas até o primeiro acerto (inclusive).
    As feitas depois do acerto são revisão e não entram."""
    counted, solved = [], set()
    for att in Attempt.objects.filter(student=student):
        key = (att.exercise_id, att.order)
        if key in solved:
            continue
        counted.append(att)
        if att.correct:
            solved.add(key)
    return counted


def student_progress(student):
    base = student_home(student)
    attempts = scored_attempts(student)
    total, correct = len(attempts), sum(1 for a in attempts if a.correct)
    skills = []
    for kind in (Challenge.ASSOCIATION, Challenge.COVERAGE, Challenge.MISSING):
        k_total = sum(1 for a in attempts if a.kind == kind)
        k_ok = sum(1 for a in attempts if a.kind == kind and a.correct)
        skills.append(
            {
                "label": KIND_DESCRIPTION[kind],
                "value": round(100 * k_ok / k_total) if k_total else 0,
                "attempts": k_total,
            }
        )
    base.update(accuracy=round(100 * correct / total) if total else 0, attempts=total, skills=skills)
    return base


# ------------------------------------------------------------- professora

def challenge_scores(student, exercise):
    """Estatísticas do estudante em um exercício."""
    challenges = list(exercise.challenges.all())
    attempts = list(Attempt.objects.filter(student=student, exercise=exercise))
    by_order = defaultdict(list)
    for a in attempts:
        by_order[a.order].append(a)

    items, scores, first_try = [], [], 0
    for ch in challenges:
        rows = by_order.get(ch.order, [])
        wrong = 0
        solved = False
        for a in rows:
            if a.correct:
                solved = True
                break
            wrong += 1
        if solved:
            score = max(40, 100 - 25 * wrong)
            first_try += 1 if wrong == 0 else 0
        else:
            score = 0
        scores.append(score)
        items.append(
            {
                "order": ch.order,
                "kind": ch.kind,
                "label": KIND_DESCRIPTION[ch.kind],
                "attempted": bool(rows),
                "solved": solved,
                "wrongBefore": wrong,
                "attempts": len(rows),
                "score": score,
            }
        )
    session = ExerciseSession.objects.filter(student=student, exercise=exercise).first()
    minutes = None
    if attempts:
        start = session.started_at if session else attempts[0].created_at
        end = session.completed_at if session and session.completed_at else attempts[-1].created_at
        minutes = max(1, math.ceil((end - start).total_seconds() / 60))
    return {
        "exercise": exercise,
        "items": items,
        "score": round(sum(scores) / len(challenges)) if challenges else 0,
        "firstTry": first_try,
        "total": len(challenges),
        "minutes": minutes,
        "completed": bool(session and session.completed_at),
        "attempted": bool(attempts),
        "wrong": Counter(a.kind for a in scored_attempts(student) if a.exercise_id == exercise.pk and not a.correct),
    }


def student_rows(exercise=None):
    """Uma linha por estudante que já tentou algo (agregando os exercícios)."""
    exercises = [exercise] if exercise else published_exercises()
    students = User.objects.filter(profile__role=Profile.STUDENT).order_by("first_name", "username")
    rows = []
    for st in students:
        stats = [s for s in (challenge_scores(st, ex) for ex in exercises) if s["attempted"]]
        if not stats:
            continue
        wrong = Counter()
        for s in stats:
            wrong.update(s["wrong"])
        minutes = sum(s["minutes"] or 0 for s in stats)
        rows.append(
            {
                "id": st.pk,
                "name": st.get_full_name() or st.username,
                "score": round(sum(s["score"] for s in stats) / len(stats)),
                "correct": f"{sum(s['firstTry'] for s in stats)}/{sum(s['total'] for s in stats)}",
                "firstTry": sum(s["firstTry"] for s in stats),
                "total": sum(s["total"] for s in stats),
                "minutes": minutes,
                "difficulty": KIND_LABEL[top_kind(wrong)] if wrong else "Sem erros",
                "completed": sum(1 for s in stats if s["completed"]),
            }
        )
    return rows


def teacher_dashboard():
    exercises = published_exercises()
    students = User.objects.filter(profile__role=Profile.STUDENT)
    total_students = students.count()
    active = Attempt.objects.values("student").distinct().count()
    completed = ExerciseSession.objects.filter(completed_at__isnull=False, exercise__in=exercises).count()
    denom = total_students * len(exercises)
    rows = student_rows()
    wrong = Counter(Attempt.objects.filter(correct=False).values_list("kind", flat=True))
    total_wrong = sum(wrong.values())
    difficulties = [
        {
            "label": KIND_LABEL[kind],
            "value": round(100 * wrong.get(kind, 0) / total_wrong) if total_wrong else 0,
        }
        for kind in (Challenge.COVERAGE, Challenge.ASSOCIATION, Challenge.MISSING)
    ]
    recent = []
    for ex in exercises:
        responders = Attempt.objects.filter(exercise=ex).values("student").distinct().count()
        if not responders:
            continue
        stats = [challenge_scores(st, ex) for st in students]
        scored = [s["score"] for s in stats if s["attempted"]]
        last = Attempt.objects.filter(exercise=ex).order_by("-created_at").first().created_at
        recent.append(
            {
                "title": ex.title,
                "responses": responders,
                "average": round(sum(scored) / len(scored)) if scored else 0,
                "last": last,
            }
        )
    recent.sort(key=lambda r: r["last"], reverse=True)
    for r in recent:
        r["last"] = r["last"].isoformat()
    return {
        "activeStudents": active,
        "totalStudents": total_students,
        "completionRate": round(100 * completed / denom) if denom else 0,
        "average": round(sum(r["score"] for r in rows) / len(rows)) if rows else 0,
        "topDifficulty": KIND_LABEL[top_kind(wrong)] if wrong else "—",
        "difficulties": difficulties,
        "recent": recent[:5],
    }


REVIEW_TEXT = {
    Challenge.ASSOCIATION: (
        "Reforce associação entre requisitos e testes",
        "O estudante errou conexões RF ↔ CT. Vale retomar a leitura do resultado esperado de cada teste antes de associar.",
    ),
    Challenge.COVERAGE: (
        "Reforce cobertura parcial",
        "O estudante reconhece associações diretas, mas hesitou ao identificar quando um requisito possui testes e ainda assim permanece parcialmente coberto.",
    ),
    Challenge.MISSING: (
        "Reforce a busca por evidências que faltam",
        "O estudante teve dificuldade em apontar qual comportamento do requisito ainda não possui teste.",
    ),
}


def student_detail(student):
    exercises = published_exercises()
    stats = [s for s in (challenge_scores(student, ex) for ex in exercises) if s["attempted"]]
    wrong = Counter()
    for s in stats:
        wrong.update(s["wrong"])
    scored = scored_attempts(student)
    total_attempts = len(scored)
    correct_attempts = sum(1 for a in scored if a.correct)
    if wrong:
        title, text = REVIEW_TEXT[top_kind(wrong)]
        tags = [KIND_LABEL[k] for k in sorted(wrong, key=lambda k: (-wrong[k], KIND_ORDER.index(k)))]
    else:
        title, text, tags = "Sem dificuldades registradas", "Nenhum erro registrado até o momento.", []
    return {
        "id": student.pk,
        "name": student.get_full_name() or student.username,
        "score": round(sum(s["score"] for s in stats) / len(stats)) if stats else 0,
        "accuracy": round(100 * correct_attempts / total_attempts) if total_attempts else 0,
        "firstTry": sum(s["firstTry"] for s in stats),
        "total": sum(s["total"] for s in stats),
        "minutes": sum(s["minutes"] or 0 for s in stats),
        "exercises": [
            {
                "id": s["exercise"].pk,
                "title": s["exercise"].title,
                "completed": s["completed"],
                "score": s["score"],
                "challenges": s["items"],
            }
            for s in stats
        ],
        "review": {"title": title, "text": text, "tags": tags},
    }


def student_answers(student):
    rows = Attempt.objects.filter(student=student).select_related("exercise")
    return [
        {
            "id": a.pk,
            "exercise": a.exercise.title,
            "order": a.order,
            "kind": KIND_DESCRIPTION[a.kind],
            "correct": a.correct,
            "summary": a.feedback.get("summary", ""),
            "createdAt": a.created_at.isoformat(),
        }
        for a in rows
    ]


def attempts_count_by_exercise():
    return dict(Attempt.objects.values_list("exercise_id").annotate(n=Count("id")))
