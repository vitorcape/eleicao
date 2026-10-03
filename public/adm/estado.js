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
        nomeDiv.classList.add("col-lg-8", "col-8", "mx-1", "mb-2", "p-0");
        camposDiv.appendChild(nomeDiv);
        
        const nomeInput = document.createElement("input");
        nomeInput.type = "text";
        nomeInput.placeholder = "Nome";
        nomeInput.classList.add("form-control");
        nomeInput.id = `candidatoNome${i}`;
        nomeDiv.appendChild(nomeInput);

        // Campo Nome
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
        partidoDiv.classList.add("col-lg-4", "col-3", "mx-1", "mb-2", "p-0");
        camposDiv.appendChild(partidoDiv);
        
        const partidoInput = document.createElement("input");
        partidoInput.type = "text";
        partidoInput.placeholder = "Partido";
        partidoInput.classList.add("form-control");
        partidoInput.id = `candidatoPartido${i}`;
        partidoDiv.appendChild(partidoInput);
    
        // Campo Votos
        const votosDiv = document.createElement("div");
        votosDiv.classList.add("col-lg-4", "col-3", "ms-1", "mb-2", "p-0");
        camposDiv.appendChild(votosDiv);
        
        const votosInput = document.createElement("input");
        votosInput.type = "number";
        votosInput.placeholder = "Votos";
        votosInput.classList.add("form-control");
        votosInput.id = `candidatoVotos${i}`;
        votosDiv.appendChild(votosInput);

        // Campo Voto NPC
        const votosNPCDiv = document.createElement("div");
        votosNPCDiv.classList.add("col-lg-3", "col-3", "mx-1", "mb-2", "p-0");
        camposDiv.appendChild(votosNPCDiv);
        
        const votosNPCInput = document.createElement("input");
        votosNPCInput.type = "number";
        votosNPCInput.placeholder = "% NPC";
        votosNPCInput.classList.add("form-control");
        votosNPCInput.id = `candidatoNpc${i}`;
        votosNPCDiv.appendChild(votosNPCInput);
    
        // Campo Cor
        const corDiv = document.createElement("div");
        corDiv.classList.add("col-lg-2", "col-1", "mb-2", "p-0");
        camposDiv.appendChild(corDiv);
        
        const corInput = document.createElement("input");
        corInput.type = "color";
        corInput.classList.add("form-control", "form-control-color");
        corInput.id = `candidatoCor${i}`;
        corDiv.appendChild(corInput);
    
        // Campo Imagem (URL)
        const imagemDiv = document.createElement("div");
        imagemDiv.classList.add("col-lg-10", "col-12", "mb-2", "p-0");
        camposDiv.appendChild(imagemDiv);
        
        const imagemInput = document.createElement("input");
        imagemInput.type = "text";
        imagemInput.placeholder = "URL da Imagem do Candidato";
        imagemInput.classList.add("form-control");
        imagemInput.id = `candidatoImagem${i}`;
        imagemDiv.appendChild(imagemInput);
    
        container.appendChild(candidatoDiv);
    }
    
}

// Variáveis globais para armazenar dados de votação
let votosValidos;
let totalVotos;

