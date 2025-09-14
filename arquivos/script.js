  async function loginWithDiscord() {
    // Chama endpoint do Apps Script para pegar URL de login seguro
    const res = await fetch('https://script.google.com/macros/s/AKfycbxcfSvd98VIbxsg7wV4XbW_bexgoWK-_38fi1T24-PywzbiZ6yd7ktFVt4QOVMP_6ZBkA/exec');
    const data = await res.json();
    const url = data.url;

    const width = 500;
    const height = 700;
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
        } catch (err) {
          // Cross-origin temporário
        }
      }, 500);
    });
  }

  async function fetchDiscordUser(token) {
    const res = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  }

  // ---------------------
  // Botão login
  document.getElementById("discordLogin").addEventListener("click", async e => {
    e.preventDefault();
    try {
      const token = await loginWithDiscord();
      const user = await fetchDiscordUser(token);

      // Preenche formulário com <@ID>
      document.querySelector('[name="investigator"]').value = `<@${user.id}>`;
      document.getElementById("discordLogin").style.display = "none";
      document.getElementById("investigationForm").style.display = "block";
    } catch (err) {
      alert("Falha no login com Discord: " + err);
    }
  });

  // ---------------------
  // Código de arquivos e envio

  const filesInput = document.getElementById('files');
  const mbStatus = document.getElementById('mbStatus');

  filesInput.addEventListener('change', () => {
    let totalMB = 0;
    for (const file of filesInput.files) {
      totalMB += file.size / (1024*1024);
    }
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

  document.getElementById('investigationForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('status');
    const btn = form.querySelector('button[type="submit"]');

    btn.disabled = true;
    status.innerText = "⏳ Enviando...";

    const investigator = form.investigator.value; // já é <@ID>
    const summary = form.summary.value;
    const observations = form.observations.value;
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
        body: JSON.stringify({ investigator, summary, observations, files: filesData })
      });
      const res = await response.json();
      if(res.status==='ok') {
        status.innerText = `✅ Enviado! ${filesData.length} arquivo(s)`;
        form.reset();
        mbStatus.innerText = `Total: 0 MB / 25 MB`;
      } else {
        status.innerText = "❌ " + (res.message||JSON.stringify(res));
      }
    } catch(err) {
      status.innerText = "❌ Falha na comunicação: " + err.message;
    } finally {
      btn.disabled = false;
    }
  });