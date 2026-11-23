import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, useApi } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Async, Banner, Shell, StatCard } from '../components.jsx';

const KIND_TITLE = {
  association: 'conecte os rastros',
  coverage: 'conserte a cobertura',
  missing: 'encontre a evidência que falta',
};

/* ------------------------------------------------------------------ início */

export function StudentHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useApi('student/home');
  return (
    <Shell>
      <Async state={state}>{(h) => (
        <>
          <section className="hero-card">
            <div className="hero-copy">
              <span className="eyebrow yellow-chip">TRILHA ATUAL</span>
              <h1>TraceQuest</h1><h2>Olá, {user.firstName}!</h2>
              <p>{h.next ? 'Continue sua expedição pela rastreabilidade e descubra novas pistas.' : h.missionsTotal ? 'Você concluiu todas as missões disponíveis. Novas pistas chegam em breve!' : 'Ainda não há missões publicadas. Volte em breve!'}</p>
              {h.next && <button className="primary-button compact" onClick={() => navigate(`/aluno/missao/${h.next.id}`)}>{h.next.status === 'Em andamento' ? 'Continuar missão' : 'Começar missão'}</button>}
            </div>
            <div className="hero-map">
              <div className="map-card"><b>Expedição</b><span>Investigação {String(Math.min(h.missionsDone + 1, Math.max(h.missionsTotal, 1))).padStart(2, '0')}</span><small>Rastreabilidade</small></div>
              <div className="hero-mascot">⌕<span>♥</span></div>
              <span className="map-dot d1" /><span className="map-dot d2" /><span className="map-dot d3" />
              <div className="dotted-path">· · · · · · · · · · · ·</div>
            </div>
          </section>
          <section className="stats-grid">
            <StatCard value={`${h.missionsDone} de ${h.missionsTotal}`} label="Missões concluídas" tone="pink" />
            <StatCard value={`+${h.xp} XP`} label="Experiência" tone="lavender" />
            <StatCard value={`${h.streak} ${h.streak === 1 ? 'dia' : 'dias'}`} label="Sequência" tone="mint" />
            <StatCard value={h.achievements} label="Conquistas" tone="yellow" />
          </section>
          <section className="home-grid">
            <div className="panel">
              {h.next ? (
                <>
                  <div className="panel-title"><h3>Próxima pista</h3><span>Missão {h.next.number}</span></div>
                  <h2>{h.next.title}</h2>
                  <p>{h.next.description || h.next.subtitle}</p>
                  <button className="secondary-button" onClick={() => navigate(`/aluno/missao/${h.next.id}`)}>Abrir investigação</button>
                </>
              ) : (
                <>
                  <div className="panel-title"><h3>Próxima pista</h3></div>
                  <h2>Tudo investigado por aqui</h2>
                  <p>Revise suas missões ou veja suas conquistas.</p>
                  <button className="secondary-button" onClick={() => navigate('/aluno/missoes')}>Ver missões</button>
                </>
              )}
            </div>
            <div className="panel lavender-panel">
              <h3>Seu caderno de campo</h3>
              <p>{h.missionsDone ? 'Você já reconhece vínculos diretos. Agora é hora de investigar cobertura parcial.' : 'Comece sua primeira missão para registrar as primeiras pistas.'}</p>
              <div className="progress"><i style={{ width: `${h.progress}%` }} /></div>
              <small>{h.progress}% da trilha concluída</small>
            </div>
          </section>
        </>
      )}</Async>
    </Shell>
  );
}

/* ----------------------------------------------------------------- missões */

