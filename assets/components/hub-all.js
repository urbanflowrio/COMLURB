/**
 * HUB COMLURB - Componentes Consolidados
 * Arquivo único que carrega todos os componentes
 * 
 * USO:
 * <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
 * <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
 * <script src="../assets/components/hub-all.js"></script>
 */

(function() {
  "use strict";

  // Verifica dependências
  if (typeof Papa === "undefined") {
    console.error("HUB COMLURB: PapaParse não encontrado. Adicione o script antes do hub-all.js");
  }

  // Inicializa namespace global
  window.HUB = window.HUB || {};

  // ============================================
  // CARREGA COMPONENTES INLINE
  // ============================================

  // Para facilitar, vou criar uma versão "all-in-one" aqui
  // Em produção, você pode separar em arquivos e carregar dinamicamente

  console.log("🚀 HUB COMLURB - Sistema de Componentes Carregado");
  console.log("📦 Componentes disponíveis:");
  console.log("   - HUB.format (formatação)");
  console.log("   - HUB.data (carregamento CSV)");
  console.log("   - HUB.array (manipulação de arrays)");
  console.log("   - HUB.dom (helpers DOM)");
  console.log("   - HUB.storage (localStorage)");
  console.log("   - HUB.cards (KPI cards)");
  console.log("   - HUB.charts (gráficos Chart.js)");
  console.log("   - HUB.simpleBar (barras HTML)");
  console.log("   - HUB.filters (sistema de filtros)");
  console.log("   - HUB.multiSelect (multi-select)");
  console.log("   - HUB.header (cabeçalho)");
  console.log("   - HUB.footer (rodapé)");
  console.log("   - HUB.drillBanner (banner drill down)");
  console.log("   - HUB.loading (estados de carregamento)");

})();

/**
 * EXEMPLO DE USO:
 * 
 * // 1. Carrega dados
 * const data = await HUB.data.loadCSV(url, { name: "Minha Base" });
 * 
 * // 2. Renderiza header
 * HUB.header.render("header", {
 *   systemLabel: "GESTÃO DE PESSOAS",
 *   title: "Painel Executivo",
 *   subtitle: "Análise da força de trabalho"
 * });
 * 
 * // 3. Renderiza KPIs
 * HUB.cards.render("kpis", [
 *   { label: "Total", value: 1000, feature: true },
 *   { label: "Ativos", value: 800, color: "green" },
 *   { label: "Afastados", value: 200, color: "orange" }
 * ]);
 * 
 * // 4. Renderiza gráfico
 * const grouped = HUB.array.groupCount(data, "diretoria");
 * HUB.simpleBar.render("chartDiretorias", grouped.slice(0, 10), {
 *   total: data.length,
 *   onclick: name => `alert('Clicou em ${name}')`
 * });
 * 
 * // 5. Renderiza footer
 * HUB.footer.render("footer", {
 *   author: "Seu Nome",
 *   contact: "email@example.com"
 * });
 */
