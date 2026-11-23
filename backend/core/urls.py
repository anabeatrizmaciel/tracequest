from django.urls import path

from . import views

urlpatterns = [
    path("auth/login", views.login),
    path("auth/register", views.register),
    path("auth/me/student", views.me_student),
    path("auth/me/teacher", views.me_teacher),

    path("student/home", views.student_home),
    path("student/missions", views.student_missions),
    path("student/missions/<int:exercise_id>", views.student_mission),
    path("student/missions/<int:exercise_id>/start", views.student_mission_start),
    path("student/missions/<int:exercise_id>/result", views.student_mission_result),
    path("student/missions/<int:exercise_id>/challenges/<int:order>", views.student_challenge),
    path("student/missions/<int:exercise_id>/challenges/<int:order>/submit", views.student_challenge_submit),
    path("student/missions/<int:exercise_id>/challenges/<int:order>/feedback", views.student_challenge_feedback),
    path("student/progress", views.student_progress),
    path("student/achievements", views.student_achievements),

    path("teacher/dashboard", views.teacher_dashboard),
    path("teacher/exercises", views.teacher_exercises),
    path("teacher/exercises/new", views.teacher_exercise_create),
    path("teacher/exercises/<int:exercise_id>", views.teacher_exercise_detail),
    path("teacher/exercises/<int:exercise_id>/status", views.teacher_exercise_status),
    path("teacher/results", views.teacher_results),
    path("teacher/results.csv", views.teacher_results_csv),
    path("teacher/students/<int:student_id>", views.teacher_student),
]