export function Missions() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  useEffect(() => { setQuery(params.get('q') || ''); }, [params]);
  const state = useApi('student/missions');
  return (
    <Shell>
      <Async state={state}>{({ missions }) => {
        const done = missions.filter((m) => m.status === 'Concluída').length;
        const q = query.toLowerCase();
        const filtered = missions.filter((m) => `${m.title} ${m.subtitle} ${m.level}`.toLowerCase().includes(q));
        const next = missions.find((m) => m.status === 'Em andamento' || m.status === 'Disponível');
        return (
          <>
            <section className="page-heading"><div><span className="eyebrow">MAPA DA TRILHA</span><h1>Missões</h1><p>Escolha uma investigação e avance no seu ritmo.</p></div><span className="tiny-pill">{done} de {missions.length} concluídas</span></section>
            <div className="inline-search"><span>⌕</span><input placeholder="Buscar missão..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <div className="missions-layout">
              <section className="mission-list">
                {filtered.map((m) => (
                  <article key={m.id} className={`mission-card ${m.tone} ${m.status === 'Bloqueada' ? 'locked' : ''}`}>
                    <div className="mission-index">{m.status === 'Concluída' ? '✓' : m.status === 'Bloqueada' ? '🔒' : m.number}</div>
                    <div><small>{m.level}</small><h3>{m.title}</h3><p>{m.subtitle}</p><span className="xp-tag">+{m.xp} XP</span></div>
                    <div className="mission-meta"><span>{m.status}</span>{m.status !== 'Bloqueada' && <button onClick={() => navigate(`/aluno/missao/${m.id}`)}>{m.status === 'Concluída' ? 'Revisar' : m.status === 'Em andamento' ? 'Continuar' : 'Começar'} →</button>}</div>
                  </article>
                ))}
                {!filtered.length && <div className="state-box">{missions.length ? 'Nenhuma missão encontrada para esta busca.' : 'Ainda não há missões publicadas.'}</div>}
              </section>
              <aside className="trail-summary">
                <h3>Rota de investigação</h3>
                <div className="trail-line">{missions.map((m) => <i key={m.id} className={m.status === 'Concluída' ? 'done' : m === next ? 'current' : ''} />)}</div>
                <p><b>Próximo objetivo</b><br />{next ? <>{next.status === 'Em andamento' ? 'Concluir' : 'Começar'} “{next.title}”.</> : 'Você concluiu a trilha!'}</p>
                <div className="note-card"><b>Pista do Trace</b><span>Conecte comportamentos, não apenas códigos.</span></div>
              </aside>
            </div>
          </>
        );
      }}</Async>
    </Shell>
  );
}

export function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useApi(`student/missions/${id}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (state.error && (state.error.status === 403 || state.error.status === 404)) navigate('/aluno/missoes', { replace: true });
  }, [state.error, navigate]);

  async function start(mission, nextOrder) {
    setBusy(true);
    setError('');
    try {
      if (nextOrder == null) { navigate(`/aluno/missao/${mission.id}/concluida`); return; }
      await api.post(`student/missions/${mission.id}/start`);
      navigate(`/aluno/missao/${mission.id}/desafio/${nextOrder}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Shell>
      <Async state={state}>{({ mission: m, nextOrder }) => (
        <>
          <section className="mission-detail-hero">
            <div className="mission-copy">
              <span className="eyebrow">MISSÃO {String(m.number).padStart(2, '0')} · {m.level.toUpperCase()}</span>
              <h1>{m.title}</h1>
              <p>{m.description || m.subtitle}</p>
              <div className="mission-tags"><span>{m.challenges} {m.challenges === 1 ? 'desafio' : 'desafios'}</span><span>+{m.xp} XP</span><span>≈ {m.minutes} min</span></div>
              <Banner>{error}</Banner>
              <button className="primary-button" disabled={busy} onClick={() => start(m, nextOrder)}>
                {nextOrder == null ? 'Ver resultado →' : m.status === 'Em andamento' ? 'Continuar missão →' : 'Iniciar missão →'}
              </button>
              {nextOrder == null && <button className="secondary-button" style={{ marginLeft: 12 }} onClick={() => navigate(`/aluno/missao/${m.id}/desafio/1`)}>Rever desafios</button>}
            </div>
            <div className="mission-case-file"><span className="pin">●</span><b>CASO #{String(m.id).padStart(3, '0')}</b><h3>O mistério da cobertura</h3><p>Você recebeu requisitos e evidências de teste. Sua missão é reconstruir a rastreabilidade correta.</p><div className="case-stamp">{m.status === 'Concluída' ? 'CASO RESOLVIDO' : 'EM INVESTIGAÇÃO'}</div></div>
          </section>
          <section className="mission-objectives">
            <div><span>01</span><b>Relacionar</b><p>Conecte cada requisito ao teste que verifica seu comportamento.</p></div>
            <div><span>02</span><b>Diagnosticar</b><p>Descubra se a cobertura é completa, parcial ou inexistente.</p></div>
            <div><span>03</span><b>Completar</b><p>Escolha a evidência que falta para fechar a investigação.</p></div>
          </section>
        </>
      )}</Async>
    </Shell>
  );
}

