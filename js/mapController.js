/**
 * BharatSetu — Autonomous Maritime Spill Attribution System
 * Leaflet.js Map Controller for Hindcast Drift & Suspect Vessel Attribution
 */

class MaritimeMapController {
  constructor(mapElementId = 'maritime-map') {
    this.elementId = mapElementId;
    this.map = null;
    this.baseLayers = {};
    this.currentBaseLayer = 'satelliteSea';
    this.layers = {
      spill: null,
      hindcast: null,
      forwardcast: null,
      origin: null,
      vessels: null,
      vesselTracks: null,
      currentVectors: null,
      coastalWarning: null
    };
    this.vesselMarkers = {};
    this.vesselTrackLayers = {};
    this.activeVesselId = null;
    this.initialized = false;
  }

  init() {
    const container = document.getElementById(this.elementId);
    if (!container || this.initialized) return;

    // Center on Arabian Sea with clear view of Mumbai / Maharashtra Coast
    const center = [18.865, 71.920];
    const zoom = 9.5;

    this.map = L.map(this.elementId, {
      center: center,
      zoom: zoom,
      minZoom: 6,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: true
    });

    // Custom tactical zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // 1. Satellite Sea View (Esri World Imagery - genuine satellite ocean and coastline)
    this.baseLayers.satelliteSea = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics | Arabian Sea Satellite',
        maxZoom: 18
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri Ocean Boundaries',
        maxZoom: 18,
        opacity: 0.85
      })
    ]);

    // 2. Ocean Bathymetry (Specialized deep blue oceanographic depth layer)
    this.baseLayers.oceanBathymetry = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, GEBCO, NOAA, National Geographic | Ocean Bathymetry',
        maxZoom: 16
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        opacity: 0.95
      })
    ]);

    // 3. Dark Tactical Nautical Radar Mode
    this.baseLayers.cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap | Tactical Radar',
      maxZoom: 18,
      subdomains: 'abcd'
    });

    // Set Satellite Sea as default background
    this.baseLayers.satelliteSea.addTo(this.map);

    // Initialize overlay layer groups
    this.layers.spill = L.layerGroup().addTo(this.map);
    this.layers.hindcast = L.layerGroup().addTo(this.map);
    this.layers.forwardcast = L.layerGroup().addTo(this.map);
    this.layers.coastalWarning = L.layerGroup().addTo(this.map);
    this.layers.origin = L.layerGroup().addTo(this.map);
    this.layers.currentVectors = L.layerGroup().addTo(this.map);
    this.layers.vesselTracks = L.layerGroup().addTo(this.map);
    this.layers.vessels = L.layerGroup().addTo(this.map);

    this.renderDriftFeatures();
    this.renderVesselFeatures();
    this.addCustomLegend();
    this.addCoordinatesHud();
    this.addBaseLayerSwitcher();
    this.addOceanBanner();

    this.initialized = true;

    // Invalidate map size after DOM renders
    setTimeout(() => {
      this.map.invalidateSize();
    }, 250);
  }

  renderDriftFeatures() {
    const data = window.BHARATSETU_DATA;
    if (!data) return;

    // 1. Render Current Spill Location & Polygon
    const spill = data.spillDetection;
    const spillPolygon = L.polygon(spill.boundingPolygon, {
      color: '#ef4444',
      weight: 3,
      fillColor: '#dc2626',
      fillOpacity: 0.55,
      className: 'pulse-polygon ocean-spill-glow'
    }).addTo(this.layers.spill);

    spillPolygon.bindPopup(`
      <div class="map-popup-card danger">
        <div class="popup-tag danger">🚨 CONFIRMED SPILL DETECTION</div>
        <div class="popup-title">Heavy Fuel Oil / Crude Slick</div>
        <div class="popup-grid">
          <div><span>Location:</span> 18.924° N, 71.852° E (Arabian Sea)</div>
          <div><span>Area:</span> 12.4 km²</div>
          <div><span>Confidence:</span> 94.2%</div>
          <div><span>Observed:</span> 02:15 UTC (T_obs)</div>
          <div><span>Depth:</span> ~78 meters (Continental Shelf)</div>
        </div>
      </div>
    `);

    // Spill center pulsing beacon icon
    const spillIcon = L.divIcon({
      className: 'custom-beacon-icon',
      html: `<div class="pulse-beacon red"><div class="core"></div><div class="ring"></div></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker([spill.coordinates.lat, spill.coordinates.lng], { icon: spillIcon })
      .addTo(this.layers.spill)
      .bindPopup(spillPolygon.getPopup());

    // 2. Render Hindcast (Reverse Drift Trajectory across the Sea)
    const drift = data.driftSimulation;
    const hindcastCoords = drift.hindcastTrajectory.map(pt => [pt.lat, pt.lng]);

    // Glowing Hindcast line on sea surface
    const hindcastLine = L.polyline(hindcastCoords, {
      color: '#f59e0b',
      weight: 4.5,
      dashArray: '10, 8',
      opacity: 0.98,
      className: 'hindcast-glow-line'
    }).addTo(this.layers.hindcast);

    // Waypoint time markers & reverse drift indicators
    drift.hindcastTrajectory.forEach((pt, index) => {
      if (index > 0 && index < drift.hindcastTrajectory.length - 1) {
        const timeIcon = L.divIcon({
          className: 'waypoint-label-icon',
          html: `<div class="waypoint-badge">◄ ${pt.timeOffset}</div>`,
          iconSize: [52, 20],
          iconAnchor: [26, 10]
        });
        L.marker([pt.lat, pt.lng], { icon: timeIcon })
          .addTo(this.layers.hindcast)
          .bindTooltip(`Hindcast Drift Position at ${pt.time} (${pt.timeOffset})`, { direction: 'top' });
      }
    });

    // 3. Render Probable Spill Origin (Ground Zero at Sea)
    const origin = drift.probableOrigin;
    
    // Uncertainty ellipse/circle on ocean surface
    L.circle([origin.lat, origin.lng], {
      radius: origin.uncertaintyRadiusKm * 1000,
      color: '#f59e0b',
      dashArray: '6, 6',
      weight: 2,
      fillColor: '#fbbf24',
      fillOpacity: 0.22,
      className: 'origin-circle-glow'
    }).addTo(this.layers.origin);

    // Origin Crosshair Target Icon
    const originIcon = L.divIcon({
      className: 'custom-target-icon',
      html: `
        <div class="origin-crosshair">
          <div class="cross-line-h"></div>
          <div class="cross-line-v"></div>
          <div class="center-dot"></div>
          <div class="pulse-ring"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(this.layers.origin)
      .bindPopup(`
        <div class="map-popup-card warning">
          <div class="popup-tag warning">🎯 PROBABLE SPILL ORIGIN (T₀)</div>
          <div class="popup-title">Attribution Ground Zero (Arabian Sea)</div>
          <div class="popup-grid">
            <div><span>Est. Time:</span> 21:30 UTC (-4h 45m)</div>
            <div><span>Coords:</span> 18.782° N, 71.614° E</div>
            <div><span>Sea Depth:</span> ~82m (Offshore Corridor)</div>
            <div><span>Uncertainty:</span> ±2.1 km (INCOIS ROMS)</div>
            <div><span>Ocean Current:</span> 0.82 kt @ 165° SSE</div>
            <div><span>Wind Leeway:</span> 14.2 kt @ 290° WNW (3.1%)</div>
          </div>
          <div class="popup-footer">Correlating AIS records within 15 NM at T₀...</div>
        </div>
      `);

    // 4. Render Forwardcast (Predicted Spread Cone on Sea Water)
    // Dispersion cone polygon
    const dispersionConeCoords = [
      [spill.coordinates.lat, spill.coordinates.lng],
      [19.04, 71.98],
      [19.14, 72.18],
      [19.08, 72.28],
      [18.96, 72.08]
    ];

    L.polygon(dispersionConeCoords, {
      color: '#06b6d4',
      weight: 1.5,
      dashArray: '5, 5',
      fillColor: '#0891b2',
      fillOpacity: 0.25,
      className: 'dispersion-cone-glow'
    }).addTo(this.layers.forwardcast);

    // Forwardcast centerline
    const forwardCoords = [
      [spill.coordinates.lat, spill.coordinates.lng],
      ...drift.forwardcastTrajectory.map(pt => [pt.lat, pt.lng])
    ];

    L.polyline(forwardCoords, {
      color: '#22d3ee',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.95
    }).addTo(this.layers.forwardcast);

    drift.forwardcastTrajectory.forEach(pt => {
      const fwdIcon = L.divIcon({
        className: 'fwd-time-icon',
        html: `<div class="fwd-badge">► ${pt.timeOffset}</div>`,
        iconSize: [48, 20],
        iconAnchor: [24, 10]
      });

      L.marker([pt.lat, pt.lng], { icon: fwdIcon })
        .addTo(this.layers.forwardcast)
        .bindTooltip(`Projected Spread: ${pt.timeOffset} (~${pt.spreadKm2} km²)`, { direction: 'bottom' });
    });

    // 5. Coastal Proximity Warning Line to Maharashtra Coastline
    const lastFwdPoint = drift.forwardcastTrajectory[drift.forwardcastTrajectory.length - 1];
    const alibaugShorePoint = [19.050, 72.860]; // Alibaug coastline

    L.polyline([[lastFwdPoint.lat, lastFwdPoint.lng], alibaugShorePoint], {
      color: '#f43f5e',
      weight: 2,
      dashArray: '4, 6',
      opacity: 0.8
    }).addTo(this.layers.coastalWarning);

    const coastalThreatIcon = L.divIcon({
      className: 'coastal-threat-icon',
      html: `<div class="coastal-threat-tag">⚠️ 18 NM to Alibaug Coast (+24h)</div>`,
      iconSize: [160, 24],
      iconAnchor: [80, 12]
    });

    L.marker([19.072, 72.540], { icon: coastalThreatIcon })
      .addTo(this.layers.coastalWarning)
      .bindTooltip("Coastal Alert: Inevitable shore impact within 24h unless boom containment deployed", { direction: 'top' });

    // 6. Hydrodynamic Sea Surface Current Vectors (INCOIS ROMS Simulation)
    const vectorCoords = [
      [18.98, 71.60], [18.92, 71.70], [18.86, 71.78], [18.80, 71.86],
      [18.74, 71.94], [18.68, 72.02], [18.88, 71.55], [18.82, 71.65],
      [18.76, 71.74], [18.95, 71.85], [19.02, 71.75], [18.70, 71.80]
    ];

    vectorCoords.forEach(pos => {
      const arrowIcon = L.divIcon({
        className: 'current-vector-icon',
        html: `<div class="current-arrow-animated" style="transform: rotate(165deg);">➔</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker(pos, { icon: arrowIcon }).addTo(this.layers.currentVectors)
        .bindTooltip("INCOIS ROMS Surface Current: 0.82 kts @ 165° SSE", { direction: 'right' });
    });
  }

  // Add Interactive Base Layer Switcher (Satellite Sea / Ocean Bathymetry / Tactical Dark)
  addBaseLayerSwitcher() {
    const switcher = L.control({ position: 'topleft' });
    switcher.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-layer-switcher');
      div.innerHTML = `
        <div class="switcher-title">SEA BASEMAP</div>
        <div class="switcher-buttons">
          <button class="layer-btn active" data-layer="satelliteSea" onclick="window.maritimeMap.switchBaseLayer('satelliteSea')">
            🌊 Satellite Sea
          </button>
          <button class="layer-btn" data-layer="oceanBathymetry" onclick="window.maritimeMap.switchBaseLayer('oceanBathymetry')">
            🗺️ Ocean Depth
          </button>
          <button class="layer-btn" data-layer="cartoDark" onclick="window.maritimeMap.switchBaseLayer('cartoDark')">
            🛰️ Tactical Dark
          </button>
        </div>
      `;
      return div;
    };
    switcher.addTo(this.map);
  }

  switchBaseLayer(layerName) {
    if (!this.baseLayers[layerName] || this.currentBaseLayer === layerName) return;

    this.map.removeLayer(this.baseLayers[this.currentBaseLayer]);
    this.baseLayers[layerName].addTo(this.map);
    this.currentBaseLayer = layerName;

    // Update active button state
    const buttons = document.querySelectorAll('.map-layer-switcher .layer-btn');
    buttons.forEach(btn => {
      if (btn.dataset.layer === layerName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  addOceanBanner() {
    const banner = L.control({ position: 'topright' });
    banner.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-ocean-telemetry-badge');
      div.innerHTML = `
        <div class="badge-row"><span class="pulse-dot"></span> <strong>ARABIAN SEA // SECTOR 04</strong></div>
        <div class="badge-sub">Current: 0.82 kts @ 165° | Wind: 14.2 kts @ 290° | Swell: 1.2m</div>
      `;
      return div;
    };
    banner.addTo(this.map);
  }

  renderVesselFeatures() {
    const vessels = window.BHARATSETU_DATA.suspectVessels;
    if (!vessels) return;

    vessels.forEach(vessel => {
      // Historical track
      const trackPoints = vessel.historicalTrack.map(pt => [pt.lat, pt.lng]);
      const isTopSuspect = vessel.rank === 1;

      // Track polyline
      const trackLayer = L.polyline(trackPoints, {
        color: isTopSuspect ? '#ef4444' : '#64748b',
        weight: isTopSuspect ? 3.5 : 2,
        dashArray: isTopSuspect ? '6, 4' : null,
        opacity: isTopSuspect ? 0.95 : 0.6
      }).addTo(this.layers.vesselTracks);

      this.vesselTrackLayers[vessel.id] = trackLayer;

      // Position at origin time (T0)
      const isBlackout = vessel.aisStatus.includes('GAP');
      const markerClass = isTopSuspect ? 'vessel-marker top-suspect' : 'vessel-marker';

      const vesselIcon = L.divIcon({
        className: 'custom-vessel-icon',
        html: `
          <div class="${markerClass}" id="marker-${vessel.id}">
            <div class="ship-glyph">${isTopSuspect ? '▲' : '▲'}</div>
            <div class="vessel-tag ${isTopSuspect ? 'danger' : ''}">#${vessel.rank} ${vessel.name.split(' ')[1] || vessel.name}</div>
            ${isTopSuspect ? '<div class="radar-ping"></div>' : ''}
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 20]
      });

      const marker = L.marker([vessel.posAtOriginTime.lat, vessel.posAtOriginTime.lng], { icon: vesselIcon })
        .addTo(this.layers.vessels);

      marker.bindPopup(`
        <div class="map-popup-card ${isTopSuspect ? 'danger' : 'neutral'}">
          <div class="popup-tag ${isTopSuspect ? 'danger' : 'neutral'}">
            ${isTopSuspect ? '🚨 PRIME SUSPECT VESSEL (RANK #1)' : `VESSEL RANK #${vessel.rank}`}
          </div>
          <div class="popup-title">${vessel.name}</div>
          <div class="popup-grid">
            <div><span>Flag:</span> ${vessel.flag} (${vessel.flagCode})</div>
            <div><span>Type:</span> ${vessel.type}</div>
            <div><span>MMSI:</span> ${vessel.mmsi}</div>
            <div><span>Distance at T₀:</span> <strong>${vessel.distanceFromOriginKm} km</strong></div>
            <div><span>Suspicion Score:</span> <strong class="${isTopSuspect ? 'text-red' : ''}">${vessel.suspicionScore}%</strong></div>
            <div><span>AIS Status:</span> <span class="badge ${vessel.aisStatusClass}">${vessel.aisStatus}</span></div>
          </div>
          ${isTopSuspect ? `
            <div class="popup-alert-box">
              ⚠️ <strong>AIS Blackout Detected:</strong> 2h 15m gap during discharge window.
              <br>Speed dropped 14.4 → 5.6 kts during transponder silence!
            </div>
          ` : ''}
        </div>
      `);

      marker.on('click', () => {
        this.selectVessel(vessel.id, false);
      });

      this.vesselMarkers[vessel.id] = marker;
    });
  }

  selectVessel(vesselId, zoomTo = true) {
    this.activeVesselId = vesselId;
    const vessel = window.BHARATSETU_DATA.suspectVessels.find(v => v.id === vesselId);
    if (!vessel) return;

    // Reset styles on all tracks
    Object.keys(this.vesselTrackLayers).forEach(id => {
      const isTop = id === 'vessel-1';
      const isSelected = id === vesselId;
      const layer = this.vesselTrackLayers[id];
      if (layer) {
        layer.setStyle({
          color: isSelected ? '#38bdf8' : (isTop ? '#ef4444' : '#475569'),
          weight: isSelected ? 4.5 : (isTop ? 3.5 : 2),
          opacity: isSelected ? 1 : 0.5
        });
        if (isSelected) layer.bringToFront();
      }
    });

    // Highlight row in table if present
    const rows = document.querySelectorAll('.vessel-table-row');
    rows.forEach(row => {
      if (row.dataset.vesselId === vesselId) {
        row.classList.add('selected-row');
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        row.classList.remove('selected-row');
      }
    });

    if (zoomTo && this.vesselMarkers[vesselId]) {
      const pos = [vessel.posAtOriginTime.lat, vessel.posAtOriginTime.lng];
      this.map.flyTo(pos, 11.5, { duration: 1.2 });
      this.vesselMarkers[vesselId].openPopup();
    }
  }

  setStageMode(stageNumber) {
    if (!this.map) return;

    if (stageNumber === 4) {
      // Stage 4: Focus on Ocean Drift Trajectory (Arabian Sea & Coastline)
      this.map.removeLayer(this.layers.vessels);
      this.map.removeLayer(this.layers.vesselTracks);
      this.layers.hindcast.addTo(this.map);
      this.layers.origin.addTo(this.map);
      this.layers.forwardcast.addTo(this.map);
      this.layers.coastalWarning.addTo(this.map);
      this.layers.currentVectors.addTo(this.map);
      this.layers.spill.addTo(this.map);

      // Pan to show the full sea expanse and trajectory from origin to offshore and coast
      this.map.flyTo([18.880, 71.940], 9.5, { duration: 1.2 });
    } else if (stageNumber === 5) {
      // Stage 5: Suspect vessel attribution mode — reveal vessels and AIS tracks
      this.layers.vessels.addTo(this.map);
      this.layers.vesselTracks.addTo(this.map);
      this.layers.hindcast.addTo(this.map);
      this.layers.origin.addTo(this.map);
      this.layers.spill.addTo(this.map);
      this.map.removeLayer(this.layers.coastalWarning);

      // Focus on the cluster around origin point at sea
      this.map.flyTo([18.790, 71.630], 11, { duration: 1.2 });

      // Automatically select and highlight top suspect
      setTimeout(() => {
        this.selectVessel('vessel-1', false);
      }, 400);
    }

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }

  addCustomLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'tactical-map-legend');
      div.innerHTML = `
        <div class="legend-header">🌊 SEA DRIFT & ATTRIBUTION LAYERS</div>
        <div class="legend-item"><span class="legend-box spill"></span> Oil Slick on Sea (12.4 km²)</div>
        <div class="legend-item"><span class="legend-line hindcast"></span> Hindcast Reverse Drift (-4.75h)</div>
        <div class="legend-item"><span class="legend-dot origin"></span> Probable Ground Zero (T₀)</div>
        <div class="legend-item"><span class="legend-box forward-cone"></span> Dispersion Spread (+24h)</div>
        <div class="legend-item"><span class="legend-line coastal-alert"></span> Coastal Buffer (18 NM to Shore)</div>
        <div class="legend-item"><span class="legend-box suspect-top"></span> Prime Suspect (AIS Gap)</div>
        <div class="legend-item"><span class="legend-line regular-vessel"></span> Cleared Traffic Corridor</div>
      `;
      return div;
    };
    legend.addTo(this.map);
  }

  addCoordinatesHud() {
    const hud = L.control({ position: 'bottomleft' });
    hud.onAdd = () => {
      const div = L.DomUtil.create('div', 'tactical-coords-hud');
      div.id = 'tactical-coords-hud';
      div.innerHTML = `
        <div class="hud-item"><span>SECTOR:</span> ARABIAN SEA / MUMBAI HIGH</div>
        <div class="hud-item"><span>CURRENT:</span> 0.82 kts @ 165° SSE</div>
        <div class="hud-item"><span>WIND:</span> 14.2 kts @ 290° WNW</div>
        <div class="hud-item" id="live-mouse-coords"><span>CURSOR:</span> 18.824°N, 71.750°E</div>
      `;
      return div;
    };
    hud.addTo(this.map);

    this.map.on('mousemove', e => {
      const el = document.getElementById('live-mouse-coords');
      if (el) {
        el.innerHTML = `<span>CURSOR:</span> ${e.latlng.lat.toFixed(3)}°N, ${e.latlng.lng.toFixed(3)}°E`;
      }
    });
  }

  resize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

window.maritimeMap = new MaritimeMapController('maritime-map');
