const fs = require('fs');
const path = require('path');
const https = require('https');
const pool = require('../config/db');

const cachePath = path.join(__dirname, '../config/geocoding_cache.json');
let cache = {};

// Load cache file on start
try {
  if (fs.existsSync(cachePath)) {
    cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
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

// Query local PostGIS database to reverse geocode using batas_wilayah & jaringan_jalan
async function queryPostGIS(lat, lng) {
  try {
    // 1. Get Kecamatan from batas_wilayah
    const kecResult = await pool.query(`
      SELECT "NAME_3" 
      FROM batas_wilayah 
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
      LIMIT 1
    `, [lng, lat]);
    const kecamatan = kecResult.rows[0] ? kecResult.rows[0].NAME_3 : '—';

    // 2. Get nearest street from jaringan_jalan
    const roadResult = await pool.query(`
      SELECT name 
      FROM jaringan_jalan 
      WHERE name IS NOT NULL AND name <> '' 
      ORDER BY geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) 
      LIMIT 1
    `, [lng, lat]);
    const road = roadResult.rows[0] ? roadResult.rows[0].name : 'Jalan Tanpa Nama';

    const kelurahan = '—';
    const kota = 'Kota Padang';
    
    // Parse kelurahan if it looks like it's inside the road name (OSM formats road names like "Jl. X, Kelurahan Y, ...")
    let parsedKelurahan = kelurahan;
    if (road.includes(',')) {
      const segments = road.split(',').map(s => s.trim());
      if (segments.length > 1) {
        parsedKelurahan = segments[1];
      }
    }

    const parts = [road, kecamatan, kota].filter(Boolean);
    const alamat_lengkap = parts.join(', ');

    return {
      alamat_lengkap,
      kelurahan: parsedKelurahan,
      kecamatan,
      kota
    };
  } catch (err) {
    console.error('PostGIS geocode fallback error:', err);
    return {
      alamat_lengkap: `Koordinat: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`,
      kelurahan: '—',
      kecamatan: '—',
      kota: 'Kota Padang'
    };
  }
}

// Fetch from OSM Nominatim reverse geocoder
function fetchNominatim(lat, lng) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;
    const options = {
      headers: {
        'User-Agent': 'WebGIS-Damkar-Padang-Reverse-Geocoder-v1.0'
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
  
  // 1. Cache hit
  if (cache[key]) {
    const cached = cache[key];
    
    // Enrich subdistrict if it was marked as empty
    if (!cached.kecamatan || cached.kecamatan === '—') {
      try {
        const kecResult = await pool.query(`
          SELECT "NAME_3" 
          FROM batas_wilayah 
          WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
          LIMIT 1
        `, [lng, lat]);
        if (kecResult.rows[0] && kecResult.rows[0].NAME_3) {
          cached.kecamatan = kecResult.rows[0].NAME_3;
          if (!cached.alamat_lengkap.includes(cached.kecamatan)) {
            const parts = cached.alamat_lengkap.split(', ');
            const padangIndex = parts.indexOf('Padang');
            if (padangIndex !== -1) {
              parts.splice(padangIndex, 0, cached.kecamatan);
            } else {
              parts.push(cached.kecamatan);
            }
            cached.alamat_lengkap = parts.join(', ');
          }
          saveCache();
        }
      } catch (e) {
        console.error('Failed to enrich cache subdistrict:', e);
      }
    }
    return cached;
  }
  
  // 2. Cache miss, try Nominatim reverse geocode
  try {
    const res = await fetchNominatim(lat, lng);
    const addr = res.address || {};
    const road = addr.road || addr.pedestrian || addr.path || '';
    const kelurahan = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || '';
    let kecamatan = addr.subdistrict || addr.city_district || addr.suburb || '';
    const kota = addr.city || addr.town || addr.county || 'Kota Padang';
    
    // Fallback to PostGIS boundary join if Nominatim fails to return a subdistrict
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

    const parts = [];
    if (road) parts.push(road);
    if (kelurahan) parts.push(kelurahan);
    if (kecamatan) parts.push(kecamatan);
    if (kota) parts.push(kota);
    
    const alamat_lengkap = parts.length > 0 ? parts.join(', ') : `Koordinat: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
    
    const newEntry = {
      alamat_lengkap,
      kelurahan: kelurahan || '—',
      kecamatan: kecamatan || '—',
      kota
    };
    
    cache[key] = newEntry;
    saveCache();
    return newEntry;
  } catch (err) {
    console.warn(`⚠️ Nominatim failed for coordinates ${lat}, ${lng}, falling back to PostGIS:`, err.message);
    const localResult = await queryPostGIS(lat, lng);
    return localResult;
  }
}

module.exports = {
  reverseGeocode
};
