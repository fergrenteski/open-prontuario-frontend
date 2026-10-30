// SERVIDOR FALSO, SOMENTE PARA DESENVOLVIMENTO VISUAL DO FRONTEND (`npm run dev:mock`).
// NÃO é o BFF e não substitui o sistema real: dados em memória, token sem assinatura,
// regras de negócio simplificadas. O frontend real aponta para o BFF via VITE_API_BASE_URL.
// Sobe na porta 3999 e inicia o Vite apontando para ele.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const PORTA = Number(process.env.MOCK_PORT ?? 3999);
const agora = () => new Date();
const iso = (d) => d.toISOString();
const minAtras = (m) => iso(new Date(Date.now() - m * 60000));

const personas = [
  { id: 'pac-101', nome: 'João Pereira', roles: ['PACIENTE'] },
  { id: 'pac-102', nome: 'Maria Souza', roles: ['PACIENTE'] },
  { id: 'usr-atendente-07', nome: 'Carla Mendes', roles: ['ATENDENTE'] },
  { id: 'usr-prof-03', nome: 'Dr. Paulo Lima', roles: ['PROFISSIONAL'] },
  { id: 'usr-gestor-01', nome: 'Lúcia Andrade', roles: ['GESTOR'] },
];

const unidades = [
  { id: 'upa-01', nome: 'UPA Boa Vista', tipo: 'UPA', latitude: -25.3866, longitude: -49.2346 },
  { id: 'upa-02', nome: 'UPA Cajuru', tipo: 'UPA', latitude: -25.4486, longitude: -49.2183 },
  { id: 'ubs-03', nome: 'UBS Mãe Curitibana', tipo: 'UBS', latitude: -25.4372, longitude: -49.27 },
];

let lotacoes = [
  ['lot-1', 'usr-atendente-07', 'upa-01', 'ATENDENTE'],
  ['lot-2', 'usr-atendente-07', 'upa-02', 'ATENDENTE'],
  ['lot-3', 'usr-prof-03', 'upa-01', 'PROFISSIONAL'],
  ['lot-4', 'usr-gestor-01', 'upa-01', 'GESTOR'],
  ['lot-5', 'usr-gestor-01', 'upa-02', 'GESTOR'],
  ['lot-6', 'usr-gestor-01', 'ubs-03', 'GESTOR'],
].map(([id, usuarioId, unidadeId, perfil]) => ({ id, usuarioId, unidadeId, perfil }));

const reg = (id, pacienteId, pacienteNome, prioridade, status, sintomas, aviso, chegada, estimado, inicio) => ({
  id, pacienteId, pacienteNome, unidadeId: 'upa-01', prioridade, status, sintomas,
  tempoEstimadoChegadaMin: estimado ?? null, horarioAviso: minAtras(aviso),
  horarioChegada: chegada == null ? null : minAtras(chegada),
  horarioInicioAtendimento: inicio == null ? null : minAtras(inicio), motivoSaida: null,
});
let fila = [
  reg('r-1', 'pac-201', 'Rosa Bittencourt', 'MUITO_URGENTE', 'AGUARDANDO', ['dor no peito', 'suor frio'], 40, 31),
  reg('r-2', 'pac-102', 'Maria Souza', 'URGENTE', 'A_CAMINHO', ['febre alta', 'vômito'], 6, null, 20),
  reg('r-3', 'pac-203', 'Tiago Kowalski', 'POUCO_URGENTE', 'AGUARDANDO', ['dor de garganta', 'febre'], 75, 58),
  reg('r-4', 'pac-204', 'Helena Okamoto', 'NAO_URGENTE', 'AGUARDANDO', ['renovação de receita'], 90, 80),
  reg('r-5', 'pac-205', 'Davi Nascimento', 'URGENTE', 'AGUARDANDO', ['fratura no punho'], 35, 22),
  reg('r-6', 'pac-206', 'Ivone Schmidt', 'POUCO_URGENTE', 'A_CAMINHO', ['tontura'], 25, null, 15),
  reg('r-7', 'pac-207', 'Bruno Ferraz', 'EMERGENCIA', 'EM_ATENDIMENTO', ['convulsão'], 50, 44, 42),
];

