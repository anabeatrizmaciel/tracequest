import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { Banner, Brand } from '../components.jsx';

function DecorativeLandscape() {
  return <div className="landscape"><i /><i /><i /><i /><i /></div>;
}

export function ProfileChoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'teacher' ? '/professor/dashboard' : '/aluno/inicio'} replace />;
  return (
    <div className="profile-page">
      <div className="profile-top"><Brand /></div>
      <main className="profile-content">
        <span className="eyebrow peach">BEM-VINDO AO TRACEQUEST</span>
        <h1>Escolha como explorar o TraceQuest</h1>
        <p>Entre no ambiente de aprendizagem ou acompanhe a turma pela área da professora.</p>
        <div className="profile-grid">
          <button className="profile-card student-card" onClick={() => navigate('/login/aluno')}>
            <div className="profile-art mint-art"><span>⌕</span><i>♥</i></div>
            <span className="profile-label">Sou estudante</span>
            <h2>Quero investigar</h2>
            <p>Resolva missões, conecte requisitos e testes e acompanhe seu progresso.</p>
            <strong>Entrar como estudante →</strong>
          </button>
          <button className="profile-card teacher-card" onClick={() => navigate('/login/professor')}>
            <div className="profile-art purple-art"><span>⌕</span><i>✓</i></div>
            <span className="profile-label">Sou professora</span>
            <h2>Quero acompanhar</h2>
            <p>Cadastre exercícios, defina gabaritos e acompanhe os resultados da turma.</p>
            <strong>Entrar como professora →</strong>
          </button>
        </div>
      </main>
      <DecorativeLandscape />
    </div>
  );
}

export function LoginPage({ role = 'student' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register } = useAuth();
  const teacher = role === 'teacher';
  const [mode, setMode] = useState('login'); // login | register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && user.role === role) {
    return <Navigate to={teacher ? '/professor/dashboard' : '/aluno/inicio'} replace />;
  }

  const registering = mode === 'register' && !teacher;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (registering) await register(name, email, password);
      else await login(email, password, role);
      const from = location.state?.from;
      navigate(from && from.startsWith(teacher ? '/professor' : '/aluno') ? from : teacher ? '/professor/dashboard' : '/aluno/inicio', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`login-page ${teacher ? 'teacher-login' : ''}`}>
      <div className="login-top"><Brand /><Link to="/">← Voltar à escolha de perfil</Link></div>
      <section className="login-content">
        <div className="login-illustration">
          <span className={`expedition-chip ${teacher ? 'teacher-chip' : ''}`}>{teacher ? '▣ ESTAÇÃO DA PROFESSORA' : '✧ EXPEDIÇÃO DO ESTUDANTE'}</span>
          <h1>{teacher ? <>Boas missões<br />começam com você.</> : <>Cada conexão<br />revela uma pista.</>}</h1>
          <p>{teacher ? 'Prepare atividades, acompanhe a turma e transforme os erros recorrentes em novas pistas de aprendizagem.' : 'Investigue requisitos, conecte casos de teste e descubra o que falta para completar a missão.'}</p>
          <div className={`investigation-board ${teacher ? 'teacher-board' : ''}`}>
            <div className="paper paper-a"><b>{teacher ? 'Turma' : 'RF01'}</b><span>{teacher ? 'Resultados' : 'Login do usuário'}</span></div>
            <div className="thread">··········➜</div>
            <div className="paper paper-b"><b>{teacher ? 'Cobertura' : 'CT01'}</b><span>{teacher ? 'Dificuldades' : 'Credenciais válidas'}</span></div>
            <div className="trace-mascot">⌕<span>{teacher ? '✓' : '♥'}</span></div>
          </div>
        </div>
        <form className="login-card" onSubmit={submit} noValidate>
          <span className="login-kicker">{teacher ? 'ACESSO DA PROFESSORA' : registering ? 'NOVA EXPEDIÇÃO' : 'BEM-VINDO DE VOLTA'}</span>
          <h2>{teacher ? 'Vamos acompanhar?' : registering ? 'Crie sua conta' : 'Vamos investigar?'}</h2>
          <p>{teacher ? 'Entre para acessar sua turma.' : registering ? 'Leva menos de um minuto.' : 'Entre para continuar sua trilha.'}</p>
          {registering && <label>Nome<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" /></label>}
          <label>E-mail<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={teacher ? 'camila@uea.edu.br' : 'ana@uea.edu.br'} /></label>
          <label>Senha<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></label>
          {!registering && (
            <div className="login-options">
              <span />
              <button type="button" className="link-button-plain" onClick={() => setInfo('Para redefinir a senha, peça ajuda à professora responsável.')}>Esqueci minha senha</button>
            </div>
          )}
          <Banner kind="error">{error}</Banner>
          <Banner kind="info">{info}</Banner>
          <button className={`primary-button ${teacher ? 'purple-button' : ''}`} disabled={busy}>{busy ? 'Aguarde...' : registering ? 'Criar conta →' : 'Entrar →'}</button>
          {!teacher && (
            <button type="button" className="link-button-plain center" onClick={() => { setMode(registering ? 'login' : 'register'); setError(''); setInfo(''); }}>
              {registering ? 'Já tenho conta' : 'Ainda não tenho conta'}
            </button>
          )}
          <Link className="center-link" to={teacher ? '/login/aluno' : '/login/professor'}>{teacher ? 'Ver área do estudante' : 'Ver área da professora'}</Link>
        </form>
      </section>
      <footer className="login-footer"><b>{teacher ? 'Ensinar também é investigar.' : 'Pequenos rastros, grandes conquistas!'}</b><span>• Rastreabilidade &nbsp; • Cobertura &nbsp; • Adequação</span></footer>
    </div>
  );
}
