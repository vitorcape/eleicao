// Editor das tabelas do D1 (substitui a edição manual da planilha).

const TABELAS = {
    apuracao: {
        titulo: "Apuração",
        descricao: "Uma linha por cargo e UF (use BR para o nacional). Título, subtítulo, % apurada, data/hora e votos nulos/brancos. " +
            "Para governador, a linha BR guarda o título da página estadual; para senador, a linha BR guarda a % e data/hora gerais e cada UF guarda os nulos/brancos.",
    },
    candidatos: {
        titulo: "Candidatos",
        descricao: "Presidente (UF BR), governador e senador (UF do estado) e deputados (lista da página da Câmara). Os votos aqui são os exibidos no site.",
    },
    partidos_camara: {
        titulo: "Partidos da Câmara",
        descricao: "Votos e vagas obtidas por partido (gráfico da página da Câmara).",
    },
    mapa_cores: {
        titulo: "Cores do mapa",
        descricao: "Tipo estado: chave é a UF (ex.: SP) no mapa do Brasil. Tipo cidade: chave é o id da capital no SVG estadual (ex.: cidadesp).",
    },
    atualizacoes: {
        titulo: "Avisos de atualização",
        descricao: "Toasts \"Nova atualização!\". Estado deve ser: Brasil, Câmara, Senado, São Paulo, Pernambuco, Santa Catarina ou Goiás.",
    },
    envios: {
        titulo: "Histórico de envios",
        descricao: "Tudo o que as calculadoras enviaram (somente consulta).",
        somenteLeitura: true,
    },
};

const OPCOES = {
    cargo: ["presidente", "governador", "senador", "deputado"],
    status_cor: ["", "verde", "vermelho", "azul"],
    tipo: ["estado", "cidade"],
    ativo: [["1", "Sim"], ["0", "Não"]],
};

const NUMERICAS = ["porcentagem", "votos_nulos_brancos", "vagas", "votos"];

let tabelaAtual = "apuracao";
let colunasAtuais = [];

function iniciar() {
    const seletor = document.getElementById("seletor-tabela");
    for (const [nome, info] of Object.entries(TABELAS)) {
        seletor.add(new Option(info.titulo, nome));
    }
    const doHash = location.hash.slice(1);
    if (TABELAS[doHash]) tabelaAtual = doHash;
    seletor.value = tabelaAtual;
    seletor.addEventListener("change", () => {
        tabelaAtual = seletor.value;
        history.replaceState(null, "", `#${tabelaAtual}`);
        carregarTabela();
    });
    carregarTabela();
}

async function carregarTabela() {
    const info = TABELAS[tabelaAtual];
    document.getElementById("descricao-tabela").textContent = info.descricao;
    const tabela = document.getElementById("tabela");
    tabela.replaceChildren();

    try {
        const { colunas, linhas } = await apiAdmin(`tabelas/${tabelaAtual}`);
        colunasAtuais = colunas;

        const thead = tabela.createTHead().insertRow();
        ["id", ...colunas, ""].forEach(c => {
            const th = document.createElement("th");
            th.textContent = c;
            thead.appendChild(th);
        });

        const tbody = tabela.createTBody();
        linhas.forEach(linha => tbody.appendChild(criarLinha(linha)));
        if (!info.somenteLeitura) tbody.appendChild(criarLinha(null));
    } catch (error) {
        aviso("Erro!", error.message, "error");
    }
}

function criarLinha(linha) {
    const somenteLeitura = TABELAS[tabelaAtual].somenteLeitura;
    const tr = document.createElement("tr");
    if (!linha) tr.classList.add("table-success");

    const tdId = tr.insertCell();
    tdId.textContent = linha ? linha.id : "novo";

    for (const coluna of colunasAtuais) {
        const td = tr.insertCell();
        const campo = criarCampo(coluna, linha ? linha[coluna] : null);
        campo.dataset.coluna = coluna;
        campo.disabled = !!somenteLeitura;
        td.appendChild(campo);
    }

    const acoes = tr.insertCell();
    acoes.classList.add("text-nowrap");
    if (!somenteLeitura) {
        acoes.appendChild(botao(linha ? "fa-save" : "fa-plus", linha ? "btn-outline-success" : "btn-success",
            () => salvarLinha(tr, linha ? linha.id : null)));
    }
    if (linha) {
        acoes.appendChild(botao("fa-trash", "btn-outline-danger ms-1", () => excluirLinha(linha.id)));
    }
    return tr;
}

function criarCampo(coluna, valor) {
    const texto = valor === null || valor === undefined ? "" : String(valor);

    if (coluna === "payload") {
        const area = document.createElement("textarea");
        area.className = "form-control form-control-sm";
        area.rows = 3;
        area.value = texto;
        return area;
    }

    if (OPCOES[coluna]) {
        const select = document.createElement("select");
        select.className = "form-select form-select-sm";
        for (const opcao of OPCOES[coluna]) {
            const [v, rotulo] = Array.isArray(opcao) ? opcao : [opcao, opcao || "—"];
            select.add(new Option(rotulo, v));
        }
        select.value = texto || (coluna === "ativo" ? "1" : select.options[0].value);
        return select;
    }

    const input = document.createElement("input");
    input.className = "form-control form-control-sm";
    if (coluna === "cor") {
        input.type = "color";
        input.classList.add("form-control-color");
        input.value = /^#[0-9a-f]{6}$/i.test(texto) ? texto : "#c1c1c1";
    } else {
        input.type = NUMERICAS.includes(coluna) ? "number" : "text";
        if (coluna === "porcentagem") input.step = "0.01";
        if (coluna === "uf") input.maxLength = 2;
        input.value = texto;
    }
    return input;
}

function lerLinha(tr) {
    const dados = {};
    tr.querySelectorAll("[data-coluna]").forEach(campo => {
        const coluna = campo.dataset.coluna;
        let valor = campo.value.trim();
        if (coluna === "uf") valor = valor.toUpperCase();
        if (coluna === "ativo") valor = Number(valor);
        else if (NUMERICAS.includes(coluna)) {
            // Campo numérico vazio vira 0 (exceto vagas da apuração, que é opcional)
            if (valor === "") valor = coluna === "vagas" && tabelaAtual === "apuracao" ? "" : 0;
            else valor = Number(valor);
        }
        dados[coluna] = valor;
    });
    return dados;
}

async function salvarLinha(tr, id) {
    try {
        await apiAdmin(id ? `tabelas/${tabelaAtual}/${id}` : `tabelas/${tabelaAtual}`, {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(lerLinha(tr)),
        });
        aviso("Salvo!", "Alteração gravada no banco de dados", "success");
        carregarTabela();
    } catch (error) {
        aviso("Erro!", error.message, "error");
    }
}

async function excluirLinha(id) {
    const confirmacao = await Swal.fire({
        title: "Excluir linha?",
        text: `A linha ${id} será removida definitivamente.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Excluir",
        cancelButtonText: "Cancelar",
    });
    if (!confirmacao.isConfirmed) return;
    try {
        await apiAdmin(`tabelas/${tabelaAtual}/${id}`, { method: "DELETE" });
        carregarTabela();
    } catch (error) {
        aviso("Erro!", error.message, "error");
    }
}

function botao(icone, classe, acao) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `btn btn-sm ${classe}`;
    b.innerHTML = `<i class="fas ${icone}"></i>`;
    b.addEventListener("click", acao);
    return b;
}

function aviso(title, text, icon) {
    Swal.fire({ title, text, icon, showConfirmButton: false, timer: 2500 });
}

iniciar();
