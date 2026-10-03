// Worker da Eleição: serve os arquivos de /public e a API em /api/* usando D1.
//
// As rotas públicas devolvem JSON no mesmo formato que o opensheet devolvia
// (lista de objetos com os nomes das colunas da planilha), então o código de
// exibição das páginas continua o mesmo.

const UFS = {
    AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
    DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
    MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
    PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
    SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

// Tabelas editáveis pelo painel /adm/dados.html e as colunas permitidas em cada uma.
const TABELAS = {
    apuracao: ['cargo', 'uf', 'titulo', 'subtitulo', 'porcentagem', 'data_hora', 'votos_nulos_brancos', 'vagas'],
    candidatos: ['cargo', 'uf', 'nome', 'partido', 'imagem', 'cor', 'votos', 'status', 'status_cor'],
    partidos_camara: ['partido', 'cor', 'votos', 'vagas'],
    mapa_cores: ['tipo', 'chave', 'cor'],
    atualizacoes: ['estado', 'data_hora', 'ativo'],
    envios: ['tipo', 'payload', 'criado_em'],
};

const ORDEM = {
    apuracao: 'cargo, uf',
    candidatos: 'cargo, uf, votos DESC, nome',
    partidos_camara: 'vagas DESC, votos DESC',
    mapa_cores: 'tipo, chave',
    atualizacoes: 'id DESC',
    envios: 'id DESC',
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        try {
            if (url.pathname.startsWith('/api/admin/')) {
                if (!autorizado(request, env)) {
                    return json({ erro: 'Não autorizado' }, 401);
                }
                return await rotaAdmin(request, env, url.pathname.slice('/api/admin/'.length).split('/'));
            }
            if (url.pathname.startsWith('/api/')) {
                if (request.method !== 'GET') return json({ erro: 'Método não permitido' }, 405);
                return await rotaPublica(env, url.pathname.slice('/api/'.length));
            }
            return env.ASSETS.fetch(request);
        } catch (erro) {
            console.error(erro);
            return json({ erro: erro.message }, erro.status || 500);
        }
    },
};

// ---------------------------------------------------------------------------
// Rotas públicas (substituem https://opensheet.elk.sh/<planilha>/<aba>)
// ---------------------------------------------------------------------------

async function rotaPublica(env, rota) {
    const geradores = {
        presidente: apiPresidente,
        estado: apiEstado,
        senado: apiSenado,
        camara: apiCamara,
        update: apiUpdate,
        dashboard: apiDashboard,
    };
    const gerar = geradores[rota.replace(/\/$/, '').toLowerCase()];
    if (!gerar) return json({ erro: 'Rota não encontrada' }, 404);
    return json(await gerar(env.DB), 200, { 'Cache-Control': 'public, max-age=2' });
}

async function apiPresidente(db) {
    const [apuracao, candidatos, mapa] = await todos(db, [
        ["SELECT * FROM apuracao WHERE cargo = 'presidente' AND uf = 'BR'"],
        ["SELECT * FROM candidatos WHERE cargo = 'presidente' ORDER BY votos DESC, nome"],
        ["SELECT * FROM mapa_cores WHERE tipo = 'estado' ORDER BY chave"],
    ]);
    const a = apuracao[0] || {};
    return juntarColunas(
        [cabecalho(a, { VotoNuloBranco: formatar(a.votos_nulos_brancos || 0) })],
        candidatos.map(c => ({
            Candidato: c.nome,
            Partido: c.partido,
            Imagem: c.imagem,
            CandidatoCor: c.cor,
            Voto: formatar(c.votos),
            Status: c.status,
            StatusCor: c.status_cor,
        })),
        mapa.map(m => ({ Estados: m.chave.toLowerCase(), EstadosCor: m.cor })),
    );
}

