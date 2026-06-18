const map = L.map('map', { zoomControl: true }).setView([-22.9068, -43.1729], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let activeLayer = null;
let unitLayer = null;
let unidades = [];

const paths = {
  dsu: '../assets/geojson/GERENCIAS_DSU.geojson',
  dlu: '../assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson',
  unidades: 'data/unidades_comlurb.csv'
};

const layerMeta = {
  dsu: {
    label: 'Gerências DSU',
    tipo: 'Polígono',
    info: 'Camada territorial das Gerências da Diretoria de Serviços Urbanos.'
  },
  dlu: {
    label: 'DLU | Novos Bairros',
    tipo: 'Polígono',
    info: 'Camada de bairros e estrutura territorial 2025.'
  },
  unidades: {
    label: 'Unidades COMLURB',
    tipo: 'Ponto',
    info: 'Setores e unidades físicas da COMLURB georreferenciados por categoria, diretoria e bairro.'
  }
};

function $(id){ return document.getElementById(id); }

function setActiveButton(key){
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

function updateKpis(label, count, tipo){
  $('kpiCamada').textContent = label || '-';
  $('kpiFeicoes').textContent = Number(count || 0).toLocaleString('pt-BR');
  $('kpiTipo').textContent = tipo || '-';
}

function getProp(props, keys){
  for(const k of keys){
    if(props && props[k] !== undefined && props[k] !== null && String(props[k]).trim() !== ''){
      return props[k];
    }
  }
  const lower = {};
  Object.keys(props || {}).forEach(k => lower[k.toLowerCase()] = props[k]);
  for(const k of keys){
    const v = lower[k.toLowerCase()];
    if(v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
}

function popupGeojson(props){
  const nome = getProp(props, ['NOME','Nome','name','GERENCIA','Gerencia','GERÊNCIA','BAIRRO','Bairro','NM_BAIRRO']);
  const ger = getProp(props, ['GERENCIA','Gerencia','GERÊNCIA']);
  const bairro = getProp(props, ['BAIRRO','Bairro','NM_BAIRRO']);
  const ap = getProp(props, ['AP','ap','AREA_PLANEJAMENTO']);
  return `
    <div class="popupTitle">${nome || 'Território'}</div>
    ${ger ? `<div class="popupLine"><b>Gerência:</b> ${ger}</div>` : ''}
    ${bairro ? `<div class="popupLine"><b>Bairro:</b> ${bairro}</div>` : ''}
    ${ap ? `<div class="popupLine"><b>AP:</b> ${ap}</div>` : ''}
  `;
}

async function loadGeojson(key){
  clearLayer();
  $('filtrosUnidades').style.display = 'none';
  setActiveButton(key);

  const meta = layerMeta[key];
  $('infoBox').innerHTML = meta.info;
  $('rankBox').innerHTML = 'Carregando...';

  try{
    const res = await fetch(paths[key]);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = data.features ? data.features.length : 0;

    activeLayer = L.geoJSON(data, {
      style: {
        color: key === 'dsu' ? '#5b9bd5' : '#78aaa3',
        weight: 2,
        fillColor: key === 'dsu' ? '#2f67a5' : '#1d6b62',
        fillOpacity: .22
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(popupGeojson(feature.properties || {}));
      }
    }).addTo(map);

    try{ map.fitBounds(activeLayer.getBounds(), { padding:[20,20] }); }catch(e){}

    updateKpis(meta.label, count, meta.tipo);
    makeGeoRank(data);
  }catch(err){
    $('infoBox').innerHTML = `Erro ao carregar camada: ${paths[key]}<br><br>${err.message}`;
    $('rankBox').innerHTML = '';
    updateKpis(meta.label, 0, meta.tipo);
  }
}

function makeGeoRank(data){
  const props = (data.features || []).map(f => f.properties || {});
  const names = props.map(p => getProp(p, ['GERENCIA','Gerencia','GERÊNCIA','BAIRRO','Bairro','NM_BAIRRO','NOME','Nome'])).filter(Boolean);
  const html = names.slice(0, 12).map(n => `
    <div class="rankItem">
      <div><b>${n}</b><small>Feição territorial carregada</small></div>
      <span class="pill">GIS</span>
    </div>
  `).join('');
  $('rankBox').innerHTML = html || '<div class="infoBox">Camada carregada sem campo de nome identificado.</div>';
}

function parseCSV(text){
  const lines = text.replace(/\r/g,'').split('\n').filter(l => l.trim() !== '');
  if(!lines.length) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^\uFEFF/, ''));
  return lines.slice(1).map(line => {
    const values = [];
    let current = '', inside = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"'){ inside = !inside; continue; }
      if(ch === sep && !inside){ values.push(current); current = ''; }
      else current += ch;
    }
    values.push(current);
    const row = {};
    headers.forEach((h,i) => row[h] = (values[i] || '').trim());
    return row;
  });
}

async function loadUnits(){
  clearLayer();
  setActiveButton('unidades');
  $('filtrosUnidades').style.display = 'grid';
  $('infoBox').innerHTML = layerMeta.unidades.info;
  $('rankBox').innerHTML = 'Carregando unidades...';

  try{
    const res = await fetch(paths.unidades);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    unidades = parseCSV(text).filter(d => d.lat && d.lon && !isNaN(Number(d.lat)) && !isNaN(Number(d.lon)));

    fillFilters();
    renderUnits(unidades);
    updateKpis('Unidades COMLURB', unidades.length, 'Ponto');
  }catch(err){
    $('infoBox').innerHTML = `Erro ao carregar unidades: ${paths.unidades}<br><br>${err.message}`;
    $('rankBox').innerHTML = '';
    updateKpis('Unidades COMLURB', 0, 'Ponto');
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

function renderUnits(rows){
  if(unitLayer) map.removeLayer(unitLayer);

  unitLayer = L.layerGroup();
  rows.forEach(d => {
    const lat = Number(String(d.lat).replace(',', '.'));
    const lon = Number(String(d.lon).replace(',', '.'));
    const marker = L.circleMarker([lat, lon], {
      radius: 6,
      color: '#06111f',
      weight: 1.2,
      fillColor: colorByCategory(d.categoria),
      fillOpacity: .9
    }).bindPopup(unitPopup(d));
    marker.addTo(unitLayer);
  });
  unitLayer.addTo(map);

  if(rows.length){
    const bounds = L.latLngBounds(rows.map(d => [Number(String(d.lat).replace(',', '.')), Number(String(d.lon).replace(',', '.'))]));
    map.fitBounds(bounds, { padding:[30,30] });
  }

  updateKpis('Unidades COMLURB', rows.length, 'Ponto');
  makeUnitsRank(rows);
}

function applyUnitFilters(){
  const cat = $('fCategoria').value;
  const dir = $('fDiretoria').value;
  const bairro = $('fBairro').value;
  const busca = $('fBusca').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const rows = unidades.filter(d => {
    const hay = `${d.nome} ${d.categoria} ${d.diretoria} ${d.bairro} ${d.endereco} ${d.tipo}`
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return (!cat || d.categoria === cat)
      && (!dir || d.diretoria === dir)
      && (!bairro || d.bairro === bairro)
      && (!busca || hay.includes(busca));
  });

  renderUnits(rows);
}

function makeUnitsRank(rows){
  const byCat = {};
  rows.forEach(d => {
    const k = d.categoria || 'Sem categoria';
    byCat[k] = (byCat[k] || 0) + 1;
  });

  const html = Object.entries(byCat)
    .sort((a,b) => b[1] - a[1])
    .map(([k,v]) => `
      <div class="rankItem">
        <div><b>${escapeHtml(k)}</b><small>Categoria HUB</small></div>
        <span class="pill">${v.toLocaleString('pt-BR')}</span>
      </div>
    `).join('');

  $('rankBox').innerHTML = html || '<div class="infoBox">Nenhuma unidade encontrada para o filtro selecionado.</div>';
}

function loadLayer(key){
  if(key === 'unidades') return loadUnits();
  return loadGeojson(key);
}

loadLayer('dsu');
