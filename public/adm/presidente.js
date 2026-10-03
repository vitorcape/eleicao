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
    
        const nomeInput = document.createElement("input");
        nomeInput.type = "text";
        nomeInput.placeholder = "Nome do Candidato";
        nomeInput.classList.add("form-control", "mb-2");
        nomeInput.id = `candidatoNome${i}`;
        candidatoDiv.appendChild(nomeInput);
    
        // Div para os inputs do partido, votos, cor e imagem
        const camposDiv = document.createElement("div");
        camposDiv.classList.add("row", "col-12", "pe-0"); // Define a linha que conterá os outros campos
        candidatoDiv.appendChild(camposDiv);
    
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

function calcularDistribuicao() {
    const nulosBrancos = parseInt(document.getElementById("nulosBrancos").value) || 0;
    const numeroCandidatos = parseInt(document.getElementById("numeroCandidatos").value);

    const candidatos = [];
    for (let i = 1; i <= numeroCandidatos; i++) {
        const nome = document.getElementById(`candidatoNome${i}`).value;
        const votos = parseInt(document.getElementById(`candidatoVotos${i}`).value) || 0;
        const partido = document.getElementById(`candidatoPartido${i}`).value;
        const cor = document.getElementById(`candidatoCor${i}`).value;
        const imagem = document.getElementById(`candidatoImagem${i}`).value;
        const npc = document.getElementById(`candidatoNpc${i}`).value;

        candidatos.push({ nome, votos, partido, cor, imagem, npc });
    }

    const totalVotos = nulosBrancos + candidatos.reduce((acc, cand) => acc + cand.votos, 0);
    const votosValidos = totalVotos - nulosBrancos;
    resultados = candidatos.map(cand => ({
        ...cand,
        porcentagem: votosValidos > 0 ? ((cand.votos / votosValidos) * 100).toFixed(2) : 0
    }));

    let resultadoHTML = `<p class="mb-0"><strong>Votos válidos:</strong> ${votosValidos}</p>`;
    resultadoHTML += `<p class="mb-0"><strong>Votos nulos/brancos:</strong> ${nulosBrancos}</p>`;
    resultadoHTML += `<p class="mb-3"><strong>Total de votos:</strong> ${totalVotos}</p>`;

    resultados.forEach(cand => {
        resultadoHTML += `<p><strong>${cand.nome}</strong> (${cand.partido}) - Votos: ${cand.votos} (${cand.porcentagem}%) - NPC: ${cand.npc}%</p>`;
    });

    document.getElementById("resultado").innerHTML = resultadoHTML;
}

function enviarParaPlanilha() {
    const nulosBrancos = parseInt(document.getElementById("nulosBrancos").value) || 0;
    const totalVotos = nulosBrancos + resultados.reduce((acc, cand) => acc + parseInt(cand.votos), 0);
    const votosValidos = totalVotos - nulosBrancos;

    const dadosParaEnviar = resultados.map(cand => ({
        PresidenteVotosNulosBrancos: nulosBrancos,
        PresidenteVotosValidos: votosValidos,
        PresidenteTotalVotos: totalVotos,
        PresidenteCandidato: cand.nome,
        PresidentePartido: cand.partido,
        PresidenteVotos: cand.votos,
        PresidentePorcentagem: cand.porcentagem,
        PresidenteImagem: cand.imagem,
        PresidenteNPC: cand.npc,
        // Dados cadastrais que vão para a tabela pública de candidatos
        Candidato: cand.nome,
        Partido: cand.partido,
        Imagem: cand.imagem,
        CandidatoCor: cand.cor,
    }));

    apiAdmin("envios/presidente", {
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
