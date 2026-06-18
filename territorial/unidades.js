const DATA_URL = "data/unidades_comlurb.csv";

const state = {
  all: [],
  filtered: [],
  markers: [],
  markerById: new Map()
};

const colors = {
  "Operacional":"#5b9bd5",
  "Administrativo":"#78aaa3",
  "Apoio":"#d7b35f",
  "Manutenção":"#e87535",
  "Engenharia":"#9b86d9",
  "Gestão de Pessoas":"#f2a7c8",
  "Financeiro":"#79c37a",
  "Jurídico":"#d66b6b",
  "Tecnologia":"#5fd0d5",
  "Presidência":"#ffffff"
};

const map = L.map("map", {
  zoomControl: true,
  preferCanvas: true
}).setView([-22.9068, -43.1729], 11);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; OpenStreetMap &copy; CARTO",
  maxZoom: 20
}).addTo(map);

const layerUnidades = L.layerGroup().addTo(map);

const camadasGeojson = {
  "Bairros": L.layerGroup().addTo(map),
  "Gerências DSU": L.layerGroup().addTo(map),
  "Logradouros": L.layerGroup()
};

async function addGeojsonLayer(url, layer, options = {}){
  try{
    const r = await fetch(url);
    if(!r.ok) return;
    const geo = await r.json();
    L.geoJSON(geo, {
      style: options.style || {color:"#5b9bd5", weight:1, fillOpacity:.04},
      pointToLayer: options.pointToLayer || ((feature, latlng)=>L.circleMarker(latlng,{radius:3, color:"#78aaa3", weight:1, fillOpacity:.55})),
      onEachFeature: (feature, lyr) => {
        const p = feature.properties || {};
        const nome = p.NOME || p.nome || p.BAIRRO || p.bairro || p.GERENCIA || p.gerencia || p.Name || p.name || "Camada territorial";
        lyr.bindPopup(`<b>${escapeHtml(nome)}</b>`);
      }
    }).addTo(layer);
  }catch(e){
    console.warn("Camada GEO não carregada:", url);
  }
}

addGeojsonLayer("../assets/geojson/DLU_Novos_Bairros_estrutura2025.geojson", camadasGeojson["Bairros"], {style:{color:"#5b9bd5", weight:1, fillOpacity:.035}});
addGeojsonLayer("../assets/geojson/GERENCIAS_DSU.geojson", camadasGeojson["Gerências DSU"], {style:{color:"#e87535", weight:1.5, fillOpacity:.025}});
addGeojsonLayer("../assets/geojson/logradouros_rj_pontos.geojson", camadasGeojson["Logradouros"], {
  pointToLayer:(feature, latlng)=>L.circleMarker(latlng,{radius:2.5, color:"#b8c9de", weight:.5, fillOpacity:.35})
});

L.control.layers(null, {
  "Unidades COMLURB": layerUnidades,
  "Bairros": camadasGeojson["Bairros"],
  "Gerências DSU": camadasGeojson["Gerências DSU"],
  "Logradouros": camadasGeojson["Logradouros"]
}, {collapsed:true}).addTo(map);

function norm(v){
  return (v ?? "").toString().trim();
}

