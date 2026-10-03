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

let partidos = {}; // Mova a declaração de `partidos` para fora das funções para ser acessível em ambas

function gerarCampos() {
    const numeroPartidos = parseInt(document.getElementById("numeroPartidos").value);
    const container = document.getElementById("partidos-container");

    // Limpa o container antes de gerar novos campos
    container.innerHTML = "";

    for (let i = 1; i <= numeroPartidos; i++) {
        // Cria o contêiner principal do partido
        const partidoDiv = document.createElement("div");
        partidoDiv.classList.add("row", "mb-3");

        // Título do partido
        const partidoTitulo = document.createElement("h5");
        partidoTitulo.classList.add("mt-3");
        partidoTitulo.innerText = `Partido ${i}:`;
        partidoDiv.appendChild(partidoTitulo);

        // Nome do partido
        const nomeDiv = document.createElement("div");
        nomeDiv.classList.add("col-auto");
        const nomeLabel = document.createElement("label");
        nomeLabel.classList.add("form-label");
        nomeLabel.setAttribute("for", `partidoNome${i}`);
        nomeLabel.innerText = "Nome:";
        const nomeInput = document.createElement("input");
        nomeInput.type = "text";
        nomeInput.classList.add("form-control");
        nomeInput.id = `partidoNome${i}`;
        nomeInput.value = ""; // Defina um valor padrão se necessário
        nomeInput.required = true;
        nomeDiv.appendChild(nomeLabel);
        nomeDiv.appendChild(nomeInput);
        partidoDiv.appendChild(nomeDiv);

        // Votos do partido
        const votosDiv = document.createElement("div");
        votosDiv.classList.add("col-auto", "w-25");
        const votosLabel = document.createElement("label");
        votosLabel.classList.add("form-label");
        votosLabel.setAttribute("for", `partido${i}`);
        votosLabel.innerText = "Votos:";
        const votosInput = document.createElement("input");
        votosInput.type = "number";
        votosInput.classList.add("form-control");
        votosInput.id = `partido${i}`;
        votosInput.value = 0; // Valor padrão 0
        votosInput.required = true;
        votosDiv.appendChild(votosLabel);
        votosDiv.appendChild(votosInput);
        partidoDiv.appendChild(votosDiv);

        // Cor do partido
        const corDiv = document.createElement("div");
        corDiv.classList.add("col-auto");
        const corLabel = document.createElement("label");
        corLabel.classList.add("form-label");
        corLabel.setAttribute("for", `partidoCor${i}`);
        corLabel.innerText = "Cor:";
        const corInput = document.createElement("input");
        corInput.type = "color";
        corInput.classList.add("form-control", "form-control-color");
        corInput.id = `partidoCor${i}`;
        corInput.value = "#000000"; // Cor padrão
        corInput.title = "Escolha uma cor";
        corDiv.appendChild(corLabel);
        corDiv.appendChild(corInput);
        partidoDiv.appendChild(corDiv);

        // Adiciona o bloco do partido ao contêiner principal
        container.appendChild(partidoDiv);
    }
}

