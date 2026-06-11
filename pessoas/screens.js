/**
 * PAINEL PESSOAS - Módulo de Telas
 * Renderização das 5 telas do painel
 */

const PessoasScreens = {
  
  // ============================================
  // TELA 1: VISÃO GERAL
  // ============================================
  
  renderVisaoGeral(data) {
    const total = data.length;
    const ativos = data.filter(r => r.ativo).length;
    const afastados = data.filter(r => r.afastado).length;
    const laudos = data.filter(r => r.possuiLaudo).length;
    const risco65 = data.filter(r => r.risco65).length;
    
    // KPIs
    HUB.cards.render("kpis", [
      {
        label: "Total de servidores",
        value: total,
        note: "No recorte atual",
        feature: true,
        onclick: "PessoasApp.clearDrill()",
        tooltip: "Clique para resetar filtros"
      },
      {
        label: "Ativos",
        value: ativos,
        note: HUB.format.pct(HUB.format.calcPct(ativos, total)),
        color: "green",
        onclick: "PessoasApp.setDrill('situacao','ativo','Servidores ativos')",
        tooltip: "Servidores em atividade regular"
      },
      {
        label: "Afastados",
        value: afastados,
        note: HUB.format.pct(HUB.format.calcPct(afastados, total)),
        color: "orange",
        onclick: "PessoasApp.setDrill('situacao','afastado','Servidores afastados')",
        tooltip: "Servidores temporariamente afastados"
      },
      {
        label: "Com laudo",
        value: laudos,
        note: HUB.format.pct(HUB.format.calcPct(laudos, total)),
        color: "purple",
        onclick: "PessoasApp.setDrill('situacao','laudo','Servidores com laudo')",
        tooltip: "Servidores com laudo médico"
      },
      {
        label: "Risco etário 65+",
        value: risco65,
        note: HUB.format.pct(HUB.format.calcPct(risco65, total)),
        color: "red",
        onclick: "PessoasApp.setDrill('situacao','risco65','Risco etário 65+')",
        tooltip: "Servidores com 65 anos ou mais"
      }
    ]);
    
    // Gráfico 1: Diretorias
    const diretorias = HUB.array.groupCount(data, "diretoria").slice(0, 8);
    HUB.simpleBar.render("chartDiretorias", diretorias, {
      total,
      onclick: name => `PessoasApp.setDrill('diretoria','${HUB.format.esc(name).replaceAll("'", "&#39;")}','${HUB.format.esc(name).replaceAll("'", "&#39;")}')`
    });
    
    // Gráfico 2: Capacidade x Pressão (donut)
    this._renderCapacidadePressao(data, ativos, afastados, laudos);
    
    // Gráfico 3: Cascata (Diretoria → Super → Gerência → Setor)
    this._renderCascata(data, total);
  },

  _renderCapacidadePressao(data, ativos, afastados, laudos) {
    const total = data.length;
    const opPct = HUB.format.calcPct(ativos, total);
    
    HUB.dom.setHTML("chartAtvAfast", `
      <div class="donutRow">
        <div class="donut" style="--opPct:${opPct}%">
          <div class="donutCenter">${HUB.format.int(total)}</div>
        </div>
        <div>
          <div class="legendItem" onclick="PessoasApp.setDrill('situacao','ativo','Servidores ativos')" style="cursor:pointer">
            <div class="dot green"></div>
            <div>Ativos</div>
            <b>${HUB.format.int(ativos)}</b>
          </div>
          <div class="legendItem" onclick="PessoasApp.setDrill('situacao','afastado','Servidores afastados')" style="cursor:pointer">
            <div class="dot orange"></div>
            <div>Afastados</div>
            <b>${HUB.format.int(afastados)}</b>
          </div>
          <div class="legendItem" onclick="PessoasApp.setDrill('situacao','laudo','Servidores com laudo')" style="cursor:pointer">
            <div class="dot purple"></div>
            <div>Com laudo</div>
            <b>${HUB.format.int(laudos)}</b>
          </div>
        </div>
      </div>
    `);
  },

  _renderCascata(data, total) {
    const filtros = PessoasApp.filters;
    
    let campo = "diretoria";
    let titulo = "Distribuição por diretoria";
    let hint = "Selecione uma diretoria para abrir por superintendência";
    
    if (filtros.dir && !filtros.sup) {
      campo = "superintendencia";
      titulo = "Distribuição por superintendência / coordenação";
      hint = "Selecione para abrir por gerência";
    } else if (filtros.sup && !filtros.ger) {
      campo = "gerencia";
      titulo = "Distribuição por gerência";
      hint = "Selecione para abrir por setor";
    } else if (filtros.ger) {
      campo = "setor";
      titulo = "Distribuição por setor";
      hint = "Leitura por setor operacional";
    }
    
    HUB.dom.setText("tituloCardCascata", titulo);
    HUB.dom.setText("hintCardCascata", hint);
    
    const dados = HUB.array.groupCount(data, campo).slice(0, 8);
    HUB.simpleBar.render("chartLaudosGerencia", dados, {
      total: Math.max(total, 1),
      color: "purple",
      onclick: name => `PessoasApp.setDrill('${campo}','${HUB.format.esc(name).replaceAll("'", "&#39;")}','${HUB.format.esc(name).replaceAll("'", "&#39;")}')`
    });
  },

  // ============================================
  // TELA 2: SAÚDE OCUPACIONAL
  // ============================================
  
  renderSaude(data) {
    const total = data.length;
    const laudos = data.filter(r => r.possuiLaudo);
    const afastados = data.filter(r => r.afastado);
    const laudo60 = data.filter(r => r.possuiLaudo && r.risco60);
    const laudoAfast = data.filter(r => r.possuiLaudo && r.afastado);
    const laudoEC = data.filter(r => r.possuiLaudo && r.ecInformado);
    
    // KPIs
    HUB.cards.render("kpisSaude", [
      {
        label: "Com laudo",
        value: laudos.length,
        note: HUB.format.pct(HUB.format.calcPct(laudos.length, total)),
        feature: true,
        color: "purple",
        onclick: "PessoasApp.setDrill('situacao','laudo','Servidores com laudo')"
      },
      {
        label: "Afastados",
        value: afastados.length,
        note: "Indisponibilidade registrada",
        color: "orange",
        onclick: "PessoasApp.setDrill('situacao','afastado','Servidores afastados')"
      },
      {
        label: "Laudo + 60+",
        value: laudo60.length,
        note: "Pressão ocupacional futura",
        color: "red"
      },
      {
        label: "Laudo + afastado",
        value: laudoAfast.length,
        note: "Maior criticidade",
        color: "red"
      },
      {
        label: "Laudo + EC",
        value: laudoEC.length,
        note: "Restrição e redistribuição",
        color: "purple"
      }
    ]);
    
    // Gráfico 1: Pressão por Gerência
    const pressao = HUB.array.groupCount(
      data.filter(r => r.possuiLaudo || r.afastado || r.risco65),
      "gerencia"
    ).slice(0, 10);
    HUB.simpleBar.render("chartPressaoGerencia", pressao, {
      total: Math.max(total, 1),
      color: "red"
    });
    
    // Gráfico 2: Tipos de Laudo
    const tipoMap = new Map();
    laudos.forEach(r => {
      const tipos = r.tiposLaudos ? r.tiposLaudos.split(";").map(x => HUB.format.clean(x)).filter(Boolean) : ["Laudo informado"];
      tipos.forEach(t => tipoMap.set(t, (tipoMap.get(t) || 0) + 1));
    });
    const tipos = [...tipoMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    HUB.simpleBar.render("chartTiposLaudo", tipos, {
      total: Math.max(laudos.length, 1),
      color: "green"
    });
    
    // Gráfico 3: Funções com laudo
    const funcoes = HUB.array.groupCount(laudos, "funcaoAtuacao").slice(0, 8);
    HUB.simpleBar.render("chartFuncaoLaudo", funcoes, {
      total: Math.max(laudos.length, 1),
      color: "orange"
    });
  },

  // ============================================
  // TELA 3: AFASTAMENTOS
  // ============================================
  
  renderAfastamentos(data) {
    const subset = data.filter(r => r.afastado);
    const total = subset.length;
    const inss = subset.filter(r => 
      HUB.format.norm(r.tipoAfastamento).includes("INSS") || 
      HUB.format.norm(r.afastamento).includes("INSS")
    ).length;
    const afastLaudo = subset.filter(r => r.possuiLaudo).length;
    
    // KPIs
    HUB.cards.render("kpisAfastamentos", [
      {
        label: "Total afastados",
        value: total,
        note: "No recorte atual",
        feature: true,
        color: "orange",
        onclick: "PessoasApp.setDrill('situacao','afastado','Servidores afastados')"
      },
      {
        label: "INSS",
        value: inss,
        note: "Registros contendo INSS",
        onclick: "PessoasApp.setDrill('tipoAfast','INSS','Afastamentos INSS')"
      },
      {
        label: "Afastados com laudo",
        value: afastLaudo,
        note: "Cruzamento ocupacional"
      }
    ]);
    
    // Gráficos
    const tipoAfast = HUB.array.groupCount(subset, "tipoAfastamento").slice(0, 8);
    HUB.simpleBar.render("chartTipoAfast", tipoAfast, {
      total: Math.max(total, 1),
      color: "orange"
    });
    
    const gerencias = HUB.array.groupCount(subset, "gerencia").slice(0, 8);
    HUB.simpleBar.render("chartAfastGerencia", gerencias, {
      total: Math.max(total, 1)
    });
    
    const faixas = HUB.array.faixaCount(subset, "tempoCasa", [
      ["0–10", 0, 10],
      ["11–20", 11, 20],
      ["21–30", 21, 30],
      ["31–40", 31, 40],
      ["41–50", 41, 50],
      ["51+", 51, 999]
    ]);
    this._renderCols("chartTempoAfast", faixas, "tempoFaixa");
  },

  // ============================================
  // TELA 4: DEMOGRÁFICO
  // ============================================
  
  renderDemografico(data) {
    const total = data.length;
    const idadeMedia = HUB.array.avg(data, "idade");
    const masc = data.filter(r => 
      HUB.format.norm(r.sexo) === "M" || 
      HUB.format.norm(r.sexo).startsWith("MASC")
    ).length;
    const fem = data.filter(r => 
      HUB.format.norm(r.sexo) === "F" || 
      HUB.format.norm(r.sexo).startsWith("FEM")
    ).length;
    const escolPred = HUB.array.groupCount(data, "escolaridade")[0] || ["-", 0];
    const cidPred = HUB.array.groupCount(data, "cidade")[0] || ["-", 0];
    
    // KPIs
    HUB.cards.render("kpisDemografico", [
      {
        label: "Idade média",
        value: idadeMedia.toFixed(1).replace(".", ","),
        note: "Anos",
        format: "custom",
        customFormatter: v => v
      },
      {
        label: "Masculino",
        value: masc,
        note: HUB.format.pct(HUB.format.calcPct(masc, total)),
        onclick: "PessoasApp.setDrill('sexo','M','Masculino')"
      },
      {
        label: "Feminino",
        value: fem,
        note: HUB.format.pct(HUB.format.calcPct(fem, total)),
        onclick: "PessoasApp.setDrill('sexo','F','Feminino')"
      },
      {
        label: "Escolaridade predominante",
        value: escolPred[0],
        note: "Grau mais comum",
        format: "custom",
        customFormatter: v => `<span style="font-size:18px">${v}</span>`
      },
      {
        label: "Município predominante",
        value: cidPred[0],
        note: "Residência",
        format: "custom",
        customFormatter: v => `<span style="font-size:18px">${v}</span>`
      }
    ]);
    
    // Gráficos
    const faixasIdade = HUB.array.faixaCount(data, "idade", [
      ["< 30", 0, 30],
      ["31–40", 31, 40],
      ["41–50", 41, 50],
      ["51–60", 51, 60],
      ["61–70", 61, 70],
      ["71+", 71, 999]
    ]);
    this._renderCols("chartIdade", faixasIdade, "idadeFaixa");
    
    const escolaridade = HUB.array.groupCount(data, "escolaridade").slice(0, 8);
    HUB.simpleBar.render("chartEscolaridade", escolaridade, {
      total,
      color: "green"
    });
    
    const faixasTempo = HUB.array.faixaCount(data, "tempoCasa", [
      ["0–10", 0, 10],
      ["11–20", 11, 20],
      ["21–30", 21, 30],
      ["31–40", 31, 40],
      ["41–50", 41, 50],
      ["51+", 51, 999]
    ]);
    this._renderCols("chartTempoCasa", faixasTempo, "tempoFaixa");
    
    this._renderTerritorialMap(data, total);
    
    const jornada = HUB.array.groupCount(data, "jornada").slice(0, 8);
    HUB.simpleBar.render("chartJornada", jornada, { total });
  },

  _renderTerritorialMap(data, total) {
    const top = HUB.array.groupCount(data, "cidade")
      .filter(x => x[0] && x[0] !== "Não informado")
      .slice(0, 8);
    
    const principal = top[0] || ["Sem dados", 0];
    const foraRJ = data.filter(r => 
      HUB.format.norm(r.cidade) && 
      HUB.format.norm(r.cidade) !== "RIO DE JANEIRO" && 
      HUB.format.norm(r.cidade) !== "NAO INFORMADO"
    ).length;
    
    const bairros = HUB.array.groupCount(data, "bairroRes")
      .filter(x => x[0] && x[0] !== "Não informado")
      .slice(0, 5);
    const bairroTop = bairros[0] || ["Sem dados", 0];
    
    const max = Math.max(...top.map(x => x[1]), 1);
    
    const linhas = top.map(([cid, cnt]) => `
      <div class="territorialRow" onclick="PessoasApp.setDrill('cidade','${HUB.format.esc(cid).replaceAll("'", "&#39;")}','${HUB.format.esc(cid).replaceAll("'", "&#39;")}')">
        <div class="territorialName" title="${HUB.format.esc(cid)}">${HUB.format.esc(cid)}</div>
        <div class="territorialTrack"><div class="territorialFill" style="width:${cnt / max * 100}%"></div></div>
        <div class="territorialNum">${HUB.format.int(cnt)}</div>
        <div class="territorialPct">${HUB.format.pct(HUB.format.calcPct(cnt, total))}</div>
      </div>
    `).join("");
    
    HUB.dom.setHTML("rankCidades", `
      <div class="territorialExec">
        <div class="territorialSummary">
          <div class="territorialCard">
            <small>Município predominante</small>
            <b title="${HUB.format.esc(principal[0])}">${HUB.format.esc(principal[0])}</b>
            <span>${HUB.format.int(principal[1])} servidores • ${HUB.format.pct(HUB.format.calcPct(principal[1], total))}</span>
          </div>
          <div class="territorialCard">
            <small>Fora do Rio</small>
            <b>${HUB.format.int(foraRJ)}</b>
            <span>${HUB.format.pct(HUB.format.calcPct(foraRJ, total))} do recorte atual</span>
          </div>
          <div class="territorialCard">
            <small>Bairro mais frequente</small>
            <b title="${HUB.format.esc(bairroTop[0])}">${HUB.format.esc(bairroTop[0])}</b>
            <span>${HUB.format.int(bairroTop[1])} servidores</span>
          </div>
        </div>
        <div class="territorialNote">
          Ranking territorial por município de moradia. Clique em uma linha para filtrar o painel.
        </div>
        <div class="territorialRank">
          ${linhas || '<div class="empty">Sem dados territoriais</div>'}
        </div>
      </div>
    `);
  },

  // ============================================
  // TELA 5: ANALÍTICO
  // ============================================
  
  renderAnalitico(data) {
    const search = HUB.format.norm(HUB.dom.$("searchBox")?.value || "");
    
    let filtered = data;
    if (search) {
      filtered = data.filter(r => HUB.format.norm([
        r.registro, r.nome, r.diretoria, r.superintendencia, r.gerencia, r.setor,
        r.tipoCargo, r.funcaoCargo, r.funcaoEC, r.funcaoAtuacao, r.afastamento,
        r.tipoAfastamento, r.tiposLaudos, r.cidade
      ].join(" ")).includes(search));
    }
    
    const rows = filtered.slice(0, 1200);
    
    HUB.dom.setHTML("tableAnalitico", `
      <table class="dataTable">
        <thead><tr>
          <th>Registro</th><th>Nome</th><th>Diretoria</th><th>Superintendência</th>
          <th>Gerência</th><th>Setor</th><th>Tipo de cargo</th><th>Função / cargo</th>
          <th>Função EC</th><th>Atuação</th><th>Situação</th><th>Afastamento</th>
          <th>Tipo afast.</th><th>Idade</th><th>Tempo de casa</th><th>Laudo</th>
        </tr></thead>
        <tbody>
        ${rows.map(r => `
          <tr>
            <td>${HUB.format.esc(r.registro)}</td>
            <td>${HUB.format.esc(r.nome)}</td>
            <td>${HUB.format.esc(r.diretoria)}</td>
            <td>${HUB.format.esc(r.superintendencia)}</td>
            <td>${HUB.format.esc(r.gerencia)}</td>
            <td>${HUB.format.esc(r.setor)}</td>
            <td>${HUB.format.esc(r.tipoCargo)}</td>
            <td>${HUB.format.esc(r.funcaoCargo)}</td>
            <td>${HUB.format.esc(r.funcaoEC || "—")}</td>
            <td>${HUB.format.esc(r.funcaoAtuacao)}</td>
            <td><span class="tag ${r.afastado ? 'att' : 'ok'}">${r.afastado ? 'Afastado' : 'Ativo'}</span></td>
            <td>${HUB.format.esc(r.afastamento || "—")}</td>
            <td>${HUB.format.esc(r.tipoAfastamento || "—")}</td>
            <td>${r.idade || ""}</td>
            <td>${r.tempoCasa || ""}</td>
            <td><span class="tag ${r.possuiLaudo ? 'purple' : 'ok'}">${r.possuiLaudo ? 'Sim' : 'Não'}</span></td>
          </tr>
        `).join("")}
        </tbody>
      </table>
    `);
  },

  // ============================================
  // HELPERS
  // ============================================
  
  _renderCols(containerId, faixas, drillType) {
    const max = Math.max(...faixas.map(x => x[1]), 1);
    
    HUB.dom.setHTML(containerId, `
      <div class="cols">
        ${faixas.map(([fx, cnt]) => `
          <div class="colWrap" onclick="PessoasApp.setDrill('${drillType}','${fx}','${fx}')">
            <div class="colVal">${HUB.format.int(cnt)}</div>
            <div class="col" style="--h:${cnt / max * 100}%"></div>
            <div class="colLbl">${fx}</div>
          </div>
        `).join("")}
      </div>
    `);
  }
};