/* ---------------------------------------------------------------- desafios */

function ChallengeHeader({ exercise, order, title, instruction }) {
  return (
    <div className="challenge-heading">
      <span>{exercise.title.toUpperCase()} / INVESTIGAÇÃO {String(order).padStart(2, '0')} / {String(exercise.total).padStart(2, '0')}</span>
      <h1>{title}</h1>
      <p>{instruction}</p>
    </div>
  );
}

function InvestigationCard({ item, selected, example, onClick, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} aria-pressed={!!selected} className={`investigation-card ${selected ? 'selected' : ''} ${example ? 'example' : ''}`}>
      <div><b>{item.code}</b><span className="radio">{selected ? '●' : '○'}</span></div>
      <p>{item.text}</p>
      {item.expected && <small className="expected">Esperado: {item.expected}</small>}
    </button>
  );
}

export function ChallengePage() {
  const { id, n } = useParams();
  const navigate = useNavigate();
  const state = useApi(`student/missions/${id}/challenges/${n}`);

  useEffect(() => {
    const err = state.error;
    if (!err) return;
    if (err.status === 403 && err.data?.nextOrder) navigate(`/aluno/missao/${id}/desafio/${err.data.nextOrder}`, { replace: true });
    else if (err.status === 403 || err.status === 404) navigate('/aluno/missoes', { replace: true });
  }, [state.error, id, navigate]);

  return (
    <Shell>
      <Async state={state}>{(c) => {
        const key = `${id}-${n}`;
        if (c.kind === 'association') return <AssociationChallenge key={key} challenge={c} missionId={id} />;
        if (c.kind === 'coverage') return <CoverageChallenge key={key} challenge={c} missionId={id} />;
        return <MissingChallenge key={key} challenge={c} missionId={id} />;
      }}</Async>
    </Shell>
  );
}

