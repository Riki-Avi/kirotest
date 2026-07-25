// voice.js — Módulo de reconocimiento de voz (SpeechRecognition + Whisper AI)
window.KiroVoice = (function () {
    const micBtn = document.getElementById('micBtn');
    const messageInput = document.getElementById('messageInput');

    let recognition = null;
    let isSpeechActive = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecordingAudio = false;

    function init(onAudioTranscription) {
        if (!micBtn || !messageInput) return;

        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognitionClass();
            recognition.lang = navigator.language || 'es-AR';
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                isSpeechActive = true;
                micBtn.classList.add('recording');
                micBtn.title = 'Escuchando en vivo... Haz clic para detener';
                messageInput.placeholder = '🎙️ Escuchando... habla ahora...';
                window.KiroUI?.showToast('🎙️ Escuchando... habla ahora');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    finalTranscript += event.results[i][0].transcript;
                }
                if (finalTranscript) {
                    messageInput.value = finalTranscript;
                }
            };

            recognition.onerror = (event) => {
                console.warn('SpeechRecognition error:', event.error);
                stopSpeech();
                if (event.error === 'network') {
                    startAudioRecording(onAudioTranscription);
                }
            };

            recognition.onend = () => {
                if (isSpeechActive) {
                    stopSpeech();
                }
            };
        }

        micBtn.addEventListener('click', async () => {
            if (isSpeechActive) {
                stopSpeech();
            } else if (isRecordingAudio) {
                stopAudioRecording();
            } else {
                if (recognition) {
                    try {
                        recognition.start();
                    } catch (err) {
                        startAudioRecording(onAudioTranscription);
                    }
                } else {
                    startAudioRecording(onAudioTranscription);
                }
            }
        });
    }

    function stopSpeech() {
        isSpeechActive = false;
        if (recognition) recognition.stop();
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.title = 'Hablar por micrófono';
        }
        if (messageInput) {
            messageInput.placeholder = 'Escribe o habla por micrófono para consultar al mentor...';
        }
    }

    async function startAudioRecording(onTranscription) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                if (onTranscription) onTranscription(audioBlob);
            };

            mediaRecorder.start();
            isRecordingAudio = true;
            micBtn?.classList.add('recording');
            window.KiroUI?.showToast('🎙️ Grabando audio para Whisper AI...');
        } catch (err) {
            alert('No se pudo acceder al micrófono: ' + err.message);
        }
    }

    function stopAudioRecording() {
        if (mediaRecorder && isRecordingAudio) {
            mediaRecorder.stop();
            isRecordingAudio = false;
            micBtn?.classList.remove('recording');
        }
    }

    return {
        init,
        stopSpeech
    };
})();
