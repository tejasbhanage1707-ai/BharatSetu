/**
 * BharatSetu — Autonomous Maritime Spill Attribution System
 * Official Incident Dossier & Report Generator
 * Generates print-ready / downloadable PDF intelligence dossier for Indian Coast Guard & Indian Navy
 */

class ReportGenerator {
  constructor() {
    this.reportContainerId = 'report-preview-document';
  }

  renderReport() {
    const container = document.getElementById(this.reportContainerId);
    if (!container) return;

    const data = window.BHARATSETU_DATA;
    const topVessel = data.suspectVessels[0];

    // Grab SAR detection canvas snapshot
    const sarImgUrl = window.sarRenderer ? window.sarRenderer.getSnapshotUrl('detection') : '';

    container.innerHTML = `
      <div class="official-dossier-paper">
        <!-- Official Header -->
        <div class="dossier-header">
          <div class="header-emblem">
            <div class="emblem-crest">🇮🇳</div>
            <div class="header-titles">
              <h3>GOVERNMENT OF INDIA</h3>
              <h4>National Technical Research Organisation</h4>
              <h2>BHARATSETU // AUTONOMOUS MARITIME SPILL ATTRIBUTION SYSTEM</h2>
            </div>
          </div>
          <div class="header-meta">
            <div class="stamp-box restricted">RESTRICTED // OPERATIONAL ALERT</div>
            <div class="meta-row"><span>INCIDENT ID:</span> <strong>${data.metadata.incidentId}</strong></div>
            <div class="meta-row"><span>DATETIME:</span> <strong>18-SEP-2026 03:45 UTC / 09:15 IST</strong></div>
            <div class="meta-row"><span>SECTOR:</span> <strong>${data.metadata.sector}</strong></div>
          </div>
        </div>

        <!-- Dispatch Confirmation Banner -->
        <div class="dispatch-banner">
          <div class="dispatch-icon">🛡️</div>
          <div class="dispatch-content">
            <div class="dispatch-title">AUTOMATED OPERATIONAL DISPATCH CONFIRMED</div>
            <div class="dispatch-sub">
              Electronic incident packet transmitted via Secure Coastal Defence Data Network to:
              <br><strong>${data.metadata.dispatchedTo.join(' • ')}</strong>
            </div>
          </div>
          <div class="dispatch-status-tag">TRANSMITTED (ACK: OK)</div>
        </div>

        <!-- Section 1: Executive Summary & Evidence Grid -->
        <div class="dossier-section">
          <div class="section-badge">SECTION 01 // SATELLITE DETECTION & OCEANOGRAPHIC HINDCAST</div>
          <div class="dossier-grid-2col">
            <!-- Satellite Evidence Box -->
            <div class="evidence-box">
              <div class="evidence-header">
                <span>SAR SATELLITE EVIDENCE (SENTINEL-1 C-BAND)</span>
                <span class="badge-tag">ASPP U-NET (CONF: 94.2%)</span>
              </div>
              <div class="evidence-preview-wrap">
                ${sarImgUrl ? `<img src="${sarImgUrl}" alt="SAR Detection Snapshot" class="report-sar-img" />` : '<div class="sar-placeholder">SAR Snapshot Generated</div>'}
              </div>
              <div class="evidence-meta-table">
                <div class="cell"><span>Detection Time:</span> 02:15 UTC</div>
                <div class="cell"><span>Centroid Coords:</span> 18.924°N, 71.852°E</div>
                <div class="cell"><span>Calculated Slick Area:</span> 12.4 km²</div>
                <div class="cell"><span>Est. Discharge Volume:</span> ~2,450 Barrels (~390 MT)</div>
                <div class="cell"><span>Substance:</span> Heavy Sludge / Hydrocarbon Residue</div>
                <div class="cell"><span>Radar Damping Ratio:</span> 9.8 dB (Capillary attenuation)</div>
              </div>
            </div>

            <!-- Hindcast Drift Matrix -->
            <div class="evidence-box">
              <div class="evidence-header">
                <span>REVERSE DRIFT TRAJECTORY (INCOIS ROMS + LEEWAY)</span>
                <span class="badge-tag">T₀: 21:30 UTC (-4.75h)</span>
              </div>
              <div class="drift-summary-card">
                <div class="drift-origin-banner">
                  <div class="origin-tag">🎯 PROBABLE GROUND ZERO (T₀)</div>
                  <div class="origin-coords">18.782° N, 71.614° E (±2.1 km)</div>
                  <div class="origin-time">Discharge Window: 17-SEP 21:15 to 21:45 UTC</div>
                </div>
                <div class="vector-grid">
                  <div class="vector-stat">
                    <span class="label">Ocean Current:</span>
                    <span class="val">0.82 kts @ 165° (SSE)</span>
                  </div>
                  <div class="vector-stat">
                    <span class="label">ECMWF Surface Wind:</span>
                    <span class="val">14.2 kts @ 290° (WNW)</span>
                  </div>
                  <div class="vector-stat">
                    <span class="label">Wind Leeway Factor:</span>
                    <span class="val">3.1% Surface Shear</span>
                  </div>
                  <div class="vector-stat">
                    <span class="label">Forward Coastal Threat:</span>
                    <span class="val text-amber">Alibaug Sector (+24h)</span>
                  </div>
                </div>
                <div class="drift-notes">
                  Hindcast derived using Eulerian-Lagrangian trajectory backtracking across 6 hydrodynamic hourly timesteps. Ground zero intersects international shipping transit lane 4A off Mumbai High.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Prime Suspect Attribution Dossier -->
        <div class="dossier-section">
          <div class="section-badge alert-red">SECTION 02 // PRIME SUSPECT VESSEL ATTRIBUTION</div>
          <div class="suspect-highlight-card">
            <div class="suspect-flag-header">
              <div class="vessel-identity">
                <span class="rank-badge">RANK #1 PRIME SUSPECT</span>
                <h4>${topVessel.name}</h4>
                <span class="vessel-meta-sub">Flag: ${topVessel.flag} | Type: ${topVessel.type} | IMO: ${topVessel.imo} | MMSI: ${topVessel.mmsi} | DWT: ${topVessel.dwt.toLocaleString()} MT</span>
              </div>
              <div class="score-display">
                <div class="score-num">${topVessel.suspicionScore}%</div>
                <div class="score-lbl">ATTRIBUTION SCORE</div>
              </div>
            </div>

            <div class="suspect-evidence-grid">
              <div class="anomaly-col">
                <h5>⚠️ CRITICAL ANOMALIES RECORDED:</h5>
                <ul>
                  <li><strong>Distance at T₀:</strong> Only <strong>${topVessel.distanceFromOriginKm} km</strong> from hydrodynamic ground zero.</li>
                  <li><strong>AIS Transponder Gap:</strong> <strong>${topVessel.aisBlackoutDuration}</strong> intentional transponder blackout during the discharge timeframe.</li>
                  <li><strong>Speed Deceleration Anomaly:</strong> Cruising speed abruptly plummeted from <strong>14.4 kts to 5.6 kts</strong> inside the origin radius, then accelerated back to 15.2 kts post-blackout.</li>
                  <li><strong>Hydrostatic Draught Variation:</strong> Recorded <strong>0.38m draft reduction</strong> across the transit corridor, consistent with tank washing / bilgewater de-ballasting.</li>
                </ul>
              </div>
              <div class="legal-col">
                <h5>STATUTORY VIOLATIONS & LEGAL BASIS:</h5>
                <ul>
                  <li><strong>Merchant Shipping Act 1958, Sec 356(J):</strong> Criminal liability for deliberate oil discharge in Indian Exclusive Economic Zone.</li>
                  <li><strong>MARPOL 73/78 Annex I, Reg 9/10:</strong> Breach of oily-mixture discharge threshold (&gt;15 ppm).</li>
                  <li><strong>SOLAS Chapter V, Reg 19:</strong> Unlawful deactivation of AIS transponder in international shipping corridor.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Ranked Vessel Correlation Matrix -->
        <div class="dossier-section">
          <div class="section-badge">SECTION 03 // FULL CORRIDOR TRAFFIC SCREENING MATRIX</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Vessel Name</th>
                <th>Flag / Type</th>
                <th>Distance at T₀</th>
                <th>AIS Integrity</th>
                <th>Kinematic Profile</th>
                <th>Attribution Score</th>
              </tr>
            </thead>
            <tbody>
              ${data.suspectVessels.map(v => `
                <tr class="${v.rank === 1 ? 'row-critical' : ''}">
                  <td><span class="rank-chip ${v.rank === 1 ? 'rank-1' : ''}">#${v.rank}</span></td>
                  <td><strong>${v.name}</strong><br><small>MMSI: ${v.mmsi}</small></td>
                  <td>${v.flag}<br><small>${v.type}</small></td>
                  <td><strong>${v.distanceFromOriginKm} km</strong></td>
                  <td><span class="table-badge ${v.aisStatusClass}">${v.aisStatus}</span></td>
                  <td><small>${v.rank === 1 ? 'Speed drop 14.4→5.6 kt' : 'Steady cruising'}</small></td>
                  <td><strong class="${v.rank === 1 ? 'text-red' : ''}">${v.suspicionScore}%</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Dossier Footer & Sign-off -->
        <div class="dossier-footer">
          <div class="signoff-box">
            <div class="sig-line">AUTOMATED SYSTEM VALIDATION</div>
            <div class="sig-name">BharatSetu Autonomous Core v2.4</div>
            <div class="sig-time">Cryptographic Hash: SHA256: 9b8f...4e12c</div>
          </div>
          <div class="classification-footer">
            RESTRICTED // FOR OFFICIAL USE OF INDIAN COAST GUARD & INDIAN NAVY
            <div class="disclaimer-sub">SIMULATED DATA PROTOTYPE FOR SMART INDIA HACKATHON EVALUATION</div>
          </div>
        </div>
      </div>
    `;
  }

  downloadPDF() {
    window.print();
  }

  copyDispatchMemo() {
    const data = window.BHARATSETU_DATA;
    const memo = `
================================================================================
GOVERNMENT OF INDIA // BHARATSETU AUTONOMOUS MARITIME ATTRIBUTION
OPERATIONAL DISPATCH ALERT // RESTRICTED
INCIDENT ID: ${data.metadata.incidentId}
DATETIME: 18-SEP-2026 03:45 UTC / 09:15 IST
SECTOR: ${data.metadata.sector}
================================================================================
1. SPILL DETECTION:
   - SENSOR: Sentinel-1B C-Band SAR (VV Polarisation)
   - CONFIDENCE: 94.2% | AREA: 12.4 km2 | EST. VOLUME: 2,450 Bbls (~390 MT)
   - CURRENT COORDS: 18.924° N, 71.852° E (Off Mumbai High)

2. HYDRODYNAMIC HINDCAST:
   - GROUND ZERO (T0): 18.782° N, 71.614° E (Time: 21:30 UTC)
   - VECTOR: Current 0.82 kt @ 165° SSE | Wind 14.2 kt @ 290° WNW

3. PRIME SUSPECT VESSEL:
   - VESSEL: MT OCEAN ODYSSEY (Flag: Panama, MMSI: 352001923, IMO: 9248721)
   - ATTRIBUTION SCORE: 96.8% [CRITICAL]
   - DISTANCE AT T0: 0.72 km
   - AIS INTEGRITY: GAP DETECTED (2h 15m blackout during discharge window)
   - KINEMATICS: Sudden speed drop from 14.4 to 5.6 kts; 0.38m draught reduction

4. ACTION DIRECTIVE:
   - Request ICG Dornier-228 Maritime Surveillance intercept
   - Fast Patrol Vessel (FPV) dispatched from Mumbai Command
================================================================================
    `.trim();

    navigator.clipboard.writeText(memo).then(() => {
      if (window.showToast) {
        window.showToast('✅ Official Dispatch Memo copied to clipboard!');
      } else {
        alert('Official Dispatch Memo copied to clipboard!');
      }
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }
}

window.reportGenerator = new ReportGenerator();
