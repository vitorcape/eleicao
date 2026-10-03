-- Esquema inicial: substitui as abas da planilha do Google Sheets.

-- Situação da apuração por cargo/UF (antes: Titulo, SubTitulo, DataHora,
-- Porcentagem e VotoNuloBranco nas primeiras linhas de cada aba).
-- uf = 'BR' para dados nacionais.
CREATE TABLE apuracao (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cargo               TEXT    NOT NULL CHECK (cargo IN ('presidente', 'governador', 'senador', 'deputado')),
    uf                  TEXT    NOT NULL DEFAULT 'BR',
    titulo              TEXT,
    subtitulo           TEXT,
    porcentagem         REAL    NOT NULL DEFAULT 0,
    data_hora           TEXT,
    votos_nulos_brancos INTEGER NOT NULL DEFAULT 0,
    vagas               INTEGER,
    UNIQUE (cargo, uf)
);

-- Candidatos de todos os cargos (presidente, governador, senador e deputado).
CREATE TABLE candidatos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cargo      TEXT    NOT NULL CHECK (cargo IN ('presidente', 'governador', 'senador', 'deputado')),
    uf         TEXT    NOT NULL DEFAULT 'BR',
    nome       TEXT    NOT NULL,
    partido    TEXT,
    imagem     TEXT,
    cor        TEXT,
    votos      INTEGER NOT NULL DEFAULT 0,
    status     TEXT,
    status_cor TEXT CHECK (status_cor IS NULL OR status_cor IN ('', 'verde', 'vermelho', 'azul')),
    UNIQUE (cargo, uf, nome)
);

-- Partidos da Câmara (votos e vagas obtidas).
CREATE TABLE partidos_camara (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    partido TEXT    NOT NULL UNIQUE,
    cor     TEXT,
    votos   INTEGER NOT NULL DEFAULT 0,
    vagas   INTEGER NOT NULL DEFAULT 0
);

-- Cores dos mapas: tipo 'estado' (mapa do Brasil, chave = UF) e
-- tipo 'cidade' (capitais nos mapas estaduais, chave = id do SVG, ex.: cidadesp).
CREATE TABLE mapa_cores (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo  TEXT NOT NULL CHECK (tipo IN ('estado', 'cidade')),
    chave TEXT NOT NULL,
    cor   TEXT NOT NULL,
    UNIQUE (tipo, chave)
);

-- Avisos de atualização exibidos como toast (antes: aba UPDATE).
CREATE TABLE atualizacoes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    estado    TEXT    NOT NULL,
    data_hora TEXT    NOT NULL,
    ativo     INTEGER NOT NULL DEFAULT 1
);

-- Histórico bruto do que as calculadoras do /adm enviaram (antes: planilha do SteinHQ).
CREATE TABLE envios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo      TEXT NOT NULL,
    payload   TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_candidatos_cargo_uf ON candidatos (cargo, uf);