function calcularDistribuicao() {
    const nulos = {
        SP: parseInt(document.getElementById("nulo1").value) || 0,
        SC: parseInt(document.getElementById("nulo2").value) || 0,
        PE: parseInt(document.getElementById("nulo3").value) || 0,
        GO: parseInt(document.getElementById("nulo4").value) || 0,
    };
    const numeroCandidatos = parseInt(document.getElementById("numeroCandidatos").value);
    const resultados = [];

    for (let i = 1; i <= numeroCandidatos; i++) {
        const nome = document.getElementById(`candidatoNome${i}`).value;
        const votos = parseInt(document.getElementById(`candidatoVotos${i}`).value) || 0;
        const partido = document.getElementById(`candidatoPartido${i}`).value;
        const estado = document.getElementById(`candidatoEstado${i}`).value.toUpperCase();
        const cor = document.getElementById(`candidatoCor${i}`).value;
        const imagem = document.getElementById(`candidatoImagem${i}`).value;
        const npc = document.getElementById(`candidatoNpc${i}`).value;

        resultados.push({ nome, votos, partido, estado, cor, imagem, npc });
    }

    const totalNulos = Object.values(nulos).reduce((acc, num) => acc + num, 0);
    const totalVotos = resultados.reduce((acc, cand) => acc + cand.votos, 0) + totalNulos;
    const votosValidos = totalVotos - totalNulos;

    const resultadosPorEstado = resultados.reduce((acc, cand) => {
        if (!acc[cand.estado]) {
            acc[cand.estado] = {
                votosValidosEstado: 0,
                nulos: nulos[cand.estado] || 0,
                candidatos: [],
            };
        }
        acc[cand.estado].votosValidosEstado += cand.votos;
        acc[cand.estado].candidatos.push(cand);
        return acc;
    }, {});

    let resultadoHTML = `<p class="mb-0"><strong>Votos válidos:</strong> ${votosValidos}</p>`;
    resultadoHTML += `<p class="mb-0"><strong>Votos nulos:</strong> ${totalNulos}</p>`;
    resultadoHTML += `<p class="mb-3"><strong>Total de votos:</strong> ${totalVotos}</p>`;

    Object.keys(resultadosPorEstado).forEach(estado => {
        const estadoData = resultadosPorEstado[estado];
        resultadoHTML += `<h4>${estado}</h4>`;
        resultadoHTML += `<p><strong>Votos válidos (Estado):</strong> ${estadoData.votosValidosEstado}</p>`;
        resultadoHTML += `<p><strong>Votos nulos:</strong> ${estadoData.nulos}</p>`;

        estadoData.candidatos.forEach(cand => {
            const porcentagem = estadoData.votosValidosEstado > 0
                ? ((cand.votos / estadoData.votosValidosEstado) * 100).toFixed(2)
                : 0;
            resultadoHTML += `<p><strong>${cand.nome}</strong> (${cand.partido}) - Votos: ${cand.votos} (${porcentagem}%)</p>`;
            
            cand.porcentagem = porcentagem;
        });
    });

    document.getElementById("resultado").innerHTML = resultadoHTML;

    // Salva dados para envio
    window.resultadosParaEnvio = resultados;
    window.nulosParaEnvio = nulos;
    window.votosValidosParaEnvio = votosValidos;
    window.totalVotosParaEnvio = totalVotos;
}

function enviarParaPlanilha() {
    // Obtém dados das variáveis globais
    const resultados = window.resultadosParaEnvio || [];
    const nulos = window.nulosParaEnvio || {};
    const votosValidos = window.votosValidosParaEnvio || 0;
    const totalVotos = window.totalVotosParaEnvio || 0;

    const dadosParaEnviar = resultados.map(cand => ({
        VotosValidos: votosValidos,
        TotalVotos: totalVotos,
        VotosNulos: nulos[cand.estado] || 0,
        Candidato: cand.nome,
        Partido: cand.partido,
        Votos: cand.votos,
        Porcentagem: cand.porcentagem,
        Estado: cand.estado,
        Imagem: cand.imagem,
        NPC: cand.npc,
        CandidatoCor: cand.cor
    })).filter(dado => dado.Candidato);

    if (dadosParaEnviar.length === 0) {
        console.error("Nenhum dado válido para enviar.");
        Swal.fire({
            title: "Erro!",
            text: "Nenhum dado válido para enviar.",
            icon: "error",
            showConfirmButton: false,
            timer: 2500
        });
        return;
    }

    apiAdmin("envios/estado", {
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

function copiarResultado() {
    // Seleciona o conteúdo da div#resultado
    const resultado = document.getElementById("resultado").innerText;
    
    // Cria um elemento de texto temporário
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = resultado;
    document.body.appendChild(tempTextArea);
    
    // Seleciona e copia o conteúdo
    tempTextArea.select();
    document.execCommand("copy");
    
    // Remove o elemento temporário
    document.body.removeChild(tempTextArea);

    // Alerta de sucesso
    Swal.fire({
        title: "Copiado!",
        text: "Dados copiado com sucesso",
        icon: "success",
        showConfirmButton: false,
        timer: 2500
    });
}
