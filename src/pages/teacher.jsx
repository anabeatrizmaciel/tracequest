import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, useApi } from '../api.js';
import { Async, Banner, Shell, StatCard, formatMinutes } from '../components.jsx';

/* --------------------------------------------------------------- dashboard */

function Difficulty({ label, value, tone }) {
  return <div className="difficulty"><div><span>{label}</span><b>{value}%</b></div><div className="bar"><i className={tone} style={{ width: `${value}%` }} /></div></div>;
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const state = useApi('teacher/dashboard');
  const tones = ['orange', 'pinkbar', 'purple'];
  return (
    <Shell role="teacher">
      <section className="page-heading">
        <div><span className="eyebrow">ACOMPANHAMENTO</span><h1>Visão geral da turma</h1><p>Acompanhe desempenho e dificuldades em rastreabilidade.</p></div>
        <button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/novo')}>+ Novo exercício</button>
      </section>
      <Async state={state}>{(d) => (
        <>
          <section className="stats-grid teacher-stats">
            <StatCard value={d.activeStudents} label="Alunos ativos" tone="lavender" hint={`de ${d.totalStudents} cadastrados`} />
            <StatCard value={`${d.completionRate}%`} label="Atividades concluídas" tone="mint" />
            <StatCard value={d.average ? `${d.average} pts` : '-'} label="Média da turma" tone="pink" />
            <StatCard value={d.topDifficulty} label="Maior dificuldade" tone="yellow" />
          </section>
          <section className="teacher-grid">
            <div className="panel">
              <h3>Dificuldades recorrentes</h3>
              {d.difficulties.some((x) => x.value) ? d.difficulties.map((x, i) => <Difficulty key={x.label} label={x.label} value={x.value} tone={tones[i]} />) : <p className="muted">Ainda não há erros registrados.</p>}
            </div>
            <div className="panel lavender-panel actions-panel">
              <h3>Ações rápidas</h3>
              <p>Crie uma atividade ou consulte os resultados detalhados da turma.</p>
              <button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/novo')}>Criar exercício</button>
              <button className="secondary-button" onClick={() => navigate('/professor/resultados')}>Ver resultados</button>
            </div>
          </section>
          <section className="panel recent-panel">
            <div className="panel-title"><h3>Atividades recentes</h3><Link to="/professor/exercicios">Ver todas</Link></div>
            {d.recent.length ? (
              <div className="mini-table">{d.recent.map((r) => <div key={r.title}><b>{r.title}</b><span>{r.responses} {r.responses === 1 ? 'estudante' : 'estudantes'}</span><em>{r.average}% média</em></div>)}</div>
            ) : <p className="muted">Nenhum estudante respondeu ainda.</p>}
          </section>
        </>
      )}</Async>
    </Shell>
  );
}

/* -------------------------------------------------------------- exercícios */

