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
    const url = '/api/camara';

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
            createGeneralInfo(data);
            createDataList(data); // Corrigido para chamar a função certa
            createDeputadoList(data); // Mantém apenas uma chamada da função
            createChart(data)
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

function displayDataHora(data) {
    const dataHoraDiv = document.getElementById('data-hora');
    if (data.length > 0 && data[0].DataHora) {
        dataHoraDiv.innerHTML = `${data[0].DataHora}`;
    }
}

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

function createGeneralInfo(data) {
    const generalInfoDiv = document.getElementById('lista-eleicao');

    // Extrai e processa informações relevantes
    const totalVagas = data.reduce((sum, row) => sum + (parseInt(row.VagasObtidas) || 0), 0);
    const totalVotos = data.reduce((sum, row) => sum + (parseInt(row.VotoTotal) || 0), 0);
    const votosValidos = data.reduce((sum, row) => sum + (parseInt(row.VotosValidos) || 0), 0);
    const votosNuloBranco = data.reduce((sum, row) => sum + (parseInt(row.VotoNuloBranco) || 0), 0);

    // Atualiza o HTML com os valores processados
    generalInfoDiv.innerHTML = `
        <div><strong>Vagas:</strong> ${totalVagas || 'N/A'}</div>
        <div><strong>Votos Totais:</strong> ${totalVotos || 'N/A'}</div>
        <div><strong>Votos Válidos:</strong> ${votosValidos || 'N/A'}</div>
        <div><strong>Votos Nulos/Brancos:</strong> ${votosNuloBranco || 'N/A'}</div>
    `;
}

// Função para exibir lista de partidos
function createDataList(data) {
    const dataList = document.getElementById('lista-partidos');
    dataList.innerHTML = '';

    data.forEach(row => {
        if (row.Partido && row.VagasObtidas) {
            const rowDiv = document.createElement('div');
            rowDiv.innerHTML = `<strong>${row.Partido}:</strong> ${row.VagasObtidas} vagas`;
            dataList.appendChild(rowDiv);
        }
    });
}

// Função para exibir lista de deputados
function createDeputadoList(data) {
    const deputadoList = document.getElementById('lista-deputados');
    deputadoList.innerHTML = '';

    data.forEach(row => {
        // Verifica se os campos Deputado, PartidoDeputado e VotoDeputado possuem dados
        if (row.Deputado && row.PartidoDeputado) { 
            const votoDeputado = row.VotoDeputado ? `${row.VotoDeputado} votos` : 'Sem votos';
            const deputadoDiv = document.createElement('div');
            deputadoDiv.innerHTML = `
                ${row.Deputado} (${row.PartidoDeputado})
                ${row.StatusDeputado ? ` - <strong>${row.StatusDeputado}</strong>` : ''}
            `;
            deputadoList.appendChild(deputadoDiv);
        }
    });
}

// Função para criar gráfico de pizza
function createChart(data) {
    am4core.ready(function () {
        am4core.useTheme(am4themes_animated);

        var chart = am4core.create("chartdiv", am4charts.PieChart);
        chart.hiddenState.properties.opacity = 0; // Efeito fade-in inicial
        chart.radius = am4core.percent(70);
        chart.innerRadius = am4core.percent(40);
        chart.startAngle = 180;
        chart.endAngle = 360;

        // Filtra os dados para garantir que somente partidos com vagas apareçam
        chart.data = data
            .filter(item => item.VagasObtidas && item.Cor) // Garante que ambos os campos estejam presentes
            .map(item => ({
                partido: item.Partido,
                totalVagas: parseInt(item.VagasObtidas, 10),
                cor: item.Cor
            }));

        var series = chart.series.push(new am4charts.PieSeries());
        series.dataFields.value = "totalVagas";
        series.dataFields.category = "partido";
        series.slices.template.propertyFields.fill = "cor";

        series.slices.template.cornerRadius = 4;
        series.slices.template.strokeWidth = 0.5;
        series.slices.template.stroke = am4core.color("#dee2e6");

        // Ocultar fatias com valor zero
        series.slices.template.adapter.add("visible", function (visible, target) {
            return target.dataItem.value > 0;
        });

        // Rótulo e Tooltip
        series.slices.template.tooltipText = "{category}: [bold]{value} vagas ({value.percent.formatNumber('#.0')}%)";
        series.labels.template.text = "{category}: {value} vagas ({value.percent.formatNumber('#.0')}%)";
        series.labels.template.disabled = false;
        series.ticks.template.disabled = false;

        chart.legend = new am4charts.Legend();

        // Configuração da animação de expansão
        series.hiddenState.properties.startAngle = 90;
        series.hiddenState.properties.endAngle = 90;

        series.slices.template.events.on("inited", function (event) {
            event.target.show(1000, am4core.ease.cubicOut);
        });
    });
}

// Chama a função para buscar dados ao carregar a página
fetchData();