function calcularDistribuicao() {
    const vagas = parseInt(document.getElementById("vagas").value);
    const nulosBrancos = parseInt(document.getElementById("nulosBrancos").value);
    const partidosNomes = [];
    let partidos = {}; // Inicialize o objeto `partidos` aqui

    const numeroPartidos = parseInt(document.getElementById("numeroPartidos").value);

    for (let i = 1; i <= numeroPartidos; i++) {
        const nomePartidoElement = document.getElementById(`partidoNome${i}`);
        const votosElement = document.getElementById(`partido${i}`);
        const corElement = document.getElementById(`partidoCor${i}`);

        if (!nomePartidoElement || !votosElement || !corElement) {
            console.error(`Erro: Elementos de entrada para partido ${i} não foram encontrados.`);
            continue;
        }

        const nomePartido = nomePartidoElement.value;
        const votos = parseInt(votosElement.value);
        const cor = corElement.value;

        partidosNomes.push(nomePartido);
        partidos[`partido${i}`] = {
            votos,
            cor,
            vagasObtidas: 0,
            QP: 0,
            QPInteiro: 0
        };
    }

    const votosTotais = Object.values(partidos).reduce((acc, partido) => acc + partido.votos, 0) + nulosBrancos;
    const votosValidos = Object.values(partidos).reduce((acc, partido) => acc + partido.votos, 0);
    document.getElementById("resultado").innerHTML = `
        <p class="mb-0"><strong>Quantidade de vagas:</strong> ${vagas}</p>
        <p class="mb-0"><strong>Votos válidos:</strong> ${votosValidos}</p>
        <p class="mb-0"><strong>Votos nulos/brancos:</strong> ${nulosBrancos}</p>
        <p class="mb-4"><strong>Votos totais:</strong> ${votosTotais}</p>
    `;

    const QE = Math.floor(votosValidos / vagas);
    document.getElementById("resultado").innerHTML += `<p><strong>Quociente Eleitoral (QE):</strong> ${QE}</p>`;

    let vagasDistribuidas = 0;
    let distribuicaoQP = `<h4>Quociente Partidário de cada partido:</h4><ul>`;

    for (let i = 1; i <= numeroPartidos; i++) {
        const partido = partidos[`partido${i}`];
        partido.QP = partido.votos / QE;
        partido.QPInteiro = Math.floor(partido.QP);
        partido.vagasObtidas = partido.QPInteiro;
        vagasDistribuidas += partido.vagasObtidas;

        distribuicaoQP += `<li>${partidosNomes[i - 1]} com ${partido.votos} votos: QP completo = ${partido.QP.toFixed(2)}, QP inteiro (vagas iniciais) = ${partido.QPInteiro}</li>`;
    }

    distribuicaoQP += `</ul>`;

    let vagasRestantes = vagas - vagasDistribuidas;
    document.getElementById("resultado").innerHTML += `<p>Vagas restantes para distribuir (sobras): ${vagasRestantes}</p>`;

    let distribuicaoSobras = `<h4>Distribuição das Sobras:</h4><ol>`;

    while (vagasRestantes > 0) {
        const partidosOrdenados = Object.values(partidos).sort((a, b) => {
            const mediaA = a.votos / (a.vagasObtidas + 1);
            const mediaB = b.votos / (b.vagasObtidas + 1);

            if (mediaB === mediaA) {
                // Se as médias são iguais, o partido com menos votos recebe a vaga extra
                return a.votos - b.votos;
            }

            return mediaB - mediaA;
        });

        partidosOrdenados[0].vagasObtidas++;
        vagasRestantes--;

        const partidoIndex = Object.keys(partidos).find(key => partidos[key] === partidosOrdenados[0]);
        distribuicaoSobras += `<li>${partidosNomes[partidoIndex.replace('partido', '') - 1]} recebeu 1 vaga extra (Média: ${(partidosOrdenados[0].votos / partidosOrdenados[0].vagasObtidas).toFixed(2)})</li>`;
    }

    distribuicaoSobras += `</ol>`;

    let resultadoHTML = `<p>Total de vagas distribuídas: ${vagas}</p><ul>`;
    let somaCadeiras = [];

    for (let i = 1; i <= numeroPartidos; i++) {
        const partido = partidos[`partido${i}`];
        resultadoHTML += `<li>${partidosNomes[i - 1]}: ${partido.vagasObtidas} vagas</li>`;
        somaCadeiras.push({
            partido: partidosNomes[i - 1],
            totalVagas: partido.vagasObtidas,
            cor: partido.cor
        });
    }

    resultadoHTML += `</ul>`;

    let resultadoSoma = `<h4>Total de vagas por partido:</h4><ul>`;
    somaCadeiras.forEach(item => {
        resultadoSoma += `<li>${item.partido}: ${item.totalVagas} vagas</li>`;
    });
    resultadoSoma += `</ul>`;

    document.getElementById("resultado").innerHTML += distribuicaoQP + distribuicaoSobras + resultadoSoma;

    // Atualizar o gráfico (função fictícia de exemplo)
    updateChart(somaCadeiras);
}


am4core.ready(function () {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    var chart = am4core.create("chartdiv", am4charts.PieChart);
    chart.hiddenState.properties.opacity = 0; // cria um efeito fade-in inicial

    // Configuração do gráfico
    chart.radius = am4core.percent(70);
    chart.innerRadius = am4core.percent(40);
    chart.startAngle = 180;
    chart.endAngle = 360;

    var series = chart.series.push(new am4charts.PieSeries());
    series.dataFields.value = "totalVagas";
    series.dataFields.category = "partido";
    series.slices.template.propertyFields.fill = "cor"; // Define a cor a partir dos dados

    // Ocultar fatias com valor zero usando um adaptador
    series.slices.template.adapter.add("visible", function(visible, target) {
        return target.dataItem.value > 0;
    });

    // Mostrar % e quantidade de vagas
    series.slices.template.tooltipText = "{category}: [bold]{value} vagas ({value.percent.formatNumber('#.0')}%)";

    // Configura o rótulo para exibir % e quantidade de vagas
    series.labels.template.text = "{category}: {value} vagas ({value.percent.formatNumber('#.0')}%)";
    series.labels.template.disabled = false; // habilitar rótulos
    series.ticks.template.disabled = false; // habilitar ticks

    chart.legend = new am4charts.Legend();

    // Função para atualizar o gráfico
    window.updateChart = function (somaCadeiras) {
        chart.data = somaCadeiras.map(item => ({
            partido: item.partido,
            totalVagas: item.totalVagas,
            cor: item.cor // Cor definida pelo usuário
        }));
    }
}); // end am4core.ready()

function enviarParaPlanilha() {
    const vagas = parseInt(document.getElementById("vagas").value);
    const nulosBrancos = parseInt(document.getElementById("nulosBrancos").value);
    const numeroPartidos = parseInt(document.getElementById("numeroPartidos").value);
    const partidos = [];
    let votosValidos = 0;

    for (let i = 1; i <= numeroPartidos; i++) {
        const nomePartido = document.getElementById(`partidoNome${i}`).value;
        const votos = parseInt(document.getElementById(`partido${i}`).value);
        const cor = document.getElementById(`partidoCor${i}`).value;

        partidos.push({
            Partido: nomePartido,
            Votos: votos,
            Cor: cor,
            VagasObtidas: 0,
            Sobras: 0
        });

        votosValidos += votos;
    }

    const votosTotais = votosValidos + nulosBrancos;

    partidos.forEach(partido => {
        partido.VagasObtidas = Math.floor((partido.Votos / votosValidos) * vagas);
    });

    const vagasDistribuidas = partidos.reduce((total, partido) => total + partido.VagasObtidas, 0);
    const sobras = vagas - vagasDistribuidas;

    if (sobras > 0) {
        const votosPorVaga = partidos.map(partido => ({
            Partido: partido.Partido,
            Votos: partido.Votos - partido.VagasObtidas * (votosValidos / vagas)
        }));

        votosPorVaga.sort((a, b) => b.Votos - a.Votos);

        for (let i = 0; i < sobras; i++) {
            partidos.find(p => p.Partido === votosPorVaga[i % votosPorVaga.length].Partido).Sobras++;
        }
    }

    partidos.forEach(partido => {
        partido.VagasObtidas += partido.Sobras;
    });

    const data = [
        {
            "Deputado Vagas": vagas,
            "Deputado Votos Nulos/Brancos": nulosBrancos,
            "Deputado Votos Totais": votosTotais,
            "Deputado Votos Válidos": votosValidos
        },
        ...partidos.map(partido => ({
            Partido: partido.Partido,
            Votos: partido.Votos,
            Cor: partido.Cor,
            VagasObtidas: partido.VagasObtidas
        }))
    ];

    apiAdmin("envios/camara", {
        method: "POST",
        body: JSON.stringify(data)
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
