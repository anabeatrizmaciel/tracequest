# TraceQuest

Plataforma gamificada para ensinar **rastreabilidade entre requisitos e casos de teste**, cobertura e adequação.

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Python + Django 5 (API JSON, sem dependências extras)
- **Banco:** SQLite (arquivo `backend/db.sqlite3`, criado automaticamente)

## Como rodar (Windows / PowerShell)

Pré-requisitos: Python 3.10+ e Node.js 18+.

```powershell
.\iniciar.ps1 -Demo
```

O script cria o ambiente Python, instala as dependências, migra o banco, cria contas e exercícios e sobe os dois servidores. Depois abra <http://localhost:5173>.

| Opção | Efeito |
| --- | --- |
| `-Demo` | também cria o histórico de uma turma de demonstração (Gabriela, Pedro e Lucas) |
| `-Reset` | apaga os dados e recria tudo do zero |

### Manualmente

```powershell
# backend (terminal 1)
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py seed_demo --demo-history
.venv\Scripts\python manage.py runserver 127.0.0.1:8000

# frontend (terminal 2, na raiz)
npm install
npm run dev
```

O Vite encaminha `/api` para o Django (porta 8000), então não há configuração de CORS.

## Contas de demonstração

Senha de todas: `tracequest`

| Perfil | E-mail |
| --- | --- |
| Professora | `camila@uea.edu.br` |
| Estudante | `ana@uea.edu.br` |
| Estudantes (só com `-Demo`) | `gabriela@`, `pedro@`, `lucas@` + `uea.edu.br` |

Novos estudantes podem criar conta pela tela de login. Contas de professora são criadas pelo `seed_demo` ou pelo `/admin`
(`manage.py createsuperuser` e depois crie um *Profile* com papel “teacher”).

## O que o sistema faz

**Estudante**
- Login/cadastro, início, mapa de missões (desbloqueio sequencial) e detalhe da missão.
- Três tipos de desafio: **associar RF ↔ CT**, **classificar a cobertura** e **escolher a evidência que falta**.
- Correção no servidor, comparando a resposta com o gabarito cadastrado pela professora, com feedback específico
  (quais conexões revisar; justificativa da professora no acerto).
- Cada tentativa é registrada. XP é concedido uma vez, ao concluir a missão. Progresso, taxa de acerto por habilidade e conquistas são calculados a partir das tentativas.

**Professora**
- Dashboard (alunos ativos, conclusão, média, dificuldades recorrentes, atividades recentes) com dados reais.
- Criar/editar exercícios em duas etapas: dados, requisitos e casos de teste; gabarito RF ↔ CT com justificativa, mais desafios opcionais de cobertura e de evidência que falta.
- Publicar/despublicar (rascunhos não aparecem para estudantes).
- Resultados da turma (filtro por exercício, exportação CSV), resultado individual com análise por desafio, sugestão de revisão e respostas registradas.

## Estrutura

```
backend/
  tracequest/        configuração Django
  core/
    models.py        Exercise, Requirement, TestCase, ExpectedRelation, Challenge, ExerciseSession, Attempt
    grading.py       correção e montagem do feedback
    services.py      progresso, conquistas e estatísticas da turma
    exercises.py     validação e gravação de exercícios
    views.py         endpoints /api/...
    tests.py         testes automatizados
src/
  api.js auth.jsx components.jsx   cliente da API, sessão, componentes comuns
  pages/{public,student,teacher}.jsx
  styles.css       design do protótipo (original da equipe)
  extra.css        complementos: estados de erro/carregando, menu do usuário, editor de exercícios
```

## Testes automatizados

```powershell
cd backend
.venv\Scripts\python manage.py test core
```

O roteiro de teste manual para o usuário está em [`TESTE.md`](TESTE.md); as rotas, em [`ROTAS.md`](ROTAS.md).

## Logo e mascote

A marca é desenhada em CSS. Para usar os arquivos oficiais, coloque `tracequest-logo.png` e `trace-mascote.png` em `src/assets/` e
troque o componente `Brand` (em `src/components.jsx`) e os elementos `.trace-mascot`, `.hero-mascot` e `.complete-mascot` por `<img>`.

## Limitações conhecidas

- Autenticação por token assinado guardado no navegador (adequado para a primeira versão acadêmica; em produção, use HTTPS e defina `TRACEQUEST_SECRET_KEY`).
- “Esqueci minha senha” apenas orienta a procurar a professora; não há envio de e-mail.
- O tipo de missão “Caso Suspeito” (associações inadequadas) previsto no protótipo ainda não existe como desafio.