async function apiEstado(db) {
    const [geral, apuracoes, candidatos, cidades] = await todos(db, [
        ["SELECT * FROM apuracao WHERE cargo = 'governador' AND uf = 'BR'"],
        ["SELECT * FROM apuracao WHERE cargo = 'governador' AND uf <> 'BR' ORDER BY uf"],
        ["SELECT * FROM candidatos WHERE cargo = 'governador' ORDER BY uf, votos DESC, nome"],
        ["SELECT * FROM mapa_cores WHERE tipo = 'cidade' ORDER BY chave"],
    ]);
    return juntarColunas(
        [cabecalho(geral[0] || {}, { Porcentagem: undefined })],
        candidatos.map(c => ({
            Estado: c.uf.toLowerCase(),
            Candidato: c.nome,
            Partido: c.partido,
            Imagem: c.imagem,
            CandidatoCor: c.cor,
            Voto: formatar(c.votos),
            Status: c.status,
            StatusCor: c.status_cor,
        })),
        apuracoes.map(a => ({
            EstadoVotoNuloBranco: a.uf.toLowerCase(),
            VotoNuloBranco: formatar(a.votos_nulos_brancos),
            Porcentagem: texto(a.porcentagem),
        })),
        cidades.map(c => ({ Cidade: c.chave, CidadeCor: c.cor })),
    );
}

async function apiSenado(db) {
    const [geral, apuracoes, candidatos] = await todos(db, [
        ["SELECT * FROM apuracao WHERE cargo = 'senador' AND uf = 'BR'"],
        ["SELECT * FROM apuracao WHERE cargo = 'senador' AND uf <> 'BR' ORDER BY uf"],
        ["SELECT * FROM candidatos WHERE cargo = 'senador' ORDER BY uf, votos DESC, nome"],
    ]);
    // senado.js soma VotoNuloBranco de todas as linhas de cada Estado, então
    // os nulos/brancos vão em linhas próprias. Os números saem sem separador
    // de milhar porque a página usa parseInt direto.
    const linhas = [
        ...candidatos.map(c => limpar({
            Estado: c.uf,
            Candidato: c.nome,
            Partido: c.partido,
            Voto: texto(c.votos),
            Status: c.status,
        })),
        ...apuracoes.map(a => ({ Estado: a.uf, VotoNuloBranco: texto(a.votos_nulos_brancos) })),
    ];
    if (linhas.length === 0) linhas.push({ Estado: '' });
    Object.assign(linhas[0], cabecalho(geral[0] || {}));
    return linhas;
}

async function apiCamara(db) {
    const [apuracao, partidos, deputados] = await todos(db, [
        ["SELECT * FROM apuracao WHERE cargo = 'deputado' AND uf = 'BR'"],
        ['SELECT * FROM partidos_camara ORDER BY vagas DESC, votos DESC, partido'],
        ["SELECT * FROM candidatos WHERE cargo = 'deputado' ORDER BY partido, votos DESC, nome"],
    ]);
    const a = apuracao[0] || {};
    const validos = partidos.reduce((soma, p) => soma + (p.votos || 0), 0);
    const nulos = a.votos_nulos_brancos || 0;
    return juntarColunas(
        [cabecalho(a, {
            VotoTotal: texto(validos + nulos),
            VotosValidos: texto(validos),
            VotoNuloBranco: texto(nulos),
        })],
        partidos.map(p => ({
            Partido: p.partido,
            Cor: p.cor,
            Votos: texto(p.votos),
            VagasObtidas: texto(p.vagas),
        })),
        deputados.map(d => ({
            Deputado: d.nome,
            PartidoDeputado: d.partido,
            VotoDeputado: d.votos ? formatar(d.votos) : undefined,
            StatusDeputado: d.status,
        })),
    );
}

async function apiUpdate(db) {
    const [linhas] = await todos(db, [['SELECT * FROM atualizacoes ORDER BY id']]);
    return linhas.map(l => ({
        Estado: l.estado,
        DataHora: l.data_hora,
        STATUS: l.ativo ? 'SIM' : 'NÃO',
    }));
}

