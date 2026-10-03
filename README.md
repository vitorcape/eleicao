# Eleição BRRPG — Cloudflare Workers + D1

O site agora roda em um único **Cloudflare Worker**:

- `public/` — as páginas estáticas (HTML, CSS, JS, imagens e SVGs), servidas pelo Worker (Static Assets);
- `src/index.js` — a API em `/api/*`, que lê e grava no banco **D1**;
- `migrations/` — o esquema do banco (substitui as abas da planilha do Google Sheets).

Antes, as páginas liam a planilha pelo opensheet e o `/adm` gravava pelo SteinHQ. Agora tudo passa pelo Worker.

## Rotas da API

| Rota | Substitui a aba | Usada por |
| --- | --- | --- |
| `GET /api/presidente` | `Presidente` | `geral.html` |
| `GET /api/estado` | `Estado` | `estado.html` |
| `GET /api/senado` | `Senado` | `senado.html` |
| `GET /api/camara` | `Camara` | `camara.html` |
| `GET /api/update` | `UPDATE` | avisos (toasts) em todas as páginas |
| `GET /api/dashboard` | `Dashboard` | `adm/dashboard.html` (gerado a partir de presidente + governadores) |

As rotas públicas devolvem o JSON no mesmo formato do opensheet, por isso o código de exibição das páginas quase não mudou.

Rotas de administração (exigem `Authorization: Bearer <ADMIN_TOKEN>`):

- `POST /api/admin/envios/{presidente|estado|senado|camara}` — usado pelos botões "Enviar" das calculadoras. Salva o resultado completo no histórico (`envios`) e cadastra/atualiza os candidatos (nome, partido, imagem, cor), como as duas planilhas do SteinHQ faziam;
- `GET|POST /api/admin/tabelas/{tabela}` e `PUT|DELETE /api/admin/tabelas/{tabela}/{id}` — usado pelo painel **`/adm/dados.html`**, onde se edita o que antes era editado direto na planilha (porcentagem apurada, votos exibidos, status, cores do mapa, avisos de atualização).

## Tabelas

| Tabela | Conteúdo |
| --- | --- |
| `apuracao` | por cargo + UF (`BR` = nacional): título, subtítulo, % apurada, data/hora, votos nulos/brancos, vagas |
| `candidatos` | presidente, governador, senador e deputado: nome, partido, imagem, cor, votos, status |
| `partidos_camara` | votos e vagas obtidas por partido |
| `mapa_cores` | cor de cada UF no mapa do Brasil (`estado`) e das capitais nos mapas estaduais (`cidade`) |
| `atualizacoes` | avisos "Nova atualização!" |
| `envios` | histórico bruto das calculadoras |

## Como publicar

```bash
npm install
npx wrangler login

# 1. Criar o banco e copiar o "database_id" exibido para o wrangler.jsonc
npx wrangler d1 create eleicao

# 2. Criar as tabelas no banco remoto
npm run db:migrate

# 3. Definir a senha do /adm
npx wrangler secret put ADMIN_TOKEN

# 4. Publicar
npm run deploy
```

Depois, configure o domínio (ex.: `eleicao.brrpg.site`) em *Workers & Pages → eleicao → Settings → Domains & Routes*.

## Desenvolvimento local

```bash
cp .dev.vars.example .dev.vars   # senha local do /adm
npm run db:migrate:local
npm run db:seed:local            # opcional: dados de exemplo
npm run dev                      # http://localhost:8787
```

## Migrando os dados atuais da planilha

O conteúdo da planilha não é copiado automaticamente. Cadastre os candidatos pelas calculadoras do `/adm` (botão "Enviar") e ajuste votos, apuração e cores em `/adm/dados.html`, ou monte um `.sql` com `INSERT`s no formato do `seed.sql` e rode `npx wrangler d1 execute eleicao --remote --file=arquivo.sql`.
