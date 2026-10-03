// Função para verificar se o link atual corresponde ao link da página
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('header a'); // Seleciona todos os links dentro do elemento nav

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('fw-bold'); // Adiciona a classe 'fw-bold' para o link ativo
        } else {
            link.classList.remove('fw-bold'); // Remove a classe 'fw-bold' dos outros links
        }
    });
}

// Chama a função quando a página carregar
window.onload = highlightActiveLink;

// Função para gerar os campos de candidatos
function gerarCampos() {
    const numeroCandidatos = parseInt(document.getElementById("numeroCandidatos").value);
    const container = document.getElementById("partidos-container");

    // Limpa o container antes de gerar novos campos
    container.innerHTML = "";

    for (let i = 1; i <= numeroCandidatos; i++) {
        const candidatoDiv = document.createElement("div");
        candidatoDiv.classList.add("candidato", "form-group", "row", "border", "p-3", "mb-2");
    
        const candidatoTitulo = document.createElement("h5");
        candidatoTitulo.innerText = `Candidato ${i}:`;
        candidatoTitulo.classList.add("col-12");
        candidatoDiv.appendChild(candidatoTitulo);
    
        //const nomeInput = document.createElement("input");
        //nomeInput.type = "text";
        //nomeInput.placeholder = "Nome do Candidato";
        //nomeInput.classList.add("form-control", "mb-2");
        //nomeInput.id = `candidatoNome${i}`;
        //candidatoDiv.appendChild(nomeInput);
    
        // Div para os inputs do partido, votos, cor e imagem
        const camposDiv = document.createElement("div");
        camposDiv.classList.add("row", "col-12", "pe-0"); // Define a linha que conterá os outros campos
        candidatoDiv.appendChild(camposDiv);
    
        // Campo Nome
        const nomeDiv = document.createElement("div");
        nomeDiv.classList.add("col-lg-12", "col-12", "mx-1", "mb-2", "p-0");
        camposDiv.appendChild(nomeDiv);
        
        const nomeInput = document.createElement("input");
        nomeInput.type = "text";
        nomeInput.placeholder = "Nome";
        nomeInput.classList.add("form-control");
        nomeInput.id = `candidatoNome${i}`;
        nomeDiv.appendChild(nomeInput);

        // Campo Estado
        const estadoDiv = document.createElement("div");
        estadoDiv.classList.add("col-lg-3", "col-3", "mx-1", "mb-2", "p-0");
        camposDiv.appendChild(estadoDiv);
        
        const estadoInput = document.createElement("input");
        estadoInput.type = "text";
        estadoInput.placeholder = "Estado";
        estadoInput.classList.add("form-control");
        estadoInput.id = `candidatoEstado${i}`;
        estadoDiv.appendChild(estadoInput);

        // Campo Partido
        const partidoDiv = document.createElement("div");
        partidoDiv.classList.add("col-lg-3", "col-3", "mx-1", "mb-2", "p-0");
        camposDiv.appendChild(partidoDiv);
        
        const partidoInput = document.createElement("input");
        partidoInput.type = "text";
        partidoInput.placeholder = "Partido";
        partidoInput.classList.add("form-control");
        partidoInput.id = `candidatoPartido${i}`;
        partidoDiv.appendChild(partidoInput);
    
        // Campo Votos
        const votosDiv = document.createElement("div");
        votosDiv.classList.add("col-lg-3", "col-3", "ms-1", "mb-2", "p-0");
        camposDiv.appendChild(votosDiv);
        
        const votosInput = document.createElement("input");
        votosInput.type = "number";
        votosInput.placeholder = "Votos";
        votosInput.classList.add("form-control");
        votosInput.id = `candidatoVotos${i}`;
        votosDiv.appendChild(votosInput);
    
        container.appendChild(candidatoDiv);
    }
    
}

let resultadosPorEstado = {}; // Variável global para armazenar os resultados

