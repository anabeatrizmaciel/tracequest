"""Cadastro de exercícios pela professora: validação, gravação e serialização."""

from django.db import transaction

from .grading import COVERAGE_LABEL
from .models import Challenge, Exercise, ExpectedRelation, Requirement, TestCase


class ValidationFailed(Exception):
    def __init__(self, problems):
        super().__init__("; ".join(problems))
        self.problems = problems


def _s(value):
    return str(value or "").strip()


def serialize_exercise(ex, full=False):
    data = {
        "id": ex.pk,
        "code": ex.code,
        "title": ex.title,
        "mission": f"Missão {ex.mission_order}",
        "missionOrder": ex.mission_order,
        "level": ex.level,
        "status": "Publicado" if ex.status == Exercise.PUBLISHED else "Rascunho",
        "questions": ex.challenges.count(),
        "attempts": ex.attempts.count(),
    }
    if not full:
        return data
    cov = ex.challenges.filter(kind=Challenge.COVERAGE).first()
    mis = ex.challenges.filter(kind=Challenge.MISSING).first()
    data.update(
        description=ex.description,
        subtitle=ex.subtitle,
        xp=ex.xp,
        requirements=[{"code": r.code, "description": r.description} for r in ex.requirements.all()],
        tests=[{"code": t.code, "description": t.description, "expected": t.expected} for t in ex.test_cases.all()],
        relations=[
            {"rf": r.requirement.code, "ct": r.test_case.code, "explanation": r.explanation}
            for r in ex.relations.select_related("requirement", "test_case")
        ],
        coverage=None
        if not cov
        else {
            "requirement": cov.requirement.code,
            "evidence": [t.code for t in cov.evidence.all()],
            "correct": cov.correct_answer,
            "feedbackCorrect": cov.feedback_correct,
            "feedbackWrong": cov.feedback_wrong,
        },
        missing=None
        if not mis
        else {
            "requirement": mis.requirement.code,
            "evidence": [t.code for t in mis.evidence.all()],
            "candidates": [t.code for t in mis.candidates.all()],
            "correct": mis.correct_answer,
            "feedbackCorrect": mis.feedback_correct,
            "feedbackWrong": mis.feedback_wrong,
        },
    )
    return data


def _clean_list(items, label, fields, problems):
    cleaned, seen = [], set()
    for idx, item in enumerate(items or [], start=1):
        item = item if isinstance(item, dict) else {}
        code = _s(item.get("code")).upper()
        row = {"code": code, **{f: _s(item.get(f)) for f in fields}}
        if not code:
            problems.append(f"{label} {idx}: informe o código.")
            continue
        if code in seen:
            problems.append(f"{label}: o código {code} está repetido.")
            continue
        seen.add(code)
        if not row["description"]:
            problems.append(f"{code}: informe a descrição.")
        cleaned.append(row)
    return cleaned


