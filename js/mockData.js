/**
 * BharatSetu — Autonomous Maritime Spill Attribution System
 * Simulated Mock Data Engine for Smart India Hackathon Prototype
 */

const BHARATSETU_DATA = {
  metadata: {
    systemName: "BharatSetu",
    subtitle: "Autonomous Maritime Spill Attribution System",
    sector: "Arabian Sea — Mumbai Offshore Basin (Sector-04)",
    incidentId: "BS-2026-AS-0918-0042",
    classification: "RESTRICTED // OPERATIONAL DISPATCH",
    timestampUtc: "2026-09-18T03:45:00Z",
    timestampIst: "2026-09-18T09:15:00+05:30",
    dispatchedTo: [
      "Indian Coast Guard (MRCC Mumbai)",
      "Indian Navy Maritime Operations Center (MOC)",
      "Directorate General of Shipping (DG Shipping)",
      "State Pollution Control Board (Maharashtra)"
    ]
  },

  sources: [
    {
      id: "sar",
      name: "Sentinel-1 SAR Imagery",
      type: "Synthetic Aperture Radar (C-Band)",
      provider: "ESA Copernicus Hub / GEE Pipeline",
      frequency: "5.405 GHz (VV + VH Polarization)",
      resolution: "10m Pixel Spacing (IW GRD Mode)",
      status: "STREAMING",
      latency: "1.4s",
      lastTile: "S1B_IW_GRDH_1SDV_20260918T021542_IND_SEA",
      packetsPerSec: 142,
      dataRate: "18.4 MB/s"
    },
    {
      id: "incois",
      name: "INCOIS Ocean Data",
      type: "High-Res Hydrodynamic & MetOcean",
      provider: "INCOIS Hyderabad (ROMS + HF Radar)",
      frequency: "10-minute Vector Refresh",
      resolution: "0.05° Hydrodynamic Grid",
      status: "STREAMING",
      latency: "0.8s",
      lastTile: "INCOIS_MUMBAI_HIGH_UV_WIND_20260918",
      packetsPerSec: 88,
      dataRate: "4.2 MB/s"
    },
    {
      id: "ais",
      name: "AIS Vessel Stream",
      type: "Class-A Terrestrial & Satellite AIS",
      provider: "DG Shipping / National Marine Domain Awareness (NMDA)",
      frequency: "2–10 sec transponder bursts",
      resolution: "Real-time MMSI kinematics",
      status: "STREAMING",
      latency: "0.5s",
      lastTile: "AIS_CHAIN_WEST_COAST_ZONE4_REALTIME",
      packetsPerSec: 420,
      dataRate: "1.8 MB/s"
    }
  ],

  ingestionLogs: [
    { time: "02:15:42 UTC", level: "INFO", source: "COPERNICUS", msg: "Sentinel-1B IW GRD tile S1B_IW_GRDH_1SDV ingested via cloud webhook." },
    { time: "02:16:05 UTC", level: "SYS", source: "GEE-ENGINE", msg: "Initiating Earth Engine radiometric calibration (sigma-0 backscatter dB conversion)." },
    { time: "02:16:30 UTC", level: "INFO", source: "INCOIS-API", msg: "Pulling surface current vectors from INCOIS ROMS model [18.5N-19.5N, 71.0E-72.5E]." },
    { time: "02:17:10 UTC", level: "INFO", source: "INCOIS-API", msg: "Current: 0.82 kts @ 165° SSE | ECMWF 10m Wind: 14.2 kts @ 290° WNW." },
    { time: "02:17:45 UTC", level: "INFO", source: "NMDA-AIS", msg: "Querying spatial AIS buffer within 40 km radius of ROI for past 18 hours (48 vessels found)." },
    { time: "02:18:12 UTC", level: "SUCCESS", source: "FUSION-HUB", msg: "Multi-sensor ingestion complete. Pipeline ready for SAR speckle filtering & segmentation." }
  ],

  preprocessing: {
    engine: "Google Earth Engine + ESA SNAP Cloud Worker",
    inputRaw: "Sentinel-1B Raw GRD Level-1 (Speckle Variance: σ²=0.48)",
    calibration: "Thermal Noise Subtraction & Radiometric σ₀ Calibration",
    filter: "Enhanced Lee Adaptive Filter (Window: 7x7 pixels)",
    dynamicRange: "-28.4 dB to -4.2 dB",
    steps: [
      { name: "Radiometric Calibration", status: "Completed", detail: "Applying SAR calibration look-up tables for antenna pattern correction" },
      { name: "Speckle Noise Filtering", status: "Completed", detail: "Enhanced Lee 7x7 spatial filter preserving subtle oil-water dampening edges" },
      { name: "Terrain & Incidence Correction", status: "Completed", detail: "Local incident angle normalization (mean: 38.4°)" },
      { name: "Backscatter Contrast Enhancement", status: "Completed", detail: "Histogram equalization isolating low-backscatter oil film specular reflection" }
    ]
  },

  spillDetection: {
    status: "CONFIRMED",
    confidence: 94.2,
    algorithm: "DeepLabV3+ with Atrous Spatial Pyramid Pooling (ASPP)",
    sensor: "Sentinel-1B C-SAR (VV Polarisation)",
    spillAreaKm2: 12.4,
    estimatedVolumeBbls: 2450,
    estimatedVolumeTons: 390,
    slickType: "Heavy Crude Sludge / Fuel Oil Residue",
    coordinates: {
      lat: 18.924,
      lng: 71.852,
      locationName: "Offshore Mumbai High (52 NM West of Mumbai Coast)"
    },
    dampingRatio: "9.8 dB attenuation vs background sea clutter",
    threatLevel: "CRITICAL (Level-3 Marine Pollution Incident)",
    boundingPolygon: [
      [18.945, 71.835],
      [18.938, 71.870],
      [18.918, 71.875],
      [18.905, 71.850],
      [18.912, 71.830],
      [18.932, 71.825]
    ]
  },

  driftSimulation: {
    model: "Lagrangian Particle Dispersion Hydrodynamic Model (INCOIS ROMS + Wind Leeway)",
    observationTime: "2026-09-18 02:15 UTC (T_obs)",
    probableOriginTime: "2026-09-17 21:30 UTC (T_origin = T_obs - 4h 45m)",
    currentVector: {
      speedKts: 0.82,
      speedMs: 0.42,
      directionDeg: 165,
      directionText: "SSE (South-Southeast)"
    },
    windVector: {
      speedKts: 14.2,
      directionDeg: 290,
      directionText: "WNW (West-Northwest)",
      leewayFactor: "3.1% surface shear coefficient"
    },
    probableOrigin: {
      lat: 18.782,
      lng: 71.614,
      uncertaintyRadiusKm: 2.1,
      label: "Probable Spill Discharge Origin (T₀: 21:30 UTC)"
    },
    hindcastTrajectory: [
      { timeOffset: "0h (Detection)", time: "02:15 UTC", lat: 18.924, lng: 71.852 },
      { timeOffset: "-1h", time: "01:15 UTC", lat: 18.895, lng: 71.798 },
      { timeOffset: "-2h", time: "00:15 UTC", lat: 18.862, lng: 71.745 },
      { timeOffset: "-3h", time: "23:15 UTC", lat: 18.830, lng: 71.695 },
      { timeOffset: "-4h", time: "22:15 UTC", lat: 18.802, lng: 71.648 },
      { timeOffset: "-4.75h (Origin)", time: "21:30 UTC", lat: 18.782, lng: 71.614 }
    ],
    forwardcastTrajectory: [
      { timeOffset: "+6h", time: "08:15 UTC", lat: 18.968, lng: 71.935, spreadKm2: 18.2 },
      { timeOffset: "+12h", time: "14:15 UTC", lat: 19.015, lng: 72.030, spreadKm2: 27.6 },
      { timeOffset: "+24h", time: "02:15 UTC (+1d)", lat: 19.095, lng: 72.220, spreadKm2: 44.8, alert: "Coastline Proximity Warning: 18 NM from Alibaug Coastal Zone" }
    ]
  },

  suspectVessels: [
    {
      id: "vessel-1",
      rank: 1,
      name: "MT OCEAN ODYSSEY",
      flag: "Panama",
      flagCode: "PA",
      type: "Crude Oil Tanker",
      mmsi: 352001923,
      imo: 9248721,
      dwt: 115000,
      currentPos: { lat: 18.650, lng: 71.420 },
      posAtOriginTime: { lat: 18.788, lng: 71.609 },
      distanceFromOriginKm: 0.72,
      aisStatus: "GAP DETECTED",
      aisStatusClass: "danger",
      aisBlackoutDuration: "2h 15m (20:45 UTC – 23:00 UTC)",
      speedAnomaly: "Speed drop from 14.4 kts to 5.6 kts during blackout, followed by sudden acceleration to 15.2 kts",
      draughtChange: "Draught decreased by 0.38m (Indicates intentional bilgewater / slop tank discharge)",
      suspicionScore: 96.8,
      attributionConfidence: "CRITICAL // HIGH PROBABILITY OF DISCHARGE",
      historicalTrack: [
        { lat: 18.910, lng: 71.780, time: "19:30 UTC", speed: 14.4, ais: "Active" },
        { lat: 18.840, lng: 71.690, time: "20:30 UTC", speed: 14.2, ais: "Active" },
        { lat: 18.788, lng: 71.609, time: "21:30 UTC", speed: 5.6, ais: "SILENT (Extrapolated)" },
        { lat: 18.740, lng: 71.530, time: "22:45 UTC", speed: 6.2, ais: "SILENT (Extrapolated)" },
        { lat: 18.690, lng: 71.470, time: "23:15 UTC", speed: 14.8, ais: "Reconnected" },
        { lat: 18.650, lng: 71.420, time: "02:15 UTC", speed: 15.2, ais: "Active" }
      ]
    },
    {
      id: "vessel-2",
      rank: 2,
      name: "MV SAGAR RATNA",
      flag: "Marshall Islands",
      flagCode: "MH",
      type: "Bulk Carrier",
      mmsi: 538008412,
      imo: 9410294,
      dwt: 82000,
      currentPos: { lat: 18.710, lng: 71.740 },
      posAtOriginTime: { lat: 18.818, lng: 71.642 },
      distanceFromOriginKm: 4.8,
      aisStatus: "ACTIVE (Normal)",
      aisStatusClass: "success",
      aisBlackoutDuration: "None (Continuous Stream)",
      speedAnomaly: "Steady cruising speed 12.1 kts ± 0.3 kts",
      draughtChange: "Nominal (No change)",
      suspicionScore: 34.2,
      attributionConfidence: "LOW PROBABILITY (Passer-by Corridor)",
      historicalTrack: [
        { lat: 18.890, lng: 71.720, time: "20:00 UTC", speed: 12.1, ais: "Active" },
        { lat: 18.818, lng: 71.642, time: "21:30 UTC", speed: 12.0, ais: "Active" },
        { lat: 18.710, lng: 71.740, time: "02:15 UTC", speed: 12.2, ais: "Active" }
      ]
    },
    {
      id: "vessel-3",
      rank: 3,
      name: "MT PACIFIC PIONEER",
      flag: "Liberia",
      flagCode: "LR",
      type: "Chemical Tanker",
      mmsi: 636019842,
      imo: 9385412,
      dwt: 47000,
      currentPos: { lat: 18.580, lng: 71.820 },
      posAtOriginTime: { lat: 18.730, lng: 71.685 },
      distanceFromOriginKm: 9.4,
      aisStatus: "ACTIVE (Normal)",
      aisStatusClass: "success",
      aisBlackoutDuration: "None",
      speedAnomaly: "Steady 13.5 kts",
      draughtChange: "Nominal",
      suspicionScore: 18.5,
      attributionConfidence: "NEGLIGIBLE (Outside Dispersion Zone)",
      historicalTrack: [
        { lat: 18.820, lng: 71.740, time: "20:30 UTC", speed: 13.4, ais: "Active" },
        { lat: 18.730, lng: 71.685, time: "21:30 UTC", speed: 13.5, ais: "Active" },
        { lat: 18.580, lng: 71.820, time: "02:15 UTC", speed: 13.6, ais: "Active" }
      ]
    },
    {
      id: "vessel-4",
      rank: 4,
      name: "MSC SHRESTHA",
      flag: "Singapore",
      flagCode: "SG",
      type: "Container Ship",
      mmsi: 563098124,
      imo: 9784102,
      dwt: 140000,
      currentPos: { lat: 18.980, lng: 71.490 },
      posAtOriginTime: { lat: 18.890, lng: 71.510 },
      distanceFromOriginKm: 15.6,
      aisStatus: "ACTIVE (Normal)",
      aisStatusClass: "success",
      aisBlackoutDuration: "None",
      speedAnomaly: "Constant 18.8 kts",
      draughtChange: "Nominal",
      suspicionScore: 8.1,
      attributionConfidence: "CLEARED (Traffic Lane Separation)",
      historicalTrack: [
        { lat: 18.800, lng: 71.530, time: "21:00 UTC", speed: 18.7, ais: "Active" },
        { lat: 18.890, lng: 71.510, time: "21:30 UTC", speed: 18.8, ais: "Active" },
        { lat: 18.980, lng: 71.490, time: "02:15 UTC", speed: 18.9, ais: "Active" }
      ]
    },
    {
      id: "vessel-5",
      rank: 5,
      name: "AL-SABAH STAR",
      flag: "Oman",
      flagCode: "OM",
      type: "General Cargo",
      mmsi: 461002391,
      imo: 9154203,
      dwt: 28000,
      currentPos: { lat: 18.620, lng: 71.890 },
      posAtOriginTime: { lat: 18.680, lng: 71.790 },
      distanceFromOriginKm: 21.2,
      aisStatus: "ACTIVE (Normal)",
      aisStatusClass: "success",
      aisBlackoutDuration: "None",
      speedAnomaly: "Constant 11.2 kts",
      draughtChange: "Nominal",
      suspicionScore: 4.2,
      attributionConfidence: "CLEARED (Non-matching Kinematics)",
      historicalTrack: [
        { lat: 18.680, lng: 71.790, time: "21:30 UTC", speed: 11.2, ais: "Active" },
        { lat: 18.620, lng: 71.890, time: "02:15 UTC", speed: 11.3, ais: "Active" }
      ]
    }
  ],

  legalClauses: [
    { code: "Merchant Shipping Act, 1958 (India)", section: "Section 356(J)", desc: "Prohibition on intentional discharge of oil or oily mixture in Indian EEZ and Territorial Waters." },
    { code: "MARPOL 73/78 Annex I", reg: "Regulation 9/10", desc: "Mandatory compliance for oily bilge water separation (<15 ppm) and total prohibition within special maritime zones." },
    { code: "UNCLOS 1982", article: "Article 211 & 217", desc: "Enforcement jurisdiction of coastal state to penalize vessel-source pollution through satellite and electronic evidence." }
  ]
};

// Export to global scope for browser and node
if (typeof window !== 'undefined') {
  window.BHARATSETU_DATA = BHARATSETU_DATA;
}
if (typeof global !== 'undefined') {
  global.BHARATSETU_DATA = BHARATSETU_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BHARATSETU_DATA;
}