function useSubmit(missionId, order) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(answer) {
    setBusy(true);
    setError('');
    try {
      await api.post(`student/missions/${missionId}/challenges/${order}/submit`, { answer });
      navigate(`/aluno/missao/${missionId}/desafio/${order}/feedback`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return { submit, busy, error };
}

function AssociationChallenge({ challenge: c, missionId }) {
  const example = c.example;
  const [links, setLinks] = useState(example ? { [example.rf]: example.ct } : {});
  const [pendingRf, setPendingRf] = useState(null);
  const [message, setMessage] = useState(example ? `${example.rf} ↔ ${example.ct} é um exemplo. Nas outras fichas, procure o teste que verifica o comportamento pedido.` : 'Escolha um requisito e depois o teste que o verifica.');
  const { submit, busy, error } = useSubmit(missionId, c.order);
  const used = useMemo(() => new Set(Object.values(links)), [links]);
  const total = c.requirements.length;

  function chooseRf(code) {
    if (example && code === example.rf) return;
    if (links[code]) {
      const { [code]: _removed, ...rest } = links;
      setLinks(rest);
    }
    setPendingRf(code);
    setMessage(`${code} selecionado. Agora escolha o caso de teste correspondente.`);
  }
  function chooseTest(code) {
    if (!pendingRf || used.has(code)) return;
    setLinks((prev) => ({ ...prev, [pendingRf]: code }));
    setMessage(`${pendingRf} ↔ ${code} conectado. Você pode ajustar a relação antes de verificar.`);
    setPendingRf(null);
  }
  function reset() {
    setLinks(example ? { [example.rf]: example.ct } : {});
    setPendingRf(null);
    setMessage('Conexões limpas. Recomece a investigação.');
  }

  const complete = Object.keys(links).length === total;
  return (
    <>
      <ChallengeHeader exercise={c.exercise} order={c.order} title={`Desafio ${c.order}: ${KIND_TITLE.association}`} instruction="Relacione cada requisito ao caso de teste que verifica seu comportamento." />
      <div className="cork-board">
        <div className="board-head"><h2>Quem testa o quê?</h2><span>{Object.keys(links).length} de {total} vínculo(s)</span></div>
        <div className="link-grid">
          <div className="cards-column">{c.requirements.map((r) => (
            <InvestigationCard key={r.code} item={r} example={example?.rf === r.code} selected={pendingRf === r.code || !!links[r.code]} onClick={() => chooseRf(r.code)} />
          ))}</div>
          <div className="relations-column">{c.requirements.map((r) => (
            <div key={r.code} className={`relation ${links[r.code] ? 'linked' : ''}`}>
              <b>{links[r.code] ? '↔' : '···'}</b>
              <small>{links[r.code] ? (example?.rf === r.code ? 'Exemplo' : links[r.code]) : pendingRf === r.code ? 'Escolha o teste' : 'Escolher'}</small>
            </div>
          ))}</div>
          <div className="cards-column">{c.tests.map((t) => (
            <InvestigationCard key={t.code} item={t} example={example?.ct === t.code} selected={used.has(t.code)} disabled={example?.ct === t.code || used.has(t.code) || !pendingRf} onClick={() => chooseTest(t.code)} />
          ))}</div>
        </div>
        <div className="field-note"><b>Caderno de campo</b><span>{message}</span></div>
      </div>
      <Banner>{error}</Banner>
      <div className="challenge-actions">
        <span>Dica: conecte comportamentos, não apenas códigos.</span>
        <div>
          <button className="secondary-button" onClick={reset}>Limpar</button>
          <button className="primary-button compact" disabled={busy || !complete} onClick={() => submit({ links })}>{busy ? 'Verificando...' : 'Verificar'}</button>
        </div>
      </div>
    </>
  );
}

function CoverageChallenge({ challenge: c, missionId }) {
  const [choice, setChoice] = useState(null);
  const { submit, busy, error } = useSubmit(missionId, c.order);
  return (
    <>
      <ChallengeHeader exercise={c.exercise} order={c.order} title={`Desafio ${c.order}: ${KIND_TITLE.coverage}`} instruction="Nem toda ligação significa cobertura completa. Analise o requisito, examine as evidências e descubra o que ainda falta testar." />
      <section className="evidence-board">
        <div className="requirement-highlight"><span>REQUISITO EM ANÁLISE</span><h3>{c.requirement.code}</h3><p>{c.requirement.text}</p></div>
        <div className="evidence-row">{c.evidence.map((t) => <article key={t.code}><b>{t.code}</b><p>{t.text}</p></article>)}</div>
        <h3 className="question-title">Como está a cobertura deste requisito?</h3>
        <div className="choice-grid">{c.options.map((o) => (
          <button type="button" key={o.id} aria-pressed={choice === o.id} className={choice === o.id ? 'choice-card selected-choice' : 'choice-card'} onClick={() => setChoice(o.id)}>
            <span>{choice === o.id ? '●' : '○'}</span><div><b>{o.title}</b><p>{o.text}</p></div>
          </button>
        ))}</div>
        <div className="field-note"><b>Caderno de campo</b><span>Compare todos os comportamentos do requisito com as evidências existentes.</span></div>
      </section>
      <Banner>{error}</Banner>
      <div className="challenge-actions"><span>Escolha a classificação mais adequada.</span><button className="primary-button compact" disabled={!choice || busy} onClick={() => submit({ choice })}>{busy ? 'Verificando...' : 'Verificar resposta'}</button></div>
    </>
  );
}

function MissingChallenge({ challenge: c, missionId }) {
  const [choice, setChoice] = useState(null);
  const { submit, busy, error } = useSubmit(missionId, c.order);
  return (
    <>
      <ChallengeHeader exercise={c.exercise} order={c.order} title={`Desafio ${c.order}: ${KIND_TITLE.missing}`} instruction="A cobertura está incompleta. Escolha o caso de teste que completa a investigação." />
      <section className="evidence-board final-investigation">
        <div className="requirement-highlight"><span>PISTA PRINCIPAL</span><h3>{c.requirement.code}</h3><p>{c.requirement.text}</p></div>
        <div className="evidence-existing"><span>Já temos:</span>{c.evidence.map((t) => <b key={t.code}>{t.code} · {t.text}</b>)}</div>
        <h3 className="question-title">Qual caso de teste deveria ser acrescentado ao conjunto?</h3>
        <div className="vertical-choices">{c.options.map((o) => (
          <button type="button" key={o.code} aria-pressed={choice === o.code} className={choice === o.code ? 'choice-card selected-choice' : 'choice-card'} onClick={() => setChoice(o.code)}>
            <span>{choice === o.code ? '●' : '○'}</span><div><b>{o.code}</b><p>{o.text}</p></div>
          </button>
        ))}</div>
        <div className="field-note"><b>Caderno de campo • complete a investigação</b><span>Revise o requisito e procure pelo comportamento que ainda não foi verificado.</span></div>
      </section>
      <Banner>{error}</Banner>
      <div className="challenge-actions"><span>Escolha o caso de teste que completa a cobertura.</span><button className="primary-button compact" disabled={!choice || busy} onClick={() => submit({ choice })}>{busy ? 'Verificando...' : 'Verificar pista'}</button></div>
    </>
  );
}

/* ---------------------------------------------------------------- feedback */

export function FeedbackPage() {
  const { id, n } = useParams();
  const navigate = useNavigate();
  const state = useApi(`student/missions/${id}/challenges/${n}/feedback`);

  useEffect(() => {
    if (state.error) navigate(`/aluno/missao/${id}/desafio/${n}`, { replace: true });
  }, [state.error, id, n, navigate]);

  return (
    <Shell>
      <Async state={state}>{(d) => {
        const { feedback: f, correct } = d;
        const go = () => {
          if (!correct) navigate(`/aluno/missao/${id}/desafio/${d.order}`);
          else if (d.isLast || d.nextOrder == null) navigate(`/aluno/missao/${id}/concluida`);
          else navigate(`/aluno/missao/${id}/desafio/${d.nextOrder}`);
        };
        const label = !correct ? 'Tentar novamente' : d.isLast || d.nextOrder == null ? 'Concluir missão' : 'Continuar investigação';
        return (
          <>
            <ChallengeHeader exercise={{ title: d.exercise.title, total: d.total }} order={d.order} title={f.title} instruction={f.subtitle} />
            <section className={`feedback-board ${correct ? 'feedback-success' : 'feedback-error'}`}>
              <div className="feedback-banner"><span>{correct ? '✓' : '↺'}</span><div><b>{correct ? 'Evidência confirmada' : 'Pista para revisar'}</b><small>{correct ? 'Seu raciocínio está consistente.' : 'Use o feedback para tentar novamente.'}</small></div></div>
              <div className="feedback-sections">{f.sections.map((s, i) => <article key={s.title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></article>)}</div>
              <div className="feedback-footer">
                <div className="trace-tip"><span className="mini-mascot">⌕</span><b>Trace diz:</b><p>{correct ? 'Excelente! Continue seguindo as evidências.' : 'Errar faz parte da investigação — compare as pistas e tente de novo.'}</p></div>
                <button className="primary-button" onClick={go}>{label} →</button>
              </div>
            </section>
          </>
        );
      }}</Async>
    </Shell>
  );
}

/* ------------------------------------------------------ missão concluída */

export function MissionComplete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useApi(`student/missions/${id}/result`);
  useEffect(() => {
    if (state.error?.status === 409) {
      const next = state.error.data?.nextOrder;
      navigate(next ? `/aluno/missao/${id}/desafio/${next}` : '/aluno/missoes', { replace: true });
    }
  }, [state.error, id, navigate]);
  return (
    <Shell>
      <Async state={state}>{(r) => (
        <section className="complete-card">
          <div className="confetti">✦ · ✧ · ★ · ✦ · ✧</div>
          <div className="complete-mascot">⌕<span>♥</span></div>
          <span className="eyebrow mint-chip">MISSÃO CONCLUÍDA</span>
          <h1>Você desvendou os caminhos!</h1>
          <p>Você concluiu a missão “{r.title}” e resolveu {r.challengesSolved} de {r.challengesTotal} {r.challengesTotal === 1 ? 'desafio' : 'desafios'}. Cada conexão revelou uma nova pista!</p>
          <div className="reward-grid">
            <div><strong>+{r.xp} XP</strong><span>Experiência</span></div>
            <div><strong>{r.challengesSolved}/{r.challengesTotal}</strong><span>Desafios resolvidos</span></div>
            <div><strong>{r.score}</strong><span>Pontuação</span></div>
          </div>
          {r.latestAchievement && <div className="badge-earned"><span>{r.latestAchievement.icon}</span><div><b>{r.latestAchievement.title}</b><small>{r.achievements.length} conquista(s) desbloqueada(s) até agora</small></div></div>}
          <div className="complete-actions"><button className="secondary-button" onClick={() => navigate('/aluno/missoes')}>Voltar às missões</button><button className="primary-button" onClick={() => navigate('/aluno/progresso')}>Ver meu progresso →</button></div>
        </section>
      )}</Async>
    </Shell>
  );
}

/* ----------------------------------------------- progresso e conquistas */

function SkillProgress({ label, value, attempts }) {
  return (
    <div className="skill-row">
      <div><b>{label}</b><span>{attempts ? `${value}%` : 'sem tentativas'}</span></div>
      <div className="progress"><i style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export function ProgressPage() {
  const state = useApi('student/progress');
  return (
    <Shell>
      <Async state={state}>{(p) => (
        <>
          <section className="page-heading"><div><span className="eyebrow">SEU CAMINHO</span><h1>Progresso</h1><p>Veja como sua investigação evolui ao longo das missões.</p></div></section>
          <section className="progress-hero">
            <div><span>Progresso geral</span><strong>{p.progress}%</strong><div className="progress huge"><i style={{ width: `${p.progress}%` }} /></div><small>{p.missionsDone ? 'Você está avançando muito bem.' : 'Conclua sua primeira missão para começar a trilha.'}</small></div>
            <div className="progress-compass">⌁<span>{p.missionsDone}/{p.missionsTotal}</span></div>
          </section>
          <section className="stats-grid">
            <StatCard value={`${p.missionsDone} de ${p.missionsTotal}`} label="Missões concluídas" tone="pink" />
            <StatCard value={`${p.xp} XP`} label="Experiência acumulada" tone="lavender" />
            <StatCard value={p.attempts ? `${p.accuracy}%` : '—'} label="Taxa de acerto" tone="mint" hint={`${p.attempts} tentativa(s)`} />
            <StatCard value={p.achievements} label="Conquistas" tone="yellow" />
          </section>
          <section className="panel progress-list"><h3>Domínio por habilidade</h3>{p.skills.map((s) => <SkillProgress key={s.label} {...s} />)}</section>
        </>
      )}</Async>
    </Shell>
  );
}

export function AchievementsPage() {
  const state = useApi('student/achievements');
  return (
    <Shell>
      <Async state={state}>{({ achievements, earned }) => (
        <>
          <section className="page-heading"><div><span className="eyebrow">COLEÇÃO DE PISTAS</span><h1>Conquistas</h1><p>Marcos desbloqueados durante sua jornada.</p></div><span className="tiny-pill">{earned} de {achievements.length} desbloqueadas</span></section>
          <div className="achievement-grid">{achievements.map((a) => (
            <article key={a.id} className={`achievement-card ${a.earned ? 'earned' : 'locked'}`}>
              <div className="achievement-icon">{a.icon}</div><span>{a.earned ? 'DESBLOQUEADA' : 'BLOQUEADA'}</span><h3>{a.title}</h3><p>{a.text}</p>
            </article>
          ))}</div>
        </>
      )}</Async>
    </Shell>
  );
}
