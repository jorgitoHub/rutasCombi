const map = L.map('map').setView([-16.3989, -71.5350], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'OpenStreetMap Arequipa',
  maxZoom: 18
}).addTo(map);

L.polyline([
  [-16.3980, -71.5370],
  [-16.3950, -71.5400]
], {color: 'red'}).addTo(map);
L.polyline([
  [-16.3820, -71.5500],
  [-16.3800, -71.5550]
], {color: 'purple'}).addTo(map);

    async function geocodificar(direccion) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Arequipa, Perú')}`);
  const data = await res.json();
  if (data.length === 0) throw new Error("No se encontró dirección: " + direccion);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function consultarRuta() {
  const origen = document.getElementById('origen').value;
  const destino = document.getElementById('destino').value;

  const res = await fetch('http://localhost:3000/api/ruta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origen, destino })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.mensaje);

  // Mostrar resultado en texto
  document.getElementById('resultado').innerHTML =
    data.ruta.map(r => `<p>${r.linea}: ${r.desde} ➝ ${r.hasta}</p>`).join('');

  // Limpiar el mapa
  layerGroup.clearLayers();

  // Geocodificar todos los puntos
  let puntos = [];
  for (const tramo of data.ruta) {
    const coordDesde = await geocodificar(tramo.desde);
    const coordHasta = await geocodificar(tramo.hasta);

    puntos.push(coordDesde);
    puntos.push(coordHasta);

    // Marcadores de inicio/fin
    L.marker(coordDesde).addTo(layerGroup).bindPopup("Inicio: " + tramo.desde);
    L.marker(coordHasta).addTo(layerGroup).bindPopup("Fin: " + tramo.hasta);
  }

  // Eliminar duplicados de coordenadas
  puntos = puntos.filter((p, i, arr) =>
    i === arr.findIndex(q => q[0] === p[0] && q[1] === p[1])
  );

  // Dibujar la polilínea
  const polyline = L.polyline(puntos, { color: 'blue', weight: 5 }).addTo(layerGroup);

  // Ajustar el mapa a la ruta
  map.fitBounds(polyline.getBounds());
}
