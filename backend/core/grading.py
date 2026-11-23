"""Correção das respostas: compara a resposta do estudante com o gabarito
cadastrado pela professora e monta um feedback explicativo."""

import random

from .models import Challenge

COVERAGE_OPTIONS = [
    {"id": "none", "title": "Sem cobertura", "text": "Nenhum comportamento do requisito foi verificado."},
    {"id": "partial", "title": "Cobertura parcial", "text": "Alguns comportamentos foram testados, mas ainda faltam evidências."},
    {"id": "full", "title": "Cobertura completa", "text": "Todos os comportamentos importantes foram verificados por testes."},
]
COVERAGE_LABEL = {o["id"]: o["title"] for o in COVERAGE_OPTIONS}

KIND_LABEL = {
    Challenge.ASSOCIATION: "Associação RF ↔ CT",
    Challenge.COVERAGE: "Cobertura parcial",
    Challenge.MISSING: "Requisito sem teste",
}
KIND_DESCRIPTION = {
    Challenge.ASSOCIATION: "Relações RF ↔ CT",
    Challenge.COVERAGE: "Cobertura de requisitos",
    Challenge.MISSING: "Evidência que falta",
}


class AnswerError(Exception):
    """Resposta incompleta ou malformada (não conta como tentativa)."""


def _q(text):
    """Citação sem ponto final, para não duplicar a pontuação da frase."""
    return "“" + str(text).strip().rstrip(".") + "”"


def _section(title, text):
    return {"title": title, "text": text}


def shuffled(items, seed):
    items = list(items)
    random.Random(seed).shuffle(items)
    return items


def example_relation(exercise):
    return exercise.relations.select_related("requirement", "test_case").first()


# ---------------------------------------------------------------- payloads

def challenge_payload(challenge, student):
    ex = challenge.exercise
    total = ex.challenges.count()
    base = {
        "exercise": {"id": ex.pk, "title": ex.title, "total": total},
        "order": challenge.order,
        "kind": challenge.kind,
    }
    if challenge.kind == Challenge.ASSOCIATION:
        example = example_relation(ex)
        relations = list(ex.relations.select_related("requirement", "test_case"))
        tests = [
            {"code": r.test_case.code, "text": r.test_case.description, "expected": r.test_case.expected}
            for r in relations
        ]
        # testes fora do gabarito entram como distratores, desde que não sejam conteúdo de outro desafio
        related = {r.test_case_id for r in relations}
        used = set()
        for other in ex.challenges.exclude(pk=challenge.pk):
            used.update(other.evidence.values_list("pk", flat=True))
            used.update(other.candidates.values_list("pk", flat=True))
            if other.kind == Challenge.MISSING:
                used.update(ex.test_cases.filter(code=other.correct_answer).values_list("pk", flat=True))
        tests += [
            {"code": t.code, "text": t.description, "expected": t.expected}
            for t in ex.test_cases.all()
            if t.pk not in related and t.pk not in used
        ]
        base.update(
            requirements=[{"code": r.requirement.code, "text": r.requirement.description} for r in relations],
            tests=shuffled(tests, student.pk * 1000 + challenge.pk),
            example={"rf": example.requirement.code, "ct": example.test_case.code} if example else None,
        )
    elif challenge.kind == Challenge.COVERAGE:
        rf = challenge.requirement
        base.update(
            requirement={"code": rf.code, "text": rf.description},
            evidence=[{"code": t.code, "text": t.description} for t in challenge.evidence.all()],
            options=COVERAGE_OPTIONS,
        )
    else:
        rf = challenge.requirement
        cands = [{"code": t.code, "text": t.description} for t in challenge.candidates.all()]
        base.update(
            requirement={"code": rf.code, "text": rf.description},
            evidence=[{"code": t.code, "text": t.description} for t in challenge.evidence.all()],
            options=shuffled(cands, student.pk * 1000 + challenge.pk),
        )
    return base


# ----------------------------------------------------------------- grading

def grade(challenge, answer):
    """Retorna dict(correct, feedback). Levanta AnswerError se a resposta for inválida."""
    if challenge.kind == Challenge.ASSOCIATION:
        return _grade_association(challenge, answer)
    if challenge.kind == Challenge.COVERAGE:
        return _grade_coverage(challenge, answer)
    return _grade_missing(challenge, answer)


