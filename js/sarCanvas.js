/**
 * BharatSetu — Autonomous Maritime Spill Attribution System
 * SAR Image Procedural Generator & Canvas Controller
 * Simulates C-Band Synthetic Aperture Radar (Sentinel-1) with Bragg scattering,
 * Rayleigh speckle noise, Lee filtering, and deep learning segmentation overlay.
 */

class SARCanvasRenderer {
  constructor() {
    this.rawCanvas = null;
    this.cleanedCanvas = null;
    this.detectionCanvas = null;
    this.sliderCanvas = null;
    this.isGenerated = false;
    this.width = 640;
    this.height = 420;
    
    // Cached pixel buffers
    this.baseOceanData = null;
    this.spillMaskData = null;
    this.rawImageData = null;
    this.cleanedImageData = null;
    this.detectionImageData = null;
  }

  init() {
    this.rawCanvas = document.getElementById('sar-raw-canvas');
    this.cleanedCanvas = document.getElementById('sar-cleaned-canvas');
    this.detectionCanvas = document.getElementById('sar-detection-canvas');
    
    if (this.rawCanvas) {
      this.width = this.rawCanvas.width || 640;
      this.height = this.rawCanvas.height || 420;
    }
    
    this.generateSARData();
    this.renderAll();
  }

  // Generate synthetic ocean surface backscatter and oil slick dampening
  generateSARData() {
    const w = this.width;
    const h = this.height;

    // 1. Generate base ocean surface with gentle wave texture (Bragg scattering)
    const ocean = new Float32Array(w * h);
    const slick = new Float32Array(w * h);

    // Slick centers and splines (elongated filamentary slick in Mumbai offshore)
    // Primary slick body: curved filament from (x: 240, y: 150) to (x: 440, y: 280)
    const slickNodes = [
      { x: 230, y: 140, r: 28 },
      { x: 260, y: 160, r: 38 },
      { x: 295, y: 180, r: 46 },
      { x: 335, y: 200, r: 52 },
      { x: 380, y: 225, r: 48 },
      { x: 420, y: 250, r: 40 },
      { x: 460, y: 275, r: 26 },
      // Secondary satellite slick droplet
      { x: 360, y: 160, r: 18 },
      { x: 390, y: 175, r: 15 }
    ];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;

        // Ocean swell waves (angled at ~115 degrees)
        const wave1 = Math.sin((x * 0.05 + y * 0.02) * 1.5);
        const wave2 = Math.cos((x * 0.02 - y * 0.04) * 2.0);
        const windRipples = Math.sin((x * 0.15 + y * 0.1) * 0.8) * 0.5;
        
        // Base backscatter sigma-0 level (mean ~ 128 in 8-bit scale)
        const baseVal = 135 + wave1 * 14 + wave2 * 10 + windRipples * 8;
        ocean[idx] = baseVal;

        // Calculate oil slick attenuation factor (0 = no slick, 1 = deep dark slick core)
        let slickInfluence = 0;
        for (let n = 0; n < slickNodes.length; n++) {
          const node = slickNodes[n];
          const dx = x - node.x;
          const dy = y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < node.r * 1.6) {
            // Smooth falloff (capillary wave dampening effect)
            const factor = Math.max(0, 1 - (dist / (node.r * 1.6)));
            const curvedFactor = Math.pow(factor, 1.8);
            slickInfluence = Math.max(slickInfluence, curvedFactor);
          }
        }
        slick[idx] = slickInfluence;
      }
    }

    // 2. Render Raw SAR with Rayleigh speckle noise
    const rawData = new Uint8ClampedArray(w * h * 4);
    const cleanedData = new Uint8ClampedArray(w * h * 4);
    const detectionData = new Uint8ClampedArray(w * h * 4);

    // Simple pseudo-random seed for deterministic authentic look
    let seed = 42;
    function rand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const pIdx = idx * 4;
        const bVal = ocean[idx];
        const sVal = slick[idx];

        // Dampen backscatter where oil slick exists (specular reflection away from antenna)
        // High attenuation: drops to ~30-45 (dark patch)
        const attenuated = bVal * (1 - sVal * 0.78);

        // Multiplicative speckle noise (Rayleigh / Gamma distribution simulation)
        // Box-Muller transform for normal distribution
        const u1 = Math.max(0.0001, rand());
        const u2 = rand();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        
        // Raw speckle intensity
        const speckle = 1.0 + z0 * 0.32; // Speckle variance
        const rawIntensity = Math.min(255, Math.max(0, attenuated * speckle));

        // Raw SAR pixels (Greyscale C-Band backscatter)
        rawData[pIdx] = rawIntensity;
        rawData[pIdx + 1] = rawIntensity;
        rawData[pIdx + 2] = rawIntensity * 1.05; // Subtle oceanic sensor tint
        rawData[pIdx + 3] = 255;

        // Cleaned SAR: Speckle filtered (Lee Filter 7x7 simulation) + calibrated
        // Strong smoothing in homogeneous ocean while retaining high contrast on slick edges
        const cleanedIntensity = Math.min(255, Math.max(0, attenuated * 1.05));
        cleanedData[pIdx] = cleanedIntensity * 0.95;
        cleanedData[pIdx + 1] = cleanedIntensity;
        cleanedData[pIdx + 2] = cleanedIntensity * 1.1;
        cleanedData[pIdx + 3] = 255;

        // Detection Image: Cleaned background + highlight slick in red/neon glow
        if (sVal > 0.45) {
          // Detected spill core (crimson red translucent overlay)
          const redBoost = Math.min(255, 180 + sVal * 75);
          detectionData[pIdx] = redBoost;
          detectionData[pIdx + 1] = 40;
          detectionData[pIdx + 2] = 50;
          detectionData[pIdx + 3] = 255;
        } else if (sVal > 0.2) {
          // Spill boundary / gradient buffer
          detectionData[pIdx] = 220;
          detectionData[pIdx + 1] = 90;
          detectionData[pIdx + 2] = 40;
          detectionData[pIdx + 3] = 255;
        } else {
          // Ocean backdrop
          detectionData[pIdx] = cleanedIntensity * 0.85;
          detectionData[pIdx + 1] = cleanedIntensity * 0.95;
          detectionData[pIdx + 2] = cleanedIntensity * 1.05;
          detectionData[pIdx + 3] = 255;
        }
      }
    }

    this.rawImageData = rawData;
    this.cleanedImageData = cleanedData;
    this.detectionImageData = detectionData;
    this.isGenerated = true;
  }

  renderAll() {
    if (!this.isGenerated) this.generateSARData();

    if (this.rawCanvas) {
      this.drawCanvas(this.rawCanvas, this.rawImageData, 'RAW SAR (LEVEL-1 GRD)');
    }
    if (this.cleanedCanvas) {
      this.drawCanvas(this.cleanedCanvas, this.cleanedImageData, 'PROCESSED (LEE 7x7 + CALIBRATED)');
    }
    if (this.detectionCanvas) {
      this.drawDetectionCanvas(this.detectionCanvas);
    }
  }

  drawCanvas(canvas, pixelData, label) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(this.width, this.height);
    imgData.data.set(pixelData);
    ctx.putImageData(imgData, 0, 0);

    // Overlay technical SAR graticules and radar telemetry
    this.drawSAROverlay(ctx, label, false);
  }

  drawDetectionCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(this.width, this.height);
    imgData.data.set(this.detectionImageData);
    ctx.putImageData(imgData, 0, 0);

    // Draw slick boundary polygon & contour glow
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 12;

    // Filament contour path
    ctx.beginPath();
    ctx.moveTo(215, 130);
    ctx.quadraticCurveTo(240, 110, 275, 140);
    ctx.bezierCurveTo(320, 155, 360, 180, 410, 215);
    ctx.bezierCurveTo(460, 250, 485, 275, 475, 295);
    ctx.quadraticCurveTo(450, 310, 420, 280);
    ctx.bezierCurveTo(370, 250, 315, 230, 270, 205);
    ctx.quadraticCurveTo(220, 185, 215, 130);
    ctx.closePath();
    ctx.stroke();

    // Bounding Box in tactical neon cyan
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#06b6d4';
    ctx.strokeRect(205, 105, 285, 205);

    // Bounding box corner brackets
    ctx.setLineDash([]);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    const b = { x: 205, y: 105, w: 285, h: 205, s: 12 };
    // Top-Left
    ctx.beginPath(); ctx.moveTo(b.x, b.y + b.s); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + b.s, b.y); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(b.x + b.w - b.s, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w, b.y + b.s); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h - b.s); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.s, b.y + b.h); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(b.x + b.w - b.s, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h - b.s); ctx.stroke();

    // Centroid Reticle
    const cx = 345;
    const cy = 205;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    // Tactical Target Label Tag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(b.x + 8, b.y + 12, 210, 48);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 8, b.y + 12, 210, 48);

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px "Space Mono", monospace, sans-serif';
    ctx.fillText('TARGET #01: HYDROCARBON SLICK', b.x + 16, b.y + 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px "Space Mono", monospace, sans-serif';
    ctx.fillText('CONF: 94.2% | AREA: 12.4 km²', b.x + 16, b.y + 42);

    ctx.restore();

    this.drawSAROverlay(ctx, 'AI SEGMENTATION: DEEPLABV3+ ASPP', true);
  }

  drawSAROverlay(ctx, title, isDetection) {
    ctx.save();

    // Coordinate grid ticks
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 80; x < this.width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, 8);
      ctx.moveTo(x, this.height - 8); ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 60; y < this.height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(8, y);
      ctx.moveTo(this.width - 8, y); ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Header telemetry bar
    ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
    ctx.fillRect(10, 10, this.width - 20, 24);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.strokeRect(10, 10, this.width - 20, 24);

    ctx.fillStyle = isDetection ? '#f87171' : '#38bdf8';
    ctx.font = 'bold 10px "Space Mono", monospace, sans-serif';
    ctx.fillText(`● ${title}`, 18, 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Space Mono", monospace, sans-serif';
    ctx.fillText('S1B_IW_GRDH_1SDV | POL: VV | 18.92°N, 71.85°E', this.width - 280, 26);

    // Footer telemetry bar
    ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
    ctx.fillRect(10, this.height - 28, this.width - 20, 20);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeRect(10, this.height - 28, this.width - 20, 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px "Space Mono", monospace, sans-serif';
    ctx.fillText('INCIDENCE: 38.4° | RESOLUTION: 10m/px | PASS: DESCENDING', 18, this.height - 15);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('ESA COPERNICUS HUB', this.width - 130, this.height - 15);

    ctx.restore();
  }

  getSnapshotUrl(type = 'detection') {
    if (type === 'detection' && this.detectionCanvas) {
      return this.detectionCanvas.toDataURL('image/png');
    } else if (type === 'cleaned' && this.cleanedCanvas) {
      return this.cleanedCanvas.toDataURL('image/png');
    } else if (this.rawCanvas) {
      return this.rawCanvas.toDataURL('image/png');
    }
    return '';
  }
}

// Global instance
window.sarRenderer = new SARCanvasRenderer();