// Resumo usado por /adm/dashboard.html: presidente (Brasil) + governadores por UF.
async function apiDashboard(db) {
    const [apuracoes, candidatos] = await todos(db, [
        ["SELECT * FROM apuracao WHERE cargo IN ('presidente', 'governador') ORDER BY cargo DESC, uf"],
        ["SELECT * FROM candidatos WHERE cargo IN ('presidente', 'governador') ORDER BY uf, votos DESC"],
    ]);
    const nomeLocal = (cargo, uf) => (cargo === 'presidente' ? 'Brasil' : UFS[uf] || uf);
    const presidente = apuracoes.find(a => a.cargo === 'presidente' && a.uf === 'BR') || {};
    return juntarColunas(
        [{ Titulo: presidente.titulo, SubTitulo: presidente.subtitulo }],
        candidatos.map(c => ({
            CandidatoEstado: nomeLocal(c.cargo, c.uf),
            Candidato: c.nome,
            CandidatoImagem: c.imagem,
            CandidatoCor: c.cor,
            CandidatoVoto: formatar(c.votos),
        })),
        apuracoes
            .filter(a => a.cargo === 'presidente' ? a.uf === 'BR' : a.uf !== 'BR')
            .map(a => ({
                Estado: nomeLocal(a.cargo, a.uf),
                Apuracao: texto(a.porcentagem),
                DataHora: a.data_hora,
            })),
    );
}

// ---------------------------------------------------------------------------
// Rotas de administração (exigem o cabeçalho Authorization: Bearer <ADMIN_TOKEN>)
// ---------------------------------------------------------------------------

async function rotaAdmin(request, env, partes) {
    const db = env.DB;
    const [recurso, nome, id] = partes;

    if (recurso === 'login' && request.method === 'GET') {
        return json({ ok: true });
    }

    // Envios das calculadoras (presidente, estado, senado, camara).
    if (recurso === 'envios' && request.method === 'POST') {
        const corpo = await request.json();
        return json(await registrarEnvio(db, nome, corpo), 201);
    }

    if (recurso === 'tabelas') {
        const colunas = TABELAS[nome];
        if (!colunas) throw erroHttp(404, 'Tabela não encontrada');

        if (request.method === 'GET' && !id) {
            const { results } = await db.prepare(`SELECT * FROM ${nome} ORDER BY ${ORDEM[nome]} LIMIT 1000`).all();
            return json({ colunas, linhas: results });
        }
        if (nome === 'envios' && request.method !== 'DELETE') {
            throw erroHttp(405, 'O histórico de envios é somente leitura');
        }
        if (request.method === 'POST' && !id) {
            const dados = filtrarColunas(await request.json(), colunas);
            const chaves = Object.keys(dados);
            if (chaves.length === 0) throw erroHttp(400, 'Nenhuma coluna válida enviada');
            const linha = await db
                .prepare(`INSERT INTO ${nome} (${chaves.join(', ')}) VALUES (${chaves.map(() => '?').join(', ')}) RETURNING *`)
                .bind(...chaves.map(c => dados[c]))
                .first();
            return json(linha, 201);
        }
        if (request.method === 'PUT' && id) {
            const dados = filtrarColunas(await request.json(), colunas);
            const chaves = Object.keys(dados);
            if (chaves.length === 0) throw erroHttp(400, 'Nenhuma coluna válida enviada');
            const linha = await db
                .prepare(`UPDATE ${nome} SET ${chaves.map(c => `${c} = ?`).join(', ')} WHERE id = ? RETURNING *`)
                .bind(...chaves.map(c => dados[c]), Number(id))
                .first();
            if (!linha) throw erroHttp(404, 'Linha não encontrada');
            return json(linha);
        }
        if (request.method === 'DELETE' && id) {
            await db.prepare(`DELETE FROM ${nome} WHERE id = ?`).bind(Number(id)).run();
            return json({ ok: true });
        }
    }

    throw erroHttp(404, 'Rota não encontrada');
}

