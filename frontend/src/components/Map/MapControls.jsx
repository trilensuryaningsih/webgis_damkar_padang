import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const locateIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3"></circle>
    <circle cx="12" cy="12" r="7"></circle>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
  </svg>
`;

const MapControls = ({ onLocate, locating }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: "bottomright" });

    control.onAdd = () => {
      const container = L.DomUtil.create(
        "div",
        "leaflet-bar custom-map-controls",
      );
      container.innerHTML = `
        <button type="button" data-action="zoom-in" aria-label="Perbesar peta" title="Perbesar">+</button>
        <button type="button" data-action="zoom-out" aria-label="Perkecil peta" title="Perkecil">&minus;</button>
        <button type="button" data-action="locate" aria-label="Temukan lokasi saya" title="Lokasi saya">
          ${locateIcon}
        </button>
      `;

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);

      container.addEventListener("click", (event) => {
        const action = event.target.closest("button")?.dataset.action;
        if (action === "zoom-in") map.zoomIn();
        if (action === "zoom-out") map.zoomOut();
        if (action === "locate") onLocate();
      });

      return container;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map, onLocate]);

  useEffect(() => {
    const locateButton = map
      .getContainer()
      .querySelector('.custom-map-controls [data-action="locate"]');
    if (!locateButton) return;
    locateButton.disabled = locating;
    locateButton.classList.toggle("is-loading", locating);
  }, [locating, map]);

  return null;
};

export default MapControls;
