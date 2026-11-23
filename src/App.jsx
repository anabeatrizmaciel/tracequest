import { useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';

const missionData = [
  { id: 1, title: 'Primeiros Rastros', subtitle: 'Reconheça requisitos e casos de teste', level: 'Iniciante', status: 'Concluída', xp: 100, tone: 'mint' },
  { id: 2, title: 'Conectando Pontos', subtitle: 'Relacione requisitos, cobertura e evidências', level: 'Intermediária', status: 'Em andamento', xp: 150, tone: 'lavender' },
  { id: 3, title: 'Caça à Cobertura', subtitle: 'Encontre comportamentos ainda sem teste', level: 'Intermediária', status: 'Disponível', xp: 180, tone: 'yellow' },
  { id: 4, title: 'Caso Suspeito', subtitle: 'Descubra associações inadequadas', level: 'Avançada', status: 'Bloqueada', xp: 220, tone: 'pink' },
];

const exerciseRows = [
  { id: 'EX-01', title: 'Conectando Pontos', mission: 'Missão 2', questions: 3, status: 'Publicado' },
  { id: 'EX-02', title: 'Caça à Cobertura', mission: 'Missão 3', questions: 4, status: 'Rascunho' },
  { id: 'EX-03', title: 'Caso Suspeito', mission: 'Missão 4', questions: 3, status: 'Publicado' },
];

const studentRows = [
  { name: 'Ana Beatriz', score: 92, correct: '8/9', time: '12 min', difficulty: 'Cobertura parcial' },
  { name: 'Gabriela Lima', score: 78, correct: '7/9', time: '15 min', difficulty: 'Cobertura parcial' },
  { name: 'Pedro Souza', score: 67, correct: '6/9', time: '17 min', difficulty: 'Requisito sem teste' },
  { name: 'Lucas Melo', score: 89, correct: '8/9', time: '11 min', difficulty: 'Associação inadequada' },
];

const requirements = [
  { id: 'RF01', text: 'O usuário pode entrar com e-mail e senha.' },
  { id: 'RF02', text: 'O usuário pode solicitar redefinição de senha.' },
  { id: 'RF03', text: 'Após 5 tentativas inválidas, a conta é bloqueada.' },
];
const tests = [
  { id: 'CT01', text: 'Login com credenciais válidas.' },
  { id: 'CT02', text: 'Solicitar redefinição para e-mail cadastrado.' },
  { id: 'CT03', text: 'Realizar 5 tentativas inválidas e tentar novamente.' },
];
const correctLinks = { RF01: 'CT01', RF02: 'CT02', RF03: 'CT03' };

function Brand({ compact = false }) {
  return (
    <Link to="/" className={`brand ${compact ? 'compact-brand' : ''}`} aria-label="TraceQuest">
      <span className="brand-bug" aria-hidden="true"><span>⌕</span><i>♥</i></span>
      <span className="brand-trace">Trace</span><span className="brand-quest">Quest</span>
    </Link>
  );
}

function BrowserBar() {
  return (
    <div className="browser-bar">
      <div className="browser-dots"><i /><i /><i /></div>
      <div className="browser-address">app.tracequest.com</div>
      <div className="browser-spacer" />
    </div>
  );
}

function UserHeader({ role = 'student' }) {
  const navigate = useNavigate();
  const isTeacher = role === 'teacher';
  return (
    <header className="app-header">
      <Brand compact />
      <div className="header-actions">
        <div className="search-box">⌕ <span>Buscar missões, conceitos ou desafios...</span></div>
        {!isTeacher && <div className="streak"><span>🔥</span><b>3 dias seguidos</b></div>}
        {isTeacher && <span className="role-pill">Professora</span>}
        <button className="user-mini user-button" onClick={() => navigate(isTeacher ? '/login/professor' : '/login/aluno')}>
          <span className={`avatar ${isTeacher ? 'orange' : 'mint'}`}>{isTeacher ? 'C' : '✦'}</span>
          <span><b>{isTeacher ? 'Prof. Camila' : 'Olá, Ana!'}</b><small>{isTeacher ? 'Engenharia de Software' : 'Pronta para investigar?'}</small></span>
        </button>
      </div>
    </header>
  );
}

function Sidebar({ role = 'student' }) {
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

function Shell({ role = 'student', children }) {
  return (
    <div className="app-frame">
      <BrowserBar />
      <UserHeader role={role} />
      <div className="app-body">
        <Sidebar role={role} />
        <main className={`main ${role === 'teacher' ? 'teacher-main' : 'student-main'}`}>{children}</main>
      </div>
    </div>
  );
}

function ProfileChoice() {
  const navigate = useNavigate();
  return (
    <div className="profile-page">
      <BrowserBar />
      <div className="profile-top"><Brand /></div>
      <main className="profile-content">
        <span className="eyebrow peach">BEM-VINDA AO TRACEQUEST</span>
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

function DecorativeLandscape() {
  return <div className="landscape"><i /><i /><i /><i /><i /></div>;
}

function LoginPage({ role = 'student' }) {
  const navigate = useNavigate();
  const teacher = role === 'teacher';
  const [email, setEmail] = useState(teacher ? 'camila@uea.edu.br' : 'ana@uea.edu.br');
  const [password, setPassword] = useState('tracequest');
  return (
    <div className={`login-page ${teacher ? 'teacher-login' : ''}`}>
      <BrowserBar />
      <div className="login-top"><Brand /><Link to="/">← Voltar à escolha de perfil</Link></div>
      <section className="login-content">
        <div className="login-illustration">
          <span className={`expedition-chip ${teacher ? 'teacher-chip' : ''}`}>{teacher ? '▣ ESTAÇÃO DA PROFESSORA' : '✧ EXPEDIÇÃO DO ESTUDANTE'}</span>
          <h1>{teacher ? <>Boas missões<br />começam com você.</> : <>Cada conexão<br />revela uma pista.</>}</h1>
          <p>{teacher ? 'Prepare atividades, acompanhe a turma e transforme os erros recorrentes em novas pistas de aprendizagem.' : 'Investigue requisitos, conecte casos de teste e descubra o que falta para completar a missão.'}</p>
          <div className={`investigation-board ${teacher ? 'teacher-board' : ''}`}>
            <div className="paper paper-a"><b>{teacher ? 'Turma' : 'RF01'}</b><span>{teacher ? '32 estudantes' : 'Login do usuário'}</span></div>
            <div className="thread">··········➜</div>
            <div className="paper paper-b"><b>{teacher ? 'Cobertura' : 'CT01'}</b><span>{teacher ? '42% de dificuldade' : 'Credenciais válidas'}</span></div>
            <div className="trace-mascot">⌕<span>{teacher ? '✓' : '♥'}</span></div>
          </div>
        </div>
        <form className="login-card" onSubmit={(e) => { e.preventDefault(); navigate(teacher ? '/professor/dashboard' : '/aluno/inicio'); }}>
          <span className="login-kicker">{teacher ? 'ACESSO DA PROFESSORA' : 'BEM-VINDA DE VOLTA'}</span>
          <h2>{teacher ? 'Vamos acompanhar?' : 'Vamos investigar?'}</h2>
          <p>{teacher ? 'Entre para acessar sua turma.' : 'Entre para continuar sua trilha.'}</p>
          <label>E-mail<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <div className="login-options"><label className="check-line"><input type="checkbox" defaultChecked /> Lembrar acesso</label><a href="#">Esqueci minha senha</a></div>
          <button className={`primary-button ${teacher ? 'purple-button' : ''}`}>Entrar →</button>
        </form>
      </section>
      <footer className="login-footer"><b>{teacher ? 'Ensinar também é investigar.' : 'Pequenos rastros, grandes conquistas!'}</b><span>• Rastreabilidade &nbsp; • Cobertura &nbsp; • Adequação</span></footer>
    </div>
  );
}

function StatCard({ value, label, tone = 'lavender', hint }) {
  return <div className={`stat-card ${tone}`}><strong>{value}</strong><span>{label}</span>{hint && <small>{hint}</small>}</div>;
}

function StudentHome() {
  const navigate = useNavigate();
  return (
    <Shell>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow yellow-chip">TRILHA ATUAL</span>
          <h1>TraceQuest</h1><h2>Bem-vinda, Ana!</h2>
          <p>Continue sua expedição pela rastreabilidade e descubra novas pistas.</p>
          <button className="primary-button compact" onClick={() => navigate('/aluno/missao/2')}>Continuar missão</button>
        </div>
        <div className="hero-map">
          <div className="map-card"><b>Expedição</b><span>Investigação 01</span><small>Rastreabilidade</small></div>
          <div className="hero-mascot">⌕<span>♥</span></div>
          <span className="map-dot d1" /><span className="map-dot d2" /><span className="map-dot d3" />
          <div className="dotted-path">· · · · · · · · · · · ·</div>
        </div>
      </section>
      <section className="stats-grid">
        <StatCard value="2 de 10" label="Missões concluídas" tone="pink" />
        <StatCard value="+400 XP" label="Experiência" tone="lavender" />
        <StatCard value="3 dias" label="Sequência" tone="mint" />
        <StatCard value="5" label="Conquistas" tone="yellow" />
      </section>
      <section className="home-grid">
        <div className="panel"><div className="panel-title"><h3>Próxima pista</h3><span>Missão 2</span></div><h2>Conectando Pontos</h2><p>Relacione requisitos aos casos de teste que realmente verificam cada comportamento.</p><button className="secondary-button" onClick={() => navigate('/aluno/missao/2')}>Abrir investigação</button></div>
        <div className="panel lavender-panel"><h3>Seu caderno de campo</h3><p>Você já reconhece vínculos diretos. Agora é hora de investigar cobertura parcial.</p><div className="progress"><i style={{ width: '62%' }} /></div><small>62% da trilha atual</small></div>
      </section>
    </Shell>
  );
}

function Missions() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const filtered = missionData.filter((m) => `${m.title} ${m.subtitle}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Shell>
      <section className="page-heading"><div><span className="eyebrow">MAPA DA TRILHA</span><h1>Missões</h1><p>Escolha uma investigação e avance no seu ritmo.</p></div><span className="tiny-pill">2 de 10 concluídas</span></section>
      <div className="inline-search"><span>⌕</span><input placeholder="Buscar missão..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <div className="missions-layout">
        <section className="mission-list">
          {filtered.map((m, idx) => <article key={m.id} className={`mission-card ${m.tone} ${m.status === 'Bloqueada' ? 'locked' : ''}`}>
            <div className="mission-index">{m.status === 'Concluída' ? '✓' : idx + 1}</div>
            <div><small>{m.level}</small><h3>{m.title}</h3><p>{m.subtitle}</p><span className="xp-tag">+{m.xp} XP</span></div>
            <div className="mission-meta"><span>{m.status}</span>{m.status !== 'Bloqueada' && <button onClick={() => navigate(`/aluno/missao/${m.id}`)}>{m.status === 'Concluída' ? 'Revisar' : 'Continuar'} →</button>}</div>
          </article>)}
        </section>
        <aside className="trail-summary">
          <h3>Rota de investigação</h3>
          <div className="trail-line"><i className="done" /><i className="current" /><i /><i /></div>
          <p><b>Próximo objetivo</b><br />Concluir “Conectando Pontos”.</p>
          <div className="note-card"><b>Pista do Trace</b><span>Conecte comportamentos, não apenas códigos.</span></div>
        </aside>
      </div>
    </Shell>
  );
}

function MissionDetail() {
  const navigate = useNavigate();
  return (
    <Shell>
      <section className="mission-detail-hero">
        <div className="mission-copy"><span className="eyebrow">MISSÃO 02 · INTERMEDIÁRIA</span><h1>Conectando Pontos</h1><p>Investigue como requisitos e casos de teste se relacionam e descubra quando a cobertura ainda está incompleta.</p><div className="mission-tags"><span>3 desafios</span><span>+150 XP</span><span>≈ 10 min</span></div><button className="primary-button" onClick={() => navigate('/aluno/desafio/1')}>Iniciar missão →</button></div>
        <div className="mission-case-file"><span className="pin">●</span><b>CASO #002</b><h3>O mistério da cobertura</h3><p>Você recebeu requisitos e evidências de teste. Sua missão é reconstruir a rastreabilidade correta.</p><div className="case-stamp">EM INVESTIGAÇÃO</div></div>
      </section>
      <section className="mission-objectives">
        <div><span>01</span><b>Relacionar</b><p>Conecte cada requisito ao teste que verifica seu comportamento.</p></div>
        <div><span>02</span><b>Diagnosticar</b><p>Descubra se a cobertura é completa, parcial ou inexistente.</p></div>
        <div><span>03</span><b>Completar</b><p>Escolha a evidência que falta para fechar a investigação.</p></div>
      </section>
    </Shell>
  );
}

function ChallengeHeader({ number, title, instruction }) {
  return <div className="challenge-heading"><span>CONECTANDO PONTOS / INVESTIGAÇÃO {String(number).padStart(2, '0')} / 03</span><h1>{title}</h1><p>{instruction}</p></div>;
}

function InvestigationCard({ item, selected, example, onClick, disabled }) {
  return <button disabled={disabled} onClick={onClick} className={`investigation-card ${selected ? 'selected' : ''} ${example ? 'example' : ''}`}><div><b>{item.id}</b><span className="radio">{selected ? '●' : '○'}</span></div><p>{item.text}</p></button>;
}

function ChallengeOne() {
  const navigate = useNavigate();
  const [links, setLinks] = useState({ RF01: 'CT01' });
  const [pendingRf, setPendingRf] = useState(null);
  const [message, setMessage] = useState('RF01 ↔ CT01 é um exemplo. Nas outras fichas, procure o teste que verifica o comportamento pedido.');
  const [result, setResult] = useState(null);
  const selectedTests = useMemo(() => new Set(Object.values(links)), [links]);
  function chooseRf(id) { if (id === 'RF01') return; setPendingRf(id); setMessage(`${id} selecionado. Agora escolha o caso de teste correspondente.`); setResult(null); }
  function chooseTest(id) { if (!pendingRf || selectedTests.has(id)) return; setLinks((prev) => ({ ...prev, [pendingRf]: id })); setMessage(`${pendingRf} ↔ ${id} conectado. Continue investigando.`); setPendingRf(null); }
  function verify() {
    if (Object.keys(links).length < 3) { setResult('missing'); return; }
    const ok = Object.entries(correctLinks).every(([rf, ct]) => links[rf] === ct);
    navigate(ok ? '/aluno/feedback/1/correto' : '/aluno/feedback/1/erro', { state: { links } });
  }
  return (
    <Shell>
      <ChallengeHeader number={1} title="Desafio 1: conecte os rastros" instruction="Relacione cada requisito ao caso de teste que verifica seu comportamento." />
      <div className="cork-board">
        <div className="board-head"><h2>Quem testa o quê?</h2><span>{Object.keys(links).length} vínculo(s) encontrado(s)</span></div>
        <div className="link-grid">
          <div className="cards-column">{requirements.map((r) => <InvestigationCard key={r.id} item={r} example={r.id === 'RF01'} selected={r.id === 'RF01' || pendingRf === r.id || links[r.id]} onClick={() => chooseRf(r.id)} />)}</div>
          <div className="relations-column">{requirements.map((r) => <div key={r.id} className={`relation ${links[r.id] ? 'linked' : ''}`}><b>{links[r.id] ? '↔' : '···'}</b><small>{links[r.id] ? (r.id === 'RF01' ? 'Exemplo' : links[r.id]) : 'Escolher'}</small></div>)}</div>
          <div className="cards-column">{tests.map((t) => <InvestigationCard key={t.id} item={t} example={t.id === 'CT01'} selected={selectedTests.has(t.id)} disabled={t.id === 'CT01' || selectedTests.has(t.id)} onClick={() => chooseTest(t.id)} />)}</div>
        </div>
        <div className="field-note"><b>Caderno de campo</b><span>{message}</span></div>
      </div>
      <div className="challenge-actions"><span>Dica: conecte comportamentos, não apenas códigos.</span><div><button className="secondary-button" onClick={() => { setLinks({ RF01: 'CT01' }); setPendingRf(null); setResult(null); }}>Limpar</button><button className="primary-button compact" onClick={verify}>Verificar</button></div></div>
      {result === 'missing' && <div className="toast">Ainda faltam relações para verificar.</div>}
    </Shell>
  );
}

function FeedbackPage({ number, correct = false }) {
  const navigate = useNavigate();
  const data = {
    '1-correct': { title: 'Boa investigação!', subtitle: 'Você conectou os rastros corretamente.', sections: [['O que você descobriu', 'Cada caso de teste verifica diretamente o comportamento descrito no requisito correspondente.'], ['Por que está correto?', 'RF01 ↔ CT01, RF02 ↔ CT02 e RF03 ↔ CT03 formam relações coerentes entre especificação e evidência.'], ['Dica do Trace', 'Uma associação correta depende do comportamento testado, não apenas do código do artefato.']], button: 'Continuar investigação', to: '/aluno/desafio/2' },
    '1-error': { title: 'Quase! — revise as conexões', subtitle: 'Algum rastro foi conectado à evidência errada.', sections: [['Lembrete', 'O caso de teste precisa verificar o comportamento descrito pelo requisito.'], ['Como revisar', 'Leia a ação e o resultado esperado de cada teste antes de olhar para o código RF/CT.'], ['Dica do Trace', 'Procure verbos e condições equivalentes entre requisito e caso de teste.']], button: 'Tentar novamente', to: '/aluno/desafio/1' },
    '2-correct': { title: 'Boa investigação! — você encontrou a lacuna', subtitle: 'A cobertura deste requisito é parcial.', sections: [['Cobertura parcial identificada', 'Os testes existentes verificam parte do comportamento, mas ainda existe uma situação não testada.'], ['O que você descobriu', 'CT03 verifica o bloqueio após cinco tentativas e CT04 verifica o acesso negado durante o período de bloqueio.'], ['Próximo passo', 'Agora descubra qual caso de teste deve ser acrescentado ao conjunto.']], button: 'Continuar investigação', to: '/aluno/desafio/3' },
    '2-error': { title: 'Quase! — revise a cobertura', subtitle: 'A classificação escolhida não corresponde às evidências.', sections: [['Lembrete', 'Um requisito pode ter casos de teste associados e ainda assim não estar completamente coberto.'], ['Como revisar sua escolha', 'Compare cada comportamento descrito no requisito com o que os testes realmente verificam.'], ['Dica do Trace', 'Não conte apenas quantos testes existem. Pergunte se todos os comportamentos foram testados.']], button: 'Tentar novamente', to: '/aluno/desafio/2' },
    '3-correct': { title: 'Resolvido!', subtitle: 'Você encontrou a evidência que faltava.', sections: [['O que você descobriu', 'CT06 verifica o comportamento ainda não coberto: permitir uma nova tentativa após os 15 minutos de bloqueio.'], ['Por que está correto?', 'CT03 verifica o bloqueio, CT04 o acesso negado durante o período e CT06 o comportamento após o tempo de bloqueio.'], ['Dica do Trace', 'Cobertura completa significa que todos os comportamentos especificados possuem evidências de teste.']], button: 'Concluir missão', to: '/aluno/missao-concluida' },
    '3-error': { title: 'Quase! — revise a evidência escolhida', subtitle: 'O teste selecionado não completa a cobertura.', sections: [['Lembrete', 'O teste escolhido precisa verificar justamente o comportamento que ainda não aparece nas evidências existentes.'], ['Como revisar sua escolha', 'Compare novamente o requisito com CT03 e CT04 e procure qual parte da regra ainda não foi testada.'], ['Dica do Trace', 'Preste atenção no que deve acontecer depois que o período de bloqueio termina.']], button: 'Tentar novamente', to: '/aluno/desafio/3' },
  }[`${number}-${correct ? 'correct' : 'error'}`];
  return (
    <Shell>
      <ChallengeHeader number={number} title={data.title} instruction={data.subtitle} />
      <section className={`feedback-board ${correct ? 'feedback-success' : 'feedback-error'}`}>
        <div className="feedback-banner"><span>{correct ? '✓' : '↺'}</span><div><b>{correct ? 'Evidência confirmada' : 'Pista para revisar'}</b><small>{correct ? 'Seu raciocínio está consistente.' : 'Use o feedback para tentar novamente.'}</small></div></div>
        <div className="feedback-sections">{data.sections.map(([title, text], i) => <article key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        <div className="feedback-footer"><div className="trace-tip"><span className="mini-mascot">⌕</span><b>Trace diz:</b><p>{correct ? 'Excelente! Continue seguindo as evidências.' : 'Errar faz parte da investigação — compare as pistas e tente de novo.'}</p></div><button className="primary-button" onClick={() => navigate(data.to)}>{data.button} →</button></div>
      </section>
    </Shell>
  );
}

function ChallengeTwo() {
  const navigate = useNavigate();
  const [choice, setChoice] = useState(null);
  const options = [
    ['none', 'Sem cobertura', 'Nenhum comportamento do requisito foi verificado.'],
    ['partial', 'Cobertura parcial', 'Alguns comportamentos foram testados, mas ainda faltam evidências.'],
    ['full', 'Cobertura completa', 'Todos os comportamentos importantes foram verificados por testes.'],
  ];
  return (
    <Shell>
      <ChallengeHeader number={2} title="Desafio 2: conserte a cobertura" instruction="Nem toda ligação significa cobertura completa. Analise o requisito, examine as evidências e descubra o que ainda falta testar." />
      <section className="evidence-board">
        <div className="requirement-highlight"><span>REQUISITO EM ANÁLISE</span><h3>RF03 — Segurança de acesso</h3><p>Após 5 tentativas inválidas, a conta deve ser bloqueada por 15 minutos. Depois desse período, o usuário deve poder tentar entrar novamente.</p></div>
        <div className="evidence-row"><article><b>CT03</b><p>Realizar 5 tentativas inválidas e verificar que a conta foi bloqueada.</p></article><article><b>CT04</b><p>Tentar fazer login durante o período de bloqueio e verificar que o acesso é negado.</p></article></div>
        <h3 className="question-title">Como está a cobertura deste requisito?</h3>
        <div className="choice-grid">{options.map(([id, title, text]) => <button key={id} className={choice === id ? 'choice-card selected-choice' : 'choice-card'} onClick={() => setChoice(id)}><span>{choice === id ? '●' : '○'}</span><div><b>{title}</b><p>{text}</p></div></button>)}</div>
        <div className="field-note"><b>Caderno de campo</b><span>Compare todos os comportamentos do requisito com as evidências existentes.</span></div>
      </section>
      <div className="challenge-actions"><span>Escolha a classificação mais adequada.</span><button className="primary-button compact" disabled={!choice} onClick={() => navigate(choice === 'partial' ? '/aluno/feedback/2/correto' : '/aluno/feedback/2/erro')}>Verificar resposta</button></div>
    </Shell>
  );
}

function ChallengeThree() {
  const navigate = useNavigate();
  const [choice, setChoice] = useState(null);
  const options = [
    ['CT05', 'Fazer login válido antes de qualquer tentativa incorreta.'],
    ['CT06', 'Aguardar 15 minutos após o bloqueio e verificar que uma nova tentativa de login é permitida.'],
    ['CT07', 'Alterar a senha enquanto a conta está bloqueada.'],
  ];
  return (
    <Shell>
      <ChallengeHeader number={3} title="Desafio 3: encontre a evidência que falta" instruction="A cobertura está incompleta. Escolha o caso de teste que completa a investigação." />
      <section className="evidence-board final-investigation">
        <div className="requirement-highlight"><span>PISTA PRINCIPAL</span><h3>RF03 — Segurança de acesso</h3><p>Após 5 tentativas inválidas, a conta deve ser bloqueada por 15 minutos. Depois desse período, o usuário deve poder tentar entrar novamente.</p></div>
        <div className="evidence-existing"><span>Já temos:</span><b>CT03 · bloqueio após 5 tentativas</b><b>CT04 · acesso negado durante o bloqueio</b></div>
        <h3 className="question-title">Qual caso de teste deveria ser acrescentado ao conjunto?</h3>
        <div className="vertical-choices">{options.map(([id, text]) => <button key={id} className={choice === id ? 'choice-card selected-choice' : 'choice-card'} onClick={() => setChoice(id)}><span>{choice === id ? '●' : '○'}</span><div><b>{id}</b><p>{text}</p></div></button>)}</div>
        <div className="field-note"><b>Caderno de campo • complete a investigação</b><span>Revise o requisito e procure pelo comportamento que ainda não foi verificado.</span></div>
      </section>
      <div className="challenge-actions"><span>Escolha o caso de teste que completa a cobertura.</span><button className="primary-button compact" disabled={!choice} onClick={() => navigate(choice === 'CT06' ? '/aluno/feedback/3/correto' : '/aluno/feedback/3/erro')}>Verificar pista</button></div>
    </Shell>
  );
}

function MissionComplete() {
  const navigate = useNavigate();
  return (
    <Shell>
      <section className="complete-card">
        <div className="confetti">✦ · ✧ · ★ · ✦ · ✧</div><div className="complete-mascot">⌕<span>♥</span></div><span className="eyebrow mint-chip">MISSÃO CONCLUÍDA</span><h1>Você desvendou os caminhos!</h1><p>Você conectou requisitos a testes, identificou uma cobertura parcial e encontrou a evidência que faltava.</p>
        <div className="reward-grid"><div><strong>+150 XP</strong><span>Experiência</span></div><div><strong>3/3</strong><span>Desafios resolvidos</span></div><div><strong>1 nova</strong><span>Conquista</span></div></div>
        <div className="badge-earned"><span>★</span><div><b>Detetive de Cobertura</b><small>Nova conquista desbloqueada</small></div></div>
        <div className="complete-actions"><button className="secondary-button" onClick={() => navigate('/aluno/missoes')}>Voltar às missões</button><button className="primary-button" onClick={() => navigate('/aluno/progresso')}>Ver meu progresso →</button></div>
      </section>
    </Shell>
  );
}

function ProgressPage() {
  return (
    <Shell>
      <section className="page-heading"><div><span className="eyebrow">SEU CAMINHO</span><h1>Progresso</h1><p>Veja como sua investigação evolui ao longo das missões.</p></div></section>
      <section className="progress-hero"><div><span>Progresso geral</span><strong>62%</strong><div className="progress huge"><i style={{ width: '62%' }} /></div><small>Você está avançando muito bem.</small></div><div className="progress-compass">⌁<span>6/10</span></div></section>
      <section className="stats-grid"><StatCard value="6 de 10" label="Missões concluídas" tone="pink" /><StatCard value="1.240 XP" label="Experiência acumulada" tone="lavender" /><StatCard value="84%" label="Taxa de acerto" tone="mint" /><StatCard value="7" label="Conquistas" tone="yellow" /></section>
      <section className="panel progress-list"><h3>Domínio por habilidade</h3><SkillProgress label="Relações RF ↔ CT" value={92} /><SkillProgress label="Cobertura de requisitos" value={76} /><SkillProgress label="Associações inadequadas" value={68} /><SkillProgress label="Análise de evidências" value={81} /></section>
    </Shell>
  );
}

function SkillProgress({ label, value }) { return <div className="skill-row"><div><b>{label}</b><span>{value}%</span></div><div className="progress"><i style={{ width: `${value}%` }} /></div></div>; }

function AchievementsPage() {
  const items = [
    ['Primeiro Rastro', 'Concluiu sua primeira missão.', '✓', 'earned'], ['Detetive de Cobertura', 'Encontrou uma lacuna de cobertura.', '★', 'earned'], ['Conexão Perfeita', 'Relacionou todos os RF e CT sem erros.', '↔', 'earned'], ['Sequência de 5', 'Estude por cinco dias seguidos.', '🔥', 'earned'], ['Olhar Clínico', 'Identifique 10 associações inadequadas.', '⌕', 'locked'], ['Mestre da Trilha', 'Conclua todas as missões.', '♛', 'locked'],
  ];
  return (
    <Shell>
      <section className="page-heading"><div><span className="eyebrow">COLEÇÃO DE PISTAS</span><h1>Conquistas</h1><p>Marcos desbloqueados durante sua jornada.</p></div><span className="tiny-pill">4 de 6 desbloqueadas</span></section>
      <div className="achievement-grid">{items.map(([title, text, icon, status]) => <article key={title} className={`achievement-card ${status}`}><div className="achievement-icon">{icon}</div><span>{status === 'earned' ? 'DESBLOQUEADA' : 'BLOQUEADA'}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </Shell>
  );
}

function TeacherDashboard() {
  const navigate = useNavigate();
  return (
    <Shell role="teacher">
      <section className="page-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h1>Visão geral da turma</h1><p>Acompanhe desempenho e dificuldades em rastreabilidade.</p></div><button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/novo')}>+ Novo exercício</button></section>
      <section className="stats-grid teacher-stats"><StatCard value="32" label="Alunos ativos" tone="lavender" /><StatCard value="86%" label="Atividades concluídas" tone="mint" /><StatCard value="78 pts" label="Média da turma" tone="pink" /><StatCard value="Cobertura" label="Maior dificuldade" tone="yellow" /></section>
      <section className="teacher-grid"><div className="panel"><h3>Dificuldades recorrentes</h3><Difficulty label="Cobertura parcial" value={42} tone="orange" /><Difficulty label="Associação inadequada" value={28} tone="pinkbar" /><Difficulty label="Requisito sem teste" value={19} tone="purple" /></div><div className="panel lavender-panel actions-panel"><h3>Ações rápidas</h3><p>Crie uma atividade ou consulte os resultados detalhados da turma.</p><button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/novo')}>Criar exercício</button><button className="secondary-button" onClick={() => navigate('/professor/resultados')}>Ver resultados</button></div></section>
      <section className="panel recent-panel"><div className="panel-title"><h3>Atividades recentes</h3><Link to="/professor/exercicios">Ver todas</Link></div><MiniTable /></section>
    </Shell>
  );
}

function Difficulty({ label, value, tone }) { return <div className="difficulty"><div><span>{label}</span><b>{value}%</b></div><div className="bar"><i className={tone} style={{ width: `${value}%` }} /></div></div>; }
function MiniTable() { return <div className="mini-table"><div><b>Conectando Pontos</b><span>28 respostas</span><em>82% média</em></div><div><b>Primeiros Rastros</b><span>32 respostas</span><em>91% média</em></div><div><b>Caça à Cobertura</b><span>18 respostas</span><em>74% média</em></div></div>; }

function ExercisesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const rows = exerciseRows.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <Shell role="teacher">
      <section className="page-heading"><div><span className="eyebrow">ATIVIDADES</span><h1>Exercícios</h1><p>Gerencie os exercícios e os gabaritos da turma.</p></div><button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/novo')}>+ Criar exercício</button></section>
      <div className="inline-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar exercícios..." /></div>
      <section className="exercise-list">{rows.map((row) => <article key={row.id} className="exercise-row"><div className="exercise-code">{row.id}</div><div><small>{row.mission}</small><h3>{row.title}</h3><p>{row.questions} desafios cadastrados</p></div><span className={`status-pill ${row.status === 'Publicado' ? 'published' : 'draft'}`}>{row.status}</span><div className="row-actions"><button onClick={() => navigate('/professor/exercicios/novo')}>Editar</button><button onClick={() => navigate('/professor/resultados')}>Resultados</button></div></article>)}</section>
    </Shell>
  );
}

function CreateExerciseStepOne() {
  const navigate = useNavigate();
  const [requirementsLocal, setRequirementsLocal] = useState([{ code: 'RF01', description: 'O usuário pode entrar com e-mail e senha.' }]);
  const [testsLocal, setTestsLocal] = useState([{ code: 'CT01', description: 'Login com credenciais válidas.', expected: 'Acesso liberado.' }]);
  return (
    <Shell role="teacher">
      <section className="page-heading"><div><span className="eyebrow">CRIAR EXERCÍCIO · ETAPA 1 DE 2</span><h1>Dados e artefatos</h1><p>Cadastre o enunciado, os requisitos e os casos de teste.</p></div></section>
      <section className="form-panel"><div className="stepper"><span className="active-step">1</span><i /><span>2</span><div><b>Dados do exercício</b><b>Relações esperadas</b></div></div><div className="form-grid"><label>Título<input defaultValue="Conectando Pontos" /></label><label>Nível<select defaultValue="Intermediário"><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label><label className="full">Descrição<textarea defaultValue="Relacione requisitos e casos de teste e analise a cobertura obtida." /></label></div>
        <EditableCollection title="Requisitos" items={requirementsLocal} setItems={setRequirementsLocal} type="rf" />
        <EditableCollection title="Casos de teste" items={testsLocal} setItems={setTestsLocal} type="ct" />
        <div className="form-actions"><button className="secondary-button" onClick={() => navigate('/professor/exercicios')}>Cancelar</button><button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/relacoes')}>Continuar →</button></div>
      </section>
    </Shell>
  );
}

function EditableCollection({ title, items, setItems, type }) {
  const add = () => setItems((prev) => [...prev, type === 'rf' ? { code: `RF0${prev.length + 1}`, description: '' } : { code: `CT0${prev.length + 1}`, description: '', expected: '' }]);
  const update = (idx, key, value) => setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  const remove = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  return <div className="collection"><div className="collection-head"><h3>{title}</h3><button onClick={add}>+ Adicionar</button></div>{items.map((item, idx) => <div className="collection-row" key={idx}><input className="code-input" value={item.code} onChange={(e) => update(idx, 'code', e.target.value)} /><input value={item.description} placeholder="Descrição" onChange={(e) => update(idx, 'description', e.target.value)} />{type === 'ct' && <input value={item.expected} placeholder="Resultado esperado" onChange={(e) => update(idx, 'expected', e.target.value)} />}<button className="remove-btn" onClick={() => remove(idx)}>×</button></div>)}</div>;
}

function ExpectedRelationsPage() {
  const navigate = useNavigate();
  const [pairs, setPairs] = useState([{ rf: 'RF01', ct: 'CT01', explanation: 'CT01 verifica o login com credenciais válidas.' }]);
  const add = () => setPairs((p) => [...p, { rf: 'RF02', ct: 'CT02', explanation: '' }]);
  return (
    <Shell role="teacher">
      <section className="page-heading"><div><span className="eyebrow">CRIAR EXERCÍCIO · ETAPA 2 DE 2</span><h1>Definir relações esperadas</h1><p>Monte o gabarito e registre a justificativa utilizada no feedback.</p></div></section>
      <section className="relations-panel"><div className="stepper"><span>1</span><i className="filled" /><span className="active-step">2</span><div><b>Dados do exercício</b><b>Relações esperadas</b></div></div><div className="relation-builder-head"><div><h3>Gabarito RF ↔ CT</h3><p>Essas relações serão usadas na correção automática.</p></div><button onClick={add}>+ Nova relação</button></div>{pairs.map((pair, idx) => <div className="relation-builder" key={idx}><select value={pair.rf} onChange={(e) => setPairs((p) => p.map((x, i) => i === idx ? { ...x, rf: e.target.value } : x))}><option>RF01</option><option>RF02</option><option>RF03</option></select><span className="relation-arrow">↔</span><select value={pair.ct} onChange={(e) => setPairs((p) => p.map((x, i) => i === idx ? { ...x, ct: e.target.value } : x))}><option>CT01</option><option>CT02</option><option>CT03</option><option>CT04</option></select><textarea placeholder="Justificativa do feedback" value={pair.explanation} onChange={(e) => setPairs((p) => p.map((x, i) => i === idx ? { ...x, explanation: e.target.value } : x))} /></div>)}<div className="form-actions"><button className="secondary-button" onClick={() => navigate('/professor/exercicios/novo')}>← Voltar</button><button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios')}>Salvar exercício</button></div></section>
    </Shell>
  );
}

function ResultsPage() {
  const navigate = useNavigate();
  return (
    <Shell role="teacher">
      <section className="page-heading"><div><span className="eyebrow">RESULTADOS</span><h1>Resultados da turma</h1><p>Consulte desempenho, acertos e dificuldades por estudante.</p></div><button className="secondary-button">Exportar resumo</button></section>
      <section className="stats-grid"><StatCard value="32" label="Participantes" tone="lavender" /><StatCard value="78" label="Média da turma" tone="pink" /><StatCard value="7,4/9" label="Acertos médios" tone="mint" /><StatCard value="14 min" label="Tempo médio" tone="yellow" /></section>
      <section className="results-table panel"><div className="table-head"><span>Estudante</span><span>Nota</span><span>Acertos</span><span>Tempo</span><span>Maior dificuldade</span><span></span></div>{studentRows.map((s) => <div className="table-row" key={s.name}><span><b>{s.name}</b></span><span>{s.score}</span><span>{s.correct}</span><span>{s.time}</span><span>{s.difficulty}</span><button onClick={() => navigate('/professor/resultados/ana')}>Detalhes</button></div>)}</section>
    </Shell>
  );
}

function IndividualResultPage() {
  return (
    <Shell role="teacher">
      <section className="page-heading"><div><span className="eyebrow">RESULTADO INDIVIDUAL</span><h1>Resultados de Ana Beatriz</h1><p>Resumo do desempenho e das dificuldades observadas.</p></div><Link className="secondary-button link-button" to="/professor/resultados">← Voltar</Link></section>
      <section className="stats-grid"><StatCard value="92" label="Pontuação" tone="pink" /><StatCard value="89%" label="Taxa de acerto" tone="mint" /><StatCard value="8/9" label="Respostas corretas" tone="lavender" /><StatCard value="12 min" label="Tempo" tone="yellow" /></section>
      <section className="individual-grid"><div className="panel"><h3>Análise por desafio</h3><div className="attempt-row success"><span>✓</span><div><b>Desafio 1 · Relações RF ↔ CT</b><small>3/3 relações corretas</small></div><em>100%</em></div><div className="attempt-row warning"><span>!</span><div><b>Desafio 2 · Cobertura</b><small>1 erro antes da resposta correta</small></div><em>67%</em></div><div className="attempt-row success"><span>✓</span><div><b>Desafio 3 · Evidência que falta</b><small>Resposta correta na primeira tentativa</small></div><em>100%</em></div></div><div className="panel review-panel"><span className="eyebrow">SUGESTÃO DE REVISÃO</span><h3>Reforce cobertura parcial</h3><p>A estudante reconhece associações diretas, mas apresentou hesitação ao identificar quando um requisito possui testes e ainda assim permanece parcialmente coberto.</p><div className="review-tags"><span>Cobertura parcial</span><span>Análise de evidências</span></div><button className="secondary-button">Ver respostas da estudante</button></div></section>
    </Shell>
  );
}

function NotFound() { return <div className="not-found"><Brand /><h1>Pista não encontrada.</h1><Link to="/">Voltar ao início</Link></div>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<ProfileChoice />} />
    <Route path="/login/aluno" element={<LoginPage />} />
    <Route path="/login/professor" element={<LoginPage role="teacher" />} />

    <Route path="/aluno/inicio" element={<StudentHome />} />
    <Route path="/aluno/missoes" element={<Missions />} />
    <Route path="/aluno/missao/:id" element={<MissionDetail />} />
    <Route path="/aluno/desafio/1" element={<ChallengeOne />} />
    <Route path="/aluno/feedback/1/correto" element={<FeedbackPage number={1} correct />} />
    <Route path="/aluno/feedback/1/erro" element={<FeedbackPage number={1} />} />
    <Route path="/aluno/desafio/2" element={<ChallengeTwo />} />
    <Route path="/aluno/feedback/2/correto" element={<FeedbackPage number={2} correct />} />
    <Route path="/aluno/feedback/2/erro" element={<FeedbackPage number={2} />} />
    <Route path="/aluno/desafio/3" element={<ChallengeThree />} />
    <Route path="/aluno/feedback/3/correto" element={<FeedbackPage number={3} correct />} />
    <Route path="/aluno/feedback/3/erro" element={<FeedbackPage number={3} />} />
    <Route path="/aluno/missao-concluida" element={<MissionComplete />} />
    <Route path="/aluno/progresso" element={<ProgressPage />} />
    <Route path="/aluno/conquistas" element={<AchievementsPage />} />

    <Route path="/professor/dashboard" element={<TeacherDashboard />} />
    <Route path="/professor/exercicios" element={<ExercisesPage />} />
    <Route path="/professor/exercicios/novo" element={<CreateExerciseStepOne />} />
    <Route path="/professor/exercicios/relacoes" element={<ExpectedRelationsPage />} />
    <Route path="/professor/resultados" element={<ResultsPage />} />
    <Route path="/professor/resultados/ana" element={<IndividualResultPage />} />

    <Route path="*" element={<NotFound />} />
  </Routes>;
}
