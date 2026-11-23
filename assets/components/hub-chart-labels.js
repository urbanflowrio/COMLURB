/* Rótulos de séries mensais no AR e na Governança. */
(function () {
  "use strict";

  function criar(formatar) {
    return {
      id: "hubMonthlyLabels",
      afterDatasetsDraw(chart) {
        const { ctx, chartArea: area } = chart;
        const ocupados = [];
        ctx.save();
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0d1e30';

        chart.data.datasets.forEach((serie, indice) => {
          if (!chart.isDatasetVisible(indice)) return;
          const pontos = chart.getDatasetMeta(indice).data;
          const valores = serie.data;
          const metaFixa = serie.hubReferencia && valores.every(valor => valor === valores[0]);
          const indices = metaFixa ? [valores.length - 1] : valores.map((_, i) => i);
          ctx.fillStyle = serie.hubReferencia ? '#f7a9bd' : '#e6f4ff';

          indices.forEach(i => {
            const ponto = pontos[i];
            if (!Number.isFinite(valores[i]) || !ponto || ponto.skip) return;
            const { x, y } = ponto.getProps(['x', 'y']);
            if (y < area.top || y > area.bottom || x < area.left || x > area.right) return;
            const texto = formatar(valores[i]);
            const meiaLargura = ctx.measureText(texto).width / 2 + 3;
            const fixarX = v => Math.max(area.left + meiaLargura, Math.min(area.right - meiaLargura, v));
            const candidatos = [
              [x, y - 12], [x, y + 12], [x, y - 25], [x, y + 25],
              [x - meiaLargura, y - 12], [x + meiaLargura, y + 12]
            ];
            for (const [cx, cy] of candidatos) {
              const px = fixarX(cx);
              const caixa = { left: px - meiaLargura, right: px + meiaLargura, top: cy - 7, bottom: cy + 7 };
              if (caixa.top < area.top || caixa.bottom > area.bottom) continue;
              if (caixa.left < area.left || caixa.right > area.right) continue;
              if (ocupados.some(b => caixa.left < b.right && caixa.right > b.left && caixa.top < b.bottom && caixa.bottom > b.top)) continue;
              ocupados.push(caixa);
              ctx.strokeText(texto, px, cy);
              ctx.fillText(texto, px, cy);
              break;
            }
          });
        });
        ctx.restore();
      }
    };
  }

  function legenda(Chart) {
    return {
      labels: {
        color: '#d0deed',
        usePointStyle: true,
        pointStyleWidth: 18,
        font: { size: 12 },
        generateLabels(chart) {
          return Chart.defaults.plugins.legend.labels.generateLabels(chart).map(item => ({
            ...item, pointStyle: 'line', lineWidth: 2, lineDash: []
          }));
        }
      }
    };
  }

  window.HUBChartLabels = { criar, legenda };
})();
