/**
 * PAINEL PESSOAS - App Principal
 * Orquestração e controle do painel
 */

const PessoasApp = {
  // ============================================
  // ESTADO
  // ============================================
  
  data: [],
  filtered: [],
  view: [],
  drill: null,
  filters: {
    dir: "",
    sup: "",
    ger: "",
    tipo: "",
    sit: "",
    funcoes: new Set()
  },

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  async init() {
    try {
      // Loading state
      HUB.loading.showMultiple([
        "kpis", "chartDiretorias", "chartAtvAfast", "chartLaudosGerencia",
        "kpisSaude", "chartPressaoGerencia", "chartTiposLaudo", "chartFuncaoLaudo",
        "kpisAfastamentos", "chartTipoAfast", "chartAfastGerencia", "chartTempoAfast",
        "kpisDemografico", "chartIdade", "chartEscolaridade", "chartTempoCasa", "rankCidades", "chartJornada",
        "tableAnalitico"
      ]);
      
      // Renderiza header
      HUB.header.render("header", {
        systemLabel: "GESTÃO DE PESSOAS",
        title: "Perfil Funcional e Territorial",
        subtitle: "Leitura executiva da força de trabalho, disponibilidade operacional, risco de reposição e aderência territorial",
        navigation: [
          { id: "screenVisao", label: "Visão Geral" },
          { id: "screenSaude", label: "Saúde Ocupacional" },
          { id: "screenAfastamentos", label: "Afastamentos" },
          { id: "screenDemografico", label: "Demográfico" },
          { id: "screenAnalitico", label: "Analítico" }
        ]
      });
      
      // Carrega dados
      this.data = await PessoasData.load();
      
      // Popula filtros
      this.populateFilters();
      
      // Attach listeners
      this.attachListeners();
      
      // Restaura filtros salvos
      this.restoreFilters();
      
      // Renderiza
      this.render();
      
// Footer
HUB.footer.render("footer", {
  customText: `
    <strong>Gabinete da Presidência</strong><br>
    HUB COMLURB • Núcleo de Inteligência e Gestão Estratégica Operacional
  `,
  version: "2.0",
  showTimestamp: false
});
      
    } catch (e) {
      console.error("Erro ao inicializar:", e);
      alert(`Erro ao carregar dados: ${e.message}`);
    }
  },

  // ============================================
  // FILTROS
  // ============================================
  
  populateFilters() {
    const base = this.getBaseForOptions();
    
    // Diretoria
    HUB.filters.populate("fDir", 
      HUB.array.unique(base, "diretoria"), 
      this.filters.dir
    );
    
    // Superintendência
    HUB.filters.populate("fSup", 
      HUB.array.unique(base, "superintendencia"), 
      this.filters.sup
    );
    
    // Gerência
    HUB.filters.populate("fGerencia", 
      HUB.array.unique(base, "gerencia"), 
      this.filters.ger
    );
    
    // Tipo Cargo
    HUB.filters.populate("fTipoCargo", 
      HUB.array.unique(base, "tipoCargo"), 
      this.filters.tipo
    );
    
    // Função (multi-select)
    this.renderFuncaoMulti(HUB.array.unique(base, "funcaoCargo"));
  },

  getBaseForOptions() {
    return this.data.filter(r => {
      if (this.filters.dir && r.diretoria !== this.filters.dir) return false;
      if (this.filters.sup && r.superintendencia !== this.filters.sup) return false;
      if (this.filters.ger && r.gerencia !== this.filters.ger) return false;
      if (this.filters.tipo && r.tipoCargo !== this.filters.tipo) return false;
      if (this.filters.sit && !this.matchSituacao(r, this.filters.sit)) return false;
      if (this.filters.funcoes.size && !this.filters.funcoes.has(r.funcaoCargo)) return false;
      return true;
    });
  },

  applyFilters() {
    this.filters.dir = HUB.filters.get("fDir");
    this.filters.sup = HUB.filters.get("fSup");
    this.filters.ger = HUB.filters.get("fGerencia");
    this.filters.tipo = HUB.filters.get("fTipoCargo");
    this.filters.sit = HUB.filters.get("fSituacao");
    
    this.filtered = this.data.filter(r => {
      if (this.filters.dir && r.diretoria !== this.filters.dir) return false;
      if (this.filters.sup && r.superintendencia !== this.filters.sup) return false;
      if (this.filters.ger && r.gerencia !== this.filters.ger) return false;
      if (this.filters.tipo && r.tipoCargo !== this.filters.tipo) return false;
      if (this.filters.sit && !this.matchSituacao(r, this.filters.sit)) return false;
      if (this.filters.funcoes.size && !this.filters.funcoes.has(r.funcaoCargo)) return false;
      return true;
    });
    
    // Aplica drill
    this.view = this.drill 
      ? this.filtered.filter(r => this.matchDrill(r)) 
      : this.filtered;
    
    this.saveFilters();
  },

  matchSituacao(r, val) {
    if (val === "ativo") return r.ativo;
    if (val === "afastado") return r.afastado;
    if (val === "laudo") return r.possuiLaudo;
    if (val === "risco65") return r.risco65;
    if (val === "ec") return r.ecInformado;
    if (val === "laudo_afastado") return r.possuiLaudo && r.afastado;
    if (val === "afastado_com_laudo") return r.afastado && r.possuiLaudo;
    if (val === "laudo_ec") return r.possuiLaudo && r.ecInformado;
    return true;
  },

  matchDrill(r) {
    if (!this.drill) return true;
    const { type, value } = this.drill;
    
    if (type === "diretoria") return r.diretoria === value;
    if (type === "superintendencia") return r.superintendencia === value;
    if (type === "gerencia") return r.gerencia === value;
    if (type === "setor") return r.setor === value;
    if (type === "funcao") return r.funcaoAtuacao === value || r.funcaoCargo === value;
    if (type === "tipoCargo") return r.tipoCargo === value;
    if (type === "tipoAfast") return HUB.format.norm(r.tipoAfastamento).includes(HUB.format.norm(value));
    if (type === "sexo") return HUB.format.norm(r.sexo) === HUB.format.norm(value);
    if (type === "cidade") return r.cidade === value;
    if (type === "idadeFaixa") return this.inFaixa(r.idade, value);
    if (type === "tempoFaixa") return this.inFaixa(r.tempoCasa, value);
    if (type === "situacao") return this.matchSituacao(r, value);
    if (type === "tipoLaudo") return HUB.format.norm(r.tiposLaudos).includes(HUB.format.norm(value));
    
    return true;
  },

  inFaixa(valor, label) {
    const defs = {
      "<30": [0, 30], "31-40": [31, 40], "41-50": [41, 50],
      "51-60": [51, 60], "61-70": [61, 70], "71+": [71, 999],
      "0-10": [0, 10], "11-20": [11, 20], "21-30": [21, 30],
      "31-40": [31, 40], "41-50": [41, 50], "51+": [51, 999]
    };
    const d = defs[label];
    if (!d) return true;
    return valor >= d[0] && valor <= d[1];
  },

  saveFilters() {
    HUB.storage.set("pessoas_filters", {
      dir: this.filters.dir,
      sup: this.filters.sup,
      ger: this.filters.ger,
      tipo: this.filters.tipo,
      sit: this.filters.sit,
      funcoes: [...this.filters.funcoes]
    });
  },

  restoreFilters() {
    const saved = HUB.storage.get("pessoas_filters", {});
    if (saved.dir) HUB.dom.$("fDir").value = saved.dir;
    if (saved.sup) HUB.dom.$("fSup").value = saved.sup;
    if (saved.ger) HUB.dom.$("fGerencia").value = saved.ger;
    if (saved.tipo) HUB.dom.$("fTipoCargo").value = saved.tipo;
    if (saved.sit) HUB.dom.$("fSituacao").value = saved.sit;
    if (saved.funcoes) this.filters.funcoes = new Set(saved.funcoes);
  },

  clearAll() {
    HUB.dom.$("fDir").value = "";
    HUB.dom.$("fSup").value = "";
    HUB.dom.$("fGerencia").value = "";
    HUB.dom.$("fTipoCargo").value = "";
    HUB.dom.$("fSituacao").value = "";
    this.filters.funcoes.clear();
    this.drill = null;
    
    HUB.drillBanner.hide("drillBanner");
    HUB.storage.remove("pessoas_filters");
    
    this.populateFilters();
    this.render();
  },

  // ============================================
  // DRILL DOWN
  // ============================================
  
  setDrill(type, value, label) {
    this.drill = { type, value, label };
    
    HUB.drillBanner.show("drillBanner", {
      title: `Drill down: ${label}`,
      description: `${HUB.format.int(this.view.length)} registros no recorte detalhado`,
      onClear: "PessoasApp.clearDrill()"
    });
    
    this.render();
  },

  clearDrill() {
    this.drill = null;
    HUB.drillBanner.hide("drillBanner");
    this.render();
  },

  // ============================================
  // RENDERIZAÇÃO
  // ============================================
  
  render() {
    this.applyFilters();
    
    // Renderiza cada tela
    PessoasScreens.renderVisaoGeral(this.view);
    PessoasScreens.renderSaude(this.view);
    PessoasScreens.renderAfastamentos(this.view);
    PessoasScreens.renderDemografico(this.view);
    PessoasScreens.renderAnalitico(this.view);
  },

  // ============================================
  // MULTI-SELECT DE FUNÇÕES
  // ============================================
  
  renderFuncaoMulti(options) {
    const valid = new Set(options);
    this.filters.funcoes = new Set([...this.filters.funcoes].filter(v => valid.has(v)));
    
    const q = HUB.format.norm(HUB.dom.$("fFuncaoSearch")?.value || "");
    const shown = options.filter(v => !q || HUB.format.norm(v).includes(q)).slice(0, 500);
    
    const list = HUB.dom.$("fFuncaoList");
    if (!list) return;
    
    list.innerHTML = shown.map(v => `
      <label class="multiItem" title="${HUB.format.esc(v)}">
        <input type="checkbox" value="${HUB.format.esc(v)}" ${this.filters.funcoes.has(v) ? "checked" : ""}>
        <span>${HUB.format.esc(v)}</span>
      </label>
    `).join("") || '<div class="empty">Sem funções disponíveis</div>';
    
    list.querySelectorAll("input[type='checkbox']").forEach(chk => {
      chk.addEventListener("change", () => {
        if (chk.checked) this.filters.funcoes.add(chk.value);
        else this.filters.funcoes.delete(chk.value);
        this.updateFuncaoBtn();
        this.render();
      });
    });
    
    this.updateFuncaoBtn();
  },

  updateFuncaoBtn() {
    const btn = HUB.dom.$("fFuncaoBtn");
    if (!btn) return;
    const n = this.filters.funcoes.size;
    if (n === 0) btn.textContent = "Todas";
    else if (n === 1) btn.textContent = [...this.filters.funcoes][0];
    else btn.textContent = `${n} funções selecionadas`;
  },

  clearFuncao() {
    this.filters.funcoes.clear();
    if (HUB.dom.$("fFuncaoSearch")) HUB.dom.$("fFuncaoSearch").value = "";
    this.renderFuncaoMulti(HUB.array.unique(this.data, "funcaoCargo"));
    this.render();
  },

  closeFuncao() {
    HUB.dom.$("funcaoMulti")?.classList.remove("open");
  },

  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  attachListeners() {
    // Filtros
    ["fDir", "fSup", "fGerencia", "fTipoCargo", "fSituacao"].forEach(id => {
      HUB.dom.$(id)?.addEventListener("change", () => {
        this.populateFilters();
        this.render();
      });
    });
    
    // Multi-select função
    HUB.dom.$("fFuncaoBtn")?.addEventListener("click", () => {
      HUB.dom.$("funcaoMulti")?.classList.toggle("open");
    });
    
    HUB.dom.$("fFuncaoSearch")?.addEventListener("input", () => {
      this.renderFuncaoMulti(HUB.array.unique(this.data, "funcaoCargo"));
    });
    
    // Busca analítica
    HUB.dom.$("searchBox")?.addEventListener("input", 
      HUB.debounce(() => PessoasScreens.renderAnalitico(this.view), 300)
    );
    
    // Fecha multi-select ao clicar fora
    document.addEventListener("click", e => {
      const box = HUB.dom.$("funcaoMulti");
      if (!box) return;
      if (e.target.id !== "fFuncaoBtn" && !box.contains(e.target)) {
        box.classList.remove("open");
      }
    });
  },

  // ============================================
  // EXPORT
  // ============================================
  
  exportExcel() {
    if (typeof XLSX === "undefined") {
      alert("Biblioteca XLSX não carregada");
      return;
    }
    
    const data = this.view.map(r => ({
      Registro: r.registro,
      Nome: r.nome,
      Diretoria: r.diretoria,
      Superintendencia: r.superintendencia,
      Gerencia: r.gerencia,
      Setor: r.setor,
      TipoCargo: r.tipoCargo,
      FuncaoCargo: r.funcaoCargo,
      FuncaoEC: r.funcaoEC,
      FuncaoAtuacao: r.funcaoAtuacao,
      Ativo: r.ativo ? "Sim" : "Não",
      Afastado: r.afastado ? "Sim" : "Não",
      Afastamento: r.afastamento,
      TipoAfastamento: r.tipoAfastamento,
      Idade: r.idade,
      TempoCasaAnos: r.tempoCasa,
      Sexo: r.sexo,
      Escolaridade: r.escolaridade,
      Cidade: r.cidade,
      Jornada: r.jornada,
      PossuiLaudo: r.possuiLaudo ? "Sim" : "Não",
      QtdLaudos: r.qtdLaudos,
      TiposLaudos: r.tiposLaudos,
      Risco60: r.risco60 ? "Sim" : "Não",
      Risco65: r.risco65 ? "Sim" : "Não",
      ECInformado: r.ecInformado ? "Sim" : "Não"
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analitico");
    XLSX.writeFile(wb, "HUB_COMLURB_Pessoas_Analitico.xlsx");
  }
};

// Funções globais (para onclick inline no HTML)
function clearAll() { PessoasApp.clearAll(); }
function clearDrill() { PessoasApp.clearDrill(); }
function clearFuncao() { PessoasApp.clearFuncao(); }
function closeFuncao() { PessoasApp.closeFuncao(); }
function exportExcel() { PessoasApp.exportExcel(); }
function searchDebounced() { 
  PessoasScreens.renderAnalitico(PessoasApp.view); 
}

// Inicializa quando DOM carregar
document.addEventListener("DOMContentLoaded", () => PessoasApp.init());
