# Rotas

## Front-end

### Geral
- `/` — escolha de perfil
- `/login/aluno` — login/cadastro do estudante
- `/login/professor` — login da professora

### Estudante (exige login de estudante)
- `/aluno/inicio`
- `/aluno/missoes` (aceita `?q=` para buscar)
- `/aluno/missao/:id`
- `/aluno/missao/:id/desafio/:n`
- `/aluno/missao/:id/desafio/:n/feedback` — acerto ou erro, conforme a última tentativa
- `/aluno/missao/:id/concluida`
- `/aluno/progresso`
- `/aluno/conquistas`

### Professora (exige login de professora)
- `/professor/dashboard`
- `/professor/exercicios` (aceita `?q=`)
- `/professor/exercicios/novo`
- `/professor/exercicios/:id/editar`
- `/professor/resultados` (aceita `?exercise=:id`)
- `/professor/resultados/:studentId`

## API (`/api`, autenticação `Authorization: Bearer <token>`)

| Método | Rota | Perfil |
| --- | --- | --- |
| POST | `auth/login`, `auth/register` | público |
| GET | `student/home`, `student/missions`, `student/progress`, `student/achievements` | estudante |
| GET | `student/missions/:id` | estudante |
| POST | `student/missions/:id/start` | estudante |
| GET | `student/missions/:id/challenges/:n` | estudante |
| POST | `student/missions/:id/challenges/:n/submit` | estudante |
| GET | `student/missions/:id/challenges/:n/feedback` | estudante |
| GET | `student/missions/:id/result` | estudante |
| GET | `teacher/dashboard`, `teacher/exercises`, `teacher/results`, `teacher/results.csv` | professora |
| POST | `teacher/exercises/new` | professora |
| GET/PUT | `teacher/exercises/:id` | professora |
| POST | `teacher/exercises/:id/status` | professora |
| GET | `teacher/students/:id` | professora |
