/**
 * PAINEL PESSOAS - Módulo de Dados
 * Carregamento e enriquecimento da base R54, Laudos e Organograma
 */

const PessoasData = {
  // ============================================
  // URLS DAS FONTES
  // ============================================
  
  URLS: {
    R54: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRE3Q_RdpZOqc4f3O3fQirMQkEXQWyBkiIlXB6LZWgqTZbItGBHAxUHf2-0kEcALDIUfyPeK7GyBQrB/pub?gid=1371643814&single=true&output=csv",
    LAUDOS: "https://docs.google.com/spreadsheets/d/1ioBdeaqpan0Eq9o4BB5f0_UvCRJPsX5hoonaF2v3YwI/export?format=csv",
    ORGANOGRAMA: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrmMaCLJp2MfkkqRqORG88xbz4d97_-S8sm1B9zXhza1Q8EHS5cPfHZI_TAFz-PdRola-TtAeywnuc/pub?output=csv"
  },

  // ============================================
  // MAPEAMENTO DE CAMPOS
  // ============================================
  
  FIELDS: {
    registro: ["REGISTRO", "MATRICULA", "MATRÍCULA", "MAT", "ID"],
    nome: ["NOME", "NOME DO SERVIDOR", "SERVIDOR", "COLABORADOR"],
    diretoria: ["DIRETORIA", "DIR"],
    super: ["SUPERINTENDÊNCIA", "SUPERINTENDENCIA", "COORDENAÇÃO", "COORDENACAO", "COORD", "SUPER"],
    gerencia: ["GERÊNCIA", "GERENCIA", "GERÊNCIA EXECUTIVA", "GERENCIA EXECUTIVA", "GER"],
    setor: ["SETOR", "LOTAÇÃO", "LOTACAO", "UNIDADE", "LOCAL_TRABALHO", "LOCAL DE TRABALHO"],
    tipoCargo: ["TIPOCARGO", "TIPO CARGO", "TIPO_CARGO"],
    funcaoCargo: ["FUNCAOCARGO", "FUNÇÃO CARGO", "FUNCAO CARGO", "CARGO", "FUNÇÃO", "FUNCAO"],
    funcaoEC: ["FUNCAO_EC", "FUNÇÃO EC", "FUNCAO EC", "EC"],
    afastamento: ["AFASTAMENTO", "AFASTAMENTO_ATUAL", "STATUS_AFASTAMENTO", "SITUAÇÃO AFASTAMENTO", "SITUACAO AFASTAMENTO"],
    tipoAfast: ["TIPOAFASTAMENTO", "TIPO AFASTAMENTO", "TIPO_AFASTAMENTO"],
    sexo: ["SEXO", "GENERO", "GÊNERO"],
    idade: ["IDADEANOS", "IDADE ANOS", "IDADE", "IDADE_ANOS"],
    tempoCasa: ["TPCASAANOS", "TP CASA ANOS", "TEMPO CASA", "TEMPO DE CASA", "ANOS CASA"],
    escolaridade: ["ESCOLARIDADE", "GRAU INSTRUÇÃO", "GRAU INSTRUCAO"],
    cidade: ["CIDADEENDER", "CIDADE ENDER", "CIDADE", "MUNICIPIO", "MUNICÍPIO"],
    jornada: ["JORNADA", "CARGA HORARIA", "CARGA HORÁRIA"],
    bairroRes: ["BAIRRO_RES", "BAIRRO RES", "BAIRRO_RESIDENCIA", "BAIRRO RESIDENCIA", "BAIRRO"]
  },

  // ============================================
  // ESTADO
  // ============================================
  
  rawR54: [],
  rawLaudos: [],
  rawOrg: [],
  orgMap: new Map(),
  
  // ============================================
  // CARREGAMENTO
  // ============================================
  
  async load() {
    try {
      // Carrega as 3 bases em paralelo
      const [r54, laudos, org] = await Promise.all([
        HUB.data.loadCSV(this.URLS.R54, { name: "R54", required: true }),
        HUB.data.loadCSV(this.URLS.LAUDOS, { name: "Laudos", required: false }),
        HUB.data.loadCSV(this.URLS.ORGANOGRAMA, { name: "Organograma", required: true })
      ]);
      
      this.rawR54 = r54;
      this.rawLaudos = laudos;
      this.rawOrg = org;
      
      // Constrói mapa de organograma
      this.orgMap = this._buildOrgMap(org);
      
      // Enriquece dados
      return this._enrich();
      
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      throw e;
    }
  },

  // ============================================
  // ENRIQUECIMENTO
  // ============================================
  
  _enrich() {
    const laudosMap = this._buildLaudosMap(this.rawLaudos);
    
    return this.rawR54.map((row, idx) => {
      const registro = HUB.format.clean(HUB.pick(row, this.FIELDS.registro));
      const laudo = laudosMap.get(HUB.format.norm(registro));
      
      // Campos básicos
      const setor = HUB.format.clean(HUB.pick(row, this.FIELDS.setor)) || "Não informado";
      const org = this._getOrgBySetor(setor);
      
      const afastamento = HUB.format.clean(HUB.pick(row, this.FIELDS.afastamento));
      const tipoAfast = HUB.format.clean(HUB.pick(row, this.FIELDS.tipoAfast));
      
      const funcaoCargo = HUB.format.clean(HUB.pick(row, this.FIELDS.funcaoCargo)) || "Não informado";
      const funcaoEC = HUB.format.clean(HUB.pick(row, this.FIELDS.funcaoEC));
      
      const idade = HUB.format.toNumber(HUB.pick(row, this.FIELDS.idade));
      const tempoCasa = HUB.format.toNumber(HUB.pick(row, this.FIELDS.tempoCasa));
      
      // Flags
      const afastado = !!afastamento && 
        !["NAO", "NÃO", "ATIVO", "SEM AFASTAMENTO", ""].includes(HUB.format.norm(afastamento));
      
      const possuiLaudo = !!laudo;
      
      return {
        idx,
        registro,
        nome: HUB.format.clean(HUB.pick(row, this.FIELDS.nome)),
        
        // Hierarquia organizacional
        diretoria: org?.diretoria || HUB.format.clean(HUB.pick(row, this.FIELDS.diretoria)) || "Não informado",
        superintendencia: org?.superintendencia || HUB.format.clean(HUB.pick(row, this.FIELDS.super)) || "Não informado",
        gerencia: org?.gerencia || HUB.format.clean(HUB.pick(row, this.FIELDS.gerencia)) || "Não informado",
        setor,
        
        // Cargo e função
        tipoCargo: HUB.format.clean(HUB.pick(row, this.FIELDS.tipoCargo)) || "Não informado",
        funcaoCargo,
        funcaoEC,
        funcaoAtuacao: this._defineFuncaoAtuacao(funcaoCargo, funcaoEC),
        
        // Afastamento
        afastamento,
        tipoAfastamento: tipoAfast || (afastado ? "Não informado" : ""),
        afastado,
        ativo: !afastado,
        
        // Laudo
        possuiLaudo,
        qtdLaudos: laudo?.qtd || 0,
        tiposLaudos: laudo ? [...laudo.tipos].join("; ") : "",
        
        // Demográfico
        sexo: HUB.format.clean(HUB.pick(row, this.FIELDS.sexo)),
        idade,
        tempoCasa,
        escolaridade: HUB.format.clean(HUB.pick(row, this.FIELDS.escolaridade)) || "Não informado",
        cidade: HUB.format.clean(HUB.pick(row, this.FIELDS.cidade)) || "Não informado",
        jornada: HUB.format.clean(HUB.pick(row, this.FIELDS.jornada)) || "Não informado",
        bairroRes: HUB.format.clean(HUB.pick(row, this.FIELDS.bairroRes)),
        
        // Flags de risco
        risco60: idade >= 60,
        risco65: idade >= 65,
        ecInformado: !!funcaoEC,
        atuaComEC: !!funcaoEC && HUB.format.norm(funcaoEC) === HUB.format.norm(this._defineFuncaoAtuacao(funcaoCargo, funcaoEC)),
        
        // Row original (se precisar)
        raw: row
      };
    });
  },

  // ============================================
  // HELPERS PRIVADOS
  // ============================================
  
  _buildLaudosMap(rows) {
    const map = new Map();
    
    rows.forEach(r => {
      const registro = HUB.format.norm(HUB.pick(r, ["REGISTRO", "MATRICULA", "MATRÍCULA", "MAT", "ID"]));
      if (!registro) return;
      
      const tipo = HUB.format.clean(HUB.pick(r, [
        "CONCLUSAO", "CONCLUSÃO", "CONCLUSAO_LAUDO", "CONCLUSÃO LAUDO",
        "CONCLUSAO DO LAUDO", "CONCLUSÃO DO LAUDO", "TIPO", "TIPO_LAUDO",
        "TIPO LAUDO", "LAUDO", "DESCRIÇÃO", "DESCRICAO", "CLASSIFICAÇÃO",
        "CLASSIFICACAO", "CID", "OBS"
      ]));
      
      const cur = map.get(registro) || { qtd: 0, tipos: new Set() };
      cur.qtd++;
      cur.tipos.add(tipo || "Laudo informado");
      map.set(registro, cur);
    });
    
    return map;
  },

  _buildOrgMap(rows) {
    const map = new Map();
    
    rows.forEach(r => {
      const setor = HUB.format.clean(HUB.pick(r, this.FIELDS.setor));
      if (!setor) return;
      
      const item = {
        setor,
        diretoria: HUB.format.clean(HUB.pick(r, this.FIELDS.diretoria)) || "Não informado",
        superintendencia: HUB.format.clean(HUB.pick(r, this.FIELDS.super)) || "Não informado",
        gerencia: HUB.format.clean(HUB.pick(r, this.FIELDS.gerencia)) || "Não informado"
      };
      
      map.set(HUB.format.norm(setor), item);
    });
    
    return map;
  },

  _getOrgBySetor(setor) {
    const key = HUB.format.norm(setor);
    if (!key) return null;
    
    if (this.orgMap.has(key)) {
      return this.orgMap.get(key);
    }
    
    // Busca fuzzy
    for (const [k, v] of this.orgMap.entries()) {
      if (k && key && (k === key || k.includes(key) || key.includes(k))) {
        return v;
      }
    }
    
    return null;
  },

  _defineFuncaoAtuacao(funcaoCargo, funcaoEC) {
    const cargo = HUB.format.norm(funcaoCargo);
    const ec = HUB.format.norm(funcaoEC);
    
    if (!HUB.format.clean(funcaoEC)) {
      return HUB.format.clean(funcaoCargo) || "Não informado";
    }
    
    // Regra especial: Gari que vira Encarregado mantém função original
    if (cargo.includes("GARI") && ec.includes("ENCARREGADO")) {
      return HUB.format.clean(funcaoCargo) || "Não informado";
    }
    
    return HUB.format.clean(funcaoEC) || HUB.format.clean(funcaoCargo) || "Não informado";
  }
};
