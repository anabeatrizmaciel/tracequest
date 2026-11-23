import { useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from './api.js';
import { useAuth } from './auth.jsx';

export function Brand({ compact = false }) {
  return (
    <Link to="/" className={`brand ${compact ? 'compact-brand' : ''}`} aria-label="TraceQuest">
      <span className="brand-bug" aria-hidden="true"><span>⌕</span><i>♥</i></span>
      <span className="brand-trace">Trace</span><span className="brand-quest">Quest</span>
    </Link>
  );
}

function HeaderSearch({ teacher }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') || '');
  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(`${teacher ? '/professor/exercicios' : '/aluno/missoes'}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };
  return (
    <form className="search-box" onSubmit={submit} role="search">
      <span>⌕</span>
      <input
        aria-label="Buscar"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={teacher ? 'Buscar exercícios...' : 'Buscar missões, conceitos ou desafios...'}
      />
    </form>
  );
}

function UserHeader({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const teacher = role === 'teacher';
  const home = useApi(teacher ? null : 'student/home');
  const streak = home.data?.streak;
  const leave = () => { logout(); navigate('/'); };
  return (
    <header className="app-header">
      <Brand compact />
      <div className="header-actions">
        <HeaderSearch teacher={teacher} />
        {!teacher && <div className="streak"><span>🔥</span><b>{streak ?? 0} {streak === 1 ? 'dia seguido' : 'dias seguidos'}</b></div>}
        {teacher && <span className="role-pill">Professora</span>}
        <div className="user-menu">
          <button className="user-mini user-button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <span className={`avatar ${teacher ? 'orange' : 'mint'}`}>{teacher ? (user?.firstName || 'P')[0] : '✦'}</span>
            <span>
              <b>{teacher ? `Prof. ${user?.firstName}` : `Olá, ${user?.firstName}!`}</b>
              <small>{teacher ? user?.subtitle || 'Professora' : 'Pronta para investigar?'}</small>
            </span>
          </button>
          {open && (
            <div className="user-dropdown">
              <small>{user?.email}</small>
              <button onClick={leave}>Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar({ role }) {
  const teacher = role === 'teacher';
  const studentLinks = [
    ['/aluno/inicio', '⌂', 'Início'], ['/aluno/missoes', '⌁', 'Missões'], ['/aluno/conquistas', '★', 'Conquistas'], ['/aluno/progresso', '▥', 'Progresso'],
  ];
  const teacherLinks = [
    ['/professor/dashboard', '▦', 'Dashboard'], ['/professor/exercicios', '▤', 'Exercícios'], ['/professor/resultados', '◉', 'Resultados'],
  ];
  return (
    <aside className="sidebar">
      <nav>
        {(teacher ? teacherLinks : studentLinks).map(([to, icon, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? (teacher ? 'teacher-active' : 'active') : ''}`}>
            <span className="nav-icon">{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-help">
        <span className="mini-mascot">⌕</span>
        <b>{teacher ? 'Central da professora' : 'Caderno do Trace'}</b>
        <small>{teacher ? 'Acompanhe as pistas da turma.' : 'Cada erro também é uma pista.'}</small>
      </div>
    </aside>
  );
}

export function Shell({ role = 'student', children }) {
  return (
    <div className="app-frame">
      <UserHeader role={role} />
      <div className="app-body">
        <Sidebar role={role} />
        <main className={`main ${role === 'teacher' ? 'teacher-main' : 'student-main'}`}>{children}</main>
      </div>
    </div>
  );
}

export function Loading({ label = 'Carregando pistas...' }) {
  return <div className="state-box" role="status"><span className="spinner" />{label}</div>;
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="state-box error-box" role="alert">
      <b>Ops! Não foi possível carregar.</b>
      <span>{error?.message}</span>
      {onRetry && <button className="secondary-button" onClick={onRetry}>Tentar de novo</button>}
    </div>
  );
}

/** Mostra carregando/erro; quando há dados, renderiza children(data). */
export function Async({ state, children }) {
  if (state.loading && !state.data) return <Loading />;
  if (state.error) return <ErrorBox error={state.error} onRetry={state.reload} />;
  return state.data ? children(state.data) : null;
}

export function StatCard({ value, label, tone = 'lavender', hint }) {
  return <div className={`stat-card ${tone}`}><strong>{value}</strong><span>{label}</span>{hint && <small>{hint}</small>}</div>;
}

export function Banner({ kind = 'error', children }) {
  if (!children) return null;
  return <div className={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function formatMinutes(min) {
  if (min == null) return '-';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function NotFound() {
  return <div className="not-found"><Brand /><h1>Pista não encontrada.</h1><Link to="/">Voltar ao início</Link></div>;
}
