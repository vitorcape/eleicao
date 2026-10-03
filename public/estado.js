function verificarEstado() {
    const hash = window.location.hash.substring(1); // Pega o hash da URL sem o '#'

    if (hash === 'sp') {
        console.log('SÃO PAULO');
    } else if (hash === 'rs') {
        console.log('RIO GRANDE DO SUL');
    } else if (hash === 'pe') {
        console.log('PERNAMBUCO');
    } 
    else if (hash === 'df') {
        console.log('DISTRITO FEDERAL');
    }
    else if (hash === 'am') {
        console.log('AMAZONAS');
    } else {
        console.log('Estado não reconhecido');
        window.location.hash = '#sp';
    }
}

verificarEstado();

document.addEventListener("DOMContentLoaded", function () {
    const botoes = document.querySelectorAll(".nav button");
    const divs = document.querySelectorAll("div[id^='sp'], div[id^='rs'], div[id^='pe'], div[id^='df'], div[id^='am']"); // Seleciona as divs com id correspondente
    const title = document.getElementById("title");
    let dadosVotacao = []; // Armazena os dados da planilha

    // Função para buscar dados da API
    async function fetchData() {
        try {
            const response = await fetch('/api/estado');
            if (!response.ok) {
                throw new Error('Erro na rede');
            }
            dadosVotacao = await response.json();
            console.log('Dados recebidos:', dadosVotacao);
            
            // Após carregar os dados, verificar o hash na URL e mostrar a aba correspondente
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                mostrarDiv(hash); // Chama mostrarDiv para o estado da URL
            }
        } catch (error) {
            console.error('Erro ao buscar os dados:', error);
        }
    }

    // Função para mostrar a div correspondente ao hash
    async function mostrarDiv(id) {
        // Oculta todas as divs
        divs.forEach((div) => {
            div.style.display = "none";
        });

        // Exibe a div correspondente ao ID
        const targetDiv = document.getElementById(id);
        if (targetDiv) {
            targetDiv.style.display = "block";
        }

        // Altera o título com base no botão correspondente ao ID
        const botao = document.querySelector(`button[data-target="${id}"]`);
        if (botao) {
            const novoTitulo = botao.getAttribute("data-titulo");
            title.textContent = novoTitulo;
        }

        // Exibe os votos e colorir o mapa se os dados estiverem carregados
        if (dadosVotacao.length > 0) {
            displayVotes(dadosVotacao, id); // Exibe os votos para o estado
            mostrarMapa(id, dadosVotacao); // Exibe o mapa colorido
        }
    }

    // Função para mostrar o mapa correspondente
    function mostrarMapa(estado, dados) {
        // Oculta todos os mapas
        document.querySelectorAll("object[type='image/svg+xml']").forEach(obj => obj.style.display = "none");

        // Exibe o mapa correspondente ao estado
        const mapa = document.getElementById(`mapa${estado === 'sp' ? '0' : estado === 'rs' ? '1' : estado === 'pe' ? '2' : estado === 'df' ? '3' : estado === 'am' ? '4' : '0'}`);
        if (mapa) {
            mapa.style.display = "block";

            // Filtra candidatos do estado
            const candidatos = dados.filter(item => item.Estado === estado);
            const votoNuloBranco = dados.find(item => item.EstadoVotoNuloBranco === estado);
            const totalVotos = candidatos.reduce((sum, candidate) => {
                return sum + (candidate.Voto ? parseInt((candidate.Voto || '0').replace(/\./g, '')) || 0 : 0);
            }, 0);
            const totalVotos1 = totalVotos + (votoNuloBranco?.VotoNuloBranco ? parseInt(votoNuloBranco.VotoNuloBranco.replace(/\./g, '')) || 0 : 0);

            // Colorir o mapa com base nos dados da planilha
            const proporcoes = {};
            candidatos.forEach(candidate => {
                const votos = parseInt((candidate.Voto || '0').replace(/\./g, '')) || 0;
                const percentage = (votos / totalVotos1) * 100;
                if (candidate.CandidatoCor) {
                    proporcoes[candidate.CandidatoCor] = (proporcoes[candidate.CandidatoCor] || 0) + percentage;
                }
            });

            // Encontrar a cor com a maior porcentagem
            const maxCor = Object.keys(proporcoes).reduce((a, b) => proporcoes[a] > proporcoes[b] ? a : b, '');

            mapa.addEventListener("load", function() {
                const svgDoc = mapa.contentDocument;
                colorirSVG(svgDoc.querySelector("svg"), proporcoes, maxCor, estado, dados);
            });
        }
    }

    // Função para exibir os votos
    function displayVotes(data, estado) {
        if (!data || !estado) {
            console.error('Dados ou estado inválido:', data, estado);
            return;
        }

        const listaEleicaoDiv = document.getElementById('lista-eleicao');
        const cardsContainer = document.getElementById('cards-container');
        const porcentagemDiv = document.getElementById('porcentagem');
        const tituloDiv = document.getElementById('titulo');
        const subtituloDiv = document.getElementById('subtitulo');
        const barraDiv = document.getElementById('barra');
        const dataHoraDiv = document.getElementById('data-hora');

        // Limpar os dados exibidos anteriormente
        listaEleicaoDiv.innerHTML = '';
        cardsContainer.innerHTML = '';
        porcentagemDiv.innerHTML = '';
        tituloDiv.innerHTML = '';
        subtituloDiv.innerHTML = '';
        barraDiv.style.width = '0%';
        dataHoraDiv.innerHTML = '';

        // Verifica se o estado está presente nos dados
        const estadoVotoNuloBranco = data.find(item => item.EstadoVotoNuloBranco === estado);
        if (!estadoVotoNuloBranco) {
            listaEleicaoDiv.innerHTML = `<div>Nenhum dado encontrado para ${estado.toUpperCase()}.</div>`;
            return;
        }

        // Obtém a porcentagem de apuração do estado
        const porcentagemEstado = estadoVotoNuloBranco.Porcentagem ? parseFloat(estadoVotoNuloBranco.Porcentagem) : 0;

        // Obtém dados globais e valida VotoNuloBranco
        const globalData = data[0]; // Presumindo que a primeira entrada contém os dados globais
        const votoNuloBranco = estadoVotoNuloBranco.VotoNuloBranco ? parseInt(estadoVotoNuloBranco.VotoNuloBranco.replace(/\./g, '')) || 0 : 0;

        // Filtra candidatos do estado
        const candidatos = data.filter(item => item.Estado === estado);
        if (candidatos.length === 0) {
            listaEleicaoDiv.innerHTML = `<div>Nenhum dado encontrado para ${estado.toUpperCase()}.</div>`;
            return;
        }

        // Soma os votos de todos os candidatos do estado
        const totalVotos = candidatos.reduce((sum, candidate) => sum + (parseInt((candidate.Voto || '0').replace(/\./g, '')) || 0), 0);

        // Total de votos com nulos e brancos
        const totalVotos1 = totalVotos + votoNuloBranco;

        // Exibe as informações do estado
        listaEleicaoDiv.innerHTML = ` 
            <div><strong>Estado:</strong> ${estado.toUpperCase()}</div>
            <div><strong>Votos Totais:</strong> ${totalVotos1.toLocaleString('pt-BR')}</div>
            <div><strong>Votos Nulos/Brancos:</strong> ${votoNuloBranco.toLocaleString('pt-BR')}</div>
            <div><strong>Votos Válidos:</strong> ${totalVotos.toLocaleString('pt-BR')}</div>
        `;

        // Criação do HTML para cada candidato e cálculo da porcentagem

        const Titulo = data[0].Titulo || 'Eleições';
        const SubtTtulo = data[0].SubTitulo || 'Eleições';
        const DataHora = data[0].DataHora;

        const candidatosHTML = candidatos.map(candidate => {
            const votosCandidato = parseInt((candidate.Voto || '0').replace(/\./g, '')) || 0;
            const porcentagem = totalVotos > 0 ? ((votosCandidato / totalVotos) * 100).toFixed(2) : '0.00'; // Garante duas casas decimais
        
            return {
                nome: candidate.Candidato,
                cor: candidate.CandidatoCor,
                porcentagem: porcentagem, // Já formatado com duas casas decimais
                imagem: candidate.Imagem,
                votos: candidate.Voto,
                status: candidate.Status || '',
                statuscor: candidate.StatusCor || ''
            };
        }).sort((a, b) => b.porcentagem - a.porcentagem); // Ordena os candidatos pela maior porcentagem

        // Renderiza os dados dos candidatos na página
        cardsContainer.innerHTML = candidatosHTML.map(candidate => `
        <div class="card my-3">
            ${candidate.status ? 
                `<div class="card-header bg-${candidate.statuscor === 'verde' ? 'success' : candidate.statuscor === 'vermelho' ? 'danger' : 'primary'} text-white montserrat">
                    <p class="m-0">${candidate.status}</p>
                </div>` 
                : ''
            }
            <div class="row card-body g-0">
                <div class="col-md-4 imagem">
                    <img src="${candidate.imagem}" class="img-fluid rounded-circle" alt="${candidate.nome}">
                </div>
                <div class="col-md-8">
                    <div class="card-body">
                        <div class="d-flex">
                            <h2 class="card-title poppins align-content-center">${candidate.nome}</h2>
                            <div class="ms-auto">
                                <h3 class="card-title poppins mb-0">${candidate.porcentagem}%</h3> <!-- Porcentagem com duas casas decimais -->
                                <h5 class="text-end me-2 fw-light">${candidate.votos}</h5>
                            </div>
                        </div>
                        <div class="mt-2 progress" style="height: 3px" role="progressbar" aria-label="Progresso do candidato" aria-valuenow="${candidate.porcentagem}" aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar" style="width: ${candidate.porcentagem}%; background-color: ${candidate.cor};"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

        // Exibe a porcentagem de apuração do estado
        tituloDiv.innerHTML = `${Titulo}`;
        subtituloDiv.innerHTML = `${SubtTtulo}`;
        porcentagemDiv.innerHTML = `${porcentagemEstado}%`;
        barraDiv.style.width = `${porcentagemEstado}%`;
        dataHoraDiv.innerHTML = `${DataHora}`;
    }

    function colorirSVG(svgElement, proporcoes, corMax, estado, data) {
        if (!svgElement) {
            console.error("Elemento SVG não encontrado.");
            return;
        }
    
        const paths = Array.from(svgElement.querySelectorAll("path"));
        const totalPaths = paths.length;
    
        // Verifica se proporcoes contém algum NaN
        let hasNaN = Object.values(proporcoes).some(value => isNaN(value));
        if (hasNaN) {
            // Se proporcoes tiver NaN, pinta tudo de cinza claro
            paths.forEach(path => path.setAttribute("fill", "#c1c1c1"));
            return;
        }
    
        // Aplica a cor de acordo com a proporção
        let index = 0;
        for (const [cor, porcentagem] of Object.entries(proporcoes)) {
            const count = Math.floor(totalPaths * (porcentagem / 100));
            for (let i = 0; i < count; i++) {
                if (index < totalPaths) {
                    paths[index].setAttribute("fill", cor);
                    index++;
                }
            }
        }
    
        // Preenche o restante com a cor do candidato com a maior porcentagem
        while (index < totalPaths) {
            paths[index].setAttribute("fill", corMax); // Preenche o restante com a cor do candidato mais forte
            index++;
        }
    
        // Pintar cidades específicas com cores da planilha
        const cidades = {
            sp: { id: 'cidadesp' },
            rs: { id: 'cidaders' },
            pe: { id: 'cidadepe' },
            df: { id: 'cidadedf' },
            am: { id: 'cidadeam' }
        };
    
        if (cidades[estado]) {
            const { id } = cidades[estado];
            const cidadeCor = getColorForCity(id, data); // Obtém a cor da cidade da planilha
            const cidadePath = svgElement.querySelector(`#${id}`);
            if (cidadePath) {
                cidadePath.setAttribute("fill", cidadeCor);
            }
        }

        // Alterar stroke e stroke-width
        alterarStroke(svgElement);
        console.log(svgElement);
    }
    
    function getColorForCity(cityId, data) {
        const cityData = data.find(item => item.Cidade === cityId);
        return cityData ? cityData.CidadeCor : '#000000'; // Retorna preto se a cor não for encontrada
    }

    // Atualiza a URL com o hash correspondente ao estado
    botoes.forEach((botao) => {
        botao.addEventListener("click", function() {
            const id = botao.getAttribute("data-target");
            history.pushState(null, null, `#${id}`); // Atualiza a URL com o hash
            mostrarDiv(id); // Muda a div ao clicar
        });
    });

    // Verifica o hash na URL ao carregar a página
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        mostrarDiv(hash); // Se houver hash na URL, exibe a div correspondente
    }

    // Ativa a busca dos dados da planilha
    fetchData();

    let clickCount = 0;
    let clickTimeout;
    // Adiciona o evento de clique ao botão de atualização
    const refreshButton = document.getElementById("refresh-button");
    if (refreshButton) {
        refreshButton.addEventListener("click", function() {
            clickCount++;

            // Reseta o contador após 1 segundo
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => clickCount = 0, 1000);

            // Verifica se o botão foi clicado 5 vezes em 1 segundo
            if (clickCount === 5) {
                Swal.fire({
                    title: "Pare!",
                    text: "Você clicou muitas vezes no botão atualizar",
                    icon: "warning",
                    showConfirmButton: false,
                    timer: 3500
                });
                refreshButton.disabled = true;

                // Bloqueia o botão por 3 segundos
                setTimeout(() => {
                    refreshButton.disabled = false;
                }, 3000);

                // Reseta o contador após o pop-up
                clickCount = 0;
            } else {
                fetchData();
            }
        });
    }
});