export function ExercisesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  useEffect(() => { setQuery(params.get('q') || ''); }, [params]);
  const state = useApi('teacher/exercises');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function toggle(ex) {
    setBusyId(ex.id);
    setError('');
    try {
      await api.post(`teacher/exercises/${ex.id}/status`, { publish: ex.status !== 'Publicado' });
      state.reload();
    } catch (e) {
      setError(`${ex.title}: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Shell role="teacher">
      <section className="page-heading">
        <div><span className="eyebrow">ATIVIDADES</span><h1>Exercícios</h1><p>Gerencie os exercícios e os gabaritos da turma.</p></div>
        <button className="primary-button purple-button" onClick={() => navigate('/professor/exercicios/novo')}>+ Criar exercício</button>
      </section>
      <div className="inline-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar exercícios..." /></div>
      <Banner>{error}</Banner>
      <Async state={state}>{({ exercises }) => {
        const rows = exercises.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));
        return (
          <section className="exercise-list">
            {rows.map((row) => (
              <article key={row.id} className="exercise-row">
                <div className="exercise-code">{row.code}</div>
                <div><small>{row.mission} · {row.level}</small><h3>{row.title}</h3><p>{row.questions} {row.questions === 1 ? 'desafio cadastrado' : 'desafios cadastrados'} · {row.attempts} tentativa(s)</p></div>
                <span className={`status-pill ${row.status === 'Publicado' ? 'published' : 'draft'}`}>{row.status}</span>
                <div className="row-actions">
                  <button onClick={() => navigate(`/professor/exercicios/${row.id}/editar`)}>Editar</button>
                  <button disabled={busyId === row.id} onClick={() => toggle(row)}>{row.status === 'Publicado' ? 'Despublicar' : 'Publicar'}</button>
                  <button onClick={() => navigate(`/professor/resultados?exercise=${row.id}`)}>Resultados</button>
                </div>
              </article>
            ))}
            {!rows.length && <div className="state-box">{exercises.length ? 'Nenhum exercício encontrado.' : 'Nenhum exercício ainda. Crie o primeiro!'}</div>}
          </section>
        );
      }}</Async>
    </Shell>
  );
}

/* ------------------------------------------------------ editor (2 etapas) */

const emptyForm = (order = 1) => ({
  title: '',
  level: 'Iniciante',
  subtitle: '',
  description: '',
  missionOrder: order,
  xp: 100,
  requirements: [{ code: 'RF01', description: '' }],
  tests: [{ code: 'CT01', description: '', expected: '' }],
  relations: [],
  coverage: null,
  missing: null,
});

function nextCode(prefix, items) {
  const max = items.reduce((m, i) => Math.max(m, parseInt(String(i.code).replace(/\D/g, ''), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(2, '0')}`;
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      <span className={step === 1 ? 'active-step' : ''}>1</span><i className={step === 2 ? 'filled' : ''} /><span className={step === 2 ? 'active-step' : ''}>2</span>
      <div><b>Dados do exercício</b><b>Relações esperadas</b></div>
    </div>
  );
}

function EditableCollection({ title, items, setItems, type }) {
  const prefix = type === 'rf' ? 'RF' : 'CT';
  const add = () => setItems([...items, type === 'rf' ? { code: nextCode(prefix, items), description: '' } : { code: nextCode(prefix, items), description: '', expected: '' }]);
  const update = (idx, key, value) => setItems(items.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));
  return (
    <div className="collection">
      <div className="collection-head"><h3>{title}</h3><button type="button" onClick={add}>+ Adicionar</button></div>
      {items.map((item, idx) => (
        <div className="collection-row" key={idx}>
          <input className="code-input" aria-label="Código" value={item.code} onChange={(e) => update(idx, 'code', e.target.value.toUpperCase())} />
          <input aria-label="Descrição" value={item.description} placeholder="Descrição" onChange={(e) => update(idx, 'description', e.target.value)} />
          {type === 'ct' && <input aria-label="Resultado esperado" value={item.expected} placeholder="Resultado esperado" onChange={(e) => update(idx, 'expected', e.target.value)} />}
          <button type="button" className="remove-btn" aria-label={`Remover ${item.code}`} onClick={() => remove(idx)}>×</button>
        </div>
      ))}
      {!items.length && <p className="muted">Nenhum item. Clique em “+ Adicionar”.</p>}
    </div>
  );
}

function CheckList({ options, value, onChange, label }) {
  const toggle = (code) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  return (
    <div className="check-list" role="group" aria-label={label}>
      {options.map((t) => (
        <label key={t.code} className={`check-chip ${value.includes(t.code) ? 'on' : ''}`}>
          <input type="checkbox" checked={value.includes(t.code)} onChange={() => toggle(t.code)} />
          <b>{t.code}</b><span>{t.description || '(sem descrição)'}</span>
        </label>
      ))}
    </div>
  );
}