function num(v){
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function unique(arr){
  return [...new Set(arr.map(norm).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}

function fillSelect(id, values){
  const el = document.getElementById(id);
  const selected = el.value;
  const first = el.querySelector("option")?.textContent || "Todas";
  el.innerHTML = `<option value="">${first}</option>` + values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if (values.includes(selected)) el.value = selected;
}

function escapeHtml(str){
  return norm(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function loadData(){
  Papa.parse(DATA_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      state.all = res.data
        .map((d,i)=>({
          ...d,
          id: norm(d.id) || String(i+1),
          latitude: num(d.latitude),
          longitude: num(d.longitude),
          categoria_hub: norm(d.categoria_hub) || "Não classificado",
          diretoria: norm(d.diretoria) || "Não informado",
          tipo: norm(d.tipo) || "Não informado",
          bairro: norm(d.bairro) || "Não informado"
        }))
        .filter(d => d.latitude && d.longitude);

      setupFilters();
      applyFilters();
    },
    error: () => {
      alert("Não foi possível carregar a base territorial/data/unidades_comlurb.csv");
    }
  });
}

function setupFilters(){
  fillSelect("fCategoria", unique(state.all.map(d=>d.categoria_hub)));
  fillSelect("fDiretoria", unique(state.all.map(d=>d.diretoria)));
  fillSelect("fTipo", unique(state.all.map(d=>d.tipo)));
  fillSelect("fBairro", unique(state.all.map(d=>d.bairro)));

  ["fCategoria","fDiretoria","fTipo","fBairro","fBusca"].forEach(id=>{
    document.getElementById(id).addEventListener(id === "fBusca" ? "input" : "change", applyFilters);
  });
}

function applyFilters(){
  const cat = document.getElementById("fCategoria").value;
  const dir = document.getElementById("fDiretoria").value;
  const tipo = document.getElementById("fTipo").value;
  const bairro = document.getElementById("fBairro").value;
  const busca = norm(document.getElementById("fBusca").value).toLowerCase();

  state.filtered = state.all.filter(d => {
    if (cat && d.categoria_hub !== cat) return false;
    if (dir && d.diretoria !== dir) return false;
    if (tipo && d.tipo !== tipo) return false;
    if (bairro && d.bairro !== bairro) return false;
    if (busca) {
      const hay = [
        d.setor, d.nome_setor, d.endereco, d.bairro, d.diretoria,
        d.categoria_hub, d.subcategoria_geo
      ].map(norm).join(" ").toLowerCase();
      if (!hay.includes(busca)) return false;
    }
    return true;
  });

  renderMap();
  renderKpis();
  renderRankings();
  renderList();
}

function renderMap(){
  layerUnidades.clearLayers();
  state.markerById.clear();

  const bounds = [];
  state.filtered.forEach(d => {
    const color = colors[d.categoria_hub] || "#5b9bd5";
    const marker = L.circleMarker([d.latitude, d.longitude], {
      radius: 7,
      color,
      fillColor: color,
      weight: 1.3,
      opacity: .95,
      fillOpacity: .82
    });

    marker.bindPopup(popupHtml(d), {maxWidth: 320});
    marker.addTo(layerUnidades);
    state.markerById.set(String(d.id), marker);
    bounds.push([d.latitude, d.longitude]);
  });

  if (bounds.length) {
    map.fitBounds(bounds, {padding:[30,30], maxZoom: 13});
  }
}

function popupHtml(d){
  const street = norm(d.street_view);
  const rota = norm(d.como_chegar);
  return `
    <div class="popupTitle">${escapeHtml(d.nome_setor || d.setor)}</div>
    <div class="popupMeta">
      <b>Setor:</b> ${escapeHtml(d.setor)}<br>
      <b>Categoria:</b> ${escapeHtml(d.categoria_hub)}<br>
      <b>Diretoria:</b> ${escapeHtml(d.diretoria)}<br>
      <b>Tipo:</b> ${escapeHtml(d.tipo)}<br>
      <b>Bairro:</b> ${escapeHtml(d.bairro)}<br>
      <b>Endereço:</b> ${escapeHtml(d.endereco)}
    </div>
    <div class="popupActions">
      ${street ? `<a href="${escapeHtml(street)}" target="_blank" rel="noopener">Street View</a>` : ""}
      ${rota ? `<a href="${escapeHtml(rota)}" target="_blank" rel="noopener">Como chegar</a>` : ""}
    </div>
  `;
}

function renderKpis(){
  document.getElementById("kTotal").textContent = state.filtered.length.toLocaleString("pt-BR");
  document.getElementById("kOperacional").textContent = state.filtered.filter(d=>d.categoria_hub==="Operacional").length.toLocaleString("pt-BR");
  document.getElementById("kDiretorias").textContent = unique(state.filtered.map(d=>d.diretoria)).length.toLocaleString("pt-BR");
  document.getElementById("kBairros").textContent = unique(state.filtered.map(d=>d.bairro)).length.toLocaleString("pt-BR");
}

function countsBy(key){
  const obj = {};
  state.filtered.forEach(d => {
    const k = norm(d[key]) || "Não informado";
    obj[k] = (obj[k] || 0) + 1;
  });
  return Object.entries(obj).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],"pt-BR"));
}

function renderRanking(id, data, limit=8){
  const max = data[0]?.[1] || 1;
  document.getElementById(id).innerHTML = data.slice(0,limit).map(([name,val])=>`
    <div class="rankRow">
      <div class="rankName" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
      <div class="rankVal">${val}</div>
      <div class="bar"><i style="width:${Math.max(4, val/max*100)}%"></i></div>
    </div>
  `).join("") || `<div class="rankRow"><div class="rankName">Sem registros</div><div class="rankVal">0</div></div>`;
}

function renderRankings(){
  renderRanking("rankingCategoria", countsBy("categoria_hub"));
  renderRanking("rankingDiretoria", countsBy("diretoria"));
}

function renderList(){
  const el = document.getElementById("listaUnidades");
  el.innerHTML = state.filtered.slice(0,80).map(d=>`
    <div class="unitItem" data-id="${escapeHtml(d.id)}">
      <b>${escapeHtml(d.nome_setor || d.setor)}</b>
      <span>${escapeHtml(d.categoria_hub)} • ${escapeHtml(d.diretoria)} • ${escapeHtml(d.bairro)}</span>
    </div>
  `).join("");

  el.querySelectorAll(".unitItem").forEach(item=>{
    item.addEventListener("click", () => {
      const marker = state.markerById.get(item.dataset.id);
      const d = state.filtered.find(x => String(x.id) === String(item.dataset.id));
      if (marker && d) {
        map.setView([d.latitude, d.longitude], 15);
        marker.openPopup();
      }
    });
  });
}

loadData();
