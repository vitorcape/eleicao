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
    const url = '/api/presidente';

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Adicione esta linha para verificar a estrutura dos dados
        console.log('Dados recebidos:', data);

        // Verifique se a resposta é um array
        if (Array.isArray(data)) {
            // Funções para exibir os dados
            displayPercent(data);
            displayDataHora(data);
            displayElectionInfo(data);
            colorMap(data);
        } else {
            console.error('Os dados recebidos não são um array:', data);
        }

    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
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

// Exibe informações da eleição (Votos Totais, Nulos/Brancos, e Válidos)
function displayElectionInfo(data) {
    const listaEleicaoDiv = document.getElementById('lista-eleicao');
    const tituloDiv = document.getElementById('titulo');
    const subtituloDiv = document.getElementById('subtitulo');

    // Obtém os valores de título e subtítulo
    const Titulo = data[0].Titulo || 'Eleições';
    const SubTitulo = data[0].SubTitulo || 'Gerais';
    tituloDiv.innerHTML = Titulo;
    subtituloDiv.innerHTML = SubTitulo;

    // Calcula os votos nulos e brancos
    const votoNuloBranco = parseInt((data[0].VotoNuloBranco || '0').replace(/\./g, '')) || 0;

    // Calcula os votos válidos somando os votos de todos os candidatos
    let votosValidos = 0;
    data.forEach(candidato => {
        const votos = parseInt((candidato.Voto || '0').replace(/\./g, '')) || 0;
        votosValidos += votos;
    });

    // Calcula o total de votos (votos válidos + votos nulos/brancos)
    const votoTotal = votosValidos + votoNuloBranco;

    const votosValidosPorc = (100*votosValidos)/votoTotal || 0;
    const votoNuloBrancoPorc = (100*votoNuloBranco)/votoTotal || 0;

    if (data.length > 0) {
        listaEleicaoDiv.innerHTML = `
            <div><strong>Votos Totais:</strong> ${votoTotal.toLocaleString('pt-BR')}</div>
            <div><strong>Votos Nulos/Brancos:</strong> ${votoNuloBranco.toLocaleString('pt-BR')} (${votoNuloBrancoPorc.toFixed(2)}%)</div>
            <div><strong>Votos Válidos:</strong> ${votosValidos.toLocaleString('pt-BR')} (${votosValidosPorc.toFixed(2)}%)</div>
        `;
        console.log(votoTotal);
    }

    const container = document.getElementById('cards-container');
    container.innerHTML = ''; // Limpa o contêiner antes de adicionar novos cards

    // Ordena os candidatos em ordem decrescente com base no número de votos
    data.sort((a, b) => {
        const votosA = parseInt((a.Voto || '0').replace(/\./g, '').replace(',', '.')) || 0;
        const votosB = parseInt((b.Voto || '0').replace(/\./g, '').replace(',', '.')) || 0;
    
        // Verifica qual campo deve ser usado para a ordenação
        const porcentagemA = parseFloat(a.CandidatoPorcentagem) || ((votosA / votosValidos) * 100);
        const porcentagemB = parseFloat(b.CandidatoPorcentagem) || ((votosB / votosValidos) * 100);
    
        return porcentagemB - porcentagemA; // Ordenação decrescente
    });

    data.forEach(candidate => {
        // Verifica se todos os campos necessários têm valor (não estão vazios ou indefinidos)
        if (
            candidate.Candidato && candidate.Partido && candidate.Imagem &&
            candidate.CandidatoCor && candidate.Voto
        ) {
            // Substitui a vírgula por ponto na porcentagem e calcula
            const porcentagem = votosValidos > 0 ? ((parseInt(candidate.Voto.replace(/\./g, '').replace(',', '.')) / votosValidos) * 100).toFixed(2) : '0.00';
    
            // Cria o card com HTML dinâmico
            const cardHTML = `
                <div class="card my-3">
                    ${candidate.Status ? 
                        `<div class="card-header bg-${candidate.StatusCor === 'verde' ? 'success' : 
                            candidate.StatusCor === 'vermelho' ? 'danger' : 'primary'} text-white montserrat">
                            <p class="m-0">${candidate.Status}</p>
                        </div>` 
                        : '' 
                    }
                    <div class="row card-body g-0">
                        <div class="col-md-4 imagem">
                            <img src="${candidate.Imagem}" class="img-fluid rounded-circle">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <div class="d-flex">
                                    <h2 class="card-title poppins align-content-center">${candidate.Candidato}</h2>
                                    <div class="ms-auto">
                                        <h3 class="card-title poppins mb-0">${porcentagem}%</h3>
                                        <h5 class="text-end me-2 fw-light">${candidate.Voto}</h5>
                                    </div>
                                </div>
                                <div class="mt-2 progress" style="height: 3px" role="progressbar" aria-label="Basic example" aria-valuenow="${porcentagem}" aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-bar" style="width: ${porcentagem}%; background-color: ${candidate.CandidatoCor};"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    
            // Converte a string HTML para elementos reais e adiciona ao contêiner
            container.insertAdjacentHTML('beforeend', cardHTML);
        }
    });
    
}

function colorMap(data) {
    data.forEach(item => {
        // Confirma se as chaves correspondem aos nomes na planilha
        //console.log(item); // Log para visualizar cada item retornado
        
        const estado = item.Estados; // Acessa a coluna de Estados
        const estadoCor = item.EstadosCor; // Acessa a coluna de EstadosCor

        // Garante que o estado e a cor estão preenchidos
        if (estado && estadoCor) {
            // Formata o id do path e do círculo
            const stateId = estado.toLowerCase() + 'path'; // Converte o nome do estado para minúsculas e adiciona "path"
            const circleId = estado.toLowerCase() + 'circle'; // Converte o nome do estado para minúsculas e adiciona "circle"
            
            // Seleciona o path pelo id
            const statePath = document.getElementById(stateId);
            const stateCircle = document.getElementById(circleId); // Seleciona o círculo pelo id
            //console.log(`Tentando colorir o estado: ${stateId} com a cor: ${estadoCor}`); // Log para depuração

            if (statePath) {
                // Define a cor de preenchimento usando a propriedade CSS
                statePath.style.setProperty('fill', estadoCor, 'important');
                //console.log(`Cor aplicada com sucesso para ${estadoId}`); // Log para depuração
            }

            if (stateCircle) {
                stateCircle.style.setProperty('fill', estadoCor, 'important');
            }
        }
    });
}

// Inicializa a busca de dados quando a página é carregada
window.onload = fetchData;