const prontuarios = [
  { id: 'pront-001', pacienteId: 'pac-101', alergias: ['dipirona'], medicacoes: ['losartana 50mg'], historico: [
    { id: 'atd-900', prontuarioId: 'pront-001', unidadeId: 'ubs-03', descricao: 'Consulta de rotina - hipertensão controlada', data: '2026-06-14T10:30:00-03:00' },
  ] },
  { id: 'pront-002', pacienteId: 'pac-102', alergias: [], medicacoes: ['metformina 850mg'], historico: [] },
];
let consentimentos = [
  { id: 'c-1', pacienteId: 'pac-102', unidadeId: 'upa-01', ativo: true, concedidoEm: minAtras(6), expiraEm: iso(new Date(Date.now() + 3 * 864e5)), revogadoEm: null },
  { id: 'c-2', pacienteId: 'pac-101', unidadeId: 'upa-02', ativo: true, concedidoEm: '2026-05-02T09:00:00-03:00', expiraEm: '2026-05-05T09:00:00-03:00', revogadoEm: null },
  { id: 'c-3', pacienteId: 'pac-101', unidadeId: 'ubs-03', ativo: false, concedidoEm: '2026-06-10T08:00:00-03:00', expiraEm: '2026-06-17T08:00:00-03:00', revogadoEm: '2026-06-12T18:20:00-03:00' },
];
const auditoria = [
  { id: 'aud-1', prontuarioId: 'pront-001', consentimentoId: 'c-3', usuarioId: 'usr-prof-03', unidadeId: 'ubs-03', acessadoEm: '2026-06-11T14:05:00-03:00' },
];

