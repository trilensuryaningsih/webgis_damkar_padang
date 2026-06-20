const fs = require('fs');
const path = require('path');
const https = require('https');
const pool = require('../config/db');

const legacyCachePath = path.join(__dirname, '../config/geocoding_cache.json');
const cachePath = path.join(__dirname, '../config/geocoding_cache.data');
let cache = {};

// Load cache file on start
try {
  const sourcePath = fs.existsSync(cachePath) ? cachePath : legacyCachePath;
  if (fs.existsSync(sourcePath)) {
    cache = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  }
} catch (err) {
  console.error('Failed to load geocoding cache:', err);
}

// Function to save cache synchronously
function saveCache() {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save geocoding cache:', err);
  }
}

// KECAMATAN CENTERS FOR STATIC OFFLINE FALLBACK
const KECAMATAN_CENTERS = [
  { name: 'Koto Tangah', lat: -0.8240, lng: 100.3240, kelurahan: 'Lubuk Minturun' },
  { name: 'Padang Utara', lat: -0.8970, lng: 100.3510, kelurahan: 'Lapai' },
  { name: 'Nanggalo', lat: -0.9020, lng: 100.3740, kelurahan: 'Surau Gadang' },
  { name: 'Kuranji', lat: -0.9230, lng: 100.4120, kelurahan: 'Kuranji' },
  { name: 'Padang Timur', lat: -0.9380, lng: 100.3750, kelurahan: 'Alai Parak Kopi' },
  { name: 'Padang Barat', lat: -0.9450, lng: 100.3540, kelurahan: 'Purus' },
  { name: 'Pauh', lat: -0.9380, lng: 100.4460, kelurahan: 'Limau Manis' },
  { name: 'Lubuk Kilangan', lat: -0.9540, lng: 100.4610, kelurahan: 'Bandar Buat' },
  { name: 'Lubuk Begalung', lat: -0.9630, lng: 100.3980, kelurahan: 'Lubuk Begalung' },
  { name: 'Padang Selatan', lat: -0.9650, lng: 100.3700, kelurahan: 'Air Manis' },
  { name: 'Bungus Teluk Kabung', lat: -1.0400, lng: 100.3910, kelurahan: 'Bungus Barat' }
];

function getStaticFallback(lat, lng) {
  let nearest = KECAMATAN_CENTERS[0];
  let minDist = Infinity;
  for (const center of KECAMATAN_CENTERS) {
    const d = Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2);
    if (d < minDist) {
      minDist = d;
      nearest = center;
    }
  }
  const kelurahan = nearest.kelurahan;
  const kecamatan = nearest.name;
  const kota = 'Kota Padang';
  const provinsi = 'Sumatera Barat';
  const alamat_lengkap = `Jl. Raya Padang, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kota}, ${provinsi}`;
  
  return {
    alamat_lengkap,
    kelurahan,
    kecamatan,
    kota,
    provinsi
  };
}

function validateGeocodeResult(res) {
  if (!res) return false;
  if (!res.kelurahan || res.kelurahan === '—' || res.kelurahan === '') return false;
  if (!res.kecamatan || res.kecamatan === '—' || res.kecamatan === '') return false;
  if (!res.kota || res.kota === '—' || res.kota === '') return false;
  if (!res.provinsi || res.provinsi === '—' || res.provinsi === '') return false;
  if (!res.alamat_lengkap || res.alamat_lengkap === '—' || res.alamat_lengkap === '') return false;
  
  const cleanAddr = res.alamat_lengkap.trim().toLowerCase();
  const cleanCity = res.kota.trim().toLowerCase();
  if (cleanAddr === cleanCity || cleanAddr === 'padang' || cleanAddr === 'kota padang') return false;
  
  return true;
}