// Equivalente ao que as calculadoras faziam com as duas planilhas do SteinHQ:
// o resultado completo vai para o histórico (envios) e os dados cadastrais dos
// candidatos (nome, partido, imagem, cor) vão para as tabelas públicas.
// Os votos exibidos ao público continuam sendo controlados pelo painel de dados.
async function registrarEnvio(db, tipo, corpo) {
    const linhas = Array.isArray(corpo) ? corpo : [];
    const comandos = [
        db.prepare('INSERT INTO envios (tipo, payload) VALUES (?, ?)').bind(tipo, JSON.stringify(corpo)),
    ];

    const upsertCandidato = (cargo, uf, c) => db
        .prepare(`INSERT INTO candidatos (cargo, uf, nome, partido, imagem, cor)
                  VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT (cargo, uf, nome) DO UPDATE SET
                      partido = excluded.partido,
                      imagem = COALESCE(excluded.imagem, candidatos.imagem),
                      cor = COALESCE(excluded.cor, candidatos.cor)`)
        .bind(cargo, uf, c.Candidato, c.Partido ?? null, c.Imagem || null, c.CandidatoCor || null);

    const ufValida = uf => {
        const sigla = String(uf || '').trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(sigla)) throw erroHttp(400, `UF inválida: "${uf}"`);
        return sigla;
    };

    switch (tipo) {
        case 'presidente':
            for (const c of linhas.filter(l => l.Candidato)) comandos.push(upsertCandidato('presidente', 'BR', c));
            break;
        case 'estado':
            for (const c of linhas.filter(l => l.Candidato)) comandos.push(upsertCandidato('governador', ufValida(c.Estado), c));
            break;
        case 'senado':
            for (const c of linhas.filter(l => l.Candidato)) comandos.push(upsertCandidato('senador', ufValida(c.Estado), c));
            break;
        case 'camara':
            break;
        default:
            throw erroHttp(404, 'Tipo de envio desconhecido');
    }

    await db.batch(comandos);
    return { ok: true, linhas: comandos.length - 1 };
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function autorizado(request, env) {
    const esperado = env.ADMIN_TOKEN;
    if (!esperado) return false;
    const recebido = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (recebido.length !== esperado.length) return false;
    let diferenca = 0;
    for (let i = 0; i < esperado.length; i++) diferenca |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
    return diferenca === 0;
}

async function todos(db, consultas) {
    const resultados = await db.batch(consultas.map(([sql, ...params]) => db.prepare(sql).bind(...params)));
    return resultados.map(r => r.results);
}

function cabecalho(a, extra = {}) {
    return limpar({
        Titulo: a.titulo,
        SubTitulo: a.subtitulo,
        DataHora: a.data_hora,
        Porcentagem: a.porcentagem == null ? undefined : texto(a.porcentagem),
        ...extra,
    });
}

// Monta linhas como as da planilha, onde cada grupo de colunas ocupa as
// mesmas linhas lado a lado (linha i = item i de cada grupo).
function juntarColunas(...grupos) {
    const total = Math.max(0, ...grupos.map(g => g.length));
    const linhas = [];
    for (let i = 0; i < total; i++) {
        linhas.push(limpar(Object.assign({}, ...grupos.map(g => g[i] || {}))));
    }
    return linhas;
}

// Como no opensheet: células vazias não aparecem e todo valor é texto.
function limpar(obj) {
    const saida = {};
    for (const [chave, valor] of Object.entries(obj)) {
        if (valor !== undefined && valor !== null && valor !== '') saida[chave] = String(valor);
    }
    return saida;
}

function texto(valor) {
    return valor == null ? '' : String(valor);
}

function formatar(numero) {
    // 1234567 -> "1.234.567" (formato das células da planilha)
    return String(Math.trunc(Number(numero) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function filtrarColunas(dados, colunas) {
    const saida = {};
    for (const coluna of colunas) {
        if (Object.prototype.hasOwnProperty.call(dados, coluna)) {
            saida[coluna] = dados[coluna] === '' ? null : dados[coluna];
        }
    }
    return saida;
}

function erroHttp(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function json(dados, status = 200, cabecalhos = {}) {
    return new Response(JSON.stringify(dados), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabecalhos },
    });
}
