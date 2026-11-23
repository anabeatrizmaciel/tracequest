from django.contrib import admin

from . import models

admin.site.register(models.Profile)
admin.site.register(models.Exercise)
admin.site.register(models.Requirement)
admin.site.register(models.TestCase)
admin.site.register(models.ExpectedRelation)
admin.site.register(models.Challenge)
admin.site.register(models.ExerciseSession)
admin.site.register(models.Attempt)
