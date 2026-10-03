// Chamadas autenticadas à API de administração do Worker (/api/admin/*).
// A senha (ADMIN_TOKEN configurado no Worker) fica salva neste navegador.
const CHAVE_TOKEN = "eleicaoAdminToken";

function lerToken() {
    try {
        return localStorage.getItem(CHAVE_TOKEN);
    } catch (e) {
        return null;
    }
}

function salvarToken(token) {
    try {
        if (token) localStorage.setItem(CHAVE_TOKEN, token);
        else localStorage.removeItem(CHAVE_TOKEN);
    } catch (e) {
        // Navegador sem localStorage: a senha será pedida de novo.
    }
}

async function apiAdmin(caminho, opcoes = {}, tentativa = 0) {
    let token = lerToken();
    if (!token) {
        token = window.prompt("Senha de administração:");
        if (!token) throw new Error("Senha não informada");
        salvarToken(token);
    }

    const resposta = await fetch(`/api/admin/${caminho}`, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(opcoes.headers || {})
        }
    });

    if (resposta.status === 401) {
        salvarToken(null);
        if (tentativa === 0) return apiAdmin(caminho, opcoes, 1);
        throw new Error("Senha incorreta");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || `Erro ${resposta.status}`);
    return dados;
}

function sairAdmin() {
    salvarToken(null);
}
