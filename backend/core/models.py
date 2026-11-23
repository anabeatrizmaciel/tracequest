from django.conf import settings
from django.db import models


class Profile(models.Model):
    STUDENT = "student"
    TEACHER = "teacher"
    ROLES = [(STUDENT, "Estudante"), (TEACHER, "Professora")]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLES)
    subtitle = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"


class Exercise(models.Model):
    DRAFT = "draft"
    PUBLISHED = "published"
    STATUSES = [(DRAFT, "Rascunho"), (PUBLISHED, "Publicado")]

    LEVELS = ["Iniciante", "Intermediário", "Avançado"]

    title = models.CharField(max_length=140)
    level = models.CharField(max_length=20, default="Iniciante")
    description = models.TextField(blank=True)
    subtitle = models.CharField(max_length=200, blank=True)
    mission_order = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=12, choices=STATUSES, default=DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="exercises")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["mission_order", "id"]

    def __str__(self):
        return self.title

    @property
    def code(self):
        return f"EX-{self.pk:02d}"


class Requirement(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="requirements")
    code = models.CharField(max_length=20)
    description = models.TextField()
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class TestCase(models.Model):
    __test__ = False  # evita coleta pelo pytest

    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="test_cases")
    code = models.CharField(max_length=20)
    description = models.TextField()
    expected = models.TextField(blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class ExpectedRelation(models.Model):
    """Gabarito RF ↔ CT do exercício, com a justificativa usada no feedback."""

    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="relations")
    requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, related_name="relations")
    test_case = models.ForeignKey(TestCase, on_delete=models.CASCADE, related_name="relations")
    explanation = models.TextField(blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class Challenge(models.Model):
    ASSOCIATION = "association"
    COVERAGE = "coverage"
    MISSING = "missing"
    KINDS = [
        (ASSOCIATION, "Associação RF ↔ CT"),
        (COVERAGE, "Análise de cobertura"),
        (MISSING, "Evidência que falta"),
    ]

    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="challenges")
    order = models.PositiveIntegerField()
    kind = models.CharField(max_length=12, choices=KINDS)
    requirement = models.ForeignKey(Requirement, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    evidence = models.ManyToManyField(TestCase, blank=True, related_name="+")
    candidates = models.ManyToManyField(TestCase, blank=True, related_name="+")
    correct_answer = models.CharField(max_length=40, blank=True)
    feedback_correct = models.TextField(blank=True)
    feedback_wrong = models.TextField(blank=True)

    class Meta:
        ordering = ["exercise_id", "order"]
        unique_together = [("exercise", "order")]


class ExerciseSession(models.Model):
    """Uma execução da missão por um estudante (início, conclusão e XP)."""

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions")
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="sessions")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    xp_awarded = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [("student", "exercise")]


class Attempt(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attempts")
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="attempts")
    challenge = models.ForeignKey(Challenge, null=True, on_delete=models.SET_NULL, related_name="attempts")
    kind = models.CharField(max_length=12, choices=Challenge.KINDS)
    order = models.PositiveIntegerField()
    answer = models.JSONField(default=dict)
    correct = models.BooleanField(default=False)
    feedback = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
