/**
 * HUB COMLURB - Componente de Gráficos Chart.js
 * Gráficos pré-configurados com tema navy + glow
 */

HUB.charts = {
  /**
   * Configuração padrão de cores (tema navy)
   */
  colors: {
    blue: "#5b9bd5",
    blueGradient: ["#2f67a5", "#5b9bd5"],
    orange: "#e87535",
    orangeGradient: ["#b95023", "#e87535"],
    green: "#78aaa3",
    greenGradient: ["#437b76", "#78aaa3"],
    red: "#ef6a5d",
    purple: "#a78bfa",
    yellow: "#ffa02b",
    text: "#f7f9ff",
    muted: "#b8c9de",
    grid: "#294866",
    bg: "#0d1f36"
  },

  /**
   * Configuração base para todos os gráficos
   */
  baseConfig: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#b8c9de",
          font: { size: 12, family: "Segoe UI" },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: "rgba(13,31,54,0.95)",
        titleColor: "#f7f9ff",
        bodyColor: "#b8c9de",
        borderColor: "#294866",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            label += HUB.format.int(context.parsed.y || context.parsed);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: "rgba(41,72,102,0.3)",
          borderColor: "#294866"
        },
        ticks: {
          color: "#b8c9de",
          font: { size: 11 }
        }
      },
      y: {
        grid: {
          color: "rgba(41,72,102,0.3)",
          borderColor: "#294866"
        },
        ticks: {
          color: "#b8c9de",
          font: { size: 11 },
          callback: value => HUB.format.int(value)
        }
      }
    }
  },

  /**
   * Cria gradient linear
   */
  _createGradient(ctx, colors) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
  },

  /**
   * Gráfico de barras verticais
   */
  bar(canvasId, data, options = {}) {
    const canvas = HUB.dom.$(canvasId);
    if (!canvas) {
      console.warn(`Canvas ${canvasId} não encontrado`);
      return null;
    }

    const ctx = canvas.getContext("2d");
    const gradient = this._createGradient(ctx, options.color || this.colors.blueGradient);

    const config = {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: options.label || "Valores",
          data: data.values,
          backgroundColor: gradient,
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        ...this.baseConfig,
        onClick: options.onclick ? (evt, items) => {
          if (items.length) {
            const index = items[0].index;
            const label = data.labels[index];
            options.onclick(label, data.values[index]);
          }
        } : undefined,
        plugins: {
          ...this.baseConfig.plugins,
          legend: { display: false }
        }
      }
    };

    return new Chart(ctx, config);
  },

  /**
   * Gráfico de barras horizontais
   */
  barHorizontal(canvasId, data, options = {}) {
    const canvas = HUB.dom.$(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");

    const config = {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: options.label || "Valores",
          data: data.values,
          backgroundColor: options.color || this.colors.blue,
          borderWidth: 0,
          borderRadius: 6
        }]
      },
      options: {
        ...this.baseConfig,
        indexAxis: "y",
        onClick: options.onclick ? (evt, items) => {
          if (items.length) {
            const index = items[0].index;
            options.onclick(data.labels[index], data.values[index]);
          }
        } : undefined
      }
    };

    return new Chart(ctx, config);
  },

  /**
   * Gráfico de linha
   */
  line(canvasId, data, options = {}) {
    const canvas = HUB.dom.$(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");

    const config = {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [{
          label: options.label || "Valores",
          data: data.values,
          borderColor: options.color || this.colors.blue,
          backgroundColor: `${options.color || this.colors.blue}33`,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: options.color || this.colors.blue,
          pointBorderColor: "#06111f",
          pointBorderWidth: 2
        }]
      },
      options: {
        ...this.baseConfig,
        plugins: {
          ...this.baseConfig.plugins,
          legend: { display: false }
        }
      }
    };

    return new Chart(ctx, config);
  },

  /**
   * Gráfico de rosca (donut)
   */
  donut(canvasId, data, options = {}) {
    const canvas = HUB.dom.$(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");

    const colors = options.colors || [
      this.colors.blue,
      this.colors.orange,
      this.colors.green,
      this.colors.purple,
      this.colors.red
    ];

    const config = {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        ...this.baseConfig,
        cutout: "60%",
        onClick: options.onclick ? (evt, items) => {
          if (items.length) {
            const index = items[0].index;
            options.onclick(data.labels[index], data.values[index]);
          }
        } : undefined,
        plugins: {
          ...this.baseConfig.plugins,
          tooltip: {
            ...this.baseConfig.plugins.tooltip,
            callbacks: {
              label: context => {
                const label = context.label || "";
                const value = HUB.format.int(context.parsed);
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = HUB.format.pct(HUB.format.calcPct(context.parsed, total));
                return `${label}: ${value} (${pct})`;
              }
            }
          }
        }
      }
    };

    return new Chart(ctx, config);
  },

  /**
   * Gráfico de pizza
   */
  pie(canvasId, data, options = {}) {
    const config = this.donut(canvasId, data, options);
    if (config) {
      config.options.cutout = "0%";
    }
    return config;
  },

  /**
   * Gráfico de barras empilhadas
   */
  stackedBar(canvasId, datasets, labels, options = {}) {
    const canvas = HUB.dom.$(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");

    const config = {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.values,
          backgroundColor: ds.color || this.colors.blue,
          borderWidth: 0,
          borderRadius: i === datasets.length - 1 ? { topLeft: 6, topRight: 6 } : 0
        }))
      },
      options: {
        ...this.baseConfig,
        scales: {
          ...this.baseConfig.scales,
          x: { ...this.baseConfig.scales.x, stacked: true },
          y: { ...this.baseConfig.scales.y, stacked: true }
        }
      }
    };

    return new Chart(ctx, config);
  },

  /**
   * Destrói gráfico existente
   */
  destroy(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === "function") {
      chartInstance.destroy();
    }
  }
};

/**
 * Helper para renderizar gráfico de barra customizado (HTML puro, sem Chart.js)
 * Mais leve e rápido para rankings simples
 */
HUB.simpleBar = {
  render(containerId, data, options = {}) {
    const container = HUB.dom.$(containerId);
    if (!container) return;

    const { total, color = "", onclick = null, showPct = true } = options;
    const max = Math.max(...data.map(x => x[1]), 1);

    const html = data.map(([name, value]) => {
      const pct = total ? HUB.format.calcPct(value, total) : 0;
      const width = (value / max * 100).toFixed(1);
      const clickAttr = onclick ? `onclick="${onclick(name)}" style="cursor:pointer"` : "";

      return `
        <div class="barRow" ${clickAttr}>
          <div class="barName" title="${HUB.format.esc(name)}">${HUB.format.esc(name)}</div>
          <div class="track">
            <div class="fill ${color}" style="width:${width}%"></div>
          </div>
          <div class="num">${HUB.format.int(value)}</div>
          ${showPct ? `<div class="pct">${HUB.format.pct(pct)}</div>` : ""}
        </div>
      `;
    }).join("");

    container.innerHTML = html || `<div class="empty">Sem dados</div>`;
  }
};