function CoverageEditor({ form, setForm }) {
  const c = form.coverage;
  const set = (patch) => setForm({ ...form, coverage: { ...c, ...patch } });
  return (
    <div className="challenge-editor">
      <label>Requisito analisado
        <select value={c.requirement} onChange={(e) => set({ requirement: e.target.value })}>
          <option value="">Selecione</option>
          {form.requirements.map((r) => <option key={r.code} value={r.code}>{r.code}: {r.description.slice(0, 50)}</option>)}
        </select>
      </label>
      <div><b className="field-label">Evidências exibidas ao estudante</b><CheckList label="Evidências" options={form.tests} value={c.evidence} onChange={(evidence) => set({ evidence })} /></div>
      <label>Classificação correta
        <select value={c.correct} onChange={(e) => set({ correct: e.target.value })}>
          <option value="">Selecione</option><option value="none">Sem cobertura</option><option value="partial">Cobertura parcial</option><option value="full">Cobertura completa</option>
        </select>
      </label>
      <label>Explicação quando acertar<textarea value={c.feedbackCorrect} onChange={(e) => set({ feedbackCorrect: e.target.value })} placeholder="Por que esta classificação está correta?" /></label>
      <label>Orientação quando errar<textarea value={c.feedbackWrong} onChange={(e) => set({ feedbackWrong: e.target.value })} placeholder="Como o estudante deve revisar a análise?" /></label>
    </div>
  );
}

function MissingEditor({ form, setForm }) {
  const m = form.missing;
  const set = (patch) => setForm({ ...form, missing: { ...m, ...patch } });
  const candidates = form.tests.filter((t) => m.candidates.includes(t.code));
  return (
    <div className="challenge-editor">
      <label>Requisito analisado
        <select value={m.requirement} onChange={(e) => set({ requirement: e.target.value })}>
          <option value="">Selecione</option>
          {form.requirements.map((r) => <option key={r.code} value={r.code}>{r.code}: {r.description.slice(0, 50)}</option>)}
        </select>
      </label>
      <div><b className="field-label">Evidências que já existem</b><CheckList label="Evidências existentes" options={form.tests} value={m.evidence} onChange={(evidence) => set({ evidence })} /></div>
      <div><b className="field-label">Alternativas oferecidas (inclua a correta e distratores)</b><CheckList label="Alternativas" options={form.tests} value={m.candidates} onChange={(c) => set({ candidates: c, correct: c.includes(m.correct) ? m.correct : '' })} /></div>
      <label>Alternativa correta
        <select value={m.correct} onChange={(e) => set({ correct: e.target.value })}>
          <option value="">Selecione</option>
          {candidates.map((t) => <option key={t.code} value={t.code}>{t.code}</option>)}
        </select>
      </label>
      <label>Explicação quando acertar<textarea value={m.feedbackCorrect} onChange={(e) => set({ feedbackCorrect: e.target.value })} placeholder="Qual comportamento este teste cobre?" /></label>
      <label>Orientação quando errar<textarea value={m.feedbackWrong} onChange={(e) => set({ feedbackWrong: e.target.value })} placeholder="Que pista ajuda o estudante a tentar de novo?" /></label>
    </div>
  );
}