def _grade_association(challenge, answer):
    ex = challenge.exercise
    links = answer.get("links")
    if not isinstance(links, dict):
        raise AnswerError("Resposta inválida.")
    relations = list(ex.relations.select_related("requirement", "test_case"))
    example = relations[0] if relations else None
    tests = {t.code: t for t in ex.test_cases.all()}
    if set(links) - {r.requirement.code for r in relations}:
        raise AnswerError("Resposta inválida.")

    wrong, right = [], []
    for rel in relations:
        rf = rel.requirement
        if rel is example:
            continue
        chosen_code = links.get(rf.code)
        if not chosen_code:
            raise AnswerError("Ainda faltam relações para verificar.")
        if chosen_code == rel.test_case.code:
            right.append(rel)
        else:
            wrong.append((rel, tests.get(chosen_code)))

    if not wrong:
        sections = [
            _section("O que você descobriu", "Cada caso de teste verifica diretamente o comportamento descrito no requisito correspondente."),
            _section(
                "Por que está correto?",
                " ".join(
                    f"{r.requirement.code} ↔ {r.test_case.code}: {r.explanation}".strip()
                    if r.explanation
                    else f"{r.requirement.code} ↔ {r.test_case.code} verifica o comportamento esperado."
                    for r in [example, *right]
                    if r is not None
                ),
            ),
            _section("Dica do Trace", "Uma associação correta depende do comportamento testado, não apenas do código do artefato."),
        ]
        return {
            "correct": True,
            "feedback": {
                "title": "Boa investigação!",
                "subtitle": "Você conectou os rastros corretamente.",
                "sections": sections,
                "summary": f"{len(right) + 1}/{len(right) + 1} relações corretas",
            },
        }

    review = []
    for rel, chosen in wrong:
        rf = rel.requirement
        if chosen:
            review.append(
                f"{rf.code} ↔ {chosen.code}: o teste {_q(chosen.description)} não verifica o comportamento de {_q(rf.description)}."
            )
        else:
            review.append(f"{rf.code} foi ligado a um teste inexistente.")
    total = len(right) + len(wrong) + (1 if example else 0)
    sections = [
        _section("Conexões para revisar", " ".join(review)),
        _section("Como revisar", "Leia a ação e o resultado esperado de cada teste antes de olhar para o código RF/CT."),
        _section("Dica do Trace", "Procure verbos e condições equivalentes entre requisito e caso de teste."),
    ]
    return {
        "correct": False,
        "feedback": {
            "title": "Quase! Revise as conexões",
            "subtitle": "Algum rastro foi conectado à evidência errada.",
            "sections": sections,
            "summary": f"{len(right) + (1 if example else 0)}/{total} relações corretas",
            "wrongRequirements": [rel.requirement.code for rel, _ in wrong],
        },
    }


def _grade_coverage(challenge, answer):
    choice = answer.get("choice")
    if choice not in COVERAGE_LABEL:
        raise AnswerError("Escolha uma classificação para continuar.")
    rf = challenge.requirement
    evidence = list(challenge.evidence.all())
    correct = choice == challenge.correct_answer
    label = COVERAGE_LABEL[challenge.correct_answer].lower()
    if correct:
        sections = [
            _section("Classificação confirmada", f"{rf.code} está com {label}."),
            _section(
                "O que você descobriu",
                challenge.feedback_correct
                or "As evidências existentes sustentam esta classificação de cobertura.",
            ),
            _section(
                "Evidências analisadas",
                " ".join(f"{t.code}: {t.description}" for t in evidence) or "Nenhuma evidência associada.",
            ),
        ]
        return {
            "correct": True,
            "feedback": {
                "title": "Boa investigação!",
                "subtitle": f"A cobertura deste requisito é {label}.",
                "sections": sections,
                "summary": COVERAGE_LABEL[choice],
            },
        }
    reminders = {
        "full": "Um requisito pode ter casos de teste associados e ainda assim não estar completamente coberto.",
        "none": "Já existem casos de teste associados: ao menos parte do comportamento está verificada.",
        "partial": "Há evidências para todos os comportamentos do requisito, então ele não está parcialmente coberto.",
    }
    sections = [
        _section("Lembrete", reminders[choice]),
        _section(
            "Como revisar sua escolha",
            challenge.feedback_wrong
            or "Compare cada comportamento descrito no requisito com o que os testes realmente verificam.",
        ),
        _section("Dica do Trace", "Não conte apenas quantos testes existem. Pergunte se todos os comportamentos foram testados."),
    ]
    return {
        "correct": False,
        "feedback": {
            "title": "Quase! Revise a cobertura",
            "subtitle": "A classificação escolhida não corresponde às evidências.",
            "sections": sections,
            "summary": COVERAGE_LABEL[choice],
        },
    }


def _grade_missing(challenge, answer):
    choice = answer.get("choice")
    candidates = {t.code: t for t in challenge.candidates.all()}
    if choice not in candidates:
        raise AnswerError("Escolha um caso de teste para continuar.")
    rf = challenge.requirement
    evidence = list(challenge.evidence.all())
    chosen = candidates[choice]
    if choice == challenge.correct_answer:
        existing = ", ".join(t.code for t in evidence)
        sections = [
            _section(
                "O que você descobriu",
                challenge.feedback_correct
                or f"{chosen.code} verifica o comportamento de {rf.code} que ainda não tinha evidência.",
            ),
            _section(
                "Por que está correto?",
                f"{existing + ' + ' if existing else ''}{chosen.code} completam a cobertura de {rf.code}: {chosen.description}",
            ),
            _section("Dica do Trace", "Cobertura completa significa que todos os comportamentos especificados possuem evidências de teste."),
        ]
        return {
            "correct": True,
            "feedback": {
                "title": "Resolvido!",
                "subtitle": "Você encontrou a evidência que faltava.",
                "sections": sections,
                "summary": chosen.code,
            },
        }
    sections = [
        _section(
            "Lembrete",
            f"{chosen.code} ({_q(chosen.description)}) não completa a cobertura: o teste escolhido precisa verificar o comportamento que ainda não aparece nas evidências existentes.",
        ),
        _section(
            "Como revisar sua escolha",
            challenge.feedback_wrong
            or f"Compare novamente {rf.code} com as evidências já existentes e procure qual parte da regra ainda não foi testada.",
        ),
        _section("Dica do Trace", "Preste atenção no que deve acontecer em cada condição descrita no requisito."),
    ]
    return {
        "correct": False,
        "feedback": {
            "title": "Quase! Revise a evidência escolhida",
            "subtitle": "O teste selecionado não completa a cobertura.",
            "sections": sections,
            "summary": chosen.code,
        },
    }

