// Ensure mapToken and coordinates are valid
if (!mapToken) {
  console.error("Mapbox token is missing!");
}

let lngLat = [77.4126, 23.2699]; // default fallback coordinates
try {
  if (Array.isArray(coordinates) && coordinates.length === 2) {
    lngLat = coordinates;
  } else {
    console.warn("Invalid coordinates, using default:", lngLat);
  }
} catch (err) {
  console.error("Error parsing coordinates:", err);
}

// Initialize Mapbox map
mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: coordinates,
  zoom: 9,
});

const el = document.createElement('img');
el.src = 'https://cdn-icons-png.flaticon.com/512/684/684908.png'; // your marker icon
el.style.width = '40px';
el.style.height = '40px';

new mapboxgl.Marker(el)
  .setLngLat(coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 })
      .setHTML(`<p>You'll be living here!</p><h5>${place}</h5>`)
  )
  .addTo(map);
