const FILES = {
  dsu: {
    label: "Gerências DSU",
    file: "data/GERENCIAS_DSU.geojson",
    color: "#5b9bd5",
    fill: "#5b9bd5"
  },
  dlu: {
    label: "DLU | Novos Bairros 2025",
    file: "data/DLU_Novos_Bairros_estrutura2025.geojson",
    color: "#e87535",
    fill: "#e87535"
  }
};

let map;
let activeLayer;

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([-22.93, -43.35], 11);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 20
  }).addTo(map);

  loadLayer("dsu");
}

function loadLayer(layerKey) {
  const cfg = FILES[layerKey];

  document.querySelectorAll(".layerBtn").forEach(btn => btn.classList.remove("active"));
  document.getElementById(layerKey === "dsu" ? "btnDSU" : "btnDLU")?.classList.add("active");

  if (activeLayer) map.removeLayer(activeLayer);

  fetch(cfg.file)
    .then(r => r.json())
    .then(geojson => {
      activeLayer = L.geoJSON(geojson, {
        style: {
          color: cfg.color,
          weight: 1.6,
          fillColor: cfg.fill,
          fillOpacity: 0.13,
          opacity: 0.9
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const nome =
            p.gerencia || p.GERENCIA || p.GERÊNCIA ||
            p.nome || p.NOME || p.Name || "Área operacional";

          layer.bindPopup(`
            <div style="min-width:220px;line-height:1.45">
              <h3 style="margin:0 0 8px;color:#4b86bd">${nome}</h3>
              ${Object.entries(p).slice(0,8).map(([k,v]) => `<b>${k}:</b> ${v}<br>`).join("")}
            </div>
          `);
        }
      }).addTo(map);

      const bounds = activeLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding:[28,28] });

      document.getElementById("kpiCamada").textContent = cfg.label;
      document.getElementById("kpiFeicoes").textContent = (geojson.features || []).length.toLocaleString("pt-BR");
      document.getElementById("kpiTipo").textContent = geojson.features?.[0]?.geometry?.type || "-";

      document.getElementById("infoBox").innerHTML = `
        <b>${cfg.label}</b><br>
        Camada territorial carregada. Clique em uma área para ver os atributos.
      `;

      renderRanking(geojson);
    });
}

function renderRanking(geojson) {
  const features = geojson.features || [];
  const campo = Object.keys(features[0]?.properties || {}).find(k =>
    ["gerencia","GERENCIA","GERÊNCIA","nome","NOME","bairro","BAIRRO"].includes(k)
  );

  const grupos = new Map();
  features.forEach(f => {
    const nome = f.properties?.[campo] || "Não informado";
    grupos.set(nome, (grupos.get(nome) || 0) + 1);
  });

  document.getElementById("rankBox").innerHTML = [...grupos.entries()]
    .sort((a,b) => b[1]-a[1])
    .slice(0,6)
    .map(([nome,qtd]) => `
      <div class="rankItem">
        <div><b>${nome}</b><small>${campo || "atributo"}</small></div>
        <span class="pill">${qtd}</span>
      </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", initMap);
