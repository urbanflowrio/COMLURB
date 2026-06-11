/**
 * HUB COMLURB - Componentes de Header e Footer
 * Cabeçalho e rodapé reutilizáveis
 */

HUB.header = {
  /**
   * Renderiza header do painel
   */
  render(containerId, config) {
    const {
      logo = true,
      systemLabel = "",
      title = "",
      subtitle = "",
      status = null,
      navigation = []
    } = config;

    const container = HUB.dom.$(containerId);
    if (!container) return;

    let logoHTML = "";
    if (logo) {
      logoHTML = `
        <div class="logoWrap">
          <img id="logoComlurb" class="logoImg" 
               src="/COMLURB/assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20branco.png" 
               alt="Prefeitura do Rio + Comlurb"
               style="display:block">
          <div id="logoFallback" class="logoTextFallback" style="display:none">
            PREFEITURA DO RIO | COMLURB
          </div>
        </div>
      `;
    }

    let statusHTML = "";
    if (status) {
      statusHTML = `
        <div class="statusIndicator">
          <small>${HUB.format.esc(status.label)}</small>
          <b>${HUB.format.esc(status.value)}</b>
        </div>
      `;
    }

    let navHTML = "";
    if (navigation.length) {
      navHTML = `
        <div class="navTabs">
          ${navigation.map((nav, i) => `
            <button class="tabBtn ${i === 0 ? 'active' : ''}" data-tab="${nav.id}">
              ${HUB.format.esc(nav.label)}
            </button>
          `).join("")}
        </div>
      `;
    }

    container.innerHTML = `
      <header class="header">
        ${logoHTML}
        <div class="headerContent">
          ${systemLabel ? `<div class="systemLabel">${HUB.format.esc(systemLabel)}</div>` : ""}
          ${title ? `<h1 class="mainTitle">${HUB.format.esc(title)}</h1>` : ""}
          ${subtitle ? `<div class="subtitle">${HUB.format.esc(subtitle)}</div>` : ""}
        </div>
        ${statusHTML}
      </header>
      ${navHTML}
    `;

    // Inicializa fallback de logo
    this._initLogoFallback();

    // Anexa listeners de navegação
    if (navigation.length) {
      this._attachNavListeners(navigation);
    }
  },

  /**
   * Inicializa fallback de logo (caso imagem não carregue)
   */
  _initLogoFallback() {
    const img = HUB.dom.$("logoComlurb");
    const fallback = HUB.dom.$("logoFallback");
    if (!img) return;

    const candidates = [
      "/COMLURB/assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20branco.png",
      "./assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20branco.png",
      "../assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20branco.png",
      "../../assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20branco.png",
      "/COMLURB/assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20azul.png",
      "./assets/logos/RIOPREFEITURA%20Comlurb%20horizontal%20monocromatica%20azul.png"
    ];

    let i = 0;
    img.onerror = () => {
      i++;
      if (i < candidates.length) {
        img.src = candidates[i] + "?v=" + Date.now();
      } else {
        img.style.display = "none";
        if (fallback) fallback.style.display = "block";
      }
    };

    img.onload = () => {
      img.style.display = "block";
      if (fallback) fallback.style.display = "none";
    };

    img.src = candidates[0] + "?v=" + Date.now();
  },

  /**
   * Anexa listeners de navegação entre telas
   */
  _attachNavListeners(navigation) {
    document.querySelectorAll(".tabBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        // Remove active de todos
        document.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

        // Adiciona active no clicado
        btn.classList.add("active");
        const targetId = btn.dataset.tab;
        HUB.dom.addClass(targetId, "active");

        // Callback opcional
        const nav = navigation.find(n => n.id === targetId);
        if (nav && nav.onActivate) {
          nav.onActivate();
        }
      });
    });
  },

  /**
   * Atualiza status
   */
  updateStatus(label, value) {
    const el = document.querySelector(".statusIndicator");
    if (!el) return;

    el.querySelector("small").textContent = label;
    el.querySelector("b").textContent = value;
  }
};

HUB.footer = {
  /**
   * Renderiza footer do painel
   */
  render(containerId, config = {}) {
    const {
      author = "Greicy Moreira",
      contact = "greicymoreira@comlurb.rio",
      version = "1.0",
      showTimestamp = true,
      customText = null
    } = config;

    const container = HUB.dom.$(containerId);
    if (!container) return;

    const timestamp = showTimestamp
      ? `Atualizado em ${new Date().toLocaleString("pt-BR")}`
      : "";

    const text = customText || `
      Desenvolvido por <strong>${HUB.format.esc(author)}</strong> • 
      ${HUB.format.esc(contact)} • 
      Versão ${HUB.format.esc(version)}
    `;

    container.innerHTML = `
      <footer class="footer">
        <div class="footerContent">
          ${text}
          ${timestamp ? `<div class="footerTimestamp">${timestamp}</div>` : ""}
        </div>
      </footer>
    `;
  },

  /**
   * Atualiza timestamp
   */
  updateTimestamp(containerId) {
    const el = HUB.dom.$(containerId);
    if (!el) return;

    const timestamp = el.querySelector(".footerTimestamp");
    if (timestamp) {
      timestamp.textContent = `Atualizado em ${new Date().toLocaleString("pt-BR")}`;
    }
  }
};

/**
 * Componente de Banner de Drill Down
 */
HUB.drillBanner = {
  /**
   * Mostra banner de drill down
   */
  show(containerId, config) {
    const { title, description, onClear } = config;
    const container = HUB.dom.$(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="drillBanner active">
        <div>
          <b>${HUB.format.esc(title)}</b>
          <span>${HUB.format.esc(description)}</span>
        </div>
        <button class="actionBtn primary" onclick="${onClear || 'clearDrill()'}">
          Fechar drill down
        </button>
      </div>
    `;
  },

  /**
   * Esconde banner
   */
  hide(containerId) {
    const container = HUB.dom.$(containerId);
    if (container) {
      container.innerHTML = "";
    }
  },

  /**
   * Atualiza texto
   */
  update(containerId, title, description) {
    const container = HUB.dom.$(containerId);
    if (!container) return;

    const banner = container.querySelector(".drillBanner");
    if (!banner) return;

    banner.querySelector("b").textContent = title;
    banner.querySelector("span").textContent = description;
  }
};

/**
 * Componente de Loading State
 */
HUB.loading = {
  /**
   * Mostra loading em um container
   */
  show(containerId, message = "Carregando dados...") {
    const container = HUB.dom.$(containerId);
    if (container) {
      container.innerHTML = `<div class="loading">${HUB.format.esc(message)}</div>`;
    }
  },

  /**
   * Remove loading
   */
  hide(containerId) {
    const container = HUB.dom.$(containerId);
    if (container) {
      const loading = container.querySelector(".loading");
      if (loading) loading.remove();
    }
  },

  /**
   * Mostra loading em múltiplos containers
   */
  showMultiple(containerIds, message = "Carregando dados...") {
    containerIds.forEach(id => this.show(id, message));
  }
};
