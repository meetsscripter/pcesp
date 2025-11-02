// ---------------------------
// LOGIN COM DISCORD + VERIFICAÇÃO DE MEMBRO DO SERVIDOR
// ---------------------------
async function loginWithDiscord() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbxpvvndcbuR_-I4oggzumzHPDeSQQdpccOCaf8NcTzY9E6AdznAysviTxIXvYL-C27Tqg/exec');
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

// ---------------------------
// VERIFICAÇÃO DE CARGO ESPECÍFICO
// ---------------------------
async function checkUserRole(token, guildId, roleId) {
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
    const roleId = "1405666591668043808"; // Cargo obrigatório
    const hasRole = await checkUserRole(token, guildId, roleId);

    if (hasRole) {
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
// MATERIAIS DINÂMICOS
// ---------------------------
const materiaisContainer = document.getElementById('materiaisContainer');
const addMaterialBtn = document.getElementById('addMaterial');

function createMaterialRow(name="", qty="") {
  const div = document.createElement('div');
  div.classList.add('material-row');
  div.style.marginBottom = "8px";
  div.innerHTML = `
    <select class="material-name">
      <option value="">Selecione</option>
      <option value="Canabis">Canabis</option>
      <option value="Colete">Colete</option>
      <option value="762">762</option>
      <option value="Maconha">Maconha</option>
      <option value="Dinheiro Sujo">Dinheiro Sujo</option>
      <option value="Metafetamina">Metafetamina</option>
      <option value="Kevlar">Kevlar</option>
      <option value="Lockpick">Lockpick</option>
      <option value="Peça de arma">Peça de arma</option>
      <option value="AK47">AK47</option>
      <option value="Glock">Glock</option>
      <option value="Thompson">Thompson</option>
      <option value="MP5">MP5</option>
      <option value="9MM">9MM</option>
      <option value="Zip Lock">Zip Lock</option>
      <option value="Sementes de Marijuana">Sementes de Marijuana</option>
      <option value="Fenilacetona">Fenilacetona</option>
    </select>
    <input type="number" class="material-qty" placeholder="Valor" min="1" value="${qty}" style="width:80px;margin-left:5px;" />
    <button type="button" class="removeMaterial">❌</button>
  `;
  materiaisContainer.appendChild(div);

  div.querySelector('.material-name').value = name;

  div.querySelector('.removeMaterial').addEventListener('click', () => {
    div.remove();
  });
}

addMaterialBtn.addEventListener('click', () => {
  createMaterialRow();
});

// ---------------------------
// ARQUIVOS
// ---------------------------
const filesInput = document.getElementById('files');
const mbStatus = document.getElementById('mbStatus');

filesInput.addEventListener('change', () => {
  let totalMB = 0;
  for (const file of filesInput.files) {
    totalMB += file.size / (1024*1024);
    if (file.size > 10*1024*1024) {
      alert(`❌ Arquivo ${file.name} maior que 10MB!`);
      filesInput.value = "";
      mbStatus.innerText = `Total: 0 MB / 25 MB`;
      return;
    }
  }
  totalMB = Math.round(totalMB*100)/100;
  if (totalMB > 25) {
    alert("❌ Total de arquivos ultrapassa 25MB!");
    filesInput.value = "";
    mbStatus.innerText = `Total: 0 MB / 25 MB`;
    return;
  }
  mbStatus.innerText = `Total: ${totalMB} MB / 25 MB`;
});

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// ---------------------------
// ENVIO DO FORMULÁRIO
// ---------------------------
document.getElementById('apreensaoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById('status');
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  status.innerText = "⏳ Enviando...";

  // validação do mapa
  const mapX = document.getElementById("mapX").value;
  const mapY = document.getElementById("mapY").value;
  if (!mapX || !mapY) {
    status.innerText = "❌ Selecione o local no mapa antes de enviar!";
    btn.disabled = false;
    return;
  }

  const responsavel = form.responsavel.value;

  // transforma participantes em array, separando por vírgula, caso seja string
  let participantes = form.participantes.value;
  if (typeof participantes === 'string') {
    participantes = participantes.split(',').map(p => p.trim()).filter(p => p);
  }

  // coleta materiais e soma quantidades iguais
  const materialRows = document.querySelectorAll('.material-row');
  const materiaisMap = {};
  materialRows.forEach(row => {
    const name = row.querySelector('.material-name').value;
    const qty = parseInt(row.querySelector('.material-qty').value) || 0;
    if (name && qty) {
      if (!materiaisMap[name]) materiaisMap[name] = 0;
      materiaisMap[name] += qty;
    }
  });
  const materiais = Object.entries(materiaisMap).map(([name, qty]) => ({ name, qty }));
  if (materiais.length === 0) {
    status.innerText = "❌ Adicione pelo menos um material";
    btn.disabled = false;
    return;
  }

  // coleta arquivosx
  const files = filesInput.files;
  const filesData = [];
  for (const file of files) {
    const base64 = await fileToBase64(file);
    filesData.push({ name: file.name, type: file.type, base64 });
  }

  // coleta mapa
  const mapImageBase64 = document.getElementById("mapImage").value;
  if (mapImageBase64) {
    filesData.push({
      name: "mapa_marcado.png",
      type: "image/png",
      base64: mapImageBase64.split(',')[1]
    });
  }

  // envio via Apps Script
  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbxpvvndcbuR_-I4oggzumzHPDeSQQdpccOCaf8NcTzY9E6AdznAysviTxIXvYL-C27Tqg/exec', {
      method: 'POST',
      body: JSON.stringify({ responsavel, participantes, materiais, files: filesData })
    });
    const result = await res.json();
    if (result.status === 'ok') {
      status.innerText = `✅ Apreensões enviadas!`;
      materiaisContainer.innerHTML = "";
      form.participantes.value = "";
      filesInput.value = "";
      document.getElementById("mapX").value = "";
      document.getElementById("mapY").value = "";
      document.getElementById("mapImage").value = "";
      mbStatus.innerText = `Total: 0 MB / 25 MB`;
    } else {
      status.innerText = `❌ ${result.message || JSON.stringify(result)}`;
    }
  } catch (err) {
    status.innerText = `❌ Falha na comunicação: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
});





