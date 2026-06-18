/* HUB COMLURB | Território Operacional
   Camadas:
   - GeoJSON em /assets/geojson/
   - Unidades em /territorial/data/unidades_comlurb.csv
*/

const map = L.map('map', {
  zoomControl: true,
  preferCanvas: true
}).setView([-22.9068, -43.1729], 11);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

let activeLayer = null;
let unitLayer = null;
let unidades = [];
let currentKey = 'dsu';

const layerMeta = {
  dsu: {
    label: 'Gerências DSU',
    tipo: 'Área operacional',
    paths: [
      '../assets/geojson/GERENCIAS_DSU.geojson',
      '/COMLURB/assets/geojson/GERENCIAS_DSU.geojson',
      './assets/geojson/GERENCIAS_DSU.geojson'
    ],
    color: '#5b9bd5',
    fill: '#244f82',
    insight: 'Camada usada para leitura das áreas de atuação das Gerências da Diretoria de Serviços Urbanos.'
  },
  dlu: {
    label: 'Bairros DLU',
    tipo: 'Base territorial',
    paths: [
      '../assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson',
      '/COMLURB/assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson',
      './assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson'
    ],
    color: '#78aaa3',
    fill: '#1d6b62',
    insight: 'Camada de referência territorial para leitura por bairros e estrutura DLU 2025.'
  },
  unidades: {
    label: 'Unidades COMLURB',
    tipo: 'Pontos operacionais',
    paths: [
      'data/unidades_comlurb.csv',
      './data/unidades_comlurb.csv',
      '/COMLURB/territorial/data/unidades_comlurb.csv'
    ],
    insight: 'Camada de setores e unidades físicas da COMLURB, classificada por categoria, diretoria e bairro.'
  }
};

function $(id){ return document.getElementById(id); }

function br(n){
  return Number(n || 0).toLocaleString('pt-BR');
}

function pct(n){
  return `${Number(n || 0).toLocaleString('pt-BR', {maximumFractionDigits:1})}%`;
}

function setActiveButton(key){
  currentKey = key;
  ['DSU','DLU','UNI'].forEach(s => {
    const btn = $('btn' + s);
    if(btn) btn.classList.remove('active');
  });
  const mapBtn = { dsu:'btnDSU', dlu:'btnDLU', unidades:'btnUNI' };
  if($(mapBtn[key])) $(mapBtn[key]).classList.add('active');
}

function clearLayer(){
  if(activeLayer){
    map.removeLayer(activeLayer);
    activeLayer = null;
  }
  if(unitLayer){
    map.removeLayer(unitLayer);
    unitLayer = null;
  }
}

async function fetchFirst(paths, type='json'){
  let lastError = null;

  for(const path of paths){
    try{
      const res = await fetch(path, { cache:'no-store' });
      if(!res.ok) throw new Error(`${res.status} em ${path}`);
      return {
        data: type === 'json' ? await res.json() : await res.text(),
        path
      };
    }catch(err){
      lastError = err;
    }
  }

  throw lastError || new Error('Arquivo não encontrado.');
}

function setInsight(title, text, error=false){
  $('infoBox').classList.toggle('errorBox', error);
  $('infoBox').innerHTML = `
    <div class="insightTitle">${title}</div>
    <div class="insightText">${text}</div>
  `;
}

function updateKpis({camada='-', total=0, principal='-', cobertura='-', note2='Registros identificados', note3='Maior grupo no recorte ativo', note4='Leitura territorial do recorte'}){
  $('kpiCamada').textContent = camada;
  $('kpiFeicoes').textContent = br(total);
  $('kpiPrincipal').textContent = principal;
  $('kpiCobertura').textContent = cobertura;
  $('kpi2Note').textContent = note2;
  $('kpi3Note').textContent = note3;
  $('kpi4Note').textContent = note4;
}

