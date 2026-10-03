async function fetchData() {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
            throw new Error('Erro na rede');
        }
        const data = await response.json();
        console.log('Dados recebidos:', data); // Log dos dados para verificar
        displayCandidateInfo(data);
        displayElectionInfo(data); // Chama a função para exibir os dados
    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
    }
}

function displayCandidateInfo(data) {
    const estados = [
        { nome: "Brasil", id: "brasil" },
        { nome: "São Paulo", id: "sp" },
        { nome: "Santa Catarina", id: "sc" },
        { nome: "Pernambuco", id: "pe" },
        { nome: "Goiás", id: "go" }
    ];

    estados.forEach(({ nome, id }) => {
        const container = document.getElementById(`cards-container-${id}`);
        if (!container) {
            console.error(`Contêiner não encontrado para estado: ${nome}`);
            return;
        }
        container.innerHTML = '';

        // Filtrar candidatos por estado
        const candidatosEstado = data.filter(candidato => candidato.CandidatoEstado === nome);

        // Calcular o total de votos do estado
        const totalVotosEstado = candidatosEstado.reduce((sum, candidato) => {
            const votos = parseInt((candidato.CandidatoVoto || '0').replace(/\./g, '').replace(',', '.')) || 0;
            return sum + votos;
        }, 0);

        // Ordenar candidatos por votos em ordem decrescente
        candidatosEstado.sort((a, b) => {
            const votosA = parseInt((a.CandidatoVoto || '0').replace(/\./g, '').replace(',', '.')) || 0;
            const votosB = parseInt((b.CandidatoVoto || '0').replace(/\./g, '').replace(',', '.')) || 0;
            return votosB - votosA;
        });

        // Criar os cards para cada candidato
        candidatosEstado.forEach(candidate => {
            if (candidate.Candidato && candidate.CandidatoImagem && candidate.CandidatoCor && candidate.CandidatoVoto) {
                const votos = parseInt(candidate.CandidatoVoto.replace(/\./g, '').replace(',', '.')) || 0;
                const porcentagem = totalVotosEstado > 0 ? ((votos / totalVotosEstado) * 100).toFixed(2) : '0.00';

                const cardHTML = `
                    <div class="row card-body g-0">
                        <div class="col-md-4 imagem">
                            <img src="${candidate.CandidatoImagem}" class="img-fluid rounded-circle" style="object-fit: cover;">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <div class="d-flex">
                                    <h3 class="card-title poppins align-content-center">${candidate.Candidato}</h3>
                                    <div class="ms-auto text-end">
                                        <h4 class="card-title poppins mb-0">${porcentagem}%</h4>
                                        <p class="text-end me-2 fw-light">${candidate.CandidatoVoto}</p>
                                    </div>
                                </div>
                                <div class="mt-2 progress" style="height: 3px" role="progressbar" aria-label="Basic example" aria-valuenow="${porcentagem}" aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-bar" style="width: ${porcentagem}%; background-color: ${candidate.CandidatoCor};"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', cardHTML);
            }
        });
    });
}

function displayElectionInfo(data) {
    const estados = [
        { nome: "Brasil", id: "brasil" },
        { nome: "São Paulo", id: "sp" },
        { nome: "Santa Catarina", id: "sc" },
        { nome: "Pernambuco", id: "pe" },
        { nome: "Goiás", id: "go" }
    ];

    estados.forEach(({ nome, id }) => {
        const container = document.getElementById(`${id}`);
        if (!container) {
            console.error(`Contêiner não encontrado para estado: ${nome}`);
            return;
        }
        container.innerHTML = '';

        // Filtrar candidatos por estado
        const infoEstado = data.filter(estado => estado.Estado === nome);

        // Criar os cards para cada candidato
        infoEstado.forEach(estado => {
            if (estado.Estado && estado.Apuracao) {

                const cardHTML = `
                        <h5 class="mb-3">
                            <div class="d-flex">
                                ${estado.Apuracao}% das seções totalizadas
                            </div>
                        </h5>
                        <div class="progress" style="height: 5px" role="progressbar" aria-label="Basic example" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar" style="width:${estado.Apuracao}%"></div>
                        </div>
                        <div class="d-flex mt-2 fs-6">Última atualização: ${estado.DataHora}</div>
                `;
                container.insertAdjacentHTML('beforeend', cardHTML);
            }
        });
    });

    const tituloDiv = document.getElementById('titulo');
    const subtituloDiv = document.getElementById('subtitulo');
    const Titulo = data[0].Titulo || 'Eleições';
    const SubTitulo = data[0].SubTitulo || 'Gerais';
    tituloDiv.innerHTML = Titulo;
    subtituloDiv.innerHTML = SubTitulo;
}

// Atualiza os dados a cada 1 segundos
setInterval(fetchData, 1000);

// Primeira execução
fetchData();