export function ExerciseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const loaded = useApi(editing ? `teacher/exercises/${id}` : null);
  const list = useApi(editing ? null : 'teacher/exercises');
  const [form, setForm] = useState(null);
  const [step, setStep] = useState(1);
  const [problems, setProblems] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing && loaded.data && !form) {
      const d = loaded.data;
      setForm({
        ...emptyForm(), ...d,
        coverage: d.coverage ? { feedbackCorrect: '', feedbackWrong: '', ...d.coverage } : null,
        missing: d.missing ? { feedbackCorrect: '', feedbackWrong: '', ...d.missing } : null,
      });
    }
    if (!editing && list.data && !form) setForm(emptyForm((list.data.exercises.length || 0) + 1));
  }, [editing, loaded.data, list.data, form]);

  const state = editing ? loaded : list;
  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  async function save(publish) {
    setBusy(true);
    setProblems([]);
    try {
      const payload = { ...form, publish };
      if (editing) await api.put(`teacher/exercises/${id}`, payload);
      else await api.post('teacher/exercises/new', payload);
      navigate('/professor/exercicios');
    } catch (e) {
      setProblems(e.data?.details || [e.message]);
      setBusy(false);
    }
  }

  function addRelation() {
    const usedRf = new Set(form.relations.map((r) => r.rf));
    const usedCt = new Set(form.relations.map((r) => r.ct));
    const rf = form.requirements.find((r) => !usedRf.has(r.code))?.code || form.requirements[0]?.code || '';
    const ct = form.tests.find((t) => !usedCt.has(t.code))?.code || form.tests[0]?.code || '';
    patch({ relations: [...form.relations, { rf, ct, explanation: '' }] });
  }
  const setRelation = (idx, key, value) => patch({ relations: form.relations.map((r, i) => (i === idx ? { ...r, [key]: value } : r)) });

  return (
    <Shell role="teacher">
      <Async state={state}>{() => form && (
        step === 1 ? (
          <>
            <section className="page-heading"><div><span className="eyebrow">{editing ? 'EDITAR EXERCÍCIO' : 'CRIAR EXERCÍCIO'} · ETAPA 1 DE 2</span><h1>Dados e artefatos</h1><p>Cadastre o enunciado, os requisitos e os casos de teste.</p></div></section>
            <section className="form-panel">
              <Stepper step={1} />
              <div className="form-grid">
                <label>Título<input value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Ex.: Conectando Pontos" /></label>
                <label>Nível<select value={form.level} onChange={(e) => patch({ level: e.target.value })}><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></label>
                <label>Ordem da missão<input type="number" min="1" value={form.missionOrder} onChange={(e) => patch({ missionOrder: e.target.value })} /></label>
                <label>XP da missão<input type="number" min="0" step="10" value={form.xp} onChange={(e) => patch({ xp: e.target.value })} /></label>
                <label className="full">Resumo curto (aparece na lista de missões)<input value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} placeholder="Ex.: Relacione requisitos, cobertura e evidências" /></label>
                <label className="full">Descrição<textarea value={form.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Explique o objetivo da atividade." /></label>
              </div>
              <EditableCollection title="Requisitos" items={form.requirements} setItems={(requirements) => patch({ requirements })} type="rf" />
              <EditableCollection title="Casos de teste" items={form.tests} setItems={(tests) => patch({ tests })} type="ct" />
              <div className="form-actions">
                <button className="secondary-button" onClick={() => navigate('/professor/exercicios')}>Cancelar</button>
                <button className="primary-button purple-button" onClick={() => { setProblems([]); setStep(2); }}>Continuar →</button>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="page-heading"><div><span className="eyebrow">{editing ? 'EDITAR EXERCÍCIO' : 'CRIAR EXERCÍCIO'} · ETAPA 2 DE 2</span><h1>Definir relações esperadas</h1><p>Monte o gabarito e registre a justificativa utilizada no feedback.</p></div></section>
            <section className="relations-panel">
              <Stepper step={2} />
              <div className="relation-builder-head">
                <div><h3>Gabarito RF ↔ CT</h3><p>Essas relações são usadas na correção automática. A primeira vira o exemplo já resolvido do Desafio 1.</p></div>
                <button type="button" onClick={addRelation}>+ Nova relação</button>
              </div>
              {form.relations.map((rel, idx) => (
                <div className="relation-builder" key={idx}>
                  <select aria-label="Requisito" value={rel.rf} onChange={(e) => setRelation(idx, 'rf', e.target.value)}>{form.requirements.map((r) => <option key={r.code}>{r.code}</option>)}</select>
                  <span className="relation-arrow">↔</span>
                  <select aria-label="Caso de teste" value={rel.ct} onChange={(e) => setRelation(idx, 'ct', e.target.value)}>{form.tests.map((t) => <option key={t.code}>{t.code}</option>)}</select>
                  <textarea aria-label="Justificativa" placeholder="Justificativa do feedback" value={rel.explanation} onChange={(e) => setRelation(idx, 'explanation', e.target.value)} />
                  <button type="button" className="remove-btn" aria-label="Remover relação" onClick={() => patch({ relations: form.relations.filter((_, i) => i !== idx) })}>×</button>
                </div>
              ))}
              {!form.relations.length && <p className="muted">Nenhuma relação ainda. Clique em “+ Nova relação”.</p>}

              <div className="optional-challenge">
                <label className="check-line"><input type="checkbox" checked={!!form.coverage} onChange={(e) => patch({ coverage: e.target.checked ? { requirement: '', evidence: [], correct: '', feedbackCorrect: '', feedbackWrong: '' } : null })} /> Incluir desafio de cobertura (classificar a cobertura de um requisito)</label>
                {form.coverage && <CoverageEditor form={form} setForm={setForm} />}
              </div>
              <div className="optional-challenge">
                <label className="check-line"><input type="checkbox" checked={!!form.missing} onChange={(e) => patch({ missing: e.target.checked ? { requirement: '', evidence: [], candidates: [], correct: '', feedbackCorrect: '', feedbackWrong: '' } : null })} /> Incluir desafio da evidência que falta (escolher o teste a acrescentar)</label>
                {form.missing && <MissingEditor form={form} setForm={setForm} />}
              </div>

              {!!problems.length && <div className="banner banner-error" role="alert"><b>Revise antes de salvar:</b><ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>}
              <div className="form-actions">
                <button className="secondary-button" onClick={() => setStep(1)}>← Voltar</button>
                <button className="secondary-button" disabled={busy} onClick={() => save(false)}>Salvar rascunho</button>
                <button className="primary-button purple-button" disabled={busy} onClick={() => save(true)}>{busy ? 'Salvando...' : 'Salvar e publicar'}</button>
              </div>
            </section>
          </>
        )
      )}</Async>
    </Shell>
  );
}