function getProp(props, keys){
  const p = props || {};
  for(const k of keys){
    if(p[k] !== undefined && p[k] !== null && String(p[k]).trim() !== '') return p[k];
  }
  const lower = {};
  Object.keys(p).forEach(k => lower[k.toLowerCase()] = p[k]);
  for(const k of keys){
    const v = lower[k.toLowerCase()];
    if(v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

function detectName(props){
  return getProp(props, [
    'NOME','Nome','name','GERENCIA','Gerencia','GERÊNCIA','NM_GERENCIA',
    'BAIRRO','Bairro','NM_BAIRRO','Nome_do_Bairro','nome_bairro'
  ]);
}

function popupGeojson(props){
  const nome = detectName(props) || 'Território';
  const ger = getProp(props, ['GERENCIA','Gerencia','GERÊNCIA','NM_GERENCIA']);
  const bairro = getProp(props, ['BAIRRO','Bairro','NM_BAIRRO','Nome_do_Bairro','nome_bairro']);
  const ap = getProp(props, ['AP','ap','AREA_PLANEJAMENTO','Area_Planejamento']);
  return `
    <div class="popupTitle">${escapeHtml(nome)}</div>
    ${ger ? `<div class="popupLine"><b>Gerência:</b> ${escapeHtml(ger)}</div>` : ''}
    ${bairro ? `<div class="popupLine"><b>Bairro:</b> ${escapeHtml(bairro)}</div>` : ''}
    ${ap ? `<div class="popupLine"><b>AP:</b> ${escapeHtml(ap)}</div>` : ''}
  `;
}

function makeGeoSummary(data, key){
  const features = data.features || [];
  const names = features.map(f => detectName(f.properties || {})).filter(Boolean);

  const counts = {};
  names.forEach(n => counts[n] = (counts[n] || 0) + 1);

  const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
  const uniqueCount = Object.keys(counts).length;
  const meta = layerMeta[key];

  let principal = top ? top[0] : '-';
  if(String(principal).length > 18) principal = String(principal).slice(0,18) + '…';

  updateKpis({
    camada: meta.label,
    total: features.length,
    principal,
    cobertura: uniqueCount ? br(uniqueCount) : '-',
    note2: key === 'dsu' ? 'Áreas/feições carregadas' : 'Bairros/feições carregadas',
    note3: key === 'dsu' ? 'Gerência ou área mais recorrente' : 'Bairro mais recorrente',
    note4: 'Grupos identificados na camada'
  });

  const rankHtml = Object.entries(counts)
    .sort((a,b) => b[1] - a[1])
    .slice(0,14)
    .map(([k,v]) => `
      <div class="rankItem">
        <div><b>${escapeHtml(k)}</b><small>${meta.tipo}</small></div>
        <span class="pill">${br(v)}</span>
      </div>
    `).join('');

  $('rankBox').innerHTML = rankHtml || `
    <div class="rankItem">
      <div><b>Camada carregada</b><small>Não encontrei campo nominal para ranking.</small></div>
      <span class="pill">${br(features.length)}</span>
    </div>
  `;

  const topText = top ? ` A maior recorrência identificada no arquivo é <b>${escapeHtml(top[0])}</b>.` : '';
  setInsight(
    'Leitura executiva',
    `${meta.insight} Foram carregadas <b>${br(features.length)}</b> feições e <b>${br(uniqueCount)}</b> grupos territoriais identificáveis.${topText}`
  );
}

async function loadGeojson(key){
  clearLayer();
  $('filtrosUnidades').style.display = 'none';
  setActiveButton(key);
  const meta = layerMeta[key];

  updateKpis({camada: meta.label, total: 0, principal:'-', cobertura:'-'});
  $('rankBox').innerHTML = '<div class="loading">Carregando camada...</div>';
  setInsight('Leitura executiva', `Carregando ${meta.label}...`);

  try{
    const {data, path} = await fetchFirst(meta.paths, 'json');

    activeLayer = L.geoJSON(data, {
      style: {
        color: meta.color,
        weight: 1.8,
        fillColor: meta.fill,
        fillOpacity: .20,
        opacity: .92
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(popupGeojson(feature.properties || {}));
        layer.on({
          mouseover: e => e.target.setStyle({weight:3, fillOpacity:.34}),
          mouseout: e => activeLayer.resetStyle(e.target)
        });
      }
    }).addTo(map);

    if(activeLayer.getBounds && activeLayer.getBounds().isValid()){
      map.fitBounds(activeLayer.getBounds(), { padding:[24,24] });
    }

    makeGeoSummary(data, key);
  }catch(err){
    setInsight(
      'Camada não carregada',
      `Não consegui carregar <b>${meta.label}</b>. Confirme se o arquivo está em <b>assets/geojson</b> e se o nome está exatamente igual ao usado no GitHub.`,
      true
    );
    $('rankBox').innerHTML = '';
    updateKpis({camada: meta.label, total:0, principal:'-', cobertura:'Erro'});
  }
}

function parseCSV(text){
  const rows = [];
  const clean = text.replace(/\r/g,'').trim();
  if(!clean) return rows;

  const sep = clean.split('\n')[0].includes(';') ? ';' : ',';
  const lines = clean.split('\n');
  const headers = splitCSVLine(lines[0], sep).map(h => h.trim().replace(/^\uFEFF/, ''));

  for(const line of lines.slice(1)){
    if(!line.trim()) continue;
    const values = splitCSVLine(line, sep);
    const row = {};
    headers.forEach((h,i) => row[h] = (values[i] || '').trim());
    rows.push(row);
  }

  return rows;
}

function splitCSVLine(line, sep){
  const values = [];
  let current = '';
  let inside = false;

  for(let i=0; i<line.length; i++){
    const ch = line[i];
    const next = line[i+1];

    if(ch === '"' && inside && next === '"'){
      current += '"';
      i++;
    }else if(ch === '"'){
      inside = !inside;
    }else if(ch === sep && !inside){
      values.push(current);
      current = '';
    }else{
      current += ch;
    }
  }

  values.push(current);
  return values;
}

function normalizeUnitRow(r){
  const lower = {};
  Object.keys(r).forEach(k => lower[k.toLowerCase().trim()] = r[k]);

  function get(keys){
    for(const k of keys){
      if(r[k] !== undefined && String(r[k]).trim() !== '') return r[k];
      if(lower[k.toLowerCase()] !== undefined && String(lower[k.toLowerCase()]).trim() !== '') return lower[k.toLowerCase()];
    }
    return '';
  }

  let lat = get(['lat','latitude','y','coord_y','coordenada_y']);
  let lon = get(['lon','long','longitude','x','coord_x','coordenada_x']);

  lat = Number(String(lat).replace(',', '.'));
  lon = Number(String(lon).replace(',', '.'));

  if(Math.abs(lat) > 30 && Math.abs(lon) < 30){
    const tmp = lat;
    lat = lon;
    lon = tmp;
  }

  return {
    setor: get(['setor','cod_setor','codigo','código']),
    nome: get(['nome','descricao','descrição','unidade','local']),
    categoria: get(['categoria','categoria_hub','classificacao','classificação']) || 'Administrativo',
    diretoria: get(['diretoria','dir','sigla_diretoria']),
    tipo: get(['tipo','natureza','tipo_unidade']),
    bairro: get(['bairro']),
    endereco: get(['endereco','endereço','logradouro']),
    lat,
    lon
  };
}

async function loadUnits(){
  clearLayer();
  setActiveButton('unidades');
  $('filtrosUnidades').style.display = 'grid';
  $('rankBox').innerHTML = '<div class="loading">Carregando unidades...</div>';
  setInsight('Leitura executiva', 'Carregando unidades COMLURB...');

  try{
    const {data:text} = await fetchFirst(layerMeta.unidades.paths, 'text');
    unidades = parseCSV(text)
      .map(normalizeUnitRow)
      .filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lon) && d.lat !== 0 && d.lon !== 0);

    fillFilters();
    renderUnits(unidades);
  }catch(err){
    setInsight(
      'Unidades não carregadas',
      'Não consegui carregar <b>territorial/data/unidades_comlurb.csv</b>. Confirme se o arquivo está dentro da pasta <b>territorial/data</b>.',
      true
    );
    $('rankBox').innerHTML = '';
    updateKpis({camada:'Unidades COMLURB', total:0, principal:'-', cobertura:'Erro'});
  }
}

function uniqueValues(field){
  return [...new Set(unidades.map(d => d[field]).filter(Boolean))]
    .sort((a,b) => String(a).localeCompare(String(b), 'pt-BR'));
}

function fillSelect(id, values, first){
  const el = $(id);
  const current = el.value;
  el.innerHTML = `<option value="">${first}</option>` + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if(values.includes(current)) el.value = current;
}

function fillFilters(){
  fillSelect('fCategoria', uniqueValues('categoria'), 'Todas as categorias');
  fillSelect('fDiretoria', uniqueValues('diretoria'), 'Todas as diretorias');
  fillSelect('fBairro', uniqueValues('bairro'), 'Todos os bairros');
}

function escapeHtml(s){
  return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function colorByCategory(cat){
  const c = String(cat || '').toLowerCase();
  if(c.includes('operacional')) return '#5b9bd5';
  if(c.includes('manutenção') || c.includes('manutencao')) return '#e87535';
  if(c.includes('engenharia')) return '#78aaa3';
  if(c.includes('presid')) return '#d7b56d';
  if(c.includes('tecnologia')) return '#9c7ad9';
  if(c.includes('financeiro')) return '#74c69d';
  if(c.includes('jur')) return '#f28482';
  if(c.includes('gestão') || c.includes('gestao')) return '#90dbf4';
  if(c.includes('apoio')) return '#b8c9de';
  return '#ffffff';
}

function unitPopup(d){
  return `
    <div class="popupTitle">${escapeHtml(d.nome || 'Unidade COMLURB')}</div>
    ${d.categoria ? `<div class="popupLine"><b>Categoria:</b> ${escapeHtml(d.categoria)}</div>` : ''}
    ${d.diretoria ? `<div class="popupLine"><b>Diretoria:</b> ${escapeHtml(d.diretoria)}</div>` : ''}
    ${d.tipo ? `<div class="popupLine"><b>Tipo:</b> ${escapeHtml(d.tipo)}</div>` : ''}
    ${d.bairro ? `<div class="popupLine"><b>Bairro:</b> ${escapeHtml(d.bairro)}</div>` : ''}
    ${d.endereco ? `<div class="popupLine"><b>Endereço:</b> ${escapeHtml(d.endereco)}</div>` : ''}
  `;
}

function renderUnits(rows){
  if(unitLayer) map.removeLayer(unitLayer);

  unitLayer = L.layerGroup();

  rows.forEach(d => {
    const marker = L.circleMarker([d.lat, d.lon], {
      radius: 6.5,
      color: '#06111f',
      weight: 1.4,
      fillColor: colorByCategory(d.categoria),
      fillOpacity: .92
    }).bindPopup(unitPopup(d));

    marker.addTo(unitLayer);
  });

  unitLayer.addTo(map);

  if(rows.length){
    const bounds = L.latLngBounds(rows.map(d => [d.lat, d.lon]));
    if(bounds.isValid()) map.fitBounds(bounds, { padding:[30,30] });
  }

  makeUnitsSummary(rows);
}

function applyUnitFilters(){
  const cat = $('fCategoria').value;
  const dir = $('fDiretoria').value;
  const bairro = $('fBairro').value;
  const busca = $('fBusca').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const rows = unidades.filter(d => {
    const hay = `${d.nome} ${d.categoria} ${d.diretoria} ${d.bairro} ${d.endereco} ${d.tipo}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'');

    return (!cat || d.categoria === cat)
      && (!dir || d.diretoria === dir)
      && (!bairro || d.bairro === bairro)
      && (!busca || hay.includes(busca));
  });

  renderUnits(rows);
}

function countBy(rows, field){
  const out = {};
  rows.forEach(d => {
    const k = d[field] || 'Não informado';
    out[k] = (out[k] || 0) + 1;
  });
  return Object.entries(out).sort((a,b) => b[1] - a[1]);
}

function makeUnitsSummary(rows){
  const total = rows.length;
  const byCat = countBy(rows, 'categoria');
  const byDir = countBy(rows, 'diretoria');
  const byBairro = countBy(rows, 'bairro');

  const topCat = byCat[0] || ['-',0];
  const topDir = byDir[0] || ['-',0];
  const topBairro = byBairro[0] || ['-',0'];

  const operacional = rows.filter(d => String(d.categoria).toLowerCase().includes('operacional')).length;
  const coberturaBairros = byBairro.filter(([k]) => k !== 'Não informado').length;

  let principal = topCat[0];
  if(String(principal).length > 18) principal = String(principal).slice(0,18) + '…';

  updateKpis({
    camada: 'Unidades COMLURB',
    total,
    principal,
    cobertura: coberturaBairros ? br(coberturaBairros) : '-',
    note2: 'Unidades no recorte ativo',
    note3: `${br(topCat[1])} unidades na categoria dominante`,
    note4: 'Bairros com unidades mapeadas'
  });

  const shareOperacional = total ? (operacional / total * 100) : 0;

  setInsight(
    'Leitura executiva',
    `O recorte atual apresenta <b>${br(total)}</b> unidades mapeadas. A categoria de maior presença é <b>${escapeHtml(topCat[0])}</b>, com <b>${br(topCat[1])}</b> registros. A diretoria mais representada é <b>${escapeHtml(topDir[0])}</b>. A presença operacional representa <b>${pct(shareOperacional)}</b> do recorte.`
  );

  const html = [
    ...byCat.slice(0, 8).map(([k,v]) => ({grupo:k, valor:v, tipo:'Categoria'})),
    ...byBairro.slice(0, 6).map(([k,v]) => ({grupo:k, valor:v, tipo:'Bairro'}))
  ].map(item => `
    <div class="rankItem">
      <div><b>${escapeHtml(item.grupo)}</b><small>${item.tipo}</small></div>
      <span class="pill">${br(item.valor)}</span>
    </div>
  `).join('');

  $('rankBox').innerHTML = html || `
    <div class="rankItem">
      <div><b>Nenhum registro</b><small>Altere os filtros para ampliar o recorte.</small></div>
      <span class="pill">0</span>
    </div>
  `;
}

function loadLayer(key){
  if(key === 'unidades') return loadUnits();
  return loadGeojson(key);
}

loadLayer('dsu');
