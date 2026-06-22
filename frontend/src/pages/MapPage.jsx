import { useState, useEffect, useCallback, useRef } from "react";
import PadangMap from "../components/Map/MapContainer";
import Sidebar from "../components/Sidebar/Sidebar";
import {
  IconCar,
  IconMap,
  IconMotorcycle,
  IconWalk,
} from "../components/Icons";
import { getStats } from "../services/api";

// Hapus awalan "Prioritas X - " dari nama rekomendasi
const stripPrioritas = (nama) => {
  if (!nama) return nama;
  return nama.replace(/^Prioritas\s*\d+\s*[-–]\s*/i, "").trim();
};

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS tidak didukung oleh browser ini."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });
  });

const formatTravelTime = (minutes) => {
  const roundedMinutes = Math.max(1, Math.round(minutes));
  if (roundedMinutes < 60) return `${roundedMinutes} menit`;

  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  return remainingMinutes
    ? `${hours} jam ${remainingMinutes} menit`
    : `${hours} jam`;
};

const getRoutePoint = (feature, type) => {
  const [lng, lat] = feature.geometry.coordinates;
  const properties = feature.properties;
  const label =
    type === "damkar"
      ? `Pos ${properties.no_pos} ${properties.nama_lokasi || ""}`.trim()
      : stripPrioritas(properties.nama) || `Rekomendasi ${properties.pos_ke || properties.id}`;

  return {
    key: `${type}:${properties.id}`,
    type,
    id: properties.id,
    lat,
    lng,
    label,
  };
};

