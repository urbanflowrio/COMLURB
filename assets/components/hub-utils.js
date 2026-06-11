/**
 * HUB COMLURB - Utilitários Gerais
 * Funções auxiliares reutilizáveis em todos os painéis
 */

const HUB = window.HUB || {};

// ============================================
// FORMATAÇÃO
// ============================================

HUB.format = {
  /**
   * Normaliza string (remove acentos, maiúscula, trim)
   */
  norm(v) {
    return String(v ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .toUpperCase();
  },

  /**
   * Limpa string (apenas trim)
   */
  clean(v) {
    return String(v ?? "").trim();
  },

  /**
   * Converte para número
   */
  toNumber(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(String(v).replace(",", ".").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  },

  /**
   * Formata número inteiro com separador de milhares
   */
  int(n) {
    return Number(n || 0).toLocaleString("pt-BR");
  },

  /**
   * Formata percentual (ex: 45.3%)
   */
  pct(n, decimals = 1) {
    if (!Number.isFinite(n)) return "0,0%";
    return n.toFixed(decimals).replace(".", ",") + "%";
  },

  /**
   * Calcula percentual
   */
  calcPct(numerator, denominator) {
    return denominator ? (numerator / denominator * 100) : 0;
  },

  /**
   * Escapa HTML
   */
  esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  },

  /**
   * Formata data ISO para BR
   */
  date(isoString) {
    try {
      return new Date(isoString).toLocaleDateString("pt-BR");
    } catch {
      return "";
    }
  },

  /**
   * Formata data e hora
   */
  datetime(isoString) {
    try {
      return new Date(isoString).toLocaleString("pt-BR");
    } catch {
      return "";
    }
  }
};

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

HUB.data = {
  /**
   * Cache de URLs carregadas
   */
  cache: new Map(),

  /**
   * Converte URL do Google Sheets para CSV
   */
  googleCsvUrl(url) {
    const m = url.match(/\/spreadsheets\/d\/([^/]+)/);
    if (!m) return null;
    const gid = (url.match(/[?&]gid=([^&]+)/) || [null, "0"])[1];
    return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&gid=${gid}`;
  },

  /**
   * Carrega CSV de uma URL
   */
  async loadCSV(url, options = {}) {
    const { cache = true, required = false, name = "CSV" } = options;

    // Verifica cache
    if (cache && this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Tenta URLs alternativas
    const attempts = [url];
    const fallback = this.googleCsvUrl(url);
    if (fallback && fallback !== url) attempts.push(fallback);

    let lastError;
    for (const u of attempts) {
      try {
        const res = await fetch(u, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const text = await res.text();
        if (text.includes("<html") || text.includes("<!DOCTYPE")) {
          throw new Error("Resposta não é CSV");
        }

        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => HUB.format.clean(h)
        });

        const rows = (parsed.data || []).filter(r => 
          Object.values(r).some(v => HUB.format.clean(v) !== "")
        );

        // Salva no cache
        if (cache) this.cache.set(url, rows);

        console.log(`✅ ${name}: ${HUB.format.int(rows.length)} linhas`);
        return rows;
      } catch (e) {
        lastError = e;
        console.warn(`⚠️ ${name}:`, e);
      }
    }

    if (required) {
      throw new Error(`${name}: ${lastError?.message || "não carregou"}`);
    }

    console.warn(`⚠️ ${name}: ${lastError?.message || "não carregou"}`);
    return [];
  },

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
  }
};

// ============================================
// MANIPULAÇÃO DE ARRAYS
// ============================================

HUB.array = {
  /**
   * Retorna valores únicos de um campo
   */
  unique(arr, field) {
    return [...new Set(arr.map(r => r[field]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  },

  /**
   * Agrupa e conta ocorrências
   */
  groupCount(arr, field) {
    const map = new Map();
    arr.forEach(r => {
      const key = r[field] || "Não informado";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  },

  /**
   * Calcula média de um campo
   */
  avg(arr, field) {
    const vals = arr.map(r => Number(r[field])).filter(v => Number.isFinite(v) && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  },

  /**
   * Soma valores de um campo
   */
  sum(arr, field) {
    return arr.reduce((acc, r) => acc + HUB.format.toNumber(r[field]), 0);
  },

  /**
   * Encontra valor máximo
   */
  max(arr, field) {
    const vals = arr.map(r => HUB.format.toNumber(r[field]));
    return vals.length ? Math.max(...vals) : 0;
  },

  /**
   * Encontra valor mínimo
   */
  min(arr, field) {
    const vals = arr.map(r => HUB.format.toNumber(r[field])).filter(v => v > 0);
    return vals.length ? Math.min(...vals) : 0;
  },

  /**
   * Agrupa por faixas de valores
   */
  faixaCount(arr, field, faixas) {
    // faixas = [["0-10", 0, 10], ["11-20", 11, 20], ...]
    return faixas.map(([label, min, max]) => [
      label,
      arr.filter(r => {
        const v = HUB.format.toNumber(r[field]);
        return v >= min && v <= max;
      }).length,
      min,
      max
    ]);
  }
};

// ============================================
// DOM HELPERS
// ============================================

HUB.dom = {
  /**
   * Atalho para document.getElementById
   */
  $(id) {
    return document.getElementById(id);
  },

  /**
   * Atalho para querySelectorAll
   */
  $$(selector) {
    return document.querySelectorAll(selector);
  },

  /**
   * Mostra elemento
   */
  show(id) {
    const el = this.$(id);
    if (el) el.style.display = "block";
  },

  /**
   * Esconde elemento
   */
  hide(id) {
    const el = this.$(id);
    if (el) el.style.display = "none";
  },

  /**
   * Toggle visibilidade
   */
  toggle(id) {
    const el = this.$(id);
    if (!el) return;
    el.style.display = el.style.display === "none" ? "block" : "none";
  },

  /**
   * Define conteúdo HTML com segurança
   */
  setHTML(id, html) {
    const el = this.$(id);
    if (el) el.innerHTML = html;
  },

  /**
   * Define texto
   */
  setText(id, text) {
    const el = this.$(id);
    if (el) el.textContent = text;
  },

  /**
   * Adiciona classe
   */
  addClass(id, className) {
    const el = this.$(id);
    if (el) el.classList.add(className);
  },

  /**
   * Remove classe
   */
  removeClass(id, className) {
    const el = this.$(id);
    if (el) el.classList.remove(className);
  },

  /**
   * Toggle classe
   */
  toggleClass(id, className) {
    const el = this.$(id);
    if (el) el.classList.toggle(className);
  }
};

// ============================================
// DEBOUNCE & PERFORMANCE
// ============================================

HUB.debounce = function(fn, ms) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
};

HUB.throttle = function(fn, ms) {
  let lastRun = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastRun >= ms) {
      lastRun = now;
      fn.apply(this, args);
    }
  };
};

// ============================================
// PICK DE CAMPOS (pra lidar com nomes variados)
// ============================================

HUB.pick = function(row, candidates) {
  if (!row) return "";
  const keys = Object.keys(row);
  
  // Tenta match exato primeiro
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
    const k = keys.find(x => HUB.format.norm(x) === HUB.format.norm(c));
    if (k) return row[k];
  }
  
  // Tenta match parcial
  for (const c of candidates) {
    const k = keys.find(x => {
      const nx = HUB.format.norm(x);
      const nc = HUB.format.norm(c);
      return nx.includes(nc) || nc.includes(nx);
    });
    if (k) return row[k];
  }
  
  return "";
};

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

HUB.storage = {
  /**
   * Salva dados
   */
  set(key, value) {
    try {
      localStorage.setItem(`hub_comlurb_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn("Erro ao salvar no localStorage:", e);
      return false;
    }
  },

  /**
   * Recupera dados
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`hub_comlurb_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn("Erro ao ler do localStorage:", e);
      return defaultValue;
    }
  },

  /**
   * Remove item
   */
  remove(key) {
    try {
      localStorage.removeItem(`hub_comlurb_${key}`);
      return true;
    } catch (e) {
      console.warn("Erro ao remover do localStorage:", e);
      return false;
    }
  },

  /**
   * Limpa tudo
   */
  clear() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith("hub_comlurb_"))
        .forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) {
      console.warn("Erro ao limpar localStorage:", e);
      return false;
    }
  }
};

// Exporta para window
window.HUB = HUB;
