import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import DamkarMarkers from "./DamkarMarkers";
import CoverageLayer from "./CoverageLayer";
import BlankSpotLayer from "./BlankSpotLayer";
import RekomendasiMarkers from "./RekomendasiMarkers";
import JalanLayer from "./JalanLayer";
import NavigationLayer from "./NavigationLayer";
import MapControls from "./MapControls";

// Handle auto zoom on SearchBox selection (legacy)
const ChangeView = ({ selectedPos }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedPos) {
      map.flyTo([selectedPos.lat, selectedPos.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedPos, map]);
  return null;
};

// Handle flyTo for Damkar or Rekomendasi selection from sidebar
const FlyToHandler = ({ damkarCoords, rekomendasiCoords }) => {
  const map = useMap();
  const prevDamkar = useRef(null);
  const prevRekomendasi = useRef(null);

  useEffect(() => {
    if (
      damkarCoords &&
      (prevDamkar.current?.lat !== damkarCoords.lat ||
        prevDamkar.current?.lng !== damkarCoords.lng)
    ) {
      prevDamkar.current = damkarCoords;
      map.flyTo([damkarCoords.lat, damkarCoords.lng], 15, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [damkarCoords, map]);

  useEffect(() => {
    if (
      rekomendasiCoords &&
      (prevRekomendasi.current?.lat !== rekomendasiCoords.lat ||
        prevRekomendasi.current?.lng !== rekomendasiCoords.lng)
    ) {
      prevRekomendasi.current = rekomendasiCoords;
      map.flyTo([rekomendasiCoords.lat, rekomendasiCoords.lng], 14, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [rekomendasiCoords, map]);

  return null;
};

const PadangMap = ({
  layers,
  radius,
  selectedPos,
  refresh,
  theme,
  selectedDamkarId,
  selectedDamkarCoords,
  onDamkarMarkerClick,
  routeDamkarId,
  onDamkarRouteRequest,
  selectedRekomendasiId,
  selectedRekomendasiCoords,
  onRekomendasiMarkerClick,
  userLocation,
  route,
  onLocate,
  locating,
  onRekomendasiRouteRequest,
  onRouteCancel,
  routing,
  routeMode,
  routeOriginKey,
  onSetRouteOrigin,
  onPointClick,
}) => {
  const center = [-0.9492, 100.3543];

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={center}
        zoom={12}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={theme === "light" ? "light-map" : "dark-map"}
          url={
            theme === "light"
              ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {layers.jalan && <JalanLayer />}
        {layers.damkar && <CoverageLayer radius={radius} />}
        {layers.blankspot && <BlankSpotLayer radius={radius} />}
        {layers.damkar && (
          <DamkarMarkers
            selectedDamkarId={selectedDamkarId}
            routeDamkarId={routeDamkarId}
            onMarkerClick={onDamkarMarkerClick}
            onRouteRequest={onDamkarRouteRequest}
            onRouteCancel={onRouteCancel}
            routing={routing}
            routeActive={routeMode === "gps-to-damkar"}
            routeOriginKey={routeOriginKey}
            onSetRouteOrigin={onSetRouteOrigin}
            onPointClick={onPointClick}
            refresh={refresh}
            radius={radius}
          />
        )}
        {layers.rekomendasi && (
          <RekomendasiMarkers
            refresh={refresh}
            radius={radius}
            selectedRekomendasiId={selectedRekomendasiId}
            onMarkerClick={onRekomendasiMarkerClick}
            onRouteRequest={onRekomendasiRouteRequest}
            onRouteCancel={onRouteCancel}
            routing={routing}
            routeActive={routeMode === "gps-to-rekomendasi"}
            routeOriginKey={routeOriginKey}
            onSetRouteOrigin={onSetRouteOrigin}
            onPointClick={onPointClick}
          />
        )}
        <NavigationLayer userLocation={userLocation} route={route} />
        <MapControls onLocate={onLocate} locating={locating} />

        {/* Legacy SearchBox flyTo */}
        <ChangeView selectedPos={selectedPos} />

        {/* Sidebar-driven flyTo */}
        <FlyToHandler
          damkarCoords={selectedDamkarCoords}
          rekomendasiCoords={selectedRekomendasiCoords}
        />
      </MapContainer>
    </div>
  );
};

export default PadangMap;
