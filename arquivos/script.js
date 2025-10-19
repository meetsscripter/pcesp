// ---------------------------
// LOGIN COM DISCORD + VERIFICAÇÃO DE CARGO
// ---------------------------
async function loginWithDiscord() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbxcfSvd98VIbxsg7wV4XbW_bexgoWK-_38fi1T24-PywzbiZ6yd7ktFVt4QOVMP_6ZBkA/exec');
  const data = await res.json();
  const url = data.url;

  const width = 500, height = 700;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  const popup = window.open(url, "DiscordLogin", `width=${width},height=${height},top=${top},left=${left}`);

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          reject("Login cancelado ou popup fechado");
        }
        const hash = popup.location.hash;
        if (hash) {
          clearInterval(interval);
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get("access_token");
          popup.close();
          if (token) resolve(token);
          else reject("Token não encontrado");
        }
      } catch {}
    }, 500);
  });
}

async function fetchDiscordUser(token) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

// Verifica se o usuário tem o cargo no servidor
async function checkGuildMembership(token, guildId, roleId) {
  try {
    const res = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return false;
    const member = await res.json();
    return member.roles && member.roles.includes(roleId);
  } catch {
    return false;
  }
}

document.getElementById("discordLogin").addEventListener("click", async e => {
  e.preventDefault();
  const loginStatus = document.getElementById("loginStatus");
  loginStatus.innerHTML = "<strong>⏳ Aguarde o carregamento...</strong>";
  loginStatus.style.display = "block";

  try {
    const token = await loginWithDiscord();
    const user = await fetchDiscordUser(token);

    // IDs do servidor e cargo
    const guildId = "1396951868000702574";
    const roleId = "1405666591668043808";

    // Verifica se o usuário está no servidor e possui o cargo
    const hasRole = await checkGuildMembership(token, guildId, roleId);

    if (hasRole) {
      // Usuário autorizado
      document.querySelector('[name="investigator"]').value = `<@${user.id}>`;
      document.getElementById("discordLogin").style.display = "none";
      loginStatus.style.display = "none";
      document.querySelector('.form-section').style.display = "block";
    } else {
      // Usuário não autorizado
      loginStatus.style.display = "none";
      alert("❌ Você não tem permissão para acessar este formulário.");
    }

  } catch (err) {
    loginStatus.style.display = "none";
    alert("Falha no login com Discord: " + err);
  }
});


// ---------------------
// SISTEMA DE UPLOAD E ENVIO
// ---------------------

const filesInput = document.getElementById('files');
const mbStatus = document.getElementById('mbStatus');

filesInput.addEventListener('change', () => {
  let totalMB = 0;
  for (const file of filesInput.files) totalMB += file.size / (1024*1024);
  totalMB = Math.round(totalMB * 100) / 100;
  mbStatus.innerText = `Total: ${totalMB} MB / 25 MB`;

  for (const file of filesInput.files) {
    if (file.size > 10*1024*1024) {
      alert(`❌ Arquivo ${file.name} maior que 10MB!`);
      filesInput.value = "";
      mbStatus.innerText = `Total: 0 MB / 25 MB`;
      return;
    }
  }

  if (totalMB > 25) {
    alert("❌ Total de arquivos ultrapassa 25MB!");
    filesInput.value = "";
    mbStatus.innerText = `Total: 0 MB / 25 MB`;
  }
});

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// ---------------------
// FORMULÁRIO DE ENVIO
// ---------------------

document.getElementById('investigationForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById('status');
  const btn = form.querySelector('button[type="submit"]');

  btn.disabled = true;
  status.innerText = "⏳ Enviando...";

  const investigator = form.investigator.value;
  const summary = form.summary.value;
  const observations = form.observations.value;
  const crimeType = form.crimeType.value || "Não especificado";
  const crimeCase = form.crimeCase.value || "N/A";

  const files = filesInput.files;
  if (files.length > 10) {
    status.innerText = "❌ Máximo 10 arquivos";
    btn.disabled = false;
    return;
  }

  const filesData = [];
  let totalMB = 0;
  for (const file of files) {
    if (file.size > 10*1024*1024) {
      status.innerText = `❌ Arquivo ${file.name} maior que 10MB`;
      btn.disabled = false;
      return;
    }
    totalMB += file.size / (1024*1024);
    if (totalMB > 25) {
      status.innerText = "❌ Total de arquivos ultrapassa 25MB";
      btn.disabled = false;
      return;
    }
    const base64 = await fileToBase64(file);
    filesData.push({ name: file.name, type: file.type, base64 });
  }

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxcfSvd98VIbxsg7wV4XbW_bexgoWK-_38fi1T24-PywzbiZ6yd7ktFVt4QOVMP_6ZBkA/exec', {
      method: 'POST',
      body: JSON.stringify({
        investigator,
        summary,
        observations,
        crimeType,
        crimeCase,
        files: filesData
      })
    });

    const res = await response.json();
    if (res.status === 'ok') {
      status.innerText = `✅ Enviado com sucesso!`;
      const savedInvestigator = form.investigator.value;
      form.summary.value = "";
      form.observations.value = "";
      form.crimeType.value = "";
      form.crimeCase.value = "N/A";
      filesInput.value = "";
      mbStatus.innerText = `Total: 0 MB / 25 MB`;
      setTimeout(() => { status.innerText = ""; }, 2000);
      form.investigator.value = savedInvestigator;
    } else {
      status.innerText = "❌ " + (res.message || JSON.stringify(res));
    }
  } catch (err) {
    status.innerText = "❌ Falha na comunicação: " + err.message;
  } finally {
    btn.disabled = false;
  }
});






