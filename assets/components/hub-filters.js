/**
 * HUB COMLURB - Componente de Filtros
 * Sistema de filtros reutilizável
 */

HUB.filters = {
  /**
   * Estado atual dos filtros
   */
  state: {},

  /**
   * Callbacks registrados para mudanças
   */
  _onChange: [],

  /**
   * Inicializa sistema de filtros
   */
  init(config) {
    this.config = config;
    this.state = {};
    this._restoreFromStorage();
    this._attachListeners();
  },

  /**
   * Popula opções de um select
   */
  populate(selectId, options, current = "") {
    const select = HUB.dom.$(selectId);
    if (!select) return;

    select.innerHTML = `<option value="">Todos</option>` +
      options.map(opt => 
        `<option value="${HUB.format.esc(opt)}" ${opt === current ? "selected" : ""}>
          ${HUB.format.esc(opt)}
        </option>`
      ).join("");
  },

  /**
   * Popula todos os filtros baseado no dataset
   */
  populateAll(data, filters) {
    filters.forEach(filter => {
      const { id, field, exclude = [] } = filter;
      
      // Pega valores únicos do campo
      const values = HUB.array.unique(
        data.filter(r => !exclude.some(ex => !this._matchesFilter(r, ex))),
        field
      );
      
      this.populate(id, values, this.state[id] || "");
    });
  },

  /**
   * Obtém valor atual de um filtro
   */
  get(filterId) {
    return HUB.format.clean(HUB.dom.$(filterId)?.value || "");
  },

  /**
   * Define valor de um filtro
   */
  set(filterId, value) {
    const el = HUB.dom.$(filterId);
    if (el) {
      el.value = value;
      this.state[filterId] = value;
      this._saveToStorage();
      this._triggerChange();
    }
  },

  /**
   * Limpa todos os filtros
   */
  clear() {
    Object.keys(this.state).forEach(id => {
      const el = HUB.dom.$(id);
      if (el) el.value = "";
    });
    this.state = {};
    this._saveToStorage();
    this._triggerChange();
  },

  /**
   * Aplica filtros a um dataset
   */
  apply(data, filterDefs) {
    return data.filter(row => {
      return filterDefs.every(filter => {
        const value = this.get(filter.id);
        if (!value) return true;
        
        if (filter.matcher) {
          return filter.matcher(row, value);
        }
        
        return row[filter.field] === value;
      });
    });
  },

  /**
   * Registra callback para mudanças
   */
  onChange(callback) {
    this._onChange.push(callback);
  },

  /**
   * Anexa event listeners
   */
  _attachListeners() {
    document.addEventListener("change", e => {
      if (e.target.tagName === "SELECT" && e.target.id) {
        this.state[e.target.id] = e.target.value;
        this._saveToStorage();
        this._triggerChange();
      }
    });
  },

  /**
   * Dispara callbacks
   */
  _triggerChange() {
    this._onChange.forEach(cb => cb(this.state));
  },

  /**
   * Salva estado no localStorage
   */
  _saveToStorage() {
    HUB.storage.set("filters", this.state);
  },

  /**
   * Restaura estado do localStorage
   */
  _restoreFromStorage() {
    const saved = HUB.storage.get("filters", {});
    Object.entries(saved).forEach(([id, value]) => {
      const el = HUB.dom.$(id);
      if (el) {
        el.value = value;
        this.state[id] = value;
      }
    });
  },

  /**
   * Verifica se row passa no filtro
   */
  _matchesFilter(row, filter) {
    const value = this.get(filter.id);
    if (!value) return true;
    
    if (filter.matcher) {
      return filter.matcher(row, value);
    }
    
    return row[filter.field] === value;
  }
};

/**
 * Componente de Multi-Select (para campos com múltiplas opções)
 */
