'use client';

import { useState, useEffect, useRef } from 'react';

interface Coordinate {
  x: number;
  y: number;
}

interface GPSCoordinate {
  lat: number;
  lng: number;
}

interface AreaResult {
  squareMeters: number;
  squareFeet: number;
  katha: number;
  bigha: number;
  acre: number;
  decimal: number;
  shotok: number;
  kani: number;
}

const GPSAreaCalculator = () => {
  const [inputMode, setInputMode] = useState<'manual' | 'gps'>('manual');
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [gpsCoordinates, setGpsCoordinates] = useState<string[]>([]);
  const [result, setResult] = useState<AreaResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showMap, setShowMap] = useState(true);
  const [mapView, setMapView] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [mapCenter, setMapCenter] = useState({ lat: 23.7806, lng: 90.4392 }); // Dhaka coordinates
  const [mapZoom, setMapZoom] = useState(15);
  const mapRef = useRef<HTMLDivElement>(null);

  // Real tile server URLs for different map types
  const tileServers = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  // Convert lat/lng/z to tile coordinates
  const getTileCoords = (lat: number, lng: number, zoom: number) => {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  };

  // Get tile server subdomains (for load balancing)
  const getSubdomain = (index: number) => {
    const subdomains = mapView === 'standard' ? ['a', 'b', 'c'] :
                      mapView === 'satellite' ? [''] :
                      ['a', 'b', 'c']; // terrain
    return subdomains[index % subdomains.length];
  };

  // Convert coordinates to screen points for map drawing (simplified for single tile)
  const coordsToScreenPoints = (coords: GPSCoordinate[]): { x: number; y: number }[] => {
    if (coords.length === 0) return [];

    // Calculate bounds of all coordinates
    const bounds = coords.reduce((acc, coord) => ({
      minLat: Math.min(acc.minLat, coord.lat),
      maxLat: Math.max(acc.maxLat, coord.lat),
      minLng: Math.min(acc.minLng, coord.lng),
      maxLng: Math.max(acc.maxLng, coord.lng)
    }), {
      minLat: coords[0].lat,
      maxLat: coords[0].lat,
      minLng: coords[0].lng,
      maxLng: coords[0].lng
    });

    // Calculate the map extent based on bounds
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    const maxRange = Math.max(latRange, lngRange, 0.001);
    
    // Scale to fit within 400x400 SVG canvas
    const scale = 350 / maxRange; // Leave some margin
    
    // Calculate center point for scaling
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    
    return coords.map(coord => ({
      x: 200 + (coord.lng - centerLng) * scale,
      y: 200 - (coord.lat - centerLat) * scale // Flip Y axis for screen coordinates
    }));
  };

  // Parse GPS coordinate string to decimal degrees
  const parseGPSCoordinate = (coordStr: string): GPSCoordinate => {
    try {
      // Remove extra spaces and normalize the string
      const normalized = coordStr.trim();

      // Match pattern: degrees°minutes'seconds"direction
      const latMatch = normalized.match(/(\d+)°(\d+)'([\d.]+)"([NS])/);
      const lngMatch = normalized.match(/(\d+)°(\d+)'([\d.]+)"([EW])/);

      if (!latMatch || !lngMatch) {
        throw new Error('Invalid GPS coordinate format');
      }

      // Convert DMS to decimal degrees
      const latDeg = parseInt(latMatch[1]);
      const latMin = parseInt(latMatch[2]);
      const latSec = parseFloat(latMatch[3]);
      const latDir = latMatch[4];

      const lngDeg = parseInt(lngMatch[1]);
      const lngMin = parseInt(lngMatch[2]);
      const lngSec = parseFloat(lngMatch[3]);
      const lngDir = lngMatch[4];

      let lat = latDeg + latMin / 60 + latSec / 3600;
      let lng = lngDeg + lngMin / 60 + lngSec / 3600;

      if (latDir === 'S') lat = -lat;
      if (lngDir === 'W') lng = -lng;

      return { lat, lng };
    } catch (err) {
      throw new Error(`Failed to parse GPS coordinate: ${coordStr}`);
    }
  };

  // Convert GPS coordinates to meters using simplified Mercator projection
  const gpsToMeters = (coords: GPSCoordinate[]): Coordinate[] => {
    if (coords.length === 0) return [];

    // Calculate the centroid for reference
    const avgLat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;

    // Earth radius in meters
    const R = 6371000;

    // Convert lat/lng to meters using Mercator projection
    // This is more accurate for small areas
    return coords.map(coord => {
      // Convert to radians
      const latRad = coord.lat * Math.PI / 180;
      const lngRad = coord.lng * Math.PI / 180;
      const avgLatRad = avgLat * Math.PI / 180;

      // Calculate meters per degree at this latitude
      const metersPerDegreeLat = 111132.92 - 559.82 * Math.cos(2 * avgLatRad) + 1.175 * Math.cos(4 * avgLatRad);
      const metersPerDegreeLng = 111412.84 * Math.cos(avgLatRad) - 93.5 * Math.cos(3 * avgLatRad);

      // Convert to relative position in meters
      const x = (coord.lng - coords[0].lng) * metersPerDegreeLng;
      const y = (coord.lat - coords[0].lat) * metersPerDegreeLat;

      return { x, y };
    });
  };

  // Calculate area using Shoelace formula (Gauss's area formula)
  const calculatePolygonArea = (coords: Coordinate[]): number => {
    const n = coords.length;
    if (n < 3) return 0;

    let area = 0;

    // Shoelace formula: sum of (x[i] * y[i+1] - x[i+1] * y[i])
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coords[i].x * coords[j].y;
      area -= coords[j].x * coords[i].y;
    }

    // Return absolute value divided by 2
    return Math.abs(area) / 2;
  };

  const addCoordinate = () => {
    setCoordinates([...coordinates, { x: 0, y: 0 }]);
    setError('');
  };

  const removeCoordinate = (index: number) => {
    const newCoordinates = coordinates.filter((_, i) => i !== index);
    setCoordinates(newCoordinates);
    if (result) setResult(null);
  };

  const updateCoordinate = (index: number, field: 'x' | 'y', value: number) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index][field] = value;
    setCoordinates(newCoordinates);
    if (result) setResult(null);
  };

  const addGpsCoordinate = () => {
    setGpsCoordinates([...gpsCoordinates, ""]);
    setError('');
  };

  const removeGpsCoordinate = (index: number) => {
    const newGpsCoordinates = gpsCoordinates.filter((_, i) => i !== index);
    setGpsCoordinates(newGpsCoordinates);
    if (result) setResult(null);
  };

  const updateGpsCoordinate = (index: number, value: string) => {
    const newGpsCoordinates = [...gpsCoordinates];
    newGpsCoordinates[index] = value;
    setGpsCoordinates(newGpsCoordinates);
    if (result) setResult(null);
  };

  const loadSample = () => {
    setError('');
    setResult(null);

    if (inputMode === 'gps') {
      // Sample GPS coordinates from the provided list
      setGpsCoordinates([
        "24°24'10.5\"N 88°37'34.7\"E",
        "24°24'11.9\"N 88°37'35.0\"E",
        "24°24'11.8\"N 88°37'36.1\"E",
        "24°24'15.0\"N 88°37'36.6\"E",
        "24°24'15.3\"N 88°37'33.3\"E",
        "24°24'13.9\"N 88°37'32.8\"E",
        "24°24'14.7\"N 88°37'29.3\"E",
        "24°24'11.4\"N 88°37'28.5\"E"
      ]);
    } else {
      // Sample rectangle: 10m x 10m = 100 square meters
      setCoordinates([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]);
    }
  };

  const calculateArea = () => {
    try {
      setError('');

      let areaInSquareMeters = 0;
      let metersCoords: Coordinate[] = [];

      if (inputMode === 'manual') {
        if (coordinates.length < 3) {
          setError('At least 3 coordinates are required');
          return;
        }

        metersCoords = coordinates;
        areaInSquareMeters = calculatePolygonArea(coordinates);

      } else {
        if (gpsCoordinates.length < 3) {
          setError('At least 3 GPS coordinates are required');
          return;
        }

        // Parse GPS coordinates
        const parsedCoords: GPSCoordinate[] = [];
        for (const coord of gpsCoordinates) {
          try {
            parsedCoords.push(parseGPSCoordinate(coord));
          } catch (err: any) {
            setError(`Invalid GPS coordinate: ${coord}`);
            return;
          }
        }

        // Convert GPS to meters
        metersCoords = gpsToMeters(parsedCoords);
        areaInSquareMeters = calculatePolygonArea(metersCoords);
      }

      // Log coordinates for debugging
      console.log('Coordinates in meters:', metersCoords);
      console.log('Calculated area in m²:', areaInSquareMeters);

      // Update map center for GPS coordinates
      if (inputMode === 'gps') {
        try {
          const parsedCoords: GPSCoordinate[] = [];
          for (const coord of gpsCoordinates) {
            parsedCoords.push(parseGPSCoordinate(coord));
          }
          
          if (parsedCoords.length > 0) {
            // Calculate centroid of the polygon
            const avgLat = parsedCoords.reduce((sum, coord) => sum + coord.lat, 0) / parsedCoords.length;
            const avgLng = parsedCoords.reduce((sum, coord) => sum + coord.lng, 0) / parsedCoords.length;
            setMapCenter({ lat: avgLat, lng: avgLng });
          }
        } catch (err) {
          // Keep default center if parsing fails
          console.log('Could not update map center');
        }
      }

      // Bangladesh Standard Conversions based on the documentation
      const squareMeters = areaInSquareMeters;
      const squareFeet = squareMeters * 10.764; // 1 m² = 10.764 ft²

      // Based on documentation:
      // 1 Katha = 720 Square Feet
      // 1 Decimal = 435.6 Square Feet
      // 1 Bigha = 14400 Square Feet
      // 1 Acre = 43560 Square Feet
      // 1 Shotok = 435.6 Square Feet
      // 1 Kani = 17280 Square Feet

      const katha = squareFeet / 720;
      const decimal = squareFeet / 435.6;
      const bigha = squareFeet / 14400; // 1 Bigha = 14400 sq ft = 20 Katha
      const acre = squareFeet / 43560; // 1 Acre = 43560 sq ft
      const shotok = decimal; // 1 Decimal = 1 Shotok = 435.6 sq ft
      const kani = squareFeet / 17280; // 1 Kani = 17280 sq ft

      setResult({
        squareMeters: parseFloat(squareMeters.toFixed(2)),
        squareFeet: parseFloat(squareFeet.toFixed(2)),
        katha: parseFloat(katha.toFixed(4)),
        bigha: parseFloat(bigha.toFixed(4)),
        acre: parseFloat(acre.toFixed(4)),
        decimal: parseFloat(decimal.toFixed(4)),
        shotok: parseFloat(shotok.toFixed(4)),
        kani: parseFloat(kani.toFixed(4))
      });
    } catch (err: any) {
      setError(err.message || 'Calculation error');
    }
  };

  const clearAll = () => {
    setCoordinates([]);
    setGpsCoordinates([]);
    setResult(null);
    setError('');
  };

  const exportData = (format: 'json' | 'csv' | 'text') => {
    if (!result) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    let filename = `land-area-calculation-${timestamp}`;
    let content = '';
    let mimeType = '';

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        inputMode: inputMode,
        coordinates: inputMode === 'manual' ? coordinates : gpsCoordinates,
        parsedGPSCoordinates: inputMode === 'gps' ? gpsCoordinates.map(coord => {
          try {
            const parsed = parseGPSCoordinate(coord);
            return { original: coord, lat: parsed.lat, lng: parsed.lng };
          } catch {
            return { original: coord, error: 'Invalid coordinate' };
          }
        }) : null,
        results: {
          squareMeters: result.squareMeters,
          squareFeet: result.squareFeet,
          katha: result.katha,
          bigha: result.bigha,
          acre: result.acre,
          decimal: result.decimal,
          shotok: result.shotok,
          kani: result.kani
        },
        location: inputMode === 'gps' ? {
          center: mapCenter,
          country: 'Bangladesh'
        } : null
      };
      content = JSON.stringify(exportData, null, 2);
      filename += '.json';
      mimeType = 'application/json';

    } else if (format === 'csv') {
      // Create CSV content
      const headers = ['Point', inputMode === 'manual' ? 'X (m)' : 'GPS Coordinate', inputMode === 'manual' ? 'Y (m)' : 'Latitude', inputMode === 'gps' ? 'Longitude' : ''].filter(h => h);
      const rows: string[][] = [];
      
      if (inputMode === 'manual') {
        coordinates.forEach((coord, index) => {
          rows.push([`${index + 1}`, coord.x.toString(), coord.y.toString()]);
        });
      } else {
        gpsCoordinates.forEach((coord, index) => {
          try {
            const parsed = parseGPSCoordinate(coord);
            rows.push([`${index + 1}`, coord, parsed.lat.toString(), parsed.lng.toString()]);
          } catch {
            rows.push([`${index + 1}`, coord, 'Invalid', 'Invalid']);
          }
        });
      }
      
      // Add results section
      rows.push([]);
      rows.push(['CALCULATION RESULTS']);
      rows.push(['Measurement Unit', 'Value']);
      rows.push(['Square Meters', result.squareMeters.toString()]);
      rows.push(['Square Feet', result.squareFeet.toString()]);
      rows.push(['Katha', result.katha.toString()]);
      rows.push(['Bigha', result.bigha.toString()]);
      rows.push(['Acre', result.acre.toString()]);
      rows.push(['Decimal', result.decimal.toString()]);
      rows.push(['Shotok', result.shotok.toString()]);
      rows.push(['Kani', result.kani.toString()]);
      
      content = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      filename += '.csv';
      mimeType = 'text/csv';

    } else if (format === 'text') {
      // Create text report
      let textContent = '=== BANGLADESH LAND AREA CALCULATION REPORT ===\n\n';
      textContent += `Date: ${new Date().toLocaleString()}\n`;
      textContent += `Input Mode: ${inputMode.toUpperCase()}\n\n`;
      
      textContent += '--- COORDINATES ---\n';
      if (inputMode === 'manual') {
        coordinates.forEach((coord, index) => {
          textContent += `Point ${index + 1}: X=${coord.x}m, Y=${coord.y}m\n`;
        });
      } else {
        gpsCoordinates.forEach((coord, index) => {
          try {
            const parsed = parseGPSCoordinate(coord);
            textContent += `Point ${index + 1}: ${coord} (${parsed.lat.toFixed(6)}°, ${parsed.lng.toFixed(6)}°)\n`;
          } catch {
            textContent += `Point ${index + 1}: ${coord} (Invalid)\n`;
          }
        });
        textContent += `\nMap Center: ${mapCenter.lat.toFixed(6)}°N, ${mapCenter.lng.toFixed(6)}°E\n`;
      }
      
      textContent += '\n--- AREA CALCULATIONS ---\n';
      textContent += `Square Meters: ${result.squareMeters.toLocaleString()} m²\n`;
      textContent += `Square Feet: ${result.squareFeet.toLocaleString()} ft²\n`;
      textContent += `Katha (কাঠা): ${result.katha.toFixed(4)} (720 ft² each)\n`;
      textContent += `Bigha (বিঘা): ${result.bigha.toFixed(4)} (20 Katha each)\n`;
      textContent += `Acre (একর): ${result.acre.toFixed(4)} (100 Shotok each)\n`;
      textContent += `Decimal (শতাংশ): ${result.decimal.toFixed(4)} (435.6 ft² each)\n`;
      textContent += `Shotok (শতক): ${result.shotok.toFixed(4)} (= Decimal)\n`;
      textContent += `Kani (কানি): ${result.kani.toFixed(4)} (40 Shotok each)\n`;
      
      content = textContent;
      filename += '.txt';
      mimeType = 'text/plain';
    }

    // Create download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Bangladesh Land Area Calculator</h2>
        <div className="flex space-x-2">
          <button
            onClick={loadSample}
            className="px-3 py-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
          >
            Load Sample
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setInputMode('manual');
              setError('');
              setResult(null);
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMode === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Manual Coordinates
          </button>
          <button
            onClick={() => {
              setInputMode('gps');
              setError('');
              setResult(null);
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              inputMode === 'gps'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            GPS Coordinates
          </button>
        </div>
      </div>

      {inputMode === 'manual' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Manual Coordinate Input (meters)</h3>
            <button
              onClick={addCoordinate}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Coordinate
            </button>
          </div>

          {coordinates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No coordinates. Add a coordinate to get started.</p>
              <p className="text-sm mt-2 text-gray-400">
                Enter coordinates in meters for accurate area calculation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coordinates.map((coord, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {index + 1}.
                  </span>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">X:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={coord.x}
                      onChange={(e) => updateCoordinate(index, 'x', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="X (m)"
                    />
                    <span className="text-xs text-gray-500">m</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Y:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={coord.y}
                      onChange={(e) => updateCoordinate(index, 'y', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Y (m)"
                    />
                    <span className="text-xs text-gray-500">m</span>
                  </div>
                  <button
                    onClick={() => removeCoordinate(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {inputMode === 'gps' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">GPS Coordinate Input</h3>
            <button
              onClick={addGpsCoordinate}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add GPS Coordinate
            </button>
          </div>

          {gpsCoordinates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No GPS coordinates. Click &quot;Load Sample&quot; or add coordinates manually.</p>
              <p className="text-sm mt-2 text-gray-400">
                Format: 24°24&apos;10.5&quot;N 88°37&apos;34.7&quot;E
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {gpsCoordinates.map((gpsCoord, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={gpsCoord}
                      onChange={(e) => updateGpsCoordinate(index, e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="24°24'10.5&quot;N 88°37'34.7&quot;E"
                    />
                  </div>
                  <button
                    onClick={() => removeGpsCoordinate(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-2">
                Enter GPS coordinates in DMS format (Degrees°Minutes&apos;Seconds&quot;Direction)
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={calculateArea}
          disabled={
            inputMode === 'manual'
              ? coordinates.length < 3
              : gpsCoordinates.length < 3
          }
          className={`w-full px-4 py-3 rounded-md text-white font-medium transition-colors ${
            (inputMode === 'manual' ? coordinates.length < 3 : gpsCoordinates.length < 3)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
          }`}
        >
          {(inputMode === 'manual' ? coordinates.length < 3 : gpsCoordinates.length < 3)
            ? 'At least 3 coordinates required'
            : 'Calculate Area'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          <h4 className="font-semibold mb-1">Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Calculation Results</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => exportData('json')}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors text-sm"
                title="Export as JSON"
              >
                📋 JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="px-3 py-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors text-sm"
                title="Export as CSV"
              >
                📊 CSV
              </button>
              <button
                onClick={() => exportData('text')}
                className="px-3 py-1 bg-purple-100 text-purple-600 rounded-md hover:bg-purple-200 transition-colors text-sm"
                title="Export as Text Report"
              >
                📄 Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-700 mb-1">
                {result.squareMeters.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Square Meters</div>
              <div className="text-xs text-gray-500 mt-1">(m²)</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
              <div className="text-2xl font-bold text-green-700 mb-1">
                {result.squareFeet.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Square Feet</div>
              <div className="text-xs text-gray-500 mt-1">(ft²)</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center border border-purple-200">
              <div className="text-2xl font-bold text-purple-700 mb-1">
                {result.katha.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Katha</div>
              <div className="text-xs text-gray-500 mt-1">কাঠা (720 ft²)</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center border border-orange-200">
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {result.bigha.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Bigha</div>
              <div className="text-xs text-gray-500 mt-1">বিঘা (20 Katha)</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg text-center border border-red-200">
              <div className="text-2xl font-bold text-red-700 mb-1">
                {result.acre.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Acre</div>
              <div className="text-xs text-gray-500 mt-1">একর (100 Shotok)</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg text-center border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-700 mb-1">
                {result.decimal.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Decimal</div>
              <div className="text-xs text-gray-500 mt-1">শতাংশ (435.6 ft²)</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg text-center border border-teal-200">
              <div className="text-2xl font-bold text-teal-700 mb-1">
                {result.shotok.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Shotok</div>
              <div className="text-xs text-gray-500 mt-1">শতক (= Decimal)</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg text-center border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700 mb-1">
                {result.kani.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Kani</div>
              <div className="text-xs text-gray-500 mt-1">কানি (40 Shotok)</div>
            </div>
          </div>

          {inputMode === 'gps' && (
            <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>GPS Accuracy Note:</strong> Area calculation uses Mercator projection optimized for Bangladesh region (latitude ~24°). 
                Results are approximate with ±1-3% accuracy depending on plot size and GPS precision. 
                The map preview shows the polygon visualization for verification.
              </p>
            </div>
          )}

          {/* Map Preview */}
          {inputMode === 'gps' && result && gpsCoordinates.length >= 3 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-700">📍 Map Preview</h4>
                <div className="flex space-x-2">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setMapView('standard')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        mapView === 'standard'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🗺️ Standard
                    </button>
                    <button
                      onClick={() => setMapView('satellite')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        mapView === 'satellite'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🛰️ Satellite
                    </button>
                    <button
                      onClick={() => setMapView('terrain')}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        mapView === 'terrain'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      ⛰️ Terrain
                    </button>
                  </div>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className={`px-4 py-2 rounded-md transition-colors text-sm ${
                      showMap 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>
              </div>
              
              {showMap && (
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-green-50 p-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-800 font-medium">
                        📍 Center: {mapCenter.lat.toFixed(6)}°N, {mapCenter.lng.toFixed(6)}°E
                      </span>
                      <span className="text-xs text-gray-600">
                        {gpsCoordinates.length} coordinates plotted | View: {mapView === 'satellite' ? '🛰️ Satellite' : mapView === 'terrain' ? '⛰️ Terrain' : '🗺️ Standard'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative" style={{ height: '400px', backgroundColor: '#f8f9fa' }}>
                    {/* Real Map Tile */}
                    <div 
                      className="absolute inset-0 w-full h-full"
                      style={{
                        backgroundImage: `url(${(() => {
                          const centerTile = getTileCoords(mapCenter.lat, mapCenter.lng, mapZoom);
                          let tileUrl = tileServers[mapView];
                          tileUrl = tileUrl.replace('{s}', getSubdomain(0));
                          tileUrl = tileUrl.replace('{z}', mapZoom.toString());
                          tileUrl = tileUrl.replace('{x}', centerTile.x.toString());
                          tileUrl = tileUrl.replace('{y}', centerTile.y.toString());
                          return tileUrl;
                        })()})`,
                        backgroundSize: '400px 400px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.8
                      }}
                    />
                    
                    {/* Map attribution */}
                    <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white bg-opacity-80 px-2 py-1 rounded">
                      {mapView === 'satellite' ? '© Esri' : mapView === 'terrain' ? '© OpenTopoMap' : '© OpenStreetMap'}
                    </div>
                    
                    {/* SVG for drawing polygon and markers */}
                    <svg 
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 400 400"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Draw polygon */}
                      {(() => {
                        try {
                          const parsedCoords: GPSCoordinate[] = [];
                          for (const coord of gpsCoordinates) {
                            parsedCoords.push(parseGPSCoordinate(coord));
                          }
                          const points = coordsToScreenPoints(parsedCoords);
                          
                          if (points.length >= 3) {
                            const pathData = points.map((point, index) => 
                              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                            ).join(' ') + ' Z';
                            
                            return (
                              <path
                                d={pathData}
                                fill={mapView === 'satellite' ? 'rgba(255, 223, 0, 0.3)' : 'rgba(59, 130, 246, 0.3)'}
                                stroke={mapView === 'satellite' ? 'rgba(255, 223, 0, 0.9)' : 'rgba(59, 130, 246, 0.8)'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            );
                          }
                          return null;
                        } catch (err) {
                          return null;
                        }
                      })()}
                      
                      {/* Draw coordinate markers */}
                      {(() => {
                        try {
                          const parsedCoords: GPSCoordinate[] = [];
                          for (const coord of gpsCoordinates) {
                            parsedCoords.push(parseGPSCoordinate(coord));
                          }
                          const points = coordsToScreenPoints(parsedCoords);
                          
                          return points.map((point, index) => (
                            <g key={index}>
                              {/* Circle marker */}
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill={mapView === 'satellite' ? 'rgba(255, 59, 48, 0.9)' : 'rgba(239, 68, 68, 0.9)'}
                                stroke="white"
                                strokeWidth="2"
                              />
                              {/* Coordinate label */}
                              <text
                                x={point.x + 8}
                                y={point.y - 8}
                                fontSize="10"
                                fill={mapView === 'satellite' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(55, 65, 81, 0.8)'}
                                fontWeight="500"
                              >
                                {index + 1}
                              </text>
                              {/* Coordinate values */}
                              <text
                                x={point.x + 8}
                                y={point.y + 4}
                                fontSize="8"
                                fill={mapView === 'satellite' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.7)'}
                              >
                                {parsedCoords[index].lat.toFixed(4)}°N
                              </text>
                              <text
                                x={point.x + 8}
                                y={point.y + 12}
                                fontSize="8"
                                fill={mapView === 'satellite' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(107, 114, 128, 0.7)'}
                              >
                                {parsedCoords[index].lng.toFixed(4)}°E
                              </text>
                            </g>
                          ));
                        } catch (err) {
                          return null;
                        }
                      })()}
                    </svg>
                    
                    {/* Map info overlay */}
                    <div className={`absolute top-4 left-4 ${mapView === 'satellite' ? 'bg-black' : 'bg-white'} bg-opacity-90 px-3 py-2 rounded-lg shadow-lg`}>
                      <div className={`text-xs ${mapView === 'satellite' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>
                        <div>📍 {gpsCoordinates.length} points plotted</div>
                        <div className={mapView === 'satellite' ? 'text-gray-400 mt-1' : 'text-gray-500 mt-1'}>
                          Area: {result?.squareMeters.toFixed(2)} m²
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coordinate list */}
                  <div className="bg-gray-50 p-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <strong>Coordinates plotted:</strong>
                      <div className="mt-1 max-h-32 overflow-y-auto">
                        {gpsCoordinates.map((coord, index) => (
                          <div key={index} className="flex justify-between items-center py-1">
                            <span className="font-mono text-xs">{coord}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              {(() => {
                                try {
                                  const parsed = parseGPSCoordinate(coord);
                                  return `${parsed.lat.toFixed(4)}°, ${parsed.lng.toFixed(4)}°`;
                                } catch (err) {
                                  return 'Invalid';
                                }
                              })()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📍 Usage Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Manual Mode:</strong> Enter X,Y coordinates in meters directly</li>
          <li>• <strong>GPS Mode:</strong> Enter coordinates in DMS format (24°24&apos;10.5&quot;N 88°37&apos;34.7&quot;E)</li>
          <li>• Add at least 3 coordinates to form a polygon and calculate area</li>
          <li>• Coordinates should be entered in order (clockwise or counter-clockwise)</li>
          <li>• Click &quot;Load Sample&quot; to load example coordinates</li>
          <li>• <strong>Export Options:</strong> Save results as JSON, CSV, or Text Report</li>
          <li>• Click &quot;Show Map&quot; to preview GPS coordinates visually after calculation</li>
          <li>• The area is calculated using the Shoelace formula (Gauss&apos;s area formula)</li>
        </ul>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <h4 className="font-semibold text-gray-700 mb-2">Bangladesh Land Measurement Units (বাংলাদেশ ভূমি পরিমাপ)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <div>
            <strong>Primary Units:</strong>
            <br />• 1 Katha (কাঠা) = 720 Square Feet = 66.9 m²
            <br />• 1 Bigha (বিঘা) = 20 Katha = 14,400 Square Feet
            <br />• 1 Acre (একর) = 100 Shotok = 43,560 Square Feet
            <br />• 1 Decimal/Shotok (শতাংশ/শতক) = 435.6 Square Feet
          </div>
          <div>
            <strong>Conversion Formulas:</strong>
            <br />• 1 Kani (কানি) = 40 Shotok = 17,280 Square Feet
            <br />• 1 Paki = 1 Bigha = 33 Decimal
            <br />• 3 Bigha ≈ 1 Acre (approximate)
            <br />• 1 Square Meter = 10.764 Square Feet
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSAreaCalculator;