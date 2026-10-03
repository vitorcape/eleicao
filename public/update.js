// Endpoint do Worker (D1) com os avisos de atualização
const sheetUrl = "/api/update";

// Objetos para armazenar os Toasts
let toastObjects = {};

// Função para buscar dados da API e exibir em Toasts
async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.json();

        // Filtra os dados com base na coluna "STATUS"
        const dadosFiltrados = data.filter(row => row.STATUS);

        // Percorre cada linha de dados e exibe/atualiza os Toasts
        dadosFiltrados.forEach(row => {
            const toastId = row.DataHora;  // Usando DataHora como identificador único

            // Verificação para o Estado e definição do código correspondente
            let estadoCode = "";
            if (row.Estado === "São Paulo") {
                estadoCode = "26-sao-paulo";
            } else if (row.Estado === "Brasil") {
                estadoCode = "01-brasil";
            } else if (row.Estado === "Pernambuco") {
                estadoCode = "18-pernambuco";
            } else if (row.Estado === "Santa Catarina") {
                estadoCode = "25-santa-catarina";
            } else if (row.Estado === "Câmara") {
                estadoCode = "01-brasil";
            } else if (row.Estado === "Senado") {
                estadoCode = "01-brasil";
            } else if (row.Estado === "Goiás") {
                estadoCode = "10-goias";
            }

            let estadoURL = "";
            if (row.Estado === "São Paulo") {
                estadoURL = "estado#sp";
            } else if (row.Estado === "Brasil") {
                estadoURL = "geral";
            } else if (row.Estado === "Pernambuco") {
                estadoURL = "estado#pe";
            } else if (row.Estado === "Santa Catarina") {
                estadoURL = "estado#sc";
            } else if (row.Estado === "Câmara") {
                estadoURL = "camara";
            } else if (row.Estado === "Senado") {
                estadoURL = "senado";
            } else if (row.Estado === "Goiás") {
                estadoURL = "estado#go";
            }

            // Se STATUS for "SIM", exibe o Toast, caso contrário, remove
            if (row.STATUS.toUpperCase() === "SIM") {
                if (!toastObjects[toastId]) {
                    // Criando o Toast
                    const toastElement = document.createElement("div");
                    toastElement.classList.add("toast", "align-items-center");
                    toastElement.setAttribute("role", "alert");
                    toastElement.setAttribute("aria-live", "assertive");
                    toastElement.setAttribute("aria-atomic", "true");

                    // Conteúdo do Toast com DataHora, Estado e Código do Estado
                    const [pagina, ancora] = estadoURL.split("#");
                    toastElement.innerHTML = `
                            <a href="/${pagina}.html${ancora ? "#" + ancora : ""}" class="text-decoration-none text-body">
                            <div class="toast-header">
                                <object class="justify-align-center me-2" type="image/svg+xml" data="/svg/${estadoCode}-square-rounded.svg" width="20" height="20"></object>
                                <strong class="me-auto poppins fs-6">Nova atualização!</strong>
                            </div>
                            <div class="toast-body">
                                Atualização na apuração para <strong>${row.Estado}</strong><br>
                                Data e Hora: ${row.DataHora}<br>
                            </div>
                            </a>`;

                    // Adiciona o Toast ao container
                    document.getElementById("toast-container").appendChild(toastElement);

                    // Exibe o Toast com um delay de 10 segundos
                    const toast = new bootstrap.Toast(toastElement, {
                        delay: 10000  // Define o tempo de exibição para 10 segundos
                    });
                    toast.show();

                    // Armazenando o Toast no objeto
                    toastObjects[toastId] = toastElement;
                }
            } else {
                // Se STATUS for "NÃO", remove o Toast
                if (toastObjects[toastId]) {
                    const toastElement = toastObjects[toastId];
                    toastElement.remove(); // Remove o Toast da tela
                    delete toastObjects[toastId]; // Remove do objeto
                }
            }
        });
    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
    }
}

// Intervalo de atualização em milissegundos (a cada 10 segundos)
const intervalTime = 10000;

// Configura o intervalo para buscar e exibir os dados automaticamente
setInterval(fetchData, intervalTime);

// Chama a função pela primeira vez imediatamente
fetchData();