// Query local PostGIS database to reverse geocode using batas_wilayah & jaringan_jalan
async function queryPostGIS(lat, lng) {
  try {
    let kecamatan = '—';
    let kelurahan = '—';
    let provinsi = 'Sumatera Barat';
    let kota = 'Kota Padang';

    // 1. Get Kecamatan (NAME_3) and Kelurahan (NAME_4) if columns exist in batas_wilayah
    const checkCol = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'batas_wilayah' AND column_name = 'NAME_4' 
      LIMIT 1
    `);
    
    if (checkCol.rows.length > 0) {
      const boundaryResult = await pool.query(`
        SELECT "NAME_1", "NAME_2", "NAME_3", "NAME_4" 
        FROM batas_wilayah 
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
        LIMIT 1
      `, [lng, lat]);
      
      if (boundaryResult.rows[0]) {
        const row = boundaryResult.rows[0];
        provinsi = row.NAME_1 || provinsi;
        kota = row.NAME_2 || kota;
        kecamatan = row.NAME_3 || kecamatan;
        kelurahan = row.NAME_4 || kelurahan;
      }
    } else {
      const boundaryResult = await pool.query(`
        SELECT "NAME_1", "NAME_2", "NAME_3" 
        FROM batas_wilayah 
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
        LIMIT 1
      `, [lng, lat]);
      
      if (boundaryResult.rows[0]) {
        const row = boundaryResult.rows[0];
        provinsi = row.NAME_1 || provinsi;
        kota = row.NAME_2 || kota;
        kecamatan = row.NAME_3 || kecamatan;
      }
    }

    // 2. Get nearest street from jaringan_jalan
    const roadResult = await pool.query(`
      SELECT name 
      FROM jaringan_jalan 
      WHERE name IS NOT NULL AND name <> '' 
      ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) 
      LIMIT 1
    `, [lng, lat]);
    
    let road = roadResult.rows[0] ? roadResult.rows[0].name : '';
    
    // Parse kelurahan from road name if database Kelurahan is empty
    if ((!kelurahan || kelurahan === '—') && road.includes(',')) {
      const segments = road.split(',').map(s => s.trim());
      if (segments.length > 1) {
        kelurahan = segments[1];
        road = segments[0];
      }
    }

    // Fallbacks if kelurahan/kecamatan are missing
    const staticData = getStaticFallback(lat, lng);
    if (!kelurahan || kelurahan === '—') kelurahan = staticData.kelurahan;
    if (!kecamatan || kecamatan === '—') kecamatan = staticData.kecamatan;
    if (!road) road = `Jalan Dekat ${kelurahan}`;

    const parts = [road, kelurahan, kecamatan, kota, provinsi].filter(Boolean);
    const alamat_lengkap = parts.join(', ');

    return {
      alamat_lengkap,
      kelurahan,
      kecamatan,
      kota,
      provinsi
    };
  } catch (err) {
    console.error('PostGIS geocode fallback error:', err);
    return getStaticFallback(lat, lng);
  }
}

// Fetch from OSM Nominatim reverse geocoding API
function fetchNominatim(lat, lng) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;
    const options = {
      headers: {
        'User-Agent': 'WebGIS-Damkar-Padang-Reverse-Geocoder-v1.2'
      },
      timeout: 2500
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.address) {
            resolve(parsed);
          } else {
            reject(new Error('Invalid Nominatim response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Reverse geocode main entry point
async function reverseGeocode(lat, lng) {
  const key = `${parseFloat(lat).toFixed(5)},${parseFloat(lng).toFixed(5)}`;
  
  // 1. Cache hit (only return if it contains complete and valid results)
  if (cache[key] && validateGeocodeResult(cache[key])) {
    return cache[key];
  }
  
  // 2. Cache miss or invalid cache entry, try Nominatim reverse geocode
  try {
    const res = await fetchNominatim(lat, lng);
    const addr = res.address || {};
    const road = addr.road || addr.pedestrian || addr.path || addr.suburb || '';
    let kelurahan = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || '';
    let kecamatan = addr.subdistrict || addr.city_district || '';
    const kota = addr.city || addr.town || addr.county || 'Kota Padang';
    const provinsi = addr.province || addr.state || 'Sumatera Barat';
    
    // If Nominatim returned empty suburb/village for kelurahan, try extracting it from the full display name
    if ((!kelurahan || kelurahan === '') && res.display_name) {
      const parts = res.display_name.split(',').map(p => p.trim());
      if (parts.length > 2) {
        kelurahan = parts[1]; // typical village/suburb location in Indonesia display names
      }
    }

    // Fallback to PostGIS boundary join for missing kecamatan
    if (!kecamatan || kecamatan === '') {
      try {
        const kecResult = await pool.query(`
          SELECT "NAME_3" 
          FROM batas_wilayah 
          WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
          LIMIT 1
        `, [lng, lat]);
        kecamatan = kecResult.rows[0] ? kecResult.rows[0].NAME_3 : '';
      } catch (e) {
        console.error(e);
      }
    }

    // Secondary static boundary fallback for missing fields
    const staticData = getStaticFallback(lat, lng);
    if (!kelurahan || kelurahan === '') kelurahan = staticData.kelurahan;
    if (!kecamatan || kecamatan === '') kecamatan = staticData.kecamatan;

    const roadName = road || `Jalan Dekat ${kelurahan}`;
    const parts = [roadName, kelurahan, kecamatan, kota, provinsi].filter(Boolean);
    const alamat_lengkap = parts.join(', ');
    
    const newEntry = {
      alamat_lengkap,
      kelurahan,
      kecamatan,
      kota,
      provinsi
    };
    
    if (validateGeocodeResult(newEntry)) {
      cache[key] = newEntry;
      saveCache();
      return newEntry;
    }
    
    // If Nominatim result is still invalid, throw to trigger database/static fallback
    throw new Error('Geocoded data failed validation');
  } catch (err) {
    console.warn(`⚠️ Nominatim failed or returned invalid data for coordinates ${lat}, ${lng}, falling back to PostGIS:`, err.message);
    const localResult = await queryPostGIS(lat, lng);
    
    // Save valid fallback results to cache
    if (validateGeocodeResult(localResult)) {
      cache[key] = localResult;
      saveCache();
    }
    return localResult;
  }
}

module.exports = {
  reverseGeocode
};
