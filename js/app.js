/**
 * BharatSetu — Autonomous Maritime Spill Attribution System
 * Master Application Controller & Simulation State Machine
 */

class BharatSetuApp {
  constructor() {
    this.currentStage = 1;
    this.totalStages = 6;
    this.isSimulating = false;
    this.simTimer = null;
    this.simSpeed = 1; // 1x or 2x
    this.stageDuration = 3200; // ms per stage in 1x
    this.countdownTimer = null;
    this.countdownRemaining = 0;
    
    this.stages = [
      { id: 1, name: "Data Ingestion", desc: "Multi-Sensor Fusion (Sentinel-1 + INCOIS + AIS)" },
      { id: 2, name: "SAR Preprocessing", desc: "GEE Radiometric Calibration & Speckle Filtering" },
      { id: 3, name: "Spill Detection", desc: "AI Segmentation & Area Estimation" },
      { id: 4, name: "Drift Trajectory", desc: "Hydrodynamic Hindcast & Forwardcast Modeling" },
      { id: 5, name: "Suspect Ranking", desc: "AIS Gap Analysis & Spatial-Temporal Attribution" },
      { id: 6, name: "Automated Dossier", desc: "Official ICG / Navy Operational Dispatch" }
    ];
  }

  init() {
    this.initClock();
    this.initStepper();
    this.initEventListeners();
    this.initDataIngestionLogs();
    this.initSuspectTable();
    
    // Initialize SAR canvases
    if (window.sarRenderer) {
      window.sarRenderer.init();
    }

    // Set initial stage
    this.goToStage(1, false);
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toUTCString().replace('GMT', 'UTC');
      
      // IST is UTC + 5:30
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const istHours = String(istTime.getUTCHours()).padStart(2, '0');
      const istMinutes = String(istTime.getUTCMinutes()).padStart(2, '0');
      const istSeconds = String(istTime.getUTCSeconds()).padStart(2, '0');
      const istString = `${istHours}:${istMinutes}:${istSeconds} IST`;

      const clockEl = document.getElementById('mission-clock');
      if (clockEl) {
        clockEl.innerHTML = `<span class="clock-utc">${utcString.slice(17, 25)} UTC</span> | <span class="clock-ist">${istString}</span>`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  initStepper() {
    const stepperContainer = document.getElementById('progress-stepper');
    if (!stepperContainer) return;

    stepperContainer.innerHTML = this.stages.map(stage => `
      <div class="step-item ${stage.id === 1 ? 'active' : ''}" data-step="${stage.id}" onclick="window.app.goToStage(${stage.id})">
        <div class="step-circle">
          <span class="step-num">${stage.id}</span>
          <span class="step-check">✓</span>
        </div>
        <div class="step-content">
          <div class="step-title">${stage.name}</div>
          <div class="step-sub">${stage.desc}</div>
        </div>
        ${stage.id < this.totalStages ? '<div class="step-connector"></div>' : ''}
      </div>
    `).join('');
  }

  initEventListeners() {
    // Nav buttons
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const runSimBtn = document.getElementById('btn-run-sim');
    const speedBtn = document.getElementById('btn-sim-speed');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStage());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStage());
    }
    if (runSimBtn) {
      runSimBtn.addEventListener('click', () => this.toggleSimulation());
    }
    if (speedBtn) {
      speedBtn.addEventListener('click', () => this.toggleSpeed());
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        this.nextStage();
      } else if (e.key === 'ArrowLeft') {
        this.previousStage();
      } else if (e.key === ' ') {
        e.preventDefault();
        this.toggleSimulation();
      }
    });

    // Window resize handler for Leaflet and Canvases
    window.addEventListener('resize', () => {
      if (window.maritimeMap) {
        window.maritimeMap.resize();
      }
    });
  }

  initDataIngestionLogs() {
    const logContainer = document.getElementById('terminal-log-stream');
    if (!logContainer) return;

    // Clear any previous interval/timers
    if (this.logTimers) {
      this.logTimers.forEach(t => clearTimeout(t));
    }
    this.logTimers = [];

    const logs = window.BHARATSETU_DATA.ingestionLogs;
    logContainer.innerHTML = '';
    
    logs.forEach((log, index) => {
      const t = setTimeout(() => {
        const entry = document.createElement('div');
        entry.className = `log-line level-${log.level.toLowerCase()}`;
        entry.innerHTML = `
          <span class="log-time">[${log.time}]</span>
          <span class="log-src">[${log.source}]</span>
          <span class="log-msg">${log.msg}</span>
        `;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
      }, index * 260);
      this.logTimers.push(t);
    });
  }

  initSuspectTable() {
    const tbody = document.getElementById('suspect-table-body');
    if (!tbody) return;

    const vessels = window.BHARATSETU_DATA.suspectVessels;
    tbody.innerHTML = vessels.map(vessel => {
      const isTop = vessel.rank === 1;
      return `
        <tr class="vessel-table-row ${isTop ? 'row-critical-alert' : ''}" 
            data-vessel-id="${vessel.id}"
            onclick="window.maritimeMap.selectVessel('${vessel.id}')">
          <td>
            <span class="rank-badge-cell ${isTop ? 'rank-1' : ''}">#${vessel.rank}</span>
          </td>
          <td>
            <div class="vessel-name-cell">
              <strong>${vessel.name}</strong>
              <small>${vessel.flag} (${vessel.flagCode}) • IMO: ${vessel.imo}</small>
            </div>
          </td>
          <td>
            <div class="dist-cell">
              <strong>${vessel.distanceFromOriginKm} km</strong>
              <small>at T₀ (21:30 UTC)</small>
            </div>
          </td>
          <td>
            <span class="status-pill ${vessel.aisStatusClass}">
              ${isTop ? '⚠️ ' : '● '}${vessel.aisStatus}
            </span>
            ${isTop ? `<div class="gap-note">${vessel.aisBlackoutDuration}</div>` : ''}
          </td>
          <td>
            <div class="anomaly-cell">
              <span class="anomaly-tag ${isTop ? 'danger' : 'normal'}">
                ${isTop ? 'Speed drop 14.4→5.6 kt + 0.38m draft loss' : 'Normal transit kinematics'}
              </span>
            </div>
          </td>
          <td>
            <div class="score-bar-wrapper">
              <div class="score-val ${isTop ? 'text-red' : ''}">${vessel.suspicionScore}%</div>
              <div class="score-track">
                <div class="score-fill ${isTop ? 'fill-red' : 'fill-teal'}" style="width: ${vessel.suspicionScore}%"></div>
              </div>
            </div>
          </td>
          <td>
            <button class="btn-inspect-vessel" onclick="event.stopPropagation(); window.maritimeMap.selectVessel('${vessel.id}', true)">
              Inspect
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  goToStage(stageNumber, resetSim = false) {
    if (stageNumber < 1 || stageNumber > this.totalStages) return;

    this.currentStage = stageNumber;

    // Update screen visibility
    for (let i = 1; i <= this.totalStages; i++) {
      const stageEl = document.getElementById(`stage-${i}`);
      if (stageEl) {
        if (i === stageNumber) {
          stageEl.classList.add('active');
          stageEl.style.display = 'block';
        } else {
          stageEl.classList.remove('active');
          stageEl.style.display = 'none';
        }
      }
    }

    // Update Stepper UI
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach(item => {
      const step = parseInt(item.dataset.step);
      if (step === stageNumber) {
        item.classList.add('active');
        item.classList.remove('completed');
      } else if (step < stageNumber) {
        item.classList.remove('active');
        item.classList.add('completed');
      } else {
        item.classList.remove('active');
        item.classList.remove('completed');
      }
    });

    // Update Nav Buttons
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.disabled = (stageNumber === 1);
    if (nextBtn) {
      if (stageNumber === this.totalStages) {
        nextBtn.innerHTML = 'Finish Simulation ✓';
        nextBtn.disabled = true;
      } else {
        nextBtn.innerHTML = 'Next Stage ➔';
        nextBtn.disabled = false;
      }
    }

    // Stage specific lifecycle handlers
    this.onStageEnter(stageNumber);

    if (resetSim && this.isSimulating) {
      this.stopSimulation();
    }
  }

  onStageEnter(stageNumber) {
    switch (stageNumber) {
      case 1:
        // Restart log streaming if empty
        this.initDataIngestionLogs();
        break;

      case 2:
        // Trigger SAR Canvas redraw & GEE progress bar animation
        if (window.sarRenderer) {
          window.sarRenderer.renderAll();
        }
        this.animateGEEProgress();
        break;

      case 3:
        // Render detection highlight
        if (window.sarRenderer) {
          window.sarRenderer.renderAll();
        }
        break;

      case 4:
      case 5:
        // Initialize or reposition Leaflet Map
        const mapContainer = document.getElementById('maritime-map');
        const mapMountPoint = document.getElementById(`map-mount-stage-${stageNumber}`);
        
        if (mapContainer && mapMountPoint && mapContainer.parentElement !== mapMountPoint) {
          mapMountPoint.appendChild(mapContainer);
        }

        if (window.maritimeMap) {
          if (!window.maritimeMap.initialized) {
            window.maritimeMap.init();
          }
          window.maritimeMap.setStageMode(stageNumber);
          setTimeout(() => window.maritimeMap.resize(), 50);
          setTimeout(() => window.maritimeMap.resize(), 250);
        }
        break;

      case 6:
        // Render official report preview
        if (window.reportGenerator) {
          window.reportGenerator.renderReport();
        }
        break;
    }
  }

  animateGEEProgress() {
    const pbar = document.getElementById('gee-progress-bar');
    const statusText = document.getElementById('gee-status-text');
    if (!pbar) return;

    pbar.style.width = '0%';
    const steps = [
      { pct: 25, text: "Fetching Sentinel-1B GRD tile from Copernicus..." },
      { pct: 55, text: "Applying Thermal Noise Removal & Radiometric Calibration..." },
      { pct: 85, text: "Executing Enhanced Lee 7x7 speckle suppression..." },
      { pct: 100, text: "Calibration Complete: σ₀ Backscatter normalized [-28.4 dB to -4.2 dB]" }
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        pbar.style.width = `${step.pct}%`;
        if (statusText) statusText.innerText = step.text;
      }, i * 600);
    });
  }

  nextStage() {
    if (this.currentStage < this.totalStages) {
      this.goToStage(this.currentStage + 1);
    }
  }

  previousStage() {
    if (this.currentStage > 1) {
      this.goToStage(this.currentStage - 1);
    }
  }

  toggleSimulation() {
    if (this.isSimulating) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  startSimulation() {
    this.isSimulating = true;
    const runBtn = document.getElementById('btn-run-sim');
    if (runBtn) {
      runBtn.innerHTML = '⏸ Pause Simulation';
      runBtn.classList.add('sim-active');
    }

    if (this.currentStage === this.totalStages) {
      this.goToStage(1);
    }

    this.runSimStep();
  }

  stopSimulation() {
    this.isSimulating = false;
    clearTimeout(this.simTimer);
    clearInterval(this.countdownTimer);
    const runBtn = document.getElementById('btn-run-sim');
    if (runBtn) {
      runBtn.innerHTML = '▶ Run Simulation';
      runBtn.classList.remove('sim-active');
    }
    const indicator = document.getElementById('sim-indicator');
    if (indicator) indicator.style.display = 'none';
  }

  runSimStep() {
    if (!this.isSimulating) return;

    const duration = this.stageDuration / this.simSpeed;
    const indicator = document.getElementById('sim-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      indicator.innerHTML = `Auto-Advancing in ${(duration / 1000).toFixed(1)}s (Stage ${this.currentStage}/6)...`;
    }

    this.simTimer = setTimeout(() => {
      if (this.currentStage < this.totalStages) {
        this.nextStage();
        this.runSimStep();
      } else {
        this.stopSimulation();
        this.showToast('✅ Full BharatSetu Pipeline Simulation Complete!');
      }
    }, duration);
  }

  toggleSpeed() {
    this.simSpeed = this.simSpeed === 1 ? 2 : 1;
    const speedBtn = document.getElementById('btn-sim-speed');
    if (speedBtn) {
      speedBtn.innerText = `${this.simSpeed}x Speed`;
    }
    if (this.isSimulating) {
      clearTimeout(this.simTimer);
      this.runSimStep();
    }
  }

  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}

// Global App Instance
window.app = new BharatSetuApp();
window.showToast = (msg) => window.app.showToast(msg);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
