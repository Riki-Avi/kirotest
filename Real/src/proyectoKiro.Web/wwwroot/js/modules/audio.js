// audio.js — Sintetizador de Ambiente Cyberpunk con Web Audio API para Kiro Code Lab
window.KiroAudio = (function () {
    let audioCtx = null;
    let noiseSource = null;
    let osc1 = null;
    let osc2 = null;
    let lfo = null;
    let masterGain = null;
    let isAudioPlaying = false;

    function createNoiseBuffer(ctx) {
        const bufferSize = 5 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 2.8;
        }
        return buffer;
    }

    function init() {
        const audioToggleBtn = document.getElementById('audio-toggle-btn');
        const volumeRange = document.getElementById('volume-range');

        if (audioToggleBtn) {
            audioToggleBtn.addEventListener('click', () => {
                if (!isAudioPlaying) {
                    startAudio(volumeRange ? parseFloat(volumeRange.value) : 0.5);
                    audioToggleBtn.innerHTML = '<span class="audio-icon">&#10074;&#10074;</span> DETENER AMBIENTE CYBERPUNK';
                    audioToggleBtn.style.background = '#FF4500';
                    audioToggleBtn.style.color = '#000000';
                } else {
                    stopAudio();
                    audioToggleBtn.innerHTML = '<span class="audio-icon">&#9654;</span> ACTIVAR AMBIENTE CYBERPUNK';
                    audioToggleBtn.style.background = 'rgba(255, 69, 0, 0.1)';
                    audioToggleBtn.style.color = '#FF4500';
                }
                isAudioPlaying = !isAudioPlaying;
            });
        }

        if (volumeRange) {
            volumeRange.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (masterGain && audioCtx) {
                    masterGain.gain.setValueAtTime(val, audioCtx.currentTime);
                }
            });
        }
    }

    function startAudio(initialVol = 0.5) {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(initialVol, audioCtx.currentTime);

        // 1. Capa de Ruido Sub-bass (220Hz Lowpass Filter)
        const noiseBuffer = createNoiseBuffer(audioCtx);
        noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(220, audioCtx.currentTime);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(masterGain);
        noiseSource.start();

        // 2. Oscilador Sub-bass Drone (55Hz Sawtooth + Lowpass Filter Resonante)
        osc1 = audioCtx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, audioCtx.currentTime);

        const osc1Filter = audioCtx.createBiquadFilter();
        osc1Filter.type = 'lowpass';
        osc1Filter.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc1Filter.Q.setValueAtTime(3.0, audioCtx.currentTime);

        const osc1Gain = audioCtx.createGain();
        osc1Gain.gain.setValueAtTime(0.35, audioCtx.currentTime);

        osc1.connect(osc1Filter);
        osc1Filter.connect(osc1Gain);
        osc1Gain.connect(masterGain);
        osc1.start();

        // 3. Oscilador Pad de Atmósfera Pulsante (110Hz Triangle + LFO Sweep)
        osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(110, audioCtx.currentTime);

        const osc2Gain = audioCtx.createGain();
        osc2Gain.gain.setValueAtTime(0.2, audioCtx.currentTime);

        // LFO para modulaciones suaves (0.15Hz)
        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.15, audioCtx.currentTime);

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc2Gain.gain);

        osc2.connect(osc2Gain);
        osc2Gain.connect(masterGain);
        osc2.start();
        lfo.start();

        masterGain.connect(audioCtx.destination);
    }

    function stopAudio() {
        if (noiseSource) {
            try { noiseSource.stop(); noiseSource.disconnect(); } catch (e) {}
            noiseSource = null;
        }
        if (osc1) {
            try { osc1.stop(); osc1.disconnect(); } catch (e) {}
            osc1 = null;
        }
        if (osc2) {
            try { osc2.stop(); osc2.disconnect(); } catch (e) {}
            osc2 = null;
        }
        if (lfo) {
            try { lfo.stop(); lfo.disconnect(); } catch (e) {}
            lfo = null;
        }
    }

    return {
        init,
        startAudio,
        stopAudio
    };
})();