def validate(data, publish):
    problems = []
    title = _s(data.get("title"))
    if not title:
        problems.append("Informe o título do exercício.")
    reqs = _clean_list(data.get("requirements"), "Requisito", ["description"], problems)
    tests = _clean_list(data.get("tests"), "Caso de teste", ["description", "expected"], problems)
    rf_codes, ct_codes = {r["code"] for r in reqs}, {t["code"] for t in tests}

    relations, used_rf, used_ct = [], set(), set()
    for rel in data.get("relations") or []:
        rf, ct = _s(rel.get("rf")).upper(), _s(rel.get("ct")).upper()
        if rf not in rf_codes or ct not in ct_codes:
            problems.append(f"Relação {rf or '?'} ↔ {ct or '?'} referencia um item que não existe.")
            continue
        if rf in used_rf:
            problems.append(f"{rf} aparece em mais de uma relação.")
            continue
        if ct in used_ct:
            problems.append(f"{ct} aparece em mais de uma relação.")
            continue
        used_rf.add(rf)
        used_ct.add(ct)
        explanation = _s(rel.get("explanation"))
        if publish and not explanation:
            problems.append(f"Relação {rf} ↔ {ct}: informe a justificativa para publicar.")
        relations.append({"rf": rf, "ct": ct, "explanation": explanation})

    def sub(key, with_candidates):
        raw = data.get(key)
        if not raw:
            return None
        rf = _s(raw.get("requirement")).upper()
        evidence = [_s(c).upper() for c in raw.get("evidence") or []]
        out = {
            "requirement": rf,
            "evidence": evidence,
            "correct": _s(raw.get("correct")).upper() if with_candidates else _s(raw.get("correct")),
            "feedbackCorrect": _s(raw.get("feedbackCorrect")),
            "feedbackWrong": _s(raw.get("feedbackWrong")),
        }
        name = "Desafio de cobertura" if key == "coverage" else "Desafio da evidência que falta"
        if rf not in rf_codes:
            problems.append(f"{name}: escolha um requisito válido.")
        if any(c not in ct_codes for c in evidence):
            problems.append(f"{name}: a evidência referencia um teste que não existe.")
        if not with_candidates:
            if out["correct"] not in COVERAGE_LABEL:
                problems.append(f"{name}: escolha a classificação correta.")
        else:
            cands = list(dict.fromkeys(_s(c).upper() for c in raw.get("candidates") or []))
            out["candidates"] = cands
            if any(c not in ct_codes for c in cands):
                problems.append(f"{name}: uma alternativa referencia um teste que não existe.")
            if out["correct"] not in cands:
                problems.append(f"{name}: a alternativa correta precisa estar entre as opções.")
            elif len(cands) < 2:
                problems.append(f"{name}: informe ao menos duas alternativas.")
            if out["correct"] in evidence:
                problems.append(f"{name}: a alternativa correta não pode ser uma evidência que já existe.")
        if publish:
            if not out["feedbackCorrect"]:
                problems.append(f"{name}: preencha “Explicação quando acertar” para publicar.")
            if not out["feedbackWrong"]:
                problems.append(f"{name}: preencha “Orientação quando errar” para publicar.")
        return out

    coverage, missing = sub("coverage", False), sub("missing", True)

    if publish and len(relations) < 2:
        problems.append("Para publicar, cadastre ao menos 2 relações no gabarito (a primeira vira o exemplo).")

    try:
        order = max(1, int(data.get("missionOrder") or 1))
        xp = max(0, int(data.get("xp") or 100))
    except (TypeError, ValueError):
        order, xp = 1, 100
        problems.append("Ordem da missão e XP devem ser números.")

    if problems:
        raise ValidationFailed(problems)
    return {
        "title": title,
        "level": data.get("level") if data.get("level") in Exercise.LEVELS else "Iniciante",
        "description": _s(data.get("description")),
        "subtitle": _s(data.get("subtitle")),
        "order": order,
        "xp": xp,
        "reqs": reqs,
        "tests": tests,
        "relations": relations,
        "coverage": coverage,
        "missing": missing,
    }


@transaction.atomic
def save_exercise(data, user, instance=None):
    publish = bool(data.get("publish"))
    clean = validate(data, publish)
    ex = instance or Exercise(created_by=user)
    ex.title = clean["title"]
    ex.level = clean["level"]
    ex.description = clean["description"]
    ex.subtitle = clean["subtitle"]
    ex.mission_order = clean["order"]
    ex.xp = clean["xp"]
    ex.status = Exercise.PUBLISHED if publish else Exercise.DRAFT
    ex.save()

    ex.challenges.all().delete()
    ex.relations.all().delete()
    ex.requirements.all().delete()
    ex.test_cases.all().delete()

    reqs = {
        r["code"]: Requirement.objects.create(exercise=ex, code=r["code"], description=r["description"], position=i)
        for i, r in enumerate(clean["reqs"])
    }
    tests = {
        t["code"]: TestCase.objects.create(
            exercise=ex, code=t["code"], description=t["description"], expected=t["expected"], position=i
        )
        for i, t in enumerate(clean["tests"])
    }
    for i, rel in enumerate(clean["relations"]):
        ExpectedRelation.objects.create(
            exercise=ex,
            requirement=reqs[rel["rf"]],
            test_case=tests[rel["ct"]],
            explanation=rel["explanation"],
            position=i,
        )

    order = 0
    if clean["relations"]:
        order += 1
        Challenge.objects.create(exercise=ex, order=order, kind=Challenge.ASSOCIATION)
    if clean["coverage"]:
        c = clean["coverage"]
        order += 1
        ch = Challenge.objects.create(
            exercise=ex,
            order=order,
            kind=Challenge.COVERAGE,
            requirement=reqs[c["requirement"]],
            correct_answer=c["correct"],
            feedback_correct=c["feedbackCorrect"],
            feedback_wrong=c["feedbackWrong"],
        )
        ch.evidence.set([tests[code] for code in c["evidence"]])
    if clean["missing"]:
        m = clean["missing"]
        order += 1
        ch = Challenge.objects.create(
            exercise=ex,
            order=order,
            kind=Challenge.MISSING,
            requirement=reqs[m["requirement"]],
            correct_answer=m["correct"],
            feedback_correct=m["feedbackCorrect"],
            feedback_wrong=m["feedbackWrong"],
        )
        ch.evidence.set([tests[code] for code in m["evidence"]])
        ch.candidates.set([tests[code] for code in m["candidates"]])
    return ex
