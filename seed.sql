-- Dados de exemplo para testar localmente: npm run db:seed:local
INSERT INTO apuracao (cargo, uf, titulo, subtitulo, porcentagem, data_hora, votos_nulos_brancos, vagas) VALUES
    ('presidente', 'BR', 'Eleições', 'Gerais', 45.3, '03/10/2026 20:15', 120000, NULL),
    ('governador', 'BR', 'Eleições', 'Estaduais', 0, '03/10/2026 20:15', 0, NULL),
    ('governador', 'SP', NULL, NULL, 60, '03/10/2026 20:10', 35000, NULL),
    ('governador', 'PE', NULL, NULL, 30, '03/10/2026 20:05', 8000, NULL),
    ('senador', 'BR', 'Eleições', 'Senado', 52, '03/10/2026 20:00', 0, NULL),
    ('senador', 'SP', NULL, NULL, 0, NULL, 15000, NULL),
    ('deputado', 'BR', 'Eleições', 'Câmara', 70, '03/10/2026 20:00', 40000, 513);

INSERT INTO candidatos (cargo, uf, nome, partido, imagem, cor, votos, status, status_cor) VALUES
    ('presidente', 'BR', 'Candidata A', 'PA', '/img/logo.png', '#1f6feb', 1500000, 'Eleita', 'verde'),
    ('presidente', 'BR', 'Candidato B', 'PB', '/img/logo.png', '#d73a49', 1100000, NULL, NULL),
    ('governador', 'SP', 'Governador SP 1', 'PA', '/img/logo.png', '#1f6feb', 400000, NULL, NULL),
    ('governador', 'SP', 'Governador SP 2', 'PB', '/img/logo.png', '#d73a49', 380000, NULL, NULL),
    ('governador', 'PE', 'Governador PE 1', 'PC', '/img/logo.png', '#2da44e', 90000, NULL, NULL),
    ('senador', 'SP', 'Senador SP 1', 'PA', NULL, NULL, 200000, 'Eleito', NULL),
    ('senador', 'SP', 'Senador SP 2', 'PB', NULL, NULL, 150000, NULL, NULL),
    ('deputado', 'BR', 'Deputado 1', 'PA', NULL, NULL, 50000, 'Eleito', NULL);

INSERT INTO partidos_camara (partido, cor, votos, vagas) VALUES
    ('PA', '#1f6feb', 3000000, 280),
    ('PB', '#d73a49', 2500000, 233);

INSERT INTO mapa_cores (tipo, chave, cor) VALUES
    ('estado', 'SP', '#1f6feb'),
    ('estado', 'PE', '#d73a49'),
    ('cidade', 'cidadesp', '#1f6feb');

INSERT INTO atualizacoes (estado, data_hora, ativo) VALUES
    ('Brasil', '03/10/2026 20:15', 1),
    ('São Paulo', '03/10/2026 20:10', 1);
