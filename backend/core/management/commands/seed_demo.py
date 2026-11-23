"""Cria contas e exercícios de demonstração.

    python manage.py seed_demo                 # contas + exercícios
    python manage.py seed_demo --demo-history  # + histórico de outros estudantes
    python manage.py seed_demo --reset         # apaga os dados do TraceQuest antes
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from core.exercises import save_exercise
from core.grading import grade
from core.models import Attempt, Exercise, ExerciseSession, Profile

User = get_user_model()
PASSWORD = "tracequest"

ACCOUNTS = [
    ("camila@uea.edu.br", "Camila", "Andrade", Profile.TEACHER, "Engenharia de Software"),
    ("ana@uea.edu.br", "Ana", "Beatriz", Profile.STUDENT, "Pronta para investigar?"),
]
EXTRA_STUDENTS = [
    ("gabriela@uea.edu.br", "Gabriela", "Lima"),
    ("pedro@uea.edu.br", "Pedro", "Souza"),
    ("lucas@uea.edu.br", "Lucas", "Melo"),
]

EXERCISES = [
    {
        "title": "Primeiros Rastros",
        "subtitle": "Reconheça requisitos e casos de teste",
        "level": "Iniciante",
        "description": "Relacione os requisitos de um cadastro de usuário aos testes que os verificam.",
        "missionOrder": 1,
        "xp": 100,
        "publish": True,
        "requirements": [
            {"code": "RF01", "description": "O sistema deve permitir cadastrar um usuário com nome, e-mail e senha."},
            {"code": "RF02", "description": "O sistema deve exibir um erro quando o e-mail já estiver cadastrado."},
            {"code": "RF03", "description": "O sistema deve enviar um e-mail de confirmação após o cadastro."},
        ],
        "tests": [
            {"code": "CT01", "description": "Preencher o formulário com dados válidos e enviar.", "expected": "Conta criada com sucesso."},
            {"code": "CT02", "description": "Cadastrar um usuário com um e-mail que já existe.", "expected": "Mensagem de e-mail já cadastrado."},
            {"code": "CT03", "description": "Concluir um cadastro válido e consultar a caixa de entrada.", "expected": "E-mail de confirmação recebido."},
        ],
        "relations": [
            {"rf": "RF01", "ct": "CT01", "explanation": "CT01 cria a conta com dados válidos, que é o comportamento central de RF01."},
            {"rf": "RF02", "ct": "CT02", "explanation": "CT02 força o e-mail duplicado e verifica o erro exigido por RF02."},
            {"rf": "RF03", "ct": "CT03", "explanation": "CT03 confere o recebimento do e-mail de confirmação pedido em RF03."},
        ],
    },
    {
        "title": "Conectando Pontos",
        "subtitle": "Relacione requisitos, cobertura e evidências",
        "level": "Intermediário",
        "description": "Investigue como requisitos e casos de teste se relacionam e descubra quando a cobertura ainda está incompleta.",
        "missionOrder": 2,
        "xp": 150,
        "publish": True,
        "requirements": [
            {"code": "RF01", "description": "O usuário pode entrar com e-mail e senha."},
            {"code": "RF02", "description": "O usuário pode solicitar redefinição de senha."},
            {
                "code": "RF03",
                "description": "Após 5 tentativas inválidas, a conta deve ser bloqueada por 15 minutos. Depois desse período, o usuário deve poder tentar entrar novamente.",
            },
        ],
        "tests": [
            {"code": "CT01", "description": "Login com credenciais válidas.", "expected": "Acesso liberado."},
            {"code": "CT02", "description": "Solicitar redefinição para e-mail cadastrado.", "expected": "Link de redefinição enviado."},
            {"code": "CT03", "description": "Realizar 5 tentativas inválidas e verificar que a conta foi bloqueada.", "expected": "Conta bloqueada."},
            {"code": "CT04", "description": "Tentar fazer login durante o período de bloqueio e verificar que o acesso é negado.", "expected": "Acesso negado."},
            {"code": "CT05", "description": "Fazer login válido antes de qualquer tentativa incorreta.", "expected": "Acesso liberado."},
            {"code": "CT06", "description": "Aguardar 15 minutos após o bloqueio e verificar que uma nova tentativa de login é permitida.", "expected": "Nova tentativa permitida."},
            {"code": "CT07", "description": "Alterar a senha enquanto a conta está bloqueada.", "expected": "Alteração negada."},
        ],
        "relations": [
            {"rf": "RF01", "ct": "CT01", "explanation": "CT01 verifica o login com credenciais válidas, o comportamento descrito em RF01."},
            {"rf": "RF02", "ct": "CT02", "explanation": "CT02 solicita a redefinição para um e-mail cadastrado, que é exatamente RF02."},
            {"rf": "RF03", "ct": "CT03", "explanation": "CT03 provoca o bloqueio após 5 tentativas inválidas, o núcleo de RF03."},
        ],
        "coverage": {
            "requirement": "RF03",
            "evidence": ["CT03", "CT04"],
            "correct": "partial",
            "feedbackCorrect": "CT03 verifica o bloqueio após cinco tentativas e CT04 verifica o acesso negado durante o período de bloqueio, mas ainda existe uma situação não testada.",
            "feedbackWrong": "Compare cada comportamento de RF03 (bloquear, negar acesso, liberar após 15 minutos) com o que CT03 e CT04 realmente verificam.",
        },
        "missing": {
            "requirement": "RF03",
            "evidence": ["CT03", "CT04"],
            "candidates": ["CT05", "CT06", "CT07"],
            "correct": "CT06",
            "feedbackCorrect": "CT06 verifica o comportamento ainda não coberto: permitir uma nova tentativa depois dos 15 minutos de bloqueio.",
            "feedbackWrong": "Compare novamente RF03 com CT03 e CT04 e procure qual parte da regra ainda não foi testada. Preste atenção no que deve acontecer depois que o bloqueio termina.",
        },
    },
    {
        "title": "Caça à Cobertura",
        "subtitle": "Encontre comportamentos ainda sem teste",
        "level": "Intermediário",
        "description": "Rascunho: recuperação de senha. Publique para liberar aos estudantes.",
        "missionOrder": 3,
        "xp": 180,
        "publish": False,
        "requirements": [
            {"code": "RF01", "description": "O usuário pode solicitar um link de redefinição de senha por e-mail."},
            {"code": "RF02", "description": "O link de redefinição deve funcionar por 30 minutos e expirar depois."},
            {"code": "RF03", "description": "A nova senha deve ter pelo menos 8 caracteres."},
        ],
        "tests": [
            {"code": "CT01", "description": "Solicitar redefinição para um e-mail cadastrado.", "expected": "Link enviado por e-mail."},
            {"code": "CT02", "description": "Abrir o link em até 30 minutos e definir uma nova senha válida.", "expected": "Senha alterada."},
            {"code": "CT03", "description": "Definir uma nova senha com 3 caracteres.", "expected": "Senha rejeitada."},
            {"code": "CT04", "description": "Abrir o link depois de 30 minutos.", "expected": "Mensagem de link expirado."},
            {"code": "CT05", "description": "Solicitar redefinição para um e-mail não cadastrado.", "expected": "Mensagem genérica de envio."},
            {"code": "CT06", "description": "Alterar o e-mail da conta nas configurações.", "expected": "E-mail atualizado."},
        ],
        "relations": [
            {"rf": "RF01", "ct": "CT01", "explanation": "CT01 solicita o link para um e-mail cadastrado, como pede RF01."},
            {"rf": "RF02", "ct": "CT02", "explanation": "CT02 usa o link dentro do prazo de 30 minutos descrito em RF02."},
            {"rf": "RF03", "ct": "CT03", "explanation": "CT03 tenta uma senha curta e verifica a regra de tamanho mínimo de RF03."},
        ],
        "coverage": {
            "requirement": "RF02",
            "evidence": ["CT02"],
            "correct": "partial",
            "feedbackCorrect": "CT02 cobre o uso do link dentro do prazo, mas nenhum teste verifica a expiração depois de 30 minutos.",
            "feedbackWrong": "RF02 tem duas partes: funcionar por 30 minutos e expirar depois. Veja o que CT02 cobre.",
        },
        "missing": {
            "requirement": "RF02",
            "evidence": ["CT02"],
            "candidates": ["CT04", "CT05", "CT06"],
            "correct": "CT04",
            "feedbackCorrect": "CT04 verifica a expiração do link, a parte de RF02 que ainda não tinha teste.",
            "feedbackWrong": "Procure o teste que verifica o que acontece com o link depois do prazo.",
        },
    },
]

# Histórico de demonstração: (estudante, exercício, [(ordem, resposta), ...])
RIGHT1 = {"links": {"RF01": "CT01", "RF02": "CT02", "RF03": "CT03"}}
WRONG1 = {"links": {"RF01": "CT01", "RF02": "CT03", "RF03": "CT02"}}


def history():
    return {
        "gabriela@uea.edu.br": [
            ("Primeiros Rastros", [(1, RIGHT1)]),
            (
                "Conectando Pontos",
                [(1, RIGHT1), (2, {"choice": "full"}), (2, {"choice": "partial"}), (3, {"choice": "CT06"})],
            ),
        ],
        "pedro@uea.edu.br": [
            ("Primeiros Rastros", [(1, WRONG1), (1, RIGHT1)]),
            (
                "Conectando Pontos",
                [(1, WRONG1), (1, WRONG1), (1, RIGHT1), (2, {"choice": "partial"}), (3, {"choice": "CT05"}), (3, {"choice": "CT07"})],
            ),
        ],
        "lucas@uea.edu.br": [
            ("Primeiros Rastros", [(1, RIGHT1)]),
            ("Conectando Pontos", [(1, RIGHT1), (2, {"choice": "partial"}), (3, {"choice": "CT05"}), (3, {"choice": "CT06"})]),
        ],
    }


class Command(BaseCommand):
    help = "Cria contas e exercícios de demonstração do TraceQuest."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Apaga os dados do TraceQuest antes de criar.")
        parser.add_argument("--demo-history", action="store_true", help="Cria tentativas de outros estudantes.")

    def handle(self, *args, **opts):
        if opts["reset"]:
            Attempt.objects.all().delete()
            ExerciseSession.objects.all().delete()
            Exercise.objects.all().delete()
            User.objects.filter(profile__isnull=False).delete()
            # reinicia os contadores de id (SQLite) para que EX-01, EX-02... voltem a começar do 1
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM sqlite_sequence WHERE name LIKE 'core_%'")
            self.stdout.write("Dados anteriores removidos.")

        teacher = None
        for email, first, last, role, subtitle in ACCOUNTS:
            user = self._account(email, first, last, role, subtitle)
            if role == Profile.TEACHER:
                teacher = user

        for data in EXERCISES:
            if Exercise.objects.filter(title=data["title"]).exists():
                continue
            save_exercise(data, teacher)
            self.stdout.write(f"Exercício criado: {data['title']}")

        if opts["demo_history"]:
            for email, first, last in EXTRA_STUDENTS:
                self._account(email, first, last, Profile.STUDENT, "Pronta para investigar?")
            self._create_history()

        self.stdout.write(self.style.SUCCESS("Pronto. Senha de todas as contas: " + PASSWORD))
        for email, *_ in ACCOUNTS:
            self.stdout.write(f"  {email}")

    def _account(self, email, first, last, role, subtitle):
        user, created = User.objects.get_or_create(
            username=email, defaults={"email": email, "first_name": first, "last_name": last}
        )
        if created:
            user.set_password(PASSWORD)
            user.save()
        Profile.objects.get_or_create(user=user, defaults={"role": role, "subtitle": subtitle})
        return user

    def _create_history(self):
        now = timezone.now()
        for offset, (email, plan) in enumerate(history().items()):
            student = User.objects.get(username=email)
            if Attempt.objects.filter(student=student).exists():
                continue
            clock = now - timedelta(days=offset, hours=2)
            for title, steps in plan:
                exercise = Exercise.objects.get(title=title)
                started = clock
                session = ExerciseSession.objects.create(student=student, exercise=exercise)
                ExerciseSession.objects.filter(pk=session.pk).update(started_at=started)
                solved = set()
                for order, answer in steps:
                    clock += timedelta(minutes=3)
                    challenge = exercise.challenges.get(order=order)
                    result = grade(challenge, answer)
                    attempt = Attempt.objects.create(
                        student=student,
                        exercise=exercise,
                        challenge=challenge,
                        kind=challenge.kind,
                        order=order,
                        answer=answer,
                        correct=result["correct"],
                        feedback=result["feedback"],
                    )
                    Attempt.objects.filter(pk=attempt.pk).update(created_at=clock)
                    if result["correct"]:
                        solved.add(order)
                if len(solved) == exercise.challenges.count():
                    ExerciseSession.objects.filter(pk=session.pk).update(completed_at=clock, xp_awarded=exercise.xp)
                clock += timedelta(minutes=5)
