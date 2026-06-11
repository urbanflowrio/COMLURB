/**
 * HUB COMLURB - Componente de KPI Cards
 * Cards de métricas reutilizáveis
 */

HUB.cards = {
  /**
   * Renderiza grid de KPI cards
   * @param {string} containerId - ID do container
   * @param {Array} kpis - Array de objetos KPI
   * 
   * Formato do objeto KPI:
   * {
   *   label: "Nome do KPI",
   *   value: 1234,
   *   note: "Texto auxiliar",
   *   color: "green|orange|red|purple|blue", // opcional
   *   feature: false, // se true, ocupa 2 colunas
   *   onclick: "funcaoClick()", // opcional
   *   format: "int|pct|custom", // default: "int"
   *   customFormatter: (value) => "...", // se format === "custom"
   * }
   */
  render(containerId, kpis) {
    const container = HUB.dom.$(containerId);
    if (!container) {
      console.warn(`Container ${containerId} não encontrado`);
      return;
    }

    container.innerHTML = kpis.map(kpi => this._renderCard(kpi)).join("");
  },

  /**
   * Renderiza um card individual
   */
  _renderCard(kpi) {
    const {
      label,
      value,
      note = "",
      color = "",
      feature = false,
      onclick = "",
      format = "int",
      customFormatter = null,
      tooltip = ""
    } = kpi;

    // Formata valor
    let formattedValue;
    if (customFormatter) {
      formattedValue = customFormatter(value);
    } else if (format === "pct") {
      formattedValue = HUB.format.pct(value);
    } else {
      formattedValue = HUB.format.int(value);
    }

    // Classes CSS
    const classes = [
      "kpi",
      feature ? "feature" : "",
      color ? color : ""
    ].filter(Boolean).join(" ");

    // Atributos
    const attrs = [
      onclick ? `onclick="${onclick}"` : "",
      onclick ? 'style="cursor:pointer"' : "",
      tooltip ? `data-tooltip="${HUB.format.esc(tooltip)}"` : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="${classes}" ${attrs}>
        <div class="label">${HUB.format.esc(label)}</div>
        <div class="value">${formattedValue}</div>
        ${note ? `<div class="note">${HUB.format.esc(note)}</div>` : ""}
      </div>
    `;
  },

  /**
   * Atualiza valores de cards existentes (sem re-renderizar tudo)
   */
  update(containerId, updates) {
    // updates = { label1: newValue1, label2: newValue2, ... }
    const container = HUB.dom.$(containerId);
    if (!container) return;

    Object.entries(updates).forEach(([label, value]) => {
      const card = [...container.querySelectorAll(".kpi")].find(
        el => el.querySelector(".label")?.textContent === label
      );
      if (card) {
        const valueEl = card.querySelector(".value");
        if (valueEl) valueEl.textContent = HUB.format.int(value);
      }
    });
  },

  /**
   * Template de KPIs comuns para painéis de Pessoas
   */
  templatePessoas(data) {
    return [
      {
        label: "Total de colaboradores",
        value: data.total,
        note: "No recorte atual",
        feature: true,
        onclick: "clearDrill()",
        tooltip: "Clique para resetar filtros"
      },
      {
        label: "Ativos",
        value: data.ativos,
        note: `${HUB.format.pct(HUB.format.calcPct(data.ativos, data.total))}`,
        color: "green",
        onclick: "setDrill('situacao','ativo','Servidores ativos')",
        tooltip: "Colaboradores em atividade regular"
      },
      {
        label: "Afastados",
        value: data.afastados,
        note: `${HUB.format.pct(HUB.format.calcPct(data.afastados, data.total))}`,
        color: "orange",
        onclick: "setDrill('situacao','afastado','Servidores afastados')",
        tooltip: "Colaboradores temporariamente afastados"
      },
      {
        label: "Laudos",
        value: data.laudos,
        note: `${HUB.format.pct(HUB.format.calcPct(data.laudos, data.total))}`,
        color: "purple",
        onclick: "setDrill('situacao','laudo','Servidores com laudo')",
        tooltip: "Colaboradores com laudo médico"
      },
      {
        label: "Risco 65+",
        value: data.risco65,
        note: `${HUB.format.pct(HUB.format.calcPct(data.risco65, data.total))}`,
        color: "red",
        onclick: "setDrill('situacao','risco65','Risco etário 65+')",
        tooltip: "Colaboradores com 65 anos ou mais"
      }
    ];
  },

  /**
   * Template de KPIs para painéis de Contratos
   */
  templateContratos(data) {
    return [
      {
        label: "Unidades atendidas",
        value: data.unidades,
        note: `Em ${data.regioes || 0} regiões`,
        feature: true
      },
      {
        label: "Postos ativos",
        value: data.postos,
        note: "Distribuídos",
        color: "green"
      },
      {
        label: "Valor contratado",
        value: data.valor,
        format: "custom",
        customFormatter: v => `R$ ${HUB.format.int(v)}`,
        note: "Mensal",
        color: "blue"
      },
      {
        label: "CREs cobertas",
        value: data.cres,
        note: "Coordenadorias",
        color: "blue"
      },
      {
        label: "Taxa de cobertura",
        value: data.cobertura,
        format: "pct",
        note: "Do total previsto",
        color: "green"
      }
    ];
  }
};
