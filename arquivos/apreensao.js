// IDs fixos
const GUILD_ID = "1396951868000702574";
const ROLE_ID = "1405666591668043808";
const API_BASE = "https://discord.com/api/users/@me";

// Detecta se está no GitHub Pages ou localhost
const REDIRECT_URI = window.location.href.startsWith("http")
  ? window.location.href
  : "https://meetsscripter.github.io/investigativa/materias.html";

// ----------------------------------------
// LOGIN VIA DISCORD
// ----------------------------------------

async function loginDiscord() {
  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbyEQIo5z5cdRSP5tL1riLRTWv4rSM6nVvBF4SxZfhsek-kqANJQOLVbI12D-diY5X3B-A/exec"
    );
    const data = await res.json();
    window.location.href = data.url;
  } catch (e) {
    alert("Erro ao iniciar login via Discord.");
  }
}

// ----------------------------------------
// VERIFICAÇÃO DE USUÁRIO E CARGO
// ----------------------------------------

async function verificarDiscordToken() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");

  if (!token) return;

  try {
    // Pega informações do usuário
    const userInfo = await fetch(API_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    // Pega lista de servidores
    const guilds = await fetch(`${API_BASE}/guilds`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    const guild = guilds.find((g) => g.id === GUILD_ID);
    if (!guild) {
      alert("❌ Você não está no servidor autorizado.");
      return;
    }

    // Verifica cargo (precisa de endpoint do bot)
    const hasRole = await verificarCargoServidor(userInfo.id, token);
    if (!hasRole) {
      alert("🚫 Você não possui a tag necessária para acessar.");
      return;
    }

    document.querySelector("#responsavel").value = `<@${userInfo.id}>`;
    document.querySelector("#loginSection").style.display = "none";
    document.querySelector("#formSection").style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Erro ao verificar permissões do Discord.");
  }
}

async function verificarCargoServidor(userId, token) {
  // ⚠️ Aqui você precisa usar um BOT TOKEN no backend (AppScript)
  // pois o token do usuário não tem acesso a `/guilds/:id/members/:id`
  try {
    const response = await fetch(
      `https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`,
      {
        headers: { Authorization: `Bot SEU_BOT_TOKEN_AQUI` },
      }
    );
    if (!response.ok) return false;
    const member = await response.json();
    return member.roles.includes(ROLE_ID);
  } catch {
    return false;
  }
}

// ----------------------------------------
// EXECUTA AUTOMATICAMENTE AO CARREGAR
// ----------------------------------------

window.onload = verificarDiscordToken;

