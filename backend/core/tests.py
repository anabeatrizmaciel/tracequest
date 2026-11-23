import json

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings

User = get_user_model()
FAST = override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])

RIGHT1 = {"links": {"RF01": "CT01", "RF02": "CT02", "RF03": "CT03"}}
WRONG1 = {"links": {"RF01": "CT01", "RF02": "CT03", "RF03": "CT02"}}


@FAST
class ApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", "--demo-history", verbosity=0)

    # ------------------------------------------------------------ helpers
    def call(self, method, url, data=None, token=None):
        kwargs = {"content_type": "application/json"}
        if token:
            kwargs["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        if data is not None:
            kwargs["data"] = json.dumps(data)
        res = getattr(self.client, method)(f"/api/{url}", **kwargs)
        return res

    def login(self, email, role=None):
        res = self.call("post", "auth/login", {"email": email, "password": "tracequest", "role": role})
        self.assertEqual(res.status_code, 200, res.content)
        return res.json()["token"]

    def submit(self, token, mission, order, answer):
        res = self.call("post", f"student/missions/{mission}/challenges/{order}/submit", {"answer": answer}, token)
        return res

    def mission_ids(self, token):
        missions = self.call("get", "student/missions", token=token).json()["missions"]
        return {m["title"]: m for m in missions}

    # --------------------------------------------------------------- auth
    def test_login_rejects_wrong_password_and_wrong_role(self):
        bad = self.call("post", "auth/login", {"email": "ana@uea.edu.br", "password": "x"})
        self.assertEqual(bad.status_code, 401)
        wrong_role = self.call("post", "auth/login", {"email": "ana@uea.edu.br", "password": "tracequest", "role": "teacher"})
        self.assertEqual(wrong_role.status_code, 403)

    def test_role_isolation(self):
        student, teacher = self.login("ana@uea.edu.br", "student"), self.login("camila@uea.edu.br", "teacher")
        self.assertEqual(self.call("get", "teacher/dashboard", token=student).status_code, 403)
        self.assertEqual(self.call("get", "student/home", token=teacher).status_code, 403)
        self.assertEqual(self.call("get", "student/home").status_code, 401)

    def test_register_creates_student(self):
        res = self.call("post", "auth/register", {"name": "Maria Silva", "email": "maria@uea.edu.br", "password": "abc123"})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["user"]["role"], "student")
        again = self.call("post", "auth/register", {"name": "Maria Silva", "email": "maria@uea.edu.br", "password": "abc123"})
        self.assertEqual(again.status_code, 409)

    # ------------------------------------------------------ fluxo do aluno
    def test_missions_lock_sequentially_and_drafts_hidden(self):
        token = self.login("ana@uea.edu.br")
        missions = self.mission_ids(token)
        self.assertEqual(set(missions), {"Primeiros Rastros", "Conectando Pontos"})
        self.assertEqual(missions["Primeiros Rastros"]["status"], "Disponível")
        self.assertEqual(missions["Conectando Pontos"]["status"], "Bloqueada")
        locked = self.call("get", f"student/missions/{missions['Conectando Pontos']['id']}/challenges/1", token=token)
        self.assertEqual(locked.status_code, 403)

    def test_full_flow_grading_progress_and_xp(self):
        token = self.login("ana@uea.edu.br")
        m1 = self.mission_ids(token)["Primeiros Rastros"]["id"]

        incomplete = self.submit(token, m1, 1, {"links": {"RF01": "CT01"}})
        self.assertEqual(incomplete.status_code, 400)

        wrong = self.submit(token, m1, 1, WRONG1).json()
        self.assertFalse(wrong["correct"])
        self.assertIn("RF02", wrong["feedback"]["sections"][0]["text"])

        right = self.submit(token, m1, 1, RIGHT1).json()
        self.assertTrue(right["correct"])
        self.assertTrue(right["completed"])

        missions = self.mission_ids(token)
        self.assertEqual(missions["Primeiros Rastros"]["status"], "Concluída")
        self.assertEqual(missions["Conectando Pontos"]["status"], "Disponível")
        home = self.call("get", "student/home", token=token).json()
        self.assertEqual(home["xp"], 100)
        self.assertEqual(home["missionsDone"], 1)

        m2 = missions["Conectando Pontos"]["id"]
        # não pode pular o desafio 1
        self.assertEqual(self.call("get", f"student/missions/{m2}/challenges/2", token=token).status_code, 403)
        self.assertTrue(self.submit(token, m2, 1, RIGHT1).json()["correct"])
        self.assertFalse(self.submit(token, m2, 2, {"choice": "full"}).json()["correct"])
        self.assertTrue(self.submit(token, m2, 2, {"choice": "partial"}).json()["correct"])
        bad = self.submit(token, m2, 3, {"choice": "CT05"}).json()
        self.assertFalse(bad["correct"])
        self.assertFalse(bad["completed"])
        self.assertEqual(self.call("get", f"student/missions/{m2}/result", token=token).status_code, 409)
        done = self.submit(token, m2, 3, {"choice": "CT06"}).json()
        self.assertTrue(done["correct"] and done["completed"])
        self.assertTrue(any(a["id"] == "coverage_detective" or a["id"] == "evidence_hunter" for a in done["newAchievements"]))

        result = self.call("get", f"student/missions/{m2}/result", token=token).json()
        self.assertEqual(result["xp"], 150)
        self.assertEqual(result["challengesSolved"], 3)
        progress = self.call("get", "student/progress", token=token).json()
        self.assertEqual(progress["xp"], 250)
        self.assertEqual(progress["attempts"], 7)  # respostas incompletas não contam

        # feedback persistido (permite recarregar a página)
        fb = self.call("get", f"student/missions/{m2}/challenges/3/feedback", token=token).json()
        self.assertTrue(fb["correct"] and fb["isLast"])

    def test_review_attempts_do_not_change_accuracy(self):
        student = self.login("ana@uea.edu.br")
        teacher = self.login("camila@uea.edu.br")
        m1 = self.mission_ids(student)["Primeiros Rastros"]["id"]
        ana = User.objects.get(email="ana@uea.edu.br")

        self.assertTrue(self.submit(student, m1, 1, RIGHT1).json()["correct"])
        before = self.call("get", "student/progress", token=student).json()
        self.assertEqual(before["accuracy"], 100)

        dash_before = self.call("get", "teacher/dashboard", token=teacher).json()

        # "Rever desafios": erra três vezes de propósito depois de já ter acertado
        for _ in range(3):
            self.assertFalse(self.submit(student, m1, 1, WRONG1).json()["correct"])

        after = self.call("get", "student/progress", token=student).json()
        detail = self.call("get", f"teacher/students/{ana.pk}", token=teacher).json()
        self.assertEqual(after["accuracy"], 100)
        self.assertEqual(after["attempts"], 1)
        self.assertEqual(after["xp"], before["xp"])
        self.assertEqual(detail["accuracy"], after["accuracy"])
        self.assertEqual(detail["score"], 100)
        self.assertEqual(detail["firstTry"], 1)
        # erros só em revisão não geram dificuldade registrada
        self.assertEqual(detail["review"]["tags"], [])
        self.assertEqual(detail["review"]["title"], "Sem dificuldades registradas")
        row = next(r for r in self.call("get", "teacher/results", token=teacher).json()["students"] if r["id"] == ana.pk)
        self.assertEqual(row["score"], 100)
        self.assertEqual(row["difficulty"], "Sem erros")
        # o dashboard da turma também ignora os erros de revisão
        dash_after = self.call("get", "teacher/dashboard", token=teacher).json()
        self.assertEqual(dash_after["difficulties"], dash_before["difficulties"])
        self.assertEqual(dash_after["topDifficulty"], dash_before["topDifficulty"])
        # nenhuma tentativa é descartada: a lista da professora mostra todas, inclusive as de revisão
        self.assertEqual(len(detail["answers"]), 4)

    def test_challenge_payload_hides_answer(self):
        token = self.login("ana@uea.edu.br")
        mid = self.mission_ids(token)["Primeiros Rastros"]["id"]
        payload = self.call("get", f"student/missions/{mid}/challenges/1", token=token).content.decode()
        self.assertNotIn("explanation", payload)
        self.assertNotIn("correct_answer", payload)

    def test_unrelated_test_case_appears_as_distractor(self):
        token = self.login("ana@uea.edu.br")
        missions = self.mission_ids(token)
        m1, m2 = missions["Primeiros Rastros"]["id"], missions["Conectando Pontos"]["id"]
        self.assertTrue(self.submit(token, m1, 1, RIGHT1).json()["correct"])

        # CT04 de "Primeiros Rastros" não participa de nenhuma relação nem de outro desafio
        payload = self.call("get", f"student/missions/{m1}/challenges/1", token=token).json()
        self.assertEqual(sorted(t["code"] for t in payload["tests"]), ["CT01", "CT02", "CT03", "CT04"])
        self.assertEqual(len(payload["requirements"]), 3)

        wrong = self.submit(token, m1, 1, {"links": {"RF01": "CT01", "RF02": "CT02", "RF03": "CT04"}}).json()
        self.assertFalse(wrong["correct"])
        text = wrong["feedback"]["sections"][0]["text"]
        self.assertIn("RF03 ↔ CT04", text)
        self.assertIn("Entrar com o e-mail e a senha de uma conta já cadastrada", text)
        self.assertTrue(self.submit(token, m1, 1, RIGHT1).json()["correct"])

        # órfãos usados como evidência, alternativa ou resposta de outro desafio não viram distratores
        reserved = self.call("get", f"student/missions/{m2}/challenges/1", token=token).json()
        self.assertEqual(sorted(t["code"] for t in reserved["tests"]), ["CT01", "CT02", "CT03"])

    # ------------------------------------------------ fluxo da professora
    def test_teacher_dashboard_and_results_reflect_attempts(self):
        teacher = self.login("camila@uea.edu.br")
        dash = self.call("get", "teacher/dashboard", token=teacher).json()
        self.assertEqual(dash["activeStudents"], 3)
        self.assertEqual(dash["totalStudents"], 4)
        self.assertGreater(sum(d["value"] for d in dash["difficulties"]), 0)

        results = self.call("get", "teacher/results", token=teacher).json()
        by_name = {r["name"]: r for r in results["students"]}
        self.assertEqual(set(by_name), {"Gabriela Lima", "Pedro Souza", "Lucas Melo"})
        self.assertGreater(by_name["Lucas Melo"]["score"], by_name["Pedro Souza"]["score"])

        detail = self.call("get", f"teacher/students/{by_name['Pedro Souza']['id']}", token=teacher).json()
        self.assertTrue(detail["answers"])
        self.assertTrue(detail["review"]["tags"])

        csv = self.call("get", "teacher/results.csv", token=teacher)
        self.assertEqual(csv.status_code, 200)
        self.assertIn("Pedro Souza", csv.content.decode("utf-8"))

    def test_teacher_creates_publishes_and_student_sees_exercise(self):
        teacher = self.login("camila@uea.edu.br")
        payload = {
            "title": "Novo Caso",
            "level": "Iniciante",
            "description": "Teste",
            "missionOrder": 9,
            "xp": 80,
            "publish": True,
            "requirements": [{"code": "RF01", "description": "Pagar com cartão."}, {"code": "RF02", "description": "Emitir recibo."}],
            "tests": [
                {"code": "CT01", "description": "Pagar com cartão válido.", "expected": "Pago."},
                {"code": "CT02", "description": "Pagar e verificar recibo.", "expected": "Recibo emitido."},
            ],
            "relations": [{"rf": "RF01", "ct": "CT01", "explanation": "ok"}, {"rf": "RF02", "ct": "CT02", "explanation": "ok"}],
        }
        invalid = dict(payload, relations=[{"rf": "RF01", "ct": "CT01"}])
        self.assertEqual(self.call("post", "teacher/exercises/new", invalid, teacher).status_code, 400)
        created = self.call("post", "teacher/exercises/new", payload, teacher)
        self.assertEqual(created.status_code, 201, created.content)
        ex_id = created.json()["id"]

        listing = self.call("get", "teacher/exercises", token=teacher).json()["exercises"]
        self.assertIn("Novo Caso", [e["title"] for e in listing])

        # despublicar e republicar pelo endpoint de status
        off = self.call("post", f"teacher/exercises/{ex_id}/status", {"publish": False}, teacher).json()
        self.assertEqual(off["status"], "Rascunho")
        on = self.call("post", f"teacher/exercises/{ex_id}/status", {"publish": True}, teacher).json()
        self.assertEqual(on["status"], "Publicado")

        student = self.login("ana@uea.edu.br")
        self.assertIn("Novo Caso", self.mission_ids(student))

        # edição mantém o gabarito consistente: troca a relação e a correção acompanha
        detail = self.call("get", f"teacher/exercises/{ex_id}", token=teacher).json()
        detail["relations"] = [
            {"rf": "RF01", "ct": "CT01", "explanation": "ok"},
            {"rf": "RF02", "ct": "CT02", "explanation": "novo"},
        ]
        detail["publish"] = True
        self.assertEqual(self.call("put", f"teacher/exercises/{ex_id}", detail, teacher).status_code, 200)

    def test_publish_draft_from_seed(self):
        teacher = self.login("camila@uea.edu.br")
        drafts = [e for e in self.call("get", "teacher/exercises", token=teacher).json()["exercises"] if e["status"] == "Rascunho"]
        self.assertEqual(len(drafts), 1)
        res = self.call("post", f"teacher/exercises/{drafts[0]['id']}/status", {"publish": True}, teacher)
        self.assertEqual(res.status_code, 200, res.content)
