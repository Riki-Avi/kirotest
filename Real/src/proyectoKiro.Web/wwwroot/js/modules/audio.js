// audio.js — Sintetizador de Ruido Marrón con Web Audio API para Kiro Code Lab
window.KiroAudio = (function () {
    let audioCtx = null;
    let noiseSource = null;
    let gainNode = null;
    let isAudioPlaying = false;

    function createBrownNoiseBuffer(ctx) {
        const bufferSize = 5 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
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
                    audioToggleBtn.innerHTML = '<span class="audio-icon">&#10074;&#10074;</span> DETENER RUIDO MARRÓN';
                    audioToggleBtn.style.background = '#FF4500';
                    audioToggleBtn.style.color = '#000000';
                } else {
                    stopAudio();
                    audioToggleBtn.innerHTML = '<span class="audio-icon">&#9654;</span> ACTIVAR RUIDO MARRÓN';
                    audioToggleBtn.style.background = 'rgba(255, 69, 0, 0.1)';
                    audioToggleBtn.style.color = '#FF4500';
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
    }

    function startAudio(initialVol = 0.5) {
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

    return {
        init,
        startAudio,
        stopAudio
    };
})();