/* -------------------------------------------------------------- resultados */

export function ResultsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selected = params.get('exercise') || '';
  const state = useApi(`teacher/results${selected ? `?exercise=${selected}` : ''}`);
  const [error, setError] = useState('');

  async function exportCsv() {
    setError('');
    try { await api.download(`teacher/results.csv${selected ? `?exercise=${selected}` : ''}`, 'resultados-tracequest.csv'); } catch (e) { setError(e.message); }
  }

  return (
    <Shell role="teacher">
      <section className="page-heading">
        <div><span className="eyebrow">RESULTADOS</span><h1>Resultados da turma</h1><p>Consulte desempenho, acertos e dificuldades por estudante.</p></div>
        <button className="secondary-button" onClick={exportCsv}>Exportar resumo (CSV)</button>
      </section>
      <Banner>{error}</Banner>
      <Async state={state}>{(r) => (
        <>
          <div className="filter-row">
            <label>Exercício
              <select value={selected} onChange={(e) => setParams(e.target.value ? { exercise: e.target.value } : {})}>
                <option value="">Todos os exercícios publicados</option>
                {r.exercises.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </label>
          </div>
          <section className="stats-grid">
            <StatCard value={r.summary.participants} label="Participantes" tone="lavender" />
            <StatCard value={r.students.length ? r.summary.average : '-'} label="Média da turma" tone="pink" />
            <StatCard value={r.students.length ? `${r.summary.firstTry}/${r.summary.questions}` : '-'} label="Acertos de primeira (média)" tone="mint" />
            <StatCard value={r.students.length ? formatMinutes(r.summary.minutes) : '-'} label="Tempo médio" tone="yellow" />
          </section>
          <section className="results-table panel">
            <div className="table-head"><span>Estudante</span><span>Nota</span><span>Acertos de 1ª</span><span>Tempo</span><span>Maior dificuldade</span><span /></div>
            {r.students.map((s) => (
              <div className="table-row" key={s.id}>
                <span><b>{s.name}</b></span><span>{s.score}</span><span>{s.correct}</span><span>{formatMinutes(s.minutes)}</span><span>{s.difficulty}</span>
                <button onClick={() => navigate(`/professor/resultados/${s.id}`)}>Detalhes</button>
              </div>
            ))}
            {!r.students.length && <p className="muted pad">Nenhum estudante respondeu a este exercício ainda.</p>}
          </section>
        </>
      )}</Async>
    </Shell>
  );
}

