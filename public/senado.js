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

async function fetchData() {
    const url = '/api/senado';

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Adicione esta linha para verificar a estrutura dos dados
        console.log('Dados recebidos:', data);

        // Verifique se a resposta é um array
        if (Array.isArray(data)) {
            // Funções para exibir os dados
            displayElectionResults(data);
            displayDataHora(data);
            displayPercent(data);
        } else {
            console.error('Os dados recebidos não são um array:', data);
        }

    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
    }
}


function displayElectionResults(data) {
    const groupedData = {}; // Objeto para armazenar dados agrupados por estado

    // Agrupando dados por estado
    data.forEach(item => {
        const estado = item.Estado;

        // Inicializa a estrutura para o estado se ainda não existir
        if (!groupedData[estado]) {
            groupedData[estado] = {
                totalVotos: 0,
                votosNulos: 0,
                votosValidos: 0,
                candidatos: {}
            };
        }

        // Acumula os votos nulos
        const votosNulos = parseInt(item.VotoNuloBranco) || 0;
        groupedData[estado].votosNulos += votosNulos;

        // Conta os votos válidos e total
        const votos = parseInt(item.Voto) || 0;
        if (votos > 0) {
            const candidato = `${item.Candidato} (${item.Partido})`;
            const status = item.Status; // Captura o status do candidato
            
            // Inicializa a estrutura para o candidato se não existir
            if (!groupedData[estado].candidatos[candidato]) {
                groupedData[estado].candidatos[candidato] = {
                    votos: 0,
                    status: status // Armazena o status
                };
            }
            groupedData[estado].candidatos[candidato].votos += votos;
            groupedData[estado].votosValidos += votos; // Incrementa os votos válidos
        }

        // Incrementa o total de votos (nulos + válidos)
        groupedData[estado].totalVotos += (votos + votosNulos);
    });

    // Atualiza a exibição na página
    updateDisplay(groupedData);
}

function updateDisplay(groupedData) {
    for (const estado in groupedData) {
        const listaDiv = document.getElementById(`lista-${estado.toLowerCase()}`);
        const listaCandDiv = document.getElementById(`lista-cand-${estado.toLowerCase()}`);

        if (listaDiv) {
            // Monta o conteúdo da div de votos
            listaDiv.innerHTML = `
                <p class="mb-0"><strong>Votos Totais:</strong> ${groupedData[estado].totalVotos}</p>
                <p class="mb-0"><strong>Votos Nulos:</strong> ${groupedData[estado].votosNulos}</p>
                <p class="mb-3"><strong>Votos Válidos:</strong> ${groupedData[estado].votosValidos}</p>
            `;
        } else {
            console.warn(`Div de lista para estado ${estado} não encontrada.`);
        }

        if (listaCandDiv) {
            // Monta o conteúdo da div de candidatos
            let candidatosContent = `<h5 class="poppins">Candidatos:</h5><ul>`;
            const candidatos = groupedData[estado].candidatos;

            // Verifica se há candidatos
            if (Object.keys(candidatos).length > 0) {
                // Calcula a porcentagem e ordena os candidatos
                const candidatosComPorcentagem = Object.entries(candidatos).map(([candidato, dados]) => {
                    const porcentagem = ((dados.votos / groupedData[estado].votosValidos) * 100).toFixed(2);
                    return { candidato, votos: dados.votos, porcentagem, status: dados.status };
                });

                // Ordena por porcentagem em ordem decrescente
                candidatosComPorcentagem.sort((a, b) => b.porcentagem - a.porcentagem);

                // Monta a lista com os candidatos, suas porcentagens e status
                for (const { candidato, votos, porcentagem, status } of candidatosComPorcentagem) {
                    // Exibe o status apenas se não for null
                    const statusDisplay = status ? `- ${status}` : '';
                    candidatosContent += `<li>${candidato}: ${votos} votos (${porcentagem}%) <strong>${statusDisplay}</strong></li>`;
                }
            } else {
                candidatosContent += `<li>Nenhum candidato encontrado</li>`;
            }
            candidatosContent += `</ul>`;
            listaCandDiv.innerHTML = candidatosContent;
        } else {
            console.warn(`Div de candidatos para estado ${estado} não encontrada.`);
        }
    }
}

let clickCount = 0; // Contador de cliques
let timer; // Timer para gerenciar o intervalo

document.getElementById('refresh-button').addEventListener('click', () => {
    fetchData(); // Chama a função de buscar dados

    clickCount++; // Incrementa o contador de cliques

    // Se um timer já estiver ativo, não faz nada
    if (!timer) {
        // Inicia um novo timer que redefine o contador após 2 segundos
        timer = setTimeout(() => {
            clickCount = 0; // Reseta o contador
            timer = null; // Limpa o timer
        }, 2000); // 2000 milissegundos (2 segundos)
    }

    // Se o contador atingir 3 cliques
    if (clickCount === 3) {
        Swal.fire({
            title: "Pare!",
            text: "Você clicou muitas vezes no botão atualizar",
            icon: "warning",
            showConfirmButton: false,
            timer: 3500
        });
        clickCount = 0; // Reseta o contador após mostrar o alerta
        clearTimeout(timer); // Limpa o timer
        timer = null; // Reseta o timer
        
        // Congela o botão
        const refreshButton = document.getElementById('refresh-button');
        refreshButton.disabled = true; // Desabilita o botão

        // Reabilita o botão após 5 segundos (5000 milissegundos)
        setTimeout(() => {
            refreshButton.disabled = false; // Reabilita o botão
        }, 5000); // Tempo de congelamento em milissegundos
    }
});


// Exibe a porcentagem e ajusta a largura da barra
function displayPercent(data) {
    const percentCalcText = document.getElementById('porcentagem');
    const percentCalc = document.getElementById('barra');

    // Limpa o conteúdo anterior
    percentCalcText.innerHTML = '';
    
    // Verifica se há dados na coluna "Porcentagem"
    if (data.length > 0 && data[0].Porcentagem !== undefined) {
        const porcentagem = parseFloat(data[0].Porcentagem);

        // Verifique o valor no console
        console.log("Porcentagem obtida:", porcentagem);

        // Define o texto na div
        percentCalcText.innerHTML = `${porcentagem}%`;

        // Altera o width da barra com o valor da porcentagem, incluindo "%"
        percentCalc.style.width = `${porcentagem}%`;

    } else {
        console.warn("Porcentagem não encontrada ou dados insuficientes.");
    }
}

// Exibe a data e hora
function displayDataHora(data) {
    const dataHoraDiv = document.getElementById('data-hora');
    if (data.length > 0 && data[0].DataHora) {
        dataHoraDiv.innerHTML = `${data[0].DataHora}`;
    }
}

// Chama a função para buscar dados ao carregar a página
fetchData();
