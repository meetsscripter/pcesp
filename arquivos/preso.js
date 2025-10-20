// ---------------------------
// LOGIN COM DISCORD + VERIFICAÇÃO DE CARGO
// ---------------------------
async function loginWithDiscord() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbyMTezC06ST-HF5vPjz-KvoQdrR_wgf3pOkEIVDmx7fIZD5ywcxOqCO_g-5RYB4FJpORA/exec');
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

// Verifica se usuário está no servidor permitido
async function checkGuildMembership(token, guildId) {
  try {
    const res = await fetch(`https://discord.com/api/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const guilds = await res.json();
    return guilds.some(g => g.id === guildId);
  } catch {
    return false;
  }
}

// ---------------------------
// LOGIN BOTÃO
// ---------------------------
document.getElementById("discordLogin").addEventListener("click", async e => {
  e.preventDefault();
  const loginStatus = document.getElementById("loginStatus");
  loginStatus.innerHTML = "<strong>⏳ Aguarde o carregamento...</strong>";
  loginStatus.style.display = "block";

  try {
    const token = await loginWithDiscord();
    const user = await fetchDiscordUser(token);

    const guildId = "1396951868000702574"; // Servidor permitido
    const isMember = await checkGuildMembership(token, guildId);

    if (isMember) {
      // Mantendo lógica antiga
      document.querySelector('[name="responsavel"]').value = `<@${user.id}>`;
      document.getElementById("discordLogin").style.display = "none";
      loginStatus.style.display = "none";
      document.querySelector('.form-section').style.display = "block";
    } else {
      loginStatus.style.display = "none";
      alert("❌ Você não está no servidor permitido e não pode acessar este formulário.");
    }

  } catch (err) {
    loginStatus.style.display = "none";
    alert("Falha no login com Discord: " + err);
  }
});

// ---------------------------
// ARTIGOS
// ---------------------------
const ARTICLES = [
  "Tentativa de Homicídio","Estelionato","Suborno","Importar ou exportar mercadoria proibida",
  "Fuga Evasão","Furto","Resistência a Prisão","Sequestro e Cárcere Privado",
  "Depradação de patrimônio público ou privado","Busca e Apreensão","Disputar corridas ilegais",
  "Direção perigosa","Agressão","Porte Ilegal de arma de fogo","Roubo","Abuso de Autoridade",
  "Desobediência a Ordem Policial","Divulgar informações sigilosas ou reservadas","Lavagem de Dinheiro",
  "Assalto a Joalheria","Ameaça","Tráfico de Drogas","Desacato","Difamação",
  "Exercício ilegal da profissão","Assédio","Fuga do presídio","Tráfico de Armas",
  "Assalto ao banco","Tráfico de influência","Corrupção","Associação criminosa",
  "Injúria","Prevaricação","Violação ao Domicílio","Cumplicidade","Calúnia",
  "Receptação","Extorsão","Fazer, publicamente, apologia de fato criminoso","Homicídio"
];

const articlesContainer = document.getElementById('articlesContainer');
ARTICLES.forEach(a => {
  const div = document.createElement('div');
  div.className = 'material-row';
  div.innerHTML = `<input type="checkbox" name="articles" value="${a}"> ${a}`;
  articlesContainer.appendChild(div);
});

// ---------------------------
// INTEGRANTES
// ---------------------------
let responsiblesList = [];

function renderResponsibles() {
  const container = document.getElementById('responsiblesContainer');
  if(!container) return;
  container.innerHTML = '';
  responsiblesList.forEach((id, idx) => {
    const div = document.createElement('div');
    div.className = 'material-row';
    div.innerHTML = `<span>&lt;@${id}&gt;</span>
      <button type="button" data-idx="${idx}" class="editResponsible">Editar</button>
      <button type="button" data-idx="${idx}" class="removeResponsible">Excluir</button>`;
    container.appendChild(div);
  });

  document.querySelectorAll('.editResponsible').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.idx;
      const newId = prompt("Digite o novo ID Discord", responsiblesList[idx]);
      if (newId) {
        responsiblesList[idx] = newId.trim();
        renderResponsibles();
      }
    }
  });

  document.querySelectorAll('.removeResponsible').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.idx;
      responsiblesList.splice(idx, 1);
      renderResponsibles();
    }
  });
}

document.getElementById('addResponsible').addEventListener('click', () => {
  const input = document.getElementById('responsibleInput');
  const val = input.value.trim();
  if (val && !responsiblesList.includes(val)) {
    responsiblesList.push(val);
    input.value = '';
    renderResponsibles();
  }
});

// ---------------------------
// UPLOAD DE ARQUIVO
// ---------------------------
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

// ---------------------------
// ENVIO FORMULÁRIO
// ---------------------------
document.getElementById('prisonerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById('status');
  const btn = form.querySelector('button[type="submit"]');

  btn.disabled = true;
  status.innerText = "⏳ Enviando...";

  const investigator = form.investigator.value;
  const prisonerName = form.prisonerName.value;
  const prisonerCPF = form.prisonerCPF.value;
  const description = form.description.value;
  const articles = Array.from(form.querySelectorAll('input[name="articles"]:checked')).map(a => a.value);

  const filesData = [];
  for (let i = 0; i < filesInput.files.length; i++) {
    const f = filesInput.files[i];
    filesData.push({
      name: f.name,
      type: f.type,
      base64: await fileToBase64(f)
    });
  }

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbyMTezC06ST-HF5vPjz-KvoQdrR_wgf3pOkEIVDmx7fIZD5ywcxOqCO_g-5RYB4FJpORA/exec', {
      method: 'POST',
      body: JSON.stringify({
        investigator,
        prisonerName,
        prisonerCPF,
        description,
        articles,
        responsibles: responsiblesList,
        files: filesData
      })
    });

    const res = await response.json();
    if (res.status === 'ok') {
      status.innerText = "✅ Registro enviado com sucesso!";
      const savedInvestigator = form.investigator.value;
      form.reset();
      form.investigator.value = savedInvestigator;
      mbStatus.innerText = `Total: 0 MB / 25 MB`;
      responsiblesList = [];
      renderResponsibles();
    } else {
      status.innerText = "❌ " + (res.message || JSON.stringify(res));
    }
  } catch (err) {
    status.innerText = "❌ Falha na comunicação: " + err.message;
  } finally {
    btn.disabled = false;
  }
});