function calcularDistribuicao() {
    const nuloSP = parseInt(document.getElementById("nulo1").value) || 0;
    const nuloSC = parseInt(document.getElementById("nulo2").value) || 0;
    const nuloPE = parseInt(document.getElementById("nulo3").value) || 0;
    const nuloGO = parseInt(document.getElementById("nulo4").value) || 0;
    
    const numeroCandidatos = parseInt(document.getElementById("numeroCandidatos").value);
    const resultados = [];

    for (let i = 1; i <= numeroCandidatos; i++) {
        const nome = document.getElementById(`candidatoNome${i}`).value;
        const votos = parseInt(document.getElementById(`candidatoVotos${i}`).value) || 0;
        const partido = document.getElementById(`candidatoPartido${i}`).value;
        const estado = document.getElementById(`candidatoEstado${i}`).value.toUpperCase();

        resultados.push({ nome, votos, partido, estado });
    }

    const votosNulosPorEstado = { SP: nuloSP, SC: nuloSC, PE: nuloPE, GO: nuloGO };
    resultadosPorEstado = {}; // Redefine os resultados

    resultados.forEach(cand => {
        if (!resultadosPorEstado[cand.estado]) {
            resultadosPorEstado[cand.estado] = {
                votosNulosEstado: votosNulosPorEstado[cand.estado] || 0,
                votosValidosEstado: 0,
                totalVotosEstado: 0,
                candidatos: []
            };
        }
        resultadosPorEstado[cand.estado].votosValidosEstado += cand.votos;
        resultadosPorEstado[cand.estado].candidatos.push(cand);
    });

    Object.keys(resultadosPorEstado).forEach(estado => {
        resultadosPorEstado[estado].totalVotosEstado =
            resultadosPorEstado[estado].votosNulosEstado + resultadosPorEstado[estado].votosValidosEstado;

        const estadoData = resultadosPorEstado[estado];
        estadoData.candidatos.sort((a, b) => b.votos - a.votos);

        const primeiro = estadoData.candidatos[0].votos;
        let eleitos = 1;

        for (let i = 1; i < estadoData.candidatos.length; i++) {
            if (estadoData.candidatos[i].votos === primeiro) {
                eleitos++;
            } else {
                break;
            }
        }

        estadoData.candidatos.forEach((cand, index) => {
            cand.status = index < eleitos ? "Eleito" : (eleitos > 1 && index === eleitos) ? "Empate" : "";
            cand.porcentagem = estadoData.votosValidosEstado > 0 
                ? ((cand.votos / estadoData.votosValidosEstado) * 100).toFixed(2) 
                : 0;
        });
    });

    exibirResultados(resultadosPorEstado); // Exibe os resultados na tela
}

function exibirResultados(resultadosPorEstado) {
    const resultadosDiv = document.getElementById("resultados");
    resultadosDiv.innerHTML = ""; // Limpa resultados anteriores

    Object.keys(resultadosPorEstado).forEach(estado => {
        const estadoData = resultadosPorEstado[estado];

        let html = `<h3>Estado: ${estado}</h3>`;
        html += `<p>Votos Nulos/Brancos: ${estadoData.votosNulosEstado}</p>`;
        html += `<p>Votos Válidos: ${estadoData.votosValidosEstado}</p>`;
        html += `<p>Total de Votos: ${estadoData.totalVotosEstado}</p>`;
        html += `<ul>`; // Inicia uma lista não ordenada

        estadoData.candidatos.forEach(cand => {
            html += `<li>${cand.nome} (${cand.partido}): ${cand.votos} votos (${cand.porcentagem}%) - ${cand.status}</li>`;
        });

        html += `</ul><br>`; // Fecha a lista
        resultadosDiv.innerHTML += html;
    });
}

function enviarParaPlanilha() {
    if (!resultadosPorEstado || Object.keys(resultadosPorEstado).length === 0) {
        console.error("Nenhum dado para enviar.");
        return;
    }

    const dadosParaEnviar = [];

    Object.keys(resultadosPorEstado).forEach(estado => {
        const estadoData = resultadosPorEstado[estado];

        estadoData.candidatos.forEach(cand => {
            dadosParaEnviar.push({
                Estado: estado,
                VotosNulosBrancos: estadoData.votosNulosEstado,
                VotosValidos: estadoData.votosValidosEstado,
                TotalVotos: estadoData.totalVotosEstado,
                Candidato: cand.nome,
                Partido: cand.partido,
                Votos: cand.votos,
                Porcentagem: cand.porcentagem,
                Status: cand.status || ''
            });
        });
    });

    apiAdmin("envios/senado", {
        method: "POST",
        body: JSON.stringify(dadosParaEnviar)
    })
    .then(() => {
        Swal.fire({
            title: "Enviado!",
            text: "Dados salvos no banco de dados",
            icon: "success",
            showConfirmButton: false,
            timer: 2500
        });
    })
    .catch(error => {
        console.error("Erro ao enviar dados:", error);
        Swal.fire({
            title: "Erro!",
            text: `Erro ao enviar dados: ${error.message}`,
            icon: "error",
            showConfirmButton: false,
            timer: 2500
        });
    });
}

