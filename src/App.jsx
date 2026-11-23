import { Route, Routes } from 'react-router-dom';
import { RequireRole } from './auth.jsx';
import { NotFound } from './components.jsx';
import { LoginPage, ProfileChoice } from './pages/public.jsx';
import {
  AchievementsPage, ChallengePage, FeedbackPage, MissionComplete, MissionDetail, Missions, ProgressPage, StudentHome,
} from './pages/student.jsx';
import {
  ExerciseEditor, ExercisesPage, IndividualResultPage, ResultsPage, TeacherDashboard,
} from './pages/teacher.jsx';

const student = (el) => <RequireRole role="student">{el}</RequireRole>;
const teacher = (el) => <RequireRole role="teacher">{el}</RequireRole>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfileChoice />} />
      <Route path="/login/aluno" element={<LoginPage />} />
      <Route path="/login/professor" element={<LoginPage role="teacher" />} />

      <Route path="/aluno/inicio" element={student(<StudentHome />)} />
      <Route path="/aluno/missoes" element={student(<Missions />)} />
      <Route path="/aluno/missao/:id" element={student(<MissionDetail />)} />
      <Route path="/aluno/missao/:id/desafio/:n" element={student(<ChallengePage />)} />
      <Route path="/aluno/missao/:id/desafio/:n/feedback" element={student(<FeedbackPage />)} />
      <Route path="/aluno/missao/:id/concluida" element={student(<MissionComplete />)} />
      <Route path="/aluno/progresso" element={student(<ProgressPage />)} />
      <Route path="/aluno/conquistas" element={student(<AchievementsPage />)} />

      <Route path="/professor/dashboard" element={teacher(<TeacherDashboard />)} />
      <Route path="/professor/exercicios" element={teacher(<ExercisesPage />)} />
      <Route path="/professor/exercicios/novo" element={teacher(<ExerciseEditor />)} />
      <Route path="/professor/exercicios/:id/editar" element={teacher(<ExerciseEditor />)} />
      <Route path="/professor/resultados" element={teacher(<ResultsPage />)} />
      <Route path="/professor/resultados/:studentId" element={teacher(<IndividualResultPage />)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