export function IndividualResultPage() {
  const { studentId } = useParams();
  const state = useApi(`teacher/students/${studentId}`);
  const [showAnswers, setShowAnswers] = useState(false);
  return (
    <Shell role="teacher">
      <Async state={state}>{(s) => (
        <>
          <section className="page-heading"><div><span className="eyebrow">RESULTADO INDIVIDUAL</span><h1>Resultados de {s.name}</h1><p>Resumo do desempenho e das dificuldades observadas.</p></div><Link className="secondary-button link-button" to="/professor/resultados">← Voltar</Link></section>
          <section className="stats-grid">
            <StatCard value={s.score} label="Pontuação" tone="pink" />
            <StatCard value={`${s.accuracy}%`} label="Taxa de acerto" tone="mint" />
            <StatCard value={`${s.firstTry}/${s.total}`} label="Acertos de primeira" tone="lavender" />
            <StatCard value={formatMinutes(s.minutes)} label="Tempo" tone="yellow" />
          </section>
          <section className="individual-grid">
            <div className="panel">
              <h3>Análise por desafio</h3>
              {s.exercises.map((ex) => (
                <div key={ex.id} className="exercise-block">
                  <h4>{ex.title} {ex.completed ? <em className="done-tag">concluído</em> : <em className="todo-tag">em andamento</em>}</h4>
                  {ex.challenges.map((c) => (
                    <div key={c.order} className={`attempt-row ${c.solved ? (c.wrongBefore ? 'warning' : 'success') : 'warning'}`}>
                      <span>{c.solved && !c.wrongBefore ? '✓' : '!'}</span>
                      <div>
                        <b>Desafio {c.order} · {c.label}</b>
                        <small>{!c.attempted ? 'Ainda não tentou' : c.solved ? (c.wrongBefore ? `${c.wrongBefore} erro(s) antes do acerto` : 'Resposta correta na primeira tentativa') : `${c.attempts} tentativa(s), ainda sem acerto`}</small>
                      </div>
                      <em>{c.score}%</em>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="panel review-panel">
              <span className="eyebrow">SUGESTÃO DE REVISÃO</span>
              <h3>{s.review.title}</h3>
              <p>{s.review.text}</p>
              <div className="review-tags">{s.review.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <button className="secondary-button" onClick={() => setShowAnswers((v) => !v)}>{showAnswers ? 'Ocultar respostas' : 'Ver respostas do estudante'}</button>
            </div>
          </section>
          {showAnswers && (
            <section className="panel answers-panel">
              <h3>Respostas registradas</h3>
              <div className="answers-list">{s.answers.map((a) => (
                <div key={a.id} className={`answer-row ${a.correct ? 'ok' : 'bad'}`}>
                  <span>{a.correct ? '✓' : '✗'}</span>
                  <b>{a.exercise} · Desafio {a.order} ({a.kind})</b>
                  <small>{a.summary}</small>
                  <time>{new Date(a.createdAt).toLocaleString('pt-BR')}</time>
                </div>
              ))}</div>
            </section>
          )}
        </>
      )}</Async>
    </Shell>
  );
}