HUB.multiSelect = {
  /**
   * Estado de cada multi-select
   * { id: Set(selected values) }
   */
  state: new Map(),

  /**
   * Inicializa um multi-select
   */
  init(config) {
    const { id, options, placeholder = "Buscar..." } = config;
    
    this.state.set(id, new Set());
    
    const container = HUB.dom.$(id);
    if (!container) return;

    container.innerHTML = `
      <div class="multiBox" data-multi="${id}">
        <button class="multiBtn" type="button">
          <span class="multiLabel">Todos</span>
          <span>⌄</span>
        </button>
        <div class="multiPanel">
          <input class="multiSearch" placeholder="${HUB.format.esc(placeholder)}">
          <div class="multiList"></div>
          <div class="multiActions">
            <button type="button" class="multiClear">Limpar</button>
            <button type="button" class="multiApply">Aplicar</button>
          </div>
        </div>
      </div>
    `;

    this._populateOptions(id, options);
    this._attachListeners(id);
  },

  /**
   * Popula opções
   */
  _populateOptions(id, options) {
    const container = HUB.dom.$(`${id} .multiList`) || 
                     document.querySelector(`[data-multi="${id}"] .multiList`);
    if (!container) return;

    const selected = this.state.get(id) || new Set();

    container.innerHTML = options.map(opt => `
      <label class="multiItem">
        <input type="checkbox" value="${HUB.format.esc(opt)}" ${selected.has(opt) ? "checked" : ""}>
        <span>${HUB.format.esc(opt)}</span>
      </label>
    `).join("");

    // Attach checkbox listeners
    container.querySelectorAll("input[type='checkbox']").forEach(chk => {
      chk.addEventListener("change", () => {
        const set = this.state.get(id);
        if (chk.checked) {
          set.add(chk.value);
        } else {
          set.delete(chk.value);
        }
        this._updateLabel(id);
      });
    });
  },

  /**
   * Atualiza label do botão
   */
  _updateLabel(id) {
    const selected = this.state.get(id);
    const btn = document.querySelector(`[data-multi="${id}"] .multiLabel`);
    if (!btn) return;

    const n = selected.size;
    if (n === 0) {
      btn.textContent = "Todos";
    } else if (n === 1) {
      btn.textContent = [...selected][0];
    } else {
      btn.textContent = `${n} selecionados`;
    }
  },

  /**
   * Anexa listeners
   */
  _attachListeners(id) {
    const box = document.querySelector(`[data-multi="${id}"]`);
    if (!box) return;

    // Toggle dropdown
    const btn = box.querySelector(".multiBtn");
    btn?.addEventListener("click", () => {
      box.classList.toggle("open");
    });

    // Busca
    const search = box.querySelector(".multiSearch");
    search?.addEventListener("input", e => {
      const q = HUB.format.norm(e.target.value);
      box.querySelectorAll(".multiItem").forEach(item => {
        const text = HUB.format.norm(item.textContent);
        item.style.display = text.includes(q) ? "flex" : "none";
      });
    });

    // Limpar
    const clear = box.querySelector(".multiClear");
    clear?.addEventListener("click", () => {
      this.state.set(id, new Set());
      box.querySelectorAll("input[type='checkbox']").forEach(chk => {
        chk.checked = false;
      });
      this._updateLabel(id);
    });

    // Aplicar (fecha dropdown)
    const apply = box.querySelector(".multiApply");
    apply?.addEventListener("click", () => {
      box.classList.remove("open");
    });

    // Fecha ao clicar fora
    document.addEventListener("click", e => {
      if (!box.contains(e.target)) {
        box.classList.remove("open");
      }
    });
  },

  /**
   * Obtém valores selecionados
   */
  get(id) {
    return this.state.get(id) || new Set();
  },

  /**
   * Limpa seleção
   */
  clear(id) {
    this.state.set(id, new Set());
    const box = document.querySelector(`[data-multi="${id}"]`);
    box?.querySelectorAll("input[type='checkbox']").forEach(chk => {
      chk.checked = false;
    });
    this._updateLabel(id);
  }
};
