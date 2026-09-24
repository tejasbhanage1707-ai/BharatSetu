# BharatSetu — Autonomous Maritime Spill Attribution System
### Smart India Hackathon (SIH) Interactive Prototype & Demo Video Package

> **Disclaimer:** *Prototype — Simulated Data for Demo Purposes.* Developed specifically for Smart India Hackathon video demonstration, showcasing an autonomous end-to-end maritime oil spill detection and suspect attribution pipeline.

---

## 🌟 Quick Start Instructions

1. **Launch Directly in Any Browser:**
   - Double-click `index.html` or open `file:///C:/Users/Admin/.gemini/antigravity/scratch/bharatsetu-maritime-spill/index.html` in Google Chrome, Microsoft Edge, or Firefox.
   - Zero installation or backend required! All simulations, Leaflet cartography, SAR image processing, and reporting run 100% client-side.

2. **Or Run with a Local Server (Optional):**
   ```bash
   # From this directory:
   npx serve .
   # OR with Python:
   python -m http.server 8080
   ```

---

## 🎥 One-Take Video Recording Guide for SIH Submission

To record your SIH pitch video in one continuous, professional take without awkward clicking:

1. Open `index.html` in full screen (press `F11`).
2. Hit screen record (e.g., OBS Studio, Windows Xbox Game Bar `Win + Alt + R`).
3. Click the prominent **`▶ Run Simulation`** button in the header.
4. The system will automatically advance through all 6 pipeline stages with realistic pacing (approx 3.2 seconds per stage).
5. You can speak to each stage using the suggested voiceover script below!
6. Use `1x / 2x Speed` or the top stepper to pause/jump to any stage during Q&A with the hackathon judges.

---

## 🎙️ Suggested Voiceover Pitch Script (60–90 Seconds)

- **[0:00 - Stage 1: Data Ingestion]**
  *"Welcome to BharatSetu — an autonomous, multi-sensor maritime surveillance and spill attribution system built to protect Indian territorial waters and the Exclusive Economic Zone. At Stage 1, the cloud pipeline continuously ingests Sentinel-1 SAR imagery from Copernicus, hydrodynamic surface current models from INCOIS, and Class-A vessel AIS transponder feeds from DG Shipping."*

- **[0:15 - Stage 2: SAR Preprocessing]**
  *"At Stage 2, raw Level-1 SAR radar imagery undergoes radiometric calibration and incidence angle correction via Google Earth Engine, suppressing speckle noise using an Enhanced Lee 7x7 filter while preserving crisp surfactant boundary contrasts."*

- **[0:30 - Stage 3: Spill Detection]**
  *"At Stage 3, our DeepLabV3+ deep learning segmentation model detects an unlawful hydrocarbon discharge 52 nautical miles west of Mumbai High, with 94.2% confidence and an estimated area of 12.4 square kilometers."*

- **[0:45 - Stage 4: Drift Hindcast]**
  *"At Stage 4, BharatSetu executes a reverse Lagrangian drift simulation using INCOIS ROMS ocean current vectors and wind leeway, backtracking the slick 4 hours and 45 minutes to its exact hydrodynamic discharge ground zero at 21:30 UTC."*

- **[1:00 - Stage 5: Suspect Vessel Attribution]**
  *"At Stage 5, the system correlates historical AIS transponder telemetry against the ground zero. Notice how the MT Ocean Odyssey is automatically flagged with a 96.8% attribution score — it deliberately turned off its AIS transponder for 2 hours and 15 minutes right at ground zero, while decelerating from 14.4 to 5.6 knots."*

- **[1:15 - Stage 6: Automated Dossier & Dispatch]**
  *"Finally, at Stage 6, BharatSetu auto-compiles a legally grounded operational incident dossier citing the Merchant Shipping Act 1958 and MARPOL Annex I, instantaneously dispatching actionable intelligence to the Indian Coast Guard and Indian Navy for immediate offshore interception."*

---

## 🏗️ Technical Pipeline & Realism Architecture

| Stage | Domain Science / Tech Stack | Realistic Simulated Specifications |
|---|---|---|
| **1. Data Ingestion** | Multi-Sensor Fusion | Sentinel-1B C-SAR (VV), INCOIS ROMS 0.05° Hydrodynamic grid, NMDA AIS stream |
| **2. SAR Preprocessing** | Radar Signal Processing | Rayleigh speckle noise simulation, $\sigma_0$ radiometric calibration, Enhanced Lee adaptive spatial filtering |
| **3. Detection** | Computer Vision / Deep Learning | DeepLabV3+ ASPP neural segmentation, capillary wave damping attenuation ($9.8\text{ dB}$ ratio), 12.4 km² slick |
| **4. Drift Hindcasting** | Oceanographic Physics | Reverse Eulerian-Lagrangian trajectory backtracking: Current $0.82\text{ kts} @ 165^\circ$ + Wind $14.2\text{ kts} @ 290^\circ$ ($3.1\%$ surface shear) |
| **5. Vessel Attribution** | Spatial-Temporal Analytics | AIS blackout gap detection, speed deceleration anomaly, draft change analysis, spatial distance at $T_0$ |
| **6. Incident Dossier** | Maritime Law & Command Dispatch | Citing Merchant Shipping Act 1958 Sec 356(J), MARPOL Annex I, UNCLOS Art 211, auto-transmitted to ICG MRCC Mumbai |

---

## 📂 Project Structure

```
bharatsetu-maritime-spill/
├── index.html              # Main application entrypoint with all 6 connected stages
├── css/
│   └── style.css           # Tactical dark-ocean command center styling, glassmorphism, responsive layout
├── js/
│   ├── mockData.js         # Comprehensive simulated dataset (MetOcean, AIS, Sentinel-1, Vessels)
│   ├── sarCanvas.js        # Procedural SAR radar generator (speckle noise, Lee filter, detection mask)
│   ├── mapController.js    # Leaflet.js engine (hindcast/forwardcast trajectories, vessels, popups)
│   ├── reportGenerator.js  # Print-ready official incident report & dispatch memo generator
│   └── app.js              # State machine, simulation auto-play sequence, event listeners
└── README.md               # Video recording script, technical architecture, and usage guide
```
