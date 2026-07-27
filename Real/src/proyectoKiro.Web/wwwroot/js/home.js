/**
 * CODELAB — Clean 3D Laboratory Flask ASCII Engine (Home Landing)
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const fpsCounter = document.getElementById('fps-counter');
  const nodeCounter = document.getElementById('node-counter');
  const menuDrawer = document.getElementById('menu-drawer');
  const menuToggleBtn = document.getElementById('menu-toggle-btn');
  const closeMenuBtn = document.getElementById('close-menu-btn');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');
  const scrollIndicator = document.getElementById('scroll-indicator');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const startBtn = document.getElementById('start-btn');
  
  // Sliders & Buttons
  const speedRange = document.getElementById('speed-range');
  const densityRange = document.getElementById('density-range');
  const distortionRange = document.getElementById('distortion-range');
  const presetBtns = document.querySelectorAll('.preset-btn');

  // ASCII Engine Settings
  let fontSize = 16;
  let cols = 0;
  let rows = 0;
  let charWidth = fontSize * 0.58;
  let charHeight = fontSize * 0.85;
  
  let currentPreset = 'flask';
  let rotationSpeed = 1.0;
  let mouseDistortionPower = 0.5;
  
  // Animation State
  let time = 0;
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;
  
  // Mouse State
  let mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    radius: 160
  };

  const asciiLiquidDrop = ["@", "#", "%", "W", "M", "8", "&", "~", "o", "°", "*"];

  // Canvas Resize Handler
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    charWidth = fontSize * 0.58;
    charHeight = fontSize * 0.85;
    
    cols = Math.floor(canvas.width / charWidth);
    rows = Math.floor(canvas.height / charHeight);
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Mouse Input Listeners
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
    }
  });

  // --------------------------------------------------------------------------
  // Clean 3D Laboratory Flask Geometry Calculation (Upright)
  // --------------------------------------------------------------------------
  function getFlaskData(x, y, z, t, ripple) {
    const scale = 0.68;
    x = x / scale;
    y = y / scale;
    z = z / scale;

    let r = Math.sqrt(x * x + z * z);
    let density = 0;
    let type = 'none';
    let charHint = null;

    let baseY = -1.0;
    let neckBaseY = -0.15;
    let rimTopY = 0.85;
    let bodyRadius = 0;
    let isInsideFlask = false;

    if (y >= baseY && y < neckBaseY) {
      let factor = (y - neckBaseY) / (baseY - neckBaseY);
      bodyRadius = 0.22 + factor * 0.63;
    } else if (y >= neckBaseY && y < rimTopY - 0.06) {
      bodyRadius = 0.22;
    } else if (y >= rimTopY - 0.06 && y <= rimTopY) {
      bodyRadius = 0.25;
    }

    // Glass Wall
    if (bodyRadius > 0) {
      let distToWall = Math.abs(r - bodyRadius);
      if (distToWall < 0.04) {
        density = 1.0;
        type = 'glass';
        charHint = (y >= neckBaseY) ? '|' : ((x > 0) ? '\\' : '/');
      } else if (distToWall < 0.075) {
        density = 0.45;
        type = 'glass-glow';
        charHint = ':';
      } else if (r < bodyRadius - 0.035) {
        isInsideFlask = true;
      }
    }

    // Flat Base
    if (y >= baseY - 0.05 && y <= baseY + 0.02 && r <= 0.88) {
      if (Math.abs(y - baseY) < 0.035) {
        density = 1.0;
        type = 'glass';
        charHint = '=';
      }
    }

    // Graduation Ticks (250ml, 150ml, 50ml)
    if (y >= baseY + 0.15 && y <= neckBaseY - 0.08 && x < -0.1 && z > -0.25 && z < 0.25) {
      let leftWallX = - (0.22 + ((y - neckBaseY) / (baseY - neckBaseY)) * 0.63);
      if (Math.abs(x - leftWallX) < 0.11) {
        let t1 = Math.abs(y - (-0.70));
        let t2 = Math.abs(y - (-0.50));
        let t3 = Math.abs(y - (-0.30));
        if (t1 < 0.022 || t2 < 0.022 || t3 < 0.022) {
          density = 1.0;
          type = 'tick';
          charHint = '-';
        }
      }
    }

    // Liquid Fill inside Flask
    let liquidSurfaceY = -0.35 + Math.sin(x * 8 + t * 3.5 + ripple) * 0.03 + Math.cos(z * 8 + t * 2.5) * 0.03;
    if (isInsideFlask && y < liquidSurfaceY && y > baseY + 0.02) {
      if (Math.abs(y - liquidSurfaceY) < 0.05) {
        density = 1.0;
        type = 'liquid-surface';
        charHint = '~';
      } else {
        let turbulence = Math.sin(x * 14 + y * 12 + t * 4) * Math.cos(z * 14 + t * 3);
        density = 0.85 + turbulence * 0.15;
        type = 'liquid';
      }
    }

    // Rising Bubbles
    if (isInsideFlask && y < liquidSurfaceY && y > baseY + 0.04) {
      const bubbles = [
        { bx: -0.15, bz: 0.05, speed: 0.9, phase: 0 },
        { bx: 0.18, bz: -0.1, speed: 1.1, phase: 1.4 },
        { bx: 0.02, bz: 0.15, speed: 0.8, phase: 2.8 },
        { bx: -0.08, bz: -0.12, speed: 1.3, phase: 4.1 },
        { bx: 0.12, bz: 0.08, speed: 1.0, phase: 5.3 }
      ];
      for (let b of bubbles) {
        let bY = baseY + 0.08 + ((t * b.speed + b.phase) % (liquidSurfaceY - baseY - 0.08));
        let bX = b.bx + Math.sin(t * 3.5 + b.phase) * 0.04;
        let bZ = b.bz + Math.cos(t * 3.0 + b.phase) * 0.04;
        let distB = Math.sqrt((x - bX)*(x - bX) + (y - bY)*(y - bY) + (z - bZ)*(z - bZ));
        if (distB < 0.055) {
          density = 1.0;
          type = 'bubble';
          charHint = (distB < 0.028) ? 'O' : 'o';
        }
      }
    }

    // Steam Particles
    if (y > rimTopY + 0.02 && y < rimTopY + 1.1 && r < 0.35) {
      let sY = y - rimTopY;
      let sX = Math.sin(sY * 6.0 - t * 5.0) * 0.06 * sY;
      let sZ = Math.cos(sY * 5.0 - t * 4.0) * 0.06 * sY;
      let distS = Math.sqrt((x - sX)*(x - sX) + (z - sZ)*(z - sZ));
      if (distS < (0.12 + sY * 0.12)) {
        let alpha = (1.0 - sY / 1.1) * (Math.sin(sY * 9.0 - t * 6.0) * 0.5 + 0.5);
        if (alpha > 0.15 && density < alpha) {
          density = alpha * 0.85;
          type = 'steam';
          charHint = (alpha > 0.5) ? 'S' : 's';
        }
      }
    }

    return { density, type, charHint };
  }

  // --------------------------------------------------------------------------
  // Main Render Loop
  // --------------------------------------------------------------------------
  function render() {
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    time += 0.02 * rotationSpeed;
    frameCount++;

    const now = performance.now();
    if (now - lastTime >= 500) {
      fps = Math.round((frameCount * 1000) / (now - lastTime));
      if (fpsCounter) fpsCounter.textContent = fps;
      if (nodeCounter) nodeCounter.textContent = (cols * rows).toLocaleString();
      frameCount = 0;
      lastTime = now;
    }

    ctx.fillStyle = '#030304';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';

    // Interactive 3D Rotation with gentle auto-sway
    const rotY = (mouse.x / canvas.width - 0.5) * 1.5 + Math.sin(time * 0.4) * 0.12;
    const rotX = (mouse.y / canvas.height - 0.5) * 0.25;
    
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    for (let r = 0; r < rows; r++) {
      const py = r * charHeight;
      const screenY = py + charHeight / 2;

      for (let c = 0; c < cols; c++) {
        const px = c * charWidth;
        const screenX = px + charWidth / 2;

        let nx = (screenX / canvas.width - 0.5) * 2.4;
        let ny = -(screenY / canvas.height - 0.5) * 2.4;
        
        const dx = screenX - mouse.x;
        const dy = screenY - mouse.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        let ripple = 0;
        
        if (distToMouse < mouse.radius * 2) {
          ripple = Math.sin(distToMouse * 0.05 - time * 6) * Math.exp(-distToMouse * 0.01) * mouseDistortionPower;
        }

        let density = 0;
        let charColor = '#ffffff';
        let charToDraw = ' ';

        if (currentPreset === 'flask') {
          let wx = nx;
          let wy = ny + ripple * 0.15;
          let wz = 0;

          // 3D Point Rotation
          let x1 = wx * cosY + wz * sinY;
          let z1 = -wx * sinY + wz * cosY;
          let y1 = wy * cosX - z1 * sinX;
          let z2 = wy * sinX + z1 * cosX;

          let res = getFlaskData(x1, y1, z2, time, ripple);
          density = res.density;

          if (density > 0.03) {
            if (res.type === 'glass') {
              charColor = `rgba(190, 220, 240, ${Math.min(0.75, density * 0.85)})`;
              charToDraw = res.charHint || '|';
            } else if (res.type === 'glass-glow') {
              charColor = `rgba(110, 150, 190, ${density * 0.5})`;
              charToDraw = res.charHint || ':';
            } else if (res.type === 'tick') {
              charColor = 'rgba(220, 220, 220, 0.75)';
              charToDraw = '-';
            } else if (res.type === 'liquid-surface') {
              charColor = 'rgba(255, 100, 0, 0.82)';
              charToDraw = '~';
            } else if (res.type === 'liquid') {
              charColor = `rgba(220, 55, 0, ${Math.min(0.75, density * 0.8)})`;
              charToDraw = asciiLiquidDrop[Math.floor(density * (asciiLiquidDrop.length - 1))];
            } else if (res.type === 'bubble') {
              charColor = 'rgba(255, 200, 40, 0.80)';
              charToDraw = res.charHint || 'O';
            } else if (res.type === 'steam') {
              charColor = `rgba(170, 170, 200, ${density * 0.6})`;
              charToDraw = res.charHint || '~';
            }
          }
        } else if (currentPreset === 'dragonfly') {
          let wx = nx, wy = ny + ripple * 0.3, wz = 0;
          let x1 = wx * cosY + wz * sinY, z1 = -wx * sinY + wz * cosY;
          let y1 = wy * cosX - z1 * sinX, z2 = wy * sinX + z1 * cosX;
          let headDist = Math.sqrt(x1*x1 + y1*y1 + (z2 - 1.2)*(z2 - 1.2));
          density = Math.max(0, Math.exp(-headDist * 6.0) * 1.5);
          if (density > 0.05) {
            charColor = `rgba(255, 90, 20, ${density})`;
            charToDraw = '@';
          }
        }

        if (density > 0.03 && charToDraw !== ' ') {
          ctx.fillStyle = charColor;
          ctx.fillText(charToDraw, px, py);
        }
      }
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // --------------------------------------------------------------------------
  // UI Interactions & Controls
  // --------------------------------------------------------------------------
  if (menuToggleBtn && menuDrawer) {
    menuToggleBtn.addEventListener('click', () => {
      menuDrawer.classList.toggle('open');
    });
  }

  if (closeMenuBtn && menuDrawer) {
    closeMenuBtn.addEventListener('click', () => {
      menuDrawer.classList.remove('open');
    });
  }

  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      const modes = ['flask', 'dragonfly', 'terrain', 'vortex', 'particles'];
      let nextIdx = (modes.indexOf(currentPreset) + 1) % modes.length;
      setPreset(modes[nextIdx]);
    });
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      setPreset(preset);
    });
  });

  function setPreset(preset) {
    currentPreset = preset;
    presetBtns.forEach(b => {
      if (b.getAttribute('data-preset') === preset) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  if (speedRange) {
    speedRange.addEventListener('input', (e) => {
      rotationSpeed = parseFloat(e.target.value);
    });
  }

  if (densityRange) {
    densityRange.addEventListener('input', () => {
      resizeCanvas();
    });
  }

  if (distortionRange) {
    distortionRange.addEventListener('input', (e) => {
      mouseDistortionPower = parseFloat(e.target.value) / 50;
    });
  }

  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      window.scrollTo({
        top: window.innerHeight * 0.9,
        behavior: 'smooth'
      });
    });
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      window.location.href = '/editor';
    });
  }

  // Ambient Web Audio Synthesizer (Genuine Brown Noise)
  let audioCtx = null;
  let noiseSource = null;
  let gainNode = null;
  let isAudioPlaying = false;
  const volumeRange = document.getElementById('volume-range');

  function createBrownNoiseBuffer(ctx) {
    const bufferSize = 5 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }
    return buffer;
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      if (!isAudioPlaying) {
        startAudio();
        audioToggleBtn.innerHTML = '<span class="audio-icon">&#10074;&#10074;</span> DETENER RUIDO MARRÓN';
        audioToggleBtn.style.background = 'var(--accent-orange)';
        audioToggleBtn.style.color = '#000000';
      } else {
        stopAudio();
        audioToggleBtn.innerHTML = '<span class="audio-icon">&#9654;</span> ACTIVAR RUIDO MARRÓN (FOCUS)';
        audioToggleBtn.style.background = 'rgba(255, 69, 0, 0.1)';
        audioToggleBtn.style.color = 'var(--accent-orange)';
      }
      isAudioPlaying = !isAudioPlaying;
    });
  }

  if (volumeRange) {
    volumeRange.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (gainNode && audioCtx) {
        gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    });
  }

  function startAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const brownBuffer = createBrownNoiseBuffer(audioCtx);
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = brownBuffer;
    noiseSource.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);

    gainNode = audioCtx.createGain();
    const initialVol = volumeRange ? parseFloat(volumeRange.value) : 0.5;
    gainNode.gain.setValueAtTime(initialVol, audioCtx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
  }

  function stopAudio() {
    if (noiseSource) {
      try {
        noiseSource.stop();
        noiseSource.disconnect();
      } catch (e) {}
      noiseSource = null;
    }
  }
});

