(function(){
  'use strict';
  const INDICADORES=[
    {o:1,c:'QES05',n:'Resolução de reclamações',g:'Qualidade e Eficiência',a:'Direta',r:'COMLURB e Sistema 1746',d:'Parcial',m:'Chamados / Ouvidorias',lac:'A base precisa distinguir reclamações recebidas, resolvidas, pendentes e reabertas, além do prazo de resolução.',acao:'Consolidar status, prazo, data de abertura, conclusão e reabertura em base auditável.'},
    {o:2,c:'QES01',n:'Continuidade da coleta de resíduos domésticos',g:'Qualidade e Eficiência',a:'Direta',r:'COMLURB',d:'Não estruturado',m:'Engenharia Operacional',lac:'Não há base consolidada de rota programada versus executada, interrupção e tempo de normalização.',acao:'Criar registro diário de programação, execução, interrupções, causa, território e normalização.'},
    {o:3,c:'IG02',n:'Cobertura da coleta seletiva',g:'Gestão',a:'Direta',r:'COMLURB',d:'Parcial',m:'Engenharia Operacional',lac:'A tonelagem existente não demonstra cobertura populacional ou domiciliar.',acao:'Relacionar territórios, população, domicílios, frequência e modalidade de atendimento.'},
    {o:4,c:'QES02',n:'Cobertura do serviço de varrição pública',g:'Qualidade e Eficiência',a:'Direta',r:'COMLURB',d:'Não estruturado',m:'Operação e Território',lac:'Falta consolidar a extensão elegível e a extensão efetivamente atendida.',acao:'Cadastrar malha elegível, programação, extensão executada e periodicidade por território.'},
    {o:5,c:'QES03',n:'Continuidade do serviço de varrição pública',g:'Qualidade e Eficiência',a:'Direta',r:'COMLURB',d:'Não estruturado',m:'Operação e Território',lac:'A execução não está comparada sistematicamente à programação.',acao:'Registrar varrição programada, realizada, interrompida e remarcada.'},
    {o:6,c:'IG01',n:'Cobertura de coleta de resíduos domésticos',g:'Gestão',a:'Direta',r:'COMLURB',d:'A apurar',m:'Engenharia Operacional',lac:'É necessário validar o universo populacional ou domiciliar e o atendimento efetivo.',acao:'Definir unidade de cobertura e integrar cadastro operacional com a base territorial.'},
    {o:7,c:'QES08',n:'Recuperação de biogás a partir dos resíduos sólidos urbanos',g:'Qualidade e Eficiência',a:'Compartilhada',r:'Operador da CTR, Município e COMLURB',d:'Parcial',m:'Engenharia Operacional',lac:'O HUB acompanha biogás, mas fórmula, medição e responsabilidade precisam de validação.',acao:'Documentar medidores, periodicidade, perdas, aproveitamento e memória de cálculo.'},
    {o:8,c:'QES06',n:'Recuperação de materiais recicláveis secos',g:'Qualidade e Eficiência',a:'Compartilhada',r:'COMLURB, cooperativas e recicladores',d:'Parcial',m:'Engenharia Operacional',lac:'Massa encaminhada às cooperativas não comprova recuperação efetiva.',acao:'Integrar entrada, comercialização, estoque, rejeito e destinação do rejeito.'},
    {o:9,c:'QES07',n:'Recuperação da fração orgânica dos resíduos sólidos urbanos',g:'Qualidade e Eficiência',a:'Compartilhada',r:'COMLURB e operadores de tratamento',d:'Parcial',m:'Engenharia Operacional',lac:'É necessário distinguir recebimento, processamento, produto e rejeito.',acao:'Medir massa efetivamente tratada e sua destinação comprovada.'},
    {o:10,c:'IG04',n:'Recuperação de resíduos sólidos urbanos',g:'Gestão',a:'Compartilhada',r:'Município, COMLURB, cooperativas e operadores',d:'Parcial',m:'Engenharia Operacional',lac:'Os fluxos recuperados ainda não estão consolidados sob uma mesma metodologia.',acao:'Consolidar secos, orgânicos e demais fluxos sem dupla contagem.'},
    {o:11,c:'QES04',n:'Capacidade utilizada das unidades de aterro sanitário',g:'Qualidade e Eficiência',a:'Compartilhada',r:'Operador da CTR, Município e COMLURB',d:'Parcial',m:'Engenharia Operacional',lac:'Faltam capacidade licenciada, utilizada e remanescente sob uma fonte única.',acao:'Integrar dados operacionais e licenciados da CTR e validar a periodicidade.'},
    {o:12,c:'IG03',n:'Disposição final inadequada de resíduos sólidos urbanos',g:'Gestão',a:'Compartilhada',r:'Município, COMLURB e operadores da destinação',d:'Não estruturado',m:'Governança',lac:'O indicador exige visão municipal de todos os fluxos, não apenas dos resíduos conduzidos pela COMLURB.',acao:'Mapear geradores, transportadores, unidades de recepção e destinos finais.'},
    {o:13,c:'IG05',n:'Recuperação de despesas do serviço público de manejo de resíduos sólidos urbanos',g:'Gestão',a:'Indireta',r:'Município, Fazenda, entidade reguladora e COMLURB',d:'Não estruturado',m:'Financeiro',lac:'A base atual não representa o custo integral nem todas as receitas vinculadas ao serviço.',acao:'Integrar custos, receitas, subsídios e política municipal de cobrança.'}
  ];
  const $=id=>document.getElementById(id);
  function esc(v){return HUB.format.esc(String(v??''));}
  function adherenceClass(v){return v==='Direta'?'tagDirect':v==='Compartilhada'?'tagShared':'tagIndirect';}
  function availabilityClass(v){return v==='Parcial'?'tagPartial':v==='A apurar'?'tagReview':'tagMissing';}
  function render(){
    const q=$('search').value.trim().toLocaleLowerCase('pt-BR');
    const rows=INDICADORES.filter(x=>(!$('adherence').value||x.a===$('adherence').value)&&(!$('availability').value||x.d===$('availability').value)&&(!$('group').value||x.g===$('group').value)&&(!q||[x.c,x.n,x.r,x.m].join(' ').toLocaleLowerCase('pt-BR').includes(q)));
    $('indicatorRows').innerHTML=rows.map(x=>`<tr data-code="${esc(x.c)}" tabindex="0"><td class="anaOrder">${String(x.o).padStart(2,'0')}</td><td class="anaIndicator"><span class="anaCode">${esc(x.c)}</span>${esc(x.n)}</td><td><span class="anaTag ${adherenceClass(x.a)}">${esc(x.a)}</span></td><td class="anaOwner">${esc(x.r)}</td><td><span class="anaTag ${availabilityClass(x.d)}">${esc(x.d)}</span></td><td class="anaModule">${esc(x.m)}</td><td class="anaArrow">›</td></tr>`).join('');
    $('resultCount').textContent=`${rows.length} indicador${rows.length===1?'':'es'}`;
    $('emptyState').hidden=rows.length>0;
    document.querySelectorAll('#indicatorRows tr').forEach(tr=>{tr.addEventListener('click',()=>openDrawer(tr.dataset.code));tr.addEventListener('keydown',e=>{if(e.key==='Enter')openDrawer(tr.dataset.code);});});
  }
  function openDrawer(code){
    const x=INDICADORES.find(item=>item.c===code); if(!x)return;
    $('drawerContent').innerHTML=`<div class="anaDrawerCode">${esc(x.c)} · ${esc(x.g)}</div><h2 id="drawerTitle">${esc(x.n)}</h2><div class="anaDrawerTags"><span class="anaTag ${adherenceClass(x.a)}">Aderência ${esc(x.a.toLowerCase())}</span><span class="anaTag ${availabilityClass(x.d)}">${esc(x.d)}</span></div><div class="anaDetailGrid"><div class="anaDetail"><span>Responsabilidade predominante</span><strong>${esc(x.r)}</strong></div><div class="anaDetail"><span>Módulo relacionado</span><strong>${esc(x.m)}</strong></div><div class="anaDetail"><span>Ordem recomendada</span><strong>${x.o}º indicador</strong></div><div class="anaDetail"><span>Grupo ANA</span><strong>${esc(x.g)}</strong></div></div><h3>Lacuna atual</h3><p>${esc(x.lac)}</p><h3>Ação recomendada</h3><p>${esc(x.acao)}</p><p class="anaDrawerNote">Preparação regulatória. Não representa declaração de conformidade.</p>`;
    $('drawer').classList.add('open');$('drawerOverlay').classList.add('open');$('drawer').setAttribute('aria-hidden','false');
  }
  function closeDrawer(){$('drawer').classList.remove('open');$('drawerOverlay').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');}
  function init(){
    HUB.header.render('hubHeader',{systemLabel:'Governança Corporativa',title:'Indicadores ANA',subtitle:'Aderência da COMLURB à Norma de Referência ANA nº 14/2025',homeHref:'../',homeLabel:'Governança'});
    HUB.footer.render('hubFooter');
    ['search','adherence','availability','group'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',render));
    $('drawerClose').addEventListener('click',closeDrawer);$('drawerOverlay').addEventListener('click',closeDrawer);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
    render();
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
