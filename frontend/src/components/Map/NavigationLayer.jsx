import { useEffect, useMemo } from "react";
import { Circle, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div class="user-location-marker__pulse"></div>
    <div class="user-location-marker__dot"></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const NavigationLayer = ({ userLocation, route }) => {
  const map = useMap();
  const routePositions = useMemo(
    () =>
      route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [],
    [route],
  );

  useEffect(() => {
    if (routePositions.length > 1) {
      map.fitBounds(L.latLngBounds(routePositions), {
        padding: [48, 48],
        maxZoom: 15,
      });
    }
  }, [map, routePositions]);

  useEffect(() => {
    if (userLocation && routePositions.length === 0) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1,
      });
    }
  }, [map, routePositions.length, userLocation]);

  return (
    <>
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={Math.max(userLocation.accuracy || 0, 10)}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
            zIndexOffset={1200}
          >
            <Popup>
              <strong>Lokasi Anda</strong>
              <br />
              Akurasi sekitar {Math.round(userLocation.accuracy || 0)} meter
            </Popup>
          </Marker>
        </>
      )}

      {routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: "#2563eb",
            weight: 5,
            opacity: 0.9,
            dashArray: "10 9",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
    </>
  );
};

export default NavigationLayer;