const MapPage = ({ refresh, theme }) => {
  const [layers, setLayers] = useState({
    damkar: true,
    blankspot: true,
    rekomendasi: true,
    jalan: false,
  });
  const [radius, setRadius] = useState(3000);
  const [selectedPos, setSelectedPos] = useState(null); // legacy SearchBox compatibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  // Two-way interaction state
  const [selectedDamkarId, setSelectedDamkarId] = useState(null);
  const [selectedDamkarCoords, setSelectedDamkarCoords] = useState(null);
  const [routeDamkar, setRouteDamkar] = useState(null);
  const [selectedRekomendasiId, setSelectedRekomendasiId] = useState(null);
  const [selectedRekomendasiCoords, setSelectedRekomendasiCoords] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeMode, setRouteMode] = useState(null);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeLabel, setRouteLabel] = useState("");
  const [navigationStatus, setNavigationStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [routing, setRouting] = useState(false);
  const routeAbortController = useRef(null);

  useEffect(() => {
    getStats(radius)
      .then((res) => setLiveStats(res.data))
      .catch(() => setLiveStats(null));
  }, [refresh, radius]);

  useEffect(() => {
    if (!navigationStatus) return undefined;

    const timeout = setTimeout(() => {
      setNavigationStatus("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigationStatus]);

  const toggleLayer = (key) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // Legacy: SearchBox selects a pos by coordinates
  const handleSelectPos = (pos) => {
    setSelectedPos(pos);
    if (pos && !layers.damkar) setLayers((prev) => ({ ...prev, damkar: true }));
  };

  // Sidebar → Map: User clicks a Damkar item in the list
  const handleDamkarSelect = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.properties.id;
    setSelectedDamkarId(id);
    setSelectedDamkarCoords({ lat, lng });
    setRouteDamkar({
      id,
      lat,
      lng,
      nama: feature.properties.nama_lokasi,
      noPos: feature.properties.no_pos,
    });
    setSelectedRekomendasiId(null); // deselect rekomendasi
    setRoute(null);
    setRouteMode(null);
    if (!layers.damkar) setLayers((prev) => ({ ...prev, damkar: true }));
  }, [layers.damkar]);

  // Map → Sidebar: User clicks a Damkar marker on the map
  const handleDamkarMarkerClick = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.properties.id;
    setSelectedDamkarId(id);
    setSelectedDamkarCoords({ lat, lng });
    setRouteDamkar({
      id,
      lat,
      lng,
      nama: feature.properties.nama_lokasi,
      noPos: feature.properties.no_pos,
    });
    setSelectedRekomendasiId(null);
    setRoute(null);
    setRouteMode(null);
  }, []);

  // Sidebar → Map: User clicks a Rekomendasi item in the list
  const handleRekomendasiSelect = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.properties.id;
    setSelectedRekomendasiId(id);
    setSelectedRekomendasiCoords({ lat, lng });
    setRoute(null);
    setRouteMode(null);
    setSelectedDamkarId(null); // deselect damkar
    if (!layers.rekomendasi) setLayers((prev) => ({ ...prev, rekomendasi: true }));
  }, [layers.rekomendasi]);

  // Map → Sidebar: User clicks a Rekomendasi marker on the map
  const handleRekomendasiMarkerClick = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const id = feature.properties.id;
    setSelectedRekomendasiId(id);
    setSelectedRekomendasiCoords({ lat, lng });
    setRoute(null);
    setRouteMode(null);
    setSelectedDamkarId(null);
  }, []);

  const requestUserLocation = useCallback(async () => {
    setLocating(true);
    setNavigationStatus("Mencari lokasi GPS...");
    try {
      const position = await getCurrentPosition();
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      setUserLocation(location);
      setRoute(null);
      setRouteMode(null);
      setNavigationStatus("Lokasi Anda berhasil ditemukan.");
      return location;
    } catch (error) {
      const denied = error?.code === 1;
      setNavigationStatus(
        denied
          ? "Izin lokasi ditolak. Aktifkan izin GPS pada browser."
          : error?.message || "Lokasi GPS tidak dapat ditemukan.",
      );
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  const fetchShortestRoute = useCallback(async (origin, destination) => {
    routeAbortController.current?.abort();
    const controller = new AbortController();
    routeAbortController.current = controller;
    setRouting(true);
    setNavigationStatus("Mencari rute terpendek...");
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${origin.lng},${origin.lat};` +
        `${destination.lng},${destination.lat}` +
        "?overview=full&geometries=geojson&steps=false&alternatives=3";
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Layanan rute tidak merespons.");

      const result = await response.json();
      const shortestRoute = result.routes
        ?.filter((candidate) => Number.isFinite(candidate.distance))
        .sort((a, b) => a.distance - b.distance)[0];
      if (!shortestRoute) throw new Error("Rute jalan tidak ditemukan.");

      setRoute(shortestRoute);
      return shortestRoute;
    } catch (error) {
      if (error.name === "AbortError") return null;
      setRoute(null);
      setRouteMode(null);
      setNavigationStatus(error.message || "Rute gagal dihitung.");
      return null;
    } finally {
      if (routeAbortController.current === controller) {
        routeAbortController.current = null;
        setRouting(false);
      }
    }
  }, []);

  const handleDamkarRouteRequest = useCallback(async (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const damkar = {
      id: feature.properties.id,
      lat,
      lng,
      nama: feature.properties.nama_lokasi,
      noPos: feature.properties.no_pos,
    };
    setRouteDamkar(damkar);
    setSelectedDamkarId(damkar.id);
    setSelectedDamkarCoords({ lat, lng });

    const origin = userLocation || (await requestUserLocation());
    if (!origin) return;

    const result = await fetchShortestRoute(origin, damkar);
    if (result) {
      setRouteMode("gps-to-damkar");
      setRouteLabel(`Lokasi Saya ke ${damkar.nama || `Pos ${damkar.noPos}`}`);
      setNavigationStatus("Rute GPS ke pos damkar berhasil ditampilkan.");
    }
  }, [fetchShortestRoute, requestUserLocation, userLocation]);

  const handleRekomendasiRouteRequest = useCallback(async (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const destination = { lat, lng };
    setSelectedRekomendasiId(feature.properties.id);
    setSelectedRekomendasiCoords(destination);
    setSelectedDamkarId(null);

    const origin = userLocation || (await requestUserLocation());
    if (!origin) return;

    const result = await fetchShortestRoute(origin, destination);
    if (result) {
      setRouteMode("gps-to-rekomendasi");
      setRouteLabel(
        `Lokasi Saya ke ${
          stripPrioritas(feature.properties.nama) ||
          `Rekomendasi ${feature.properties.pos_ke || feature.properties.id}`
        }`,
      );
      setNavigationStatus(
        "Rute GPS ke lokasi rekomendasi berhasil ditampilkan.",
      );
    }
  }, [fetchShortestRoute, requestUserLocation, userLocation]);

  const handleSetRouteOrigin = useCallback((feature, type) => {
    const origin = getRoutePoint(feature, type);
    if (routeOrigin?.key === origin.key) {
      setRouteOrigin(null);
      setRoute(null);
      setRouteMode(null);
      setRouteLabel("");
      setNavigationStatus("Titik awal dibatalkan.");
      return;
    }

    setRouteOrigin(origin);
    setRoute(null);
    setRouteMode(null);
    setRouteLabel("");
    setNavigationStatus(
      `${origin.label} menjadi titik awal. Klik marker lain untuk membuat rute.`,
    );
  }, [routeOrigin]);

  const handlePointClick = useCallback(async (feature, type) => {
    if (!routeOrigin) return;

    const destination = getRoutePoint(feature, type);
    if (destination.key === routeOrigin.key) {
      setNavigationStatus("Titik ini sudah menjadi titik awal.");
      return;
    }

    const result = await fetchShortestRoute(routeOrigin, destination);
    if (result) {
      setRouteMode("point-to-point");
      setRouteLabel(`${routeOrigin.label} ke ${destination.label}`);
      setNavigationStatus("Rute antar titik berhasil ditampilkan.");
    }
  }, [fetchShortestRoute, routeOrigin]);

  const routeDistanceKm = route ? route.distance / 1000 : 0;
  const travelEstimates = route
    ? (() => {
        const osrmBaseMinutes = route.duration / 60;
        return {
          walk: (routeDistanceKm / 5) * 60,
          motorcycle: osrmBaseMinutes * 0.8,
          car: osrmBaseMinutes * 1.35,
        };
      })()
    : null;

  const cancelRoute = useCallback(() => {
    routeAbortController.current?.abort();
    routeAbortController.current = null;
    setRouting(false);
    setRoute(null);
    setRouteMode(null);
    setRouteLabel("");
    setNavigationStatus("Rute dibatalkan.");
  }, []);

  const cancelPointToPointMode = useCallback(() => {
    routeAbortController.current?.abort();
    routeAbortController.current = null;
    setRouting(false);
    setRouteOrigin(null);
    setRoute(null);
    setRouteMode(null);
    setRouteLabel("");
    setNavigationStatus("Mode rute antar titik dibatalkan.");
  }, []);

  return (
    <div className="map-page-container">
      <Sidebar
        layers={layers}
        onToggle={toggleLayer}
        radius={radius}
        onRadiusChange={setRadius}
        onSelectPos={handleSelectPos}
        refresh={refresh}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        // Two-way props
        selectedDamkarId={selectedDamkarId}
        onDamkarSelect={handleDamkarSelect}
        selectedRekomendasiId={selectedRekomendasiId}
        onRekomendasiSelect={handleRekomendasiSelect}
      />
      <div
        style={{
          flex: 1,
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{ flex: 1, position: "relative", height: "calc(100% - 32px)" }}
        >
          <PadangMap
            layers={layers}
            radius={radius}
            selectedPos={selectedPos}
            refresh={refresh}
            theme={theme}
            // Two-way props
            selectedDamkarId={selectedDamkarId}
            selectedDamkarCoords={selectedDamkarCoords}
            onDamkarMarkerClick={handleDamkarMarkerClick}
            routeDamkarId={routeDamkar?.id}
            onDamkarRouteRequest={handleDamkarRouteRequest}
            selectedRekomendasiId={selectedRekomendasiId}
            selectedRekomendasiCoords={selectedRekomendasiCoords}
            onRekomendasiMarkerClick={handleRekomendasiMarkerClick}
            userLocation={userLocation}
            route={route}
            onLocate={requestUserLocation}
            locating={locating}
            onRekomendasiRouteRequest={handleRekomendasiRouteRequest}
            onRouteCancel={cancelRoute}
            routing={routing}
            routeMode={routeMode}
            routeOriginKey={routeOrigin?.key}
            onSetRouteOrigin={handleSetRouteOrigin}
            onPointClick={handlePointClick}
          />
          {navigationStatus && (
            <div className="navigation-toast" role="status">
              {navigationStatus}
            </div>
          )}
          {routeOrigin && (
            <div className="route-origin-control">
              <span>
                Titik awal: <strong>{routeOrigin.label}</strong>
              </span>
              <button type="button" onClick={cancelPointToPointMode}>
                Batalkan Semua
              </button>
            </div>
          )}
          {route && (
            <div className="route-info-card">
              <div className="route-info-card__content">
                <div className="route-info-card__distance">
                  <span>
                    {routeLabel}
                  </span>
                  <strong>{routeDistanceKm.toFixed(1)} km</strong>
                </div>
                <div className="route-mode-estimates">
                  <div className="route-mode-estimate">
                    <IconWalk size={15} />
                    <span>Jalan kaki</span>
                    <strong>{formatTravelTime(travelEstimates.walk)}</strong>
                  </div>
                  <div className="route-mode-estimate">
                    <IconMotorcycle size={15} />
                    <span>Motor</span>
                    <strong>
                      {formatTravelTime(travelEstimates.motorcycle)}
                    </strong>
                  </div>
                  <div className="route-mode-estimate">
                    <IconCar size={15} />
                    <span>Mobil</span>
                    <strong>{formatTravelTime(travelEstimates.car)}</strong>
                  </div>
                </div>
                <span className="route-estimate-note">
                  Rute jalan terpendek untuk perjalanan yang dipilih. Estimasi
                  bukan data kemacetan real-time.
                </span>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <button
              className="sidebar-toggle-fab"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka Panel Kontrol"
            >
              <IconMap size={18} />
              <span>Filter &amp; Info</span>
            </button>
          )}
        </div>

        <div className="map-status-bar">
          <div className="status-item">
            <span className="status-indicator"></span>
            <span>Sistem Aktif</span>
          </div>
          <div className="status-separator"></div>
          <div className="status-item">
            <span>
              {liveStats ? `${liveStats.jumlah_pos} Pos Damkar` : "— Pos"}
            </span>
          </div>
          <div className="status-separator"></div>
          <div className="status-item">
            <span>Radius: {(radius / 1000).toFixed(1)} km</span>
          </div>
          {liveStats && (
            <>
              <div className="status-separator"></div>
              <div className="status-item">
                <span style={{ color: "var(--success)" }}>
                  Terlayani:{" "}
                  {(
                    Number(liveStats.persen_terlayani) ||
                    100 - Number(liveStats.persen_blankspot)
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="status-separator"></div>
              <div className="status-item">
                <span style={{ color: "var(--primary)" }}>
                  Blank Spot: {Number(liveStats.persen_blankspot).toFixed(1)}%
                </span>
              </div>
            </>
          )}
          <div
            className="nav-text-desktop"
            style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.5 }}
          >
            <span>© CARTO · OpenStreetMap contributors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