const valido = (c) => c.ativo && !c.revogadoEm && Date.now() < Date.parse(c.expiraEm);
const comValido = (c) => ({ ...c, valido: valido(c) });
const ativos = (u) => fila.filter((r) => r.unidadeId === u && r.status !== 'FINALIZADO');
const nivel = (total, espera) => (total >= 15 || espera >= 60 ? 'ALTO' : total >= 6 || espera >= 30 ? 'MEDIO' : 'BAIXO');
function visao(unidadeId) {
  const a = ativos(unidadeId);
  const totalPresente = a.filter((r) => r.status === 'AGUARDANDO').length;
  const totalACaminho = a.filter((r) => r.status === 'A_CAMINHO').length;
  const tempoMedioEsperaMin = unidadeId === 'upa-01' ? 34 : unidadeId === 'upa-02' ? 12 : 0;
  return { unidadeId, totalPresente, totalACaminho, tempoMedioEsperaMin, nivelCongestionamento: nivel(totalPresente + totalACaminho, tempoMedioEsperaMin), atualizadoEm: iso(agora()) };
}
function distancia(lat1, lon1, lat2, lon2) {
  const r = (g) => (g * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
const filaComAutorizacao = (u) =>
  ativos(u).map((r) => ({ ...r, prontuarioAutorizado: consentimentos.some((c) => c.pacienteId === r.pacienteId && c.unidadeId === u && valido(c)) }));

class Problema extends Error {
  constructor(status, codigo, title) {
    super(title);
    Object.assign(this, { status, codigo, title });
  }
}

const rotas = [];
const rota = (metodo, padrao, fn) => rotas.push({ metodo, re: new RegExp(`^/api${padrao.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), fn });

rota('GET', '/auth/personas', () => personas);
rota('POST', '/auth/dev-token', ({ corpo }) => {
  const u = personas.find((p) => p.id === corpo?.usuarioId);
  if (!u) throw new Problema(404, 'RECURSO_NAO_ENCONTRADO', 'Persona inexistente');
  return { accessToken: `mock.${u.id}`, expiresIn: 3600, usuario: u };
});
rota('GET', '/auth/me', ({ u }) => u);
rota('GET', '/aggregated-data', ({ q }) => {
  const id = q.get('unidadeId');
  const inicio = Date.now();
  return {
    unidade: unidades.find((x) => x.id === id) ?? null,
    fila: filaComAutorizacao(id),
    visaoAgregada: visao(id),
    prontuario: null,
    meta: {
      correlationId: randomUUID(), geradoEm: iso(agora()), degraded: false,
      fontes: [
        { nome: 'ms-fila-sql', status: 'ok', duracaoMs: 38 + (Date.now() - inicio) },
        { nome: 'ms-prontuario-mongo', status: 'ok', duracaoMs: 27 },
        { nome: 'fn-visao-agregada', status: 'ok', duracaoMs: 112 },
      ],
      falhas: [], avisos: [],
    },
  };
});
rota('GET', '/unidades', () => unidades);
rota('POST', '/unidades', ({ corpo }) => { const n = { id: randomUUID(), ...corpo }; unidades.push(n); return [201, n]; });
rota('GET', '/unidades/proximas', ({ q }) => {
  const lat = Number(q.get('latitude')), lon = Number(q.get('longitude'));
  return unidades.map((x) => ({ ...x, distanciaKm: distancia(lat, lon, x.latitude, x.longitude), visaoAgregada: visao(x.id) })).sort((a, b) => a.distanciaKm - b.distanciaKm);
});
rota('GET', '/unidades/minhas', ({ u }) => unidades.filter((x) => lotacoes.some((l) => l.usuarioId === u.id && l.unidadeId === x.id)));
rota('GET', '/unidades/:id', ({ p }) => unidades.find((x) => x.id === p.id) ?? (() => { throw new Problema(404, 'RECURSO_NAO_ENCONTRADO', 'Unidade'); })());
rota('PUT', '/unidades/:id', ({ p, corpo }) => { const i = unidades.findIndex((x) => x.id === p.id); unidades[i] = { ...unidades[i], ...corpo }; return unidades[i]; });
rota('DELETE', '/unidades/:id', ({ p }) => { unidades.splice(unidades.findIndex((x) => x.id === p.id), 1); return [204]; });
rota('GET', '/lotacoes', ({ q }) => lotacoes.filter((l) => l.unidadeId === q.get('unidadeId')));
rota('POST', '/lotacoes', ({ corpo }) => {
  if (lotacoes.some((l) => l.usuarioId === corpo.usuarioId && l.unidadeId === corpo.unidadeId)) throw new Problema(409, 'REQUISICAO_INVALIDA', 'Lotação já existe');
  const n = { id: randomUUID(), ...corpo }; lotacoes.push(n); return [201, n];
});
rota('DELETE', '/lotacoes/:id', ({ p }) => { lotacoes = lotacoes.filter((l) => l.id !== p.id); return [204]; });
rota('POST', '/fila/:unidadeId/aviso-chegada', ({ p, u, corpo }) => {
  if (ativos(p.unidadeId).some((r) => r.pacienteId === u.id)) throw new Problema(409, 'REGISTRO_ATIVO_DUPLICADO', 'Registro ativo');
  const s = (corpo.sintomas ?? []).join(' ').toLowerCase();
  const prioridade = /dor no peito|falta de ar|desmaio|avc/.test(s) ? 'MUITO_URGENTE' : /febre alta|vomito|vômito|fratura|dor intensa/.test(s) ? 'URGENTE' : /febre|dor|tontura/.test(s) ? 'POUCO_URGENTE' : 'NAO_URGENTE';
  const r = { ...reg(randomUUID(), u.id, u.nome, prioridade, 'A_CAMINHO', corpo.sintomas, 0, null, corpo.tempoEstimadoChegadaMin), unidadeId: p.unidadeId };
  fila.push(r);
  let prontuarioAutorizado = false;
  if (corpo.autorizarProntuario) {
    consentimentos.push({ id: randomUUID(), pacienteId: u.id, unidadeId: p.unidadeId, ativo: true, concedidoEm: iso(agora()), expiraEm: iso(new Date(Date.now() + (corpo.validadeConsentimentoDias ?? 3) * 864e5)), revogadoEm: null });
    prontuarioAutorizado = true;
  }
  return [201, { ...r, prontuarioAutorizado, avisos: [] }];
});
const acharReg = (id) => fila.find((r) => r.id === id) ?? (() => { throw new Problema(404, 'RECURSO_NAO_ENCONTRADO', 'Registro'); })();
const transicao = (r, de, para, extra = {}) => { if (!de.includes(r.status)) throw new Problema(409, 'TRANSICAO_INVALIDA', 'Transição inválida'); Object.assign(r, { status: para }, extra); return r; };
rota('POST', '/fila/:id/confirmar-chegada', ({ p }) => transicao(acharReg(p.id), ['A_CAMINHO'], 'AGUARDANDO', { horarioChegada: iso(agora()) }));
rota('POST', '/fila/:id/iniciar-atendimento', ({ p }) => transicao(acharReg(p.id), ['AGUARDANDO'], 'EM_ATENDIMENTO', { horarioInicioAtendimento: iso(agora()) }));
rota('PATCH', '/fila/:id/prioridade', ({ p, corpo }) => { const r = acharReg(p.id); return transicao(r, ['A_CAMINHO', 'AGUARDANDO'], r.status, { prioridade: corpo.prioridade }); });
rota('GET', '/fila/:id', ({ p }) => filaComAutorizacao(p.id));
rota('DELETE', '/fila/:id', ({ p, q }) => {
  const r = acharReg(p.id), m = q.get('motivo');
  const ok = { A_CAMINHO: ['DESISTENCIA'], AGUARDANDO: ['DESISTENCIA', 'ENCAMINHADO'], EM_ATENDIMENTO: ['ATENDIDO'] }[r.status] ?? [];
  if (!ok.includes(m)) throw new Problema(409, 'TRANSICAO_INVALIDA', 'Transição inválida');
  Object.assign(r, { status: 'FINALIZADO', motivoSaida: m });
  return [204];
});
rota('GET', '/prontuarios/me', ({ u }) => prontuarios.find((x) => x.pacienteId === u.id) ?? (() => { throw new Problema(404, 'RECURSO_NAO_ENCONTRADO', 'Prontuário'); })());
rota('GET', '/prontuarios/:pacienteId', ({ p, q, u }) => {
  const unidadeId = q.get('unidadeId');
  if (!lotacoes.some((l) => l.usuarioId === u.id && l.unidadeId === unidadeId)) throw new Problema(403, 'SEM_PERMISSAO', 'Não lotado');
  const c = consentimentos.find((x) => x.pacienteId === p.pacienteId && x.unidadeId === unidadeId && valido(x));
  if (!c) throw new Problema(403, 'CONSENTIMENTO_AUSENTE', 'Consentimento inválido');
  const pr = prontuarios.find((x) => x.pacienteId === p.pacienteId);
  if (!pr) throw new Problema(404, 'RECURSO_NAO_ENCONTRADO', 'Prontuário');
  auditoria.push({ id: randomUUID(), prontuarioId: pr.id, consentimentoId: c.id, usuarioId: u.id, unidadeId, acessadoEm: iso(agora()) });
  return pr;
});
rota('POST', '/prontuarios/:pacienteId/atendimentos', ({ p, corpo }) => {
  const pr = prontuarios.find((x) => x.pacienteId === p.pacienteId);
  const a = { id: randomUUID(), prontuarioId: pr.id, unidadeId: corpo.unidadeId, descricao: corpo.descricao, data: iso(agora()) };
  pr.historico.push(a);
  return [201, a];
});
rota('GET', '/consentimentos', ({ u }) => consentimentos.filter((c) => c.pacienteId === u.id).map(comValido));
rota('POST', '/consentimentos', ({ u, corpo }) => {
  if (consentimentos.some((c) => c.pacienteId === u.id && c.unidadeId === corpo.unidadeId && valido(c))) throw new Problema(409, 'CONSENTIMENTO_DUPLICADO', 'Duplicado');
  const c = { id: randomUUID(), pacienteId: u.id, unidadeId: corpo.unidadeId, ativo: true, concedidoEm: iso(agora()), expiraEm: iso(new Date(Date.now() + (corpo.validadeDias ?? 3) * 864e5)), revogadoEm: null };
  consentimentos.push(c);
  return [201, comValido(c)];
});
rota('PUT', '/consentimentos/:id', ({ p, corpo }) => { const c = consentimentos.find((x) => x.id === p.id); c.expiraEm = iso(new Date(Date.now() + corpo.validadeDias * 864e5)); return comValido(c); });
rota('DELETE', '/consentimentos/:id', ({ p }) => { const c = consentimentos.find((x) => x.id === p.id); Object.assign(c, { ativo: false, revogadoEm: iso(agora()) }); return [204]; });
rota('GET', '/auditoria/prontuarios/:id', ({ p }) => auditoria.filter((a) => a.prontuarioId === p.id));

createServer(async (req, res) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Expose-Headers': 'X-Correlation-Id' };
  if (req.method === 'OPTIONS') return res.writeHead(204, cors).end();
  const url = new URL(req.url, 'http://x');
  const corr = randomUUID();
  const enviar = (status, corpo, tipo = 'application/json') => {
    res.writeHead(status, { ...cors, 'X-Correlation-Id': corr, ...(corpo === undefined ? {} : { 'Content-Type': tipo }) });
    res.end(corpo === undefined ? undefined : JSON.stringify(corpo));
  };
  try {
    let bruto = '';
    for await (const c of req) bruto += c;
    const r = rotas.find((x) => x.metodo === req.method && x.re.test(url.pathname));
    if (!r) throw new Problema(404, 'RECURSO_NAO_ENCONTRADO', 'Rota inexistente no servidor falso');
    const token = (req.headers.authorization ?? '').replace('Bearer mock.', '');
    const u = personas.find((x) => x.id === token);
    if (!u && !url.pathname.startsWith('/api/auth/personas') && !url.pathname.startsWith('/api/auth/dev-token')) throw new Problema(401, 'NAO_AUTENTICADO', 'Sem token');
    await new Promise((ok) => setTimeout(ok, 120));
    const saida = r.fn({ p: url.pathname.match(r.re).groups ?? {}, q: url.searchParams, corpo: bruto ? JSON.parse(bruto) : undefined, u });
    if (Array.isArray(saida) && typeof saida[0] === 'number') enviar(saida[0], saida[1]);
    else enviar(200, saida);
  } catch (e) {
    const status = e.status ?? 500;
    enviar(status, { title: e.title ?? 'Erro', status, codigo: e.codigo ?? 'ERRO_DESCONHECIDO', correlationId: corr }, 'application/problem+json');
  }
}).listen(PORTA, () => {
  console.log(`[dev:mock] servidor FALSO em http://localhost:${PORTA}/api (somente desenvolvimento visual)`);
  if (process.argv.includes('--sem-vite')) return;
  const vite = fileURLToPath(new URL('../../node_modules/vite/bin/vite.js', import.meta.url));
  spawn(process.execPath, [vite], { stdio: 'inherit', env: { ...process.env, VITE_API_BASE_URL: `http://localhost:${PORTA}/api`, VITE_AUTH_MODE: 'dev' } });
});
