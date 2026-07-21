document.addEventListener('DOMContentLoaded', () => {
    // Estado de la aplicación
    let personalities = [];
    let activePersonality = null;
    let chatHistoriesByPersonality = {};
    let lastCodeByPersonality = {};
    let monacoEditor = null;

    // Elementos DOM
    const personalitiesList = document.getElementById('personalitiesList');
    const chatMessages = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const sendCodeToMentorBtn = document.getElementById('sendCodeToMentorBtn');
    const runJudge0Btn = document.getElementById('runJudge0Btn');
    const resetStarterCodeBtn = document.getElementById('resetStarterCodeBtn');
    const terminalOutput = document.getElementById('terminalOutput');
    const judge0StatusBadge = document.getElementById('judge0StatusBadge');

    const activeEmoji = document.getElementById('activeEmoji');
    const activeName = document.getElementById('activeName');
    const activeDesc = document.getElementById('activeDesc');

    // Modales
    const personalityModal = document.getElementById('personalityModal');
    const openNewModalBtn = document.getElementById('openNewPersonalityModalBtn');
    const closePersonalityModalBtn = document.getElementById('closePersonalityModalBtn');
    const cancelPersonalityBtn = document.getElementById('cancelPersonalityBtn');
    const personalityForm = document.getElementById('personalityForm');
    const modalTitle = document.getElementById('modalTitle');
    const pTemperature = document.getElementById('pTemperature');
    const tempValue = document.getElementById('tempValue');

    const settingsModal = document.getElementById('settingsModal');
    const openSettingsModalBtn = document.getElementById('openSettingsModalBtn');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const settingsForm = document.getElementById('settingsForm');
    const customApiKeyInput = document.getElementById('customApiKey');
    const modelSelect = document.getElementById('modelSelect');
    const customJudge0UrlInput = document.getElementById('customJudge0Url');

    // Mobile Sidebar
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    // Cargar configuraciones guardadas
    customApiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
    customJudge0UrlInput.value = localStorage.getItem('judge0_url') || 'https://ce.judge0.com';

    // Inicializar Monaco Editor
    initMonacoEditor();

    // Inicializar Datos
    fetchPersonalities();
    fetchAvailableModels();

    // Reconocimiento de Voz en Tiempo Real y Grabación de Audio
    const micBtn = document.getElementById('micBtn');
    let recognition = null;
    let isSpeechActive = false;
    let baseTextBeforeSpeech = '';
    let isBraveNetworkBlocked = false;

    // MediaRecorder Fallback
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecordingAudio = false;

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognitionClass();
        recognition.lang = navigator.language || 'es-AR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isSpeechActive = true;
            baseTextBeforeSpeech = messageInput.value ? messageInput.value.trim() + ' ' : '';
            if (micBtn) {
                micBtn.classList.add('recording');
                micBtn.title = "Escuchando en vivo... Haz clic para detener";
            }
            messageInput.placeholder = "🎙️ Escuchando... habla ahora...";
            showToast('🎙️ Escuchando... habla ahora');
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            const currentText = baseTextBeforeSpeech + finalTranscript + interimTranscript;
            messageInput.value = currentText.trimStart();
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        };

        recognition.onerror = (event) => {
            if (event.error === 'network') {
                // Bloqueo nativo de Brave contra servidores de voz de Google
                isBraveNetworkBlocked = true;
                stopSpeechRecognition();
                startAudioRecordingFallback();
                return;
            }
            if (event.error === 'not-allowed') {
                showToast('⚠️ Permiso de micrófono denegado en el navegador.');
            }
            stopSpeechRecognition();
        };

        recognition.onend = () => {
            stopSpeechRecognition();
        };
    }

    function stopSpeechRecognition() {
        isSpeechActive = false;
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.title = "Hablar por micrófono";
        }
        if (messageInput) {
            messageInput.placeholder = "Escribe o habla por micrófono para consultar al mentor...";
            messageInput.focus();
        }
    }

    micBtn?.addEventListener('click', async () => {
        if (isSpeechActive) {
            if (recognition) recognition.stop();
        } else if (isRecordingAudio) {
            stopAudioRecording();
        } else {
            if (recognition && !isBraveNetworkBlocked) {
                try {
                    recognition.lang = navigator.language || 'es-AR';
                    recognition.start();
                } catch (e) {
                    await startAudioRecordingFallback();
                }
            } else {
                await startAudioRecordingFallback();
            }
        }
    });

    // Whisper WebAssembly STT (100% Local en Navegador)
    let whisperTranscriber = null;
    let isWhisperLoading = false;

    async function getWhisperTranscriber() {
        if (whisperTranscriber) return whisperTranscriber;
        if (isWhisperLoading) return null;

        isWhisperLoading = true;
        showToast('🧠 Inicializando IA de voz Whisper en el navegador...');

        try {
            if (window.WhisperPipeline) {
                whisperTranscriber = await window.WhisperPipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
                showToast('✅ IA de voz Whisper lista');
            }
        } catch (err) {
            console.warn('Whisper Wasm no disponible:', err);
        } finally {
            isWhisperLoading = false;
        }
        return whisperTranscriber;
    }

    let wavRecorder = null;
    let wavAudioStream = null;

    async function startAudioRecordingFallback() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('⚠️ Tu navegador no permite el acceso al micrófono.');
            return;
        }

        try {
            wavAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            isRecordingAudio = true;
            micBtn.classList.add('recording');
            micBtn.title = "Escuchando con Whisper.net C#... Haz clic para detener";
            messageInput.placeholder = "🎙️ Escuchando... habla ahora. Haz clic de nuevo para ver el texto.";
            showToast('🎙️ Escuchando con Whisper.net C#...');

            wavRecorder = await createWavRecorder(wavAudioStream);
        } catch (err) {
            console.error('Error al acceder al micrófono:', err);
            showToast('⚠️ Permiso de micrófono denegado o no disponible.');
        }
    }

    function stopAudioRecording() {
        if (wavRecorder && isRecordingAudio) {
            isRecordingAudio = false;
            micBtn.classList.remove('recording');
            micBtn.title = "Hablar por micrófono";
            messageInput.placeholder = "⏳ Transcribiendo con Whisper.net C#...";

            wavRecorder.stop(async (wavBlob) => {
                if (wavAudioStream) {
                    wavAudioStream.getTracks().forEach(t => t.stop());
                }

                if (!wavBlob || wavBlob.size === 0) {
                    messageInput.placeholder = "Escribe o habla por micrófono para consultar al mentor...";
                    return;
                }

                const base64Wav = await blobToBase64(wavBlob);

                try {
                    const res = await fetch('/api/chat/transcribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            audioBase64: base64Wav,
                            audioMimeType: 'audio/wav',
                            customApiKey: localStorage.getItem('gemini_api_key') || null
                        })
                    });
                    const data = await res.json();
                    if (data.success && data.text) {
                        let cleanText = data.text.trim();
                        if (cleanText) {
                            const existingText = messageInput.value ? messageInput.value.trim() + ' ' : '';
                            messageInput.value = (existingText + cleanText).trim();
                            messageInput.style.height = 'auto';
                            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
                            showToast(`⚡ Transcrito con ${data.source || 'Whisper.net C#'}`);
                        } else {
                            showToast('ℹ️ No se detectó voz clara en la grabación.');
                        }
                    } else {
                        showToast('⚠️ No se pudo transcribir el audio.');
                    }
                } catch (err) {
                    showToast('⚠️ Error al procesar transcripción: ' + err.message);
                } finally {
                    messageInput.placeholder = "Escribe o habla por micrófono para consultar al mentor...";
                    messageInput.focus();
                }
            });
        }
    }

    async function createWavRecorder(stream) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        const pcmSamples = [];

        processor.onaudioprocess = (e) => {
            if (isRecordingAudio) {
                const input = e.inputBuffer.getChannelData(0);
                pcmSamples.push(new Float32Array(input));
            }
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);

        return {
            stop: async (callback) => {
                processor.disconnect();
                source.disconnect();
                await audioCtx.close();

                let totalLength = pcmSamples.reduce((acc, curr) => acc + curr.length, 0);
                let merged = new Float32Array(totalLength);
                let offset = 0;
                for (let chunk of pcmSamples) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }

                const wavBlob = encodeWAV16Bit(merged, 16000);
                callback(wavBlob);
            }
        };
    }

    function encodeWAV16Bit(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);

        let index = 44;
        for (let i = 0; i < samples.length; i++) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            index += 2;
        }

        return new Blob([view], { type: 'audio/wav' });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result;
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function sendAudioMessageToGemini(audioBase64, mimeType) {
        const textTyped = messageInput.value.trim();
        messageInput.value = '';
        messageInput.style.height = 'auto';

        const welcomeCard = chatMessages.querySelector('.welcome-card');
        if (welcomeCard) welcomeCard.remove();

        const displayMessage = textTyped ? `🎙️ [Mensaje de voz]: ${textTyped}` : '🎙️ [Mensaje de voz enviado]';
        appendUserMessage(displayMessage);
        const typingEl = appendTypingIndicator();

        const currentCode = monacoEditor ? monacoEditor.getValue() : '';
        const previousCode = activePersonality ? (lastCodeByPersonality[activePersonality.id] || null) : null;

        let promptForGemini = textTyped || 'Mensaje de voz del alumno.';

        if (currentCode) {
            if (previousCode && previousCode !== currentCode) {
                promptForGemini = `${promptForGemini}

[CÓDIGO ENVIADO EN LA INTERACCIÓN ANTERIOR]:
\`\`\`csharp
${previousCode}
\`\`\`

[CÓDIGO ACTUAL EN EL EDITOR MONACO]:
\`\`\`csharp
${currentCode}
\`\`\`

(Instrucción para el Mentor: Escucha el audio del alumno y compara detenidamente los cambios entre el código anterior y el código actual).`;
            } else {
                promptForGemini = `${promptForGemini}

[CÓDIGO ACTUAL EN EL EDITOR MONACO]:
\`\`\`csharp
${currentCode}
\`\`\``;
            }
        }

        if (activePersonality) {
            lastCodeByPersonality[activePersonality.id] = currentCode;
        }

        try {
            const currentHistory = chatHistoriesByPersonality[activePersonality?.id || ''] || [];

            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalityId: activePersonality?.id || '',
                    message: promptForGemini,
                    audioBase64: audioBase64,
                    audioMimeType: mimeType,
                    history: currentHistory,
                    customApiKey: localStorage.getItem('gemini_api_key') || null,
                    model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash'
                })
            });

            const data = await res.json();
            typingEl.remove();

            if (data.success) {
                appendModelMessage(data.response);
                if (activePersonality) {
                    if (!chatHistoriesByPersonality[activePersonality.id]) {
                        chatHistoriesByPersonality[activePersonality.id] = [];
                    }
                    chatHistoriesByPersonality[activePersonality.id].push({ role: 'user', message: displayMessage });
                    chatHistoriesByPersonality[activePersonality.id].push({ role: 'model', message: data.response });
                }
            } else {
                appendErrorMessage(data.errorMessage || 'Error al comunicarse con Gemini.');
            }
        } catch (err) {
            typingEl.remove();
            appendErrorMessage('Error de red al enviar el audio: ' + err.message);
        }
    }

    // Event Listeners
    pTemperature.addEventListener('input', (e) => {
        tempValue.textContent = e.target.value;
    });

    openNewModalBtn.addEventListener('click', () => openPersonalityModal());
    closePersonalityModalBtn.addEventListener('click', () => closePersonalityModal());
    cancelPersonalityBtn.addEventListener('click', () => closePersonalityModal());

    openSettingsModalBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    closeSettingsModalBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));

    openSidebarBtn?.addEventListener('click', () => sidebar.classList.add('open'));
    closeSidebarBtn?.addEventListener('click', () => sidebar.classList.remove('open'));

    resetStarterCodeBtn?.addEventListener('click', () => {
        if (activePersonality && monacoEditor) {
            monacoEditor.setValue(activePersonality.starterCode || '// Escribe tu código C# aquí');
        }
    });

    // Guardar Configuración
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('gemini_api_key', customApiKeyInput.value.trim());
        localStorage.setItem('gemini_model', modelSelect.value);
        localStorage.setItem('judge0_url', customJudge0UrlInput.value.trim());
        settingsModal.classList.remove('active');
    });

    // Guardar / Crear Ejercicio
    personalityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPersonalityId').value;
        const name = document.getElementById('pName').value.trim();
        const emoji = document.getElementById('pEmoji').value.trim() || '🧩';
        const description = document.getElementById('pDescription').value.trim();
        const starterCode = document.getElementById('pStarterCode').value;
        const systemInstruction = document.getElementById('pSystemInstruction').value.trim();
        const temperature = parseFloat(pTemperature.value);

        const payload = { name, emoji, description, starterCode, systemInstruction, temperature, isCustom: true };

        try {
            let res;
            if (id) {
                res = await fetch(`/api/personalities/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/personalities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                closePersonalityModal();
                await fetchPersonalities();
            } else {
                alert('Error al guardar la personalidad/ejercicio.');
            }
        } catch (err) {
            console.error(err);
            alert('Ocurrió un error al conectar con el servidor.');
        }
    });

    // Resetear Chat
    clearChatBtn.addEventListener('click', () => {
        if (activePersonality) {
            chatHistoriesByPersonality[activePersonality.id] = [];
            renderCurrentChatHistory();
        }
    });

    // Botón: Revisar Código con IA Mentor
    sendCodeToMentorBtn?.addEventListener('click', () => {
        if (!monacoEditor || !activePersonality) return;
        const code = monacoEditor.getValue();
        const prompt = `Por favor revisa mi código C# actual para el ejercicio "${activePersonality.name}":\n\n\`\`\`csharp\n${code}\n\`\`\`\n\n¿Es correcto? ¿Tengo algún error de lógica o sintaxis?`;
        
        messageInput.value = prompt;
        chatForm.dispatchEvent(new Event('submit'));
    });

    // Botón: Compilar y Ejecutar en Judge0 API
    runJudge0Btn?.addEventListener('click', async () => {
        if (!monacoEditor) return;

        const sourceCode = monacoEditor.getValue();
        terminalOutput.textContent = '⏳ Enviando código a Judge0 API para compilación y ejecución...';
        judge0StatusBadge.textContent = 'Ejecutando...';
        judge0StatusBadge.style.color = '#F59E0B';

        try {
            const res = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_code: sourceCode,
                    sourceCode: sourceCode,
                    language_id: 51,
                    languageId: 51,
                    customJudge0Url: localStorage.getItem('judge0_url') || 'https://ce.judge0.com'
                })
            });

            const data = await res.json();

            if (!data.success) {
                terminalOutput.textContent = `❌ Error: ${data.errorMessage}`;
                judge0StatusBadge.textContent = 'Error HTTP';
                judge0StatusBadge.style.color = '#EF4444';
                return;
            }

            let outputText = '';
            
            if (data.status) {
                judge0StatusBadge.textContent = `${data.status.description} (${data.time || '0'}s)`;
                judge0StatusBadge.style.color = data.status.id === 3 ? '#10B981' : '#EF4444';
            }

            if (data.compile_output) {
                outputText += `--- ERRORES DE COMPILACIÓN ---\n${data.compile_output}\n\n`;
            }

            if (data.stderr) {
                outputText += `--- ERRORES DE EJECUCIÓN (STDERR) ---\n${data.stderr}\n\n`;
            }

            if (data.stdout) {
                outputText += `--- SALIDA ESTÁNDAR (STDOUT) ---\n${data.stdout}\n`;
            }

            if (!outputText) {
                outputText = `[Ejecución terminada con estado: ${data.status?.description || 'Desconocido'}]`;
            }

            terminalOutput.textContent = outputText;
            switchTerminalTab('console');
        } catch (err) {
            terminalOutput.textContent = `❌ Error de conexión al servicio de compilación: ${err.message}`;
            judge0StatusBadge.textContent = 'Error Conexión';
            judge0StatusBadge.style.color = '#EF4444';
        }
    });

    // Pestañas de Terminal
    const tabConsoleBtn = document.getElementById('tabConsoleBtn');
    const tabTestsBtn = document.getElementById('tabTestsBtn');
    const testResultsContainer = document.getElementById('testResultsContainer');
    const testSummaryBadge = document.getElementById('testSummaryBadge');
    const runTestsBtn = document.getElementById('runTestsBtn');

    tabConsoleBtn?.addEventListener('click', () => switchTerminalTab('console'));
    tabTestsBtn?.addEventListener('click', () => switchTerminalTab('tests'));

    function switchTerminalTab(tab) {
        if (tab === 'console') {
            tabConsoleBtn.classList.add('active');
            tabTestsBtn.classList.remove('active');
            terminalOutput.classList.remove('hidden');
            testResultsContainer.classList.add('hidden');
        } else {
            tabConsoleBtn.classList.remove('active');
            tabTestsBtn.classList.add('active');
            terminalOutput.classList.add('hidden');
            testResultsContainer.classList.remove('hidden');
        }
    }

    // Botón: Correr Tests
    runTestsBtn?.addEventListener('click', async () => {
        if (!monacoEditor || !activePersonality) return;

        const sourceCode = monacoEditor.getValue();
        judge0StatusBadge.textContent = 'Ejecutando Tests...';
        judge0StatusBadge.style.color = '#8B5CF6';

        switchTerminalTab('tests');
        testResultsContainer.innerHTML = '<p class="test-placeholder">⏳ Ejecutando casos de prueba en Judge0...</p>';

        try {
            const res = await fetch('/api/compile/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalityId: activePersonality.id,
                    sourceCode: sourceCode,
                    customJudge0Url: localStorage.getItem('judge0_url') || 'https://ce.judge0.com'
                })
            });

            const data = await res.json();

            if (!data.success) {
                testResultsContainer.innerHTML = `
                    <div class="test-card failed">
                        <strong style="color: var(--accent-danger);">Error al ejecutar los tests</strong>
                        <p class="test-details" style="white-space: pre-wrap;">${escapeHtml(data.compileOutput || data.errorMessage || 'Error desconocido')}</p>
                    </div>
                `;
                judge0StatusBadge.textContent = 'Falló Compilación';
                judge0StatusBadge.style.color = '#EF4444';
                return;
            }

            testSummaryBadge.textContent = `${data.passedCount}/${data.totalTests}`;
            judge0StatusBadge.textContent = data.isAllPassed ? '🎉 100% Tests Pasados' : `⚠️ ${data.passedCount}/${data.totalTests} Pasados`;
            judge0StatusBadge.style.color = data.isAllPassed ? '#10B981' : '#F59E0B';

            let html = `
                <div style="margin-bottom: 10px; font-size: 13px; font-weight: 600; color: ${data.isAllPassed ? '#10B981' : '#F59E0B'};">
                    ${data.isAllPassed ? '🎉 ¡Felicidades! Todos los casos de prueba han pasado.' : `Resultado: ${data.passedCount} de ${data.totalTests} tests aprobados.`}
                </div>
            `;

            data.results.forEach(test => {
                html += `
                    <div class="test-card ${test.passed ? 'passed' : 'failed'}">
                        <div class="test-card-header">
                            <span class="test-title">Test ${test.id}: ${escapeHtml(test.description)}</span>
                            <span class="test-badge ${test.passed ? 'pass' : 'fail'}">${test.passed ? 'PASÓ' : 'FALLÓ'}</span>
                        </div>
                        <div class="test-details">
                            <div>Llamada: <code>${escapeHtml(test.methodCall)}</code></div>
                            <div>Esperado: <strong style="color: #10B981;">'${escapeHtml(test.expectedOutput)}'</strong> | Obtenido: <strong style="color: ${test.passed ? '#10B981' : '#EF4444'};">'${escapeHtml(test.actualOutput)}'</strong></div>
                        </div>
                    </div>
                `;
            });

            testResultsContainer.innerHTML = html;

            // Si todos los tests pasaron, enviar mensaje automático a Gemini para felicitaciones y review
            if (data.isAllPassed) {
                const autoPrompt = `¡He completado con éxito todos los test cases (${data.passedCount}/${data.totalTests}) del ejercicio "${activePersonality.name}"!\n\nAquí está mi código final:\n\`\`\`csharp\n${sourceCode}\n\`\`\`\n\n¿Podrías felicitarme y darme una breve opinión sobre la eficiencia y limpieza de mi código?`;
                messageInput.value = autoPrompt;
                chatForm.dispatchEvent(new Event('submit'));
            }

        } catch (err) {
            testResultsContainer.innerHTML = `<p class="test-placeholder" style="color: var(--accent-danger);">Error de conexión: ${escapeHtml(err.message)}</p>`;
            judge0StatusBadge.textContent = 'Error';
            judge0StatusBadge.style.color = '#EF4444';
        }
    });

    // Submit del Chat Form (Mensaje a Gemini)
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        messageInput.value = '';
        messageInput.style.height = 'auto';

        const welcomeCard = chatMessages.querySelector('.welcome-card');
        if (welcomeCard) welcomeCard.remove();

        appendUserMessage(messageText);
        const typingEl = appendTypingIndicator();

        // Código en Monaco Editor (actual y previo)
        const currentCode = monacoEditor ? monacoEditor.getValue() : '';
        const previousCode = activePersonality ? (lastCodeByPersonality[activePersonality.id] || null) : null;

        let promptForGemini = messageText;

        if (currentCode) {
            if (previousCode && previousCode !== currentCode) {
                promptForGemini = `[MENSAJE / CONSULTA DEL ALUMNO]:
${messageText}

[CÓDIGO ENVIADO EN LA INTERACCIÓN ANTERIOR]:
\`\`\`csharp
${previousCode}
\`\`\`

[CÓDIGO ACTUAL EN EL EDITOR MONACO]:
\`\`\`csharp
${currentCode}
\`\`\`

(Instrucción para el Mentor: Compara detenidamente los cambios introducidos entre el código anterior y el código actual. Responde a la duda o consulta del usuario considerando estas modificaciones e identificando avances o posibles nuevos errores).`;
            } else {
                promptForGemini = `[MENSAJE / CONSULTA DEL ALUMNO]:
${messageText}

[CÓDIGO ACTUAL EN EL EDITOR MONACO]:
\`\`\`csharp
${currentCode}
\`\`\``;
            }
        }

        // Registrar el código actual como "anterior" para la siguiente pregunta
        if (activePersonality) {
            lastCodeByPersonality[activePersonality.id] = currentCode;
        }

        try {
            const currentHistory = chatHistoriesByPersonality[activePersonality?.id || ''] || [];

            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalityId: activePersonality?.id || '',
                    message: promptForGemini,
                    history: currentHistory,
                    customApiKey: localStorage.getItem('gemini_api_key') || null,
                    model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash'
                })
            });

            const data = await res.json();
            typingEl.remove();

            if (data.success) {
                appendModelMessage(data.response);
                if (activePersonality) {
                    if (!chatHistoriesByPersonality[activePersonality.id]) {
                        chatHistoriesByPersonality[activePersonality.id] = [];
                    }
                    chatHistoriesByPersonality[activePersonality.id].push({ role: 'user', message: messageText });
                    chatHistoriesByPersonality[activePersonality.id].push({ role: 'model', message: data.response });
                }
            } else {
                appendErrorMessage(data.errorMessage || 'Error al comunicarse con Gemini.');
            }
        } catch (err) {
            typingEl.remove();
            appendErrorMessage('Error de red al enviar el mensaje: ' + err.message);
        }
    });

    // Inicializar Monaco Editor via loader
    function initMonacoEditor() {
        if (window.require) {
            window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
            window.require(['vs/editor/editor.main'], () => {
                monacoEditor = monaco.editor.create(document.getElementById('monacoEditorContainer'), {
                    value: `using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        Console.WriteLine("¡Bienvenido a Kiro Code Lab!");\n    }\n}`,
                    language: 'csharp',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    fontFamily: "'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false
                });

                if (activePersonality && activePersonality.starterCode) {
                    monacoEditor.setValue(activePersonality.starterCode);
                }
            });
        }
    }

    async function fetchPersonalities() {
        try {
            const res = await fetch('/api/personalities');
            personalities = await res.json();
            renderPersonalitiesList();

            if (!activePersonality && personalities.length > 0) {
                selectPersonality(personalities[0]);
            }
        } catch (err) {
            console.error('Error cargando ejercicios/personalidades:', err);
        }
    }

    async function fetchAvailableModels() {
        try {
            const apiKey = localStorage.getItem('gemini_api_key') || '';
            const res = await fetch(`/api/chat/models?apiKey=${encodeURIComponent(apiKey)}`);
            const models = await res.json();
            
            if (Array.isArray(models) && models.length > 0) {
                modelSelect.innerHTML = '';
                models.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.textContent = m;
                    modelSelect.appendChild(opt);
                });

                let targetModel = localStorage.getItem('gemini_model');
                if (!targetModel || !models.includes(targetModel)) {
                    targetModel = models.includes('gemini-3.5-flash') ? 'gemini-3.5-flash' : models[0];
                }
                modelSelect.value = targetModel;
                localStorage.setItem('gemini_model', targetModel);
            }
        } catch (err) {
            console.error('Error al obtener modelos:', err);
        }
    }

    function renderPersonalitiesList() {
        personalitiesList.innerHTML = '';
        personalities.forEach(p => {
            const card = document.createElement('div');
            card.className = `personality-card ${activePersonality?.id === p.id ? 'active' : ''}`;
            
            card.innerHTML = `
                <div class="p-icon">${p.emoji}</div>
                <div class="p-details">
                    <div class="p-header">
                        <span class="p-name">${escapeHtml(p.name)}</span>
                        ${p.isCustom ? '<span class="p-badge">Custom</span>' : ''}
                    </div>
                    <div class="p-desc">${escapeHtml(p.description)}</div>
                </div>
                ${p.isCustom ? `
                    <div class="p-actions">
                        <button class="btn-card-action edit-p-btn" title="Editar">✏️</button>
                        <button class="btn-card-action delete-p-btn" title="Eliminar">🗑️</button>
                    </div>
                ` : ''}
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.p-actions')) return;
                selectPersonality(p);
                if (window.innerWidth <= 768) sidebar.classList.remove('open');
            });

            if (p.isCustom) {
                card.querySelector('.edit-p-btn')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openPersonalityModal(p);
                });
                card.querySelector('.delete-p-btn')?.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar "${p.name}"?`)) {
                        await fetch(`/api/personalities/${p.id}`, { method: 'DELETE' });
                        if (activePersonality?.id === p.id) activePersonality = null;
                        await fetchPersonalities();
                    }
                });
            }

            personalitiesList.appendChild(card);
        });
    }

    function selectPersonality(p) {
        activePersonality = p;
        activeEmoji.textContent = p.emoji;
        activeName.textContent = p.name;
        activeDesc.textContent = p.description;

        // Precargar código en Monaco Editor
        if (monacoEditor && p.starterCode) {
            monacoEditor.setValue(p.starterCode);
        }

        renderPersonalitiesList();
        renderCurrentChatHistory();
    }

    function renderCurrentChatHistory() {
        chatMessages.innerHTML = '';
        if (!activePersonality) return;

        const history = chatHistoriesByPersonality[activePersonality.id] || [];
        
        if (history.length === 0) {
            chatMessages.innerHTML = `
                <div class="welcome-card">
                    <div class="welcome-icon">${activePersonality.emoji}</div>
                    <h2>${escapeHtml(activePersonality.name)}</h2>
                    <p>${escapeHtml(activePersonality.description)}</p>
                    <div class="tip-card" style="margin-top: 15px; border-color: var(--accent-primary); text-align: left;">
                        <strong style="color: var(--accent-primary);">Instrucciones del Mentor IA:</strong>
                        <p style="white-space: pre-wrap; font-size: 11px; margin-top: 6px;">${escapeHtml(activePersonality.systemInstruction)}</p>
                    </div>
                </div>
            `;
            return;
        }

        history.forEach(item => {
            if (item.role === 'user') {
                appendUserMessage(item.message);
            } else {
                appendModelMessage(item.message);
            }
        });
    }

    function openPersonalityModal(personality = null) {
        if (personality) {
            modalTitle.textContent = 'Editar Ejercicio';
            document.getElementById('editPersonalityId').value = personality.id;
            document.getElementById('pName').value = personality.name;
            document.getElementById('pEmoji').value = personality.emoji;
            document.getElementById('pDescription').value = personality.description;
            document.getElementById('pStarterCode').value = personality.starterCode || '';
            document.getElementById('pSystemInstruction').value = personality.systemInstruction;
            pTemperature.value = personality.temperature;
            tempValue.textContent = personality.temperature;
        } else {
            modalTitle.textContent = 'Crear Nuevo Ejercicio';
            personalityForm.reset();
            document.getElementById('editPersonalityId').value = '';
            document.getElementById('pStarterCode').value = `using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        // Código inicial...\n    }\n}`;
            pTemperature.value = 0.5;
            tempValue.textContent = '0.5';
        }
        personalityModal.classList.add('active');
    }

    function closePersonalityModal() {
        personalityModal.classList.remove('active');
    }

    function appendUserMessage(text) {
        const row = document.createElement('div');
        row.className = 'message-row user';
        row.innerHTML = `
            <div class="avatar">👤</div>
            <div class="bubble">${escapeHtml(text)}</div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
    }

    function appendModelMessage(text) {
        const row = document.createElement('div');
        row.className = 'message-row model';
        let parsedHtml = marked.parse(text);
        
        row.innerHTML = `
            <div class="avatar">${activePersonality?.emoji || '✨'}</div>
            <div class="bubble">
                <div class="markdown-content">${parsedHtml}</div>
            </div>
        `;
        chatMessages.appendChild(row);
        
        row.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        scrollToBottom();
    }

    function appendErrorMessage(errorText) {
        const row = document.createElement('div');
        row.className = 'message-row model';
        row.innerHTML = `
            <div class="avatar">⚠️</div>
            <div class="bubble" style="border-color: var(--accent-danger); background: rgba(239, 68, 68, 0.1);">
                <strong style="color: var(--accent-danger);">Error</strong>
                <p style="margin-top: 4px;">${escapeHtml(errorText)}</p>
            </div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
    }

    function appendTypingIndicator() {
        const row = document.createElement('div');
        row.className = 'message-row model';
        row.innerHTML = `
            <div class="avatar">${activePersonality?.emoji || '✨'}</div>
            <div class="bubble">
                <div class="typing-dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(row);
        scrollToBottom();
        return row;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function showToast(msg) {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
            document.body.appendChild(toastContainer);
        }
        const toast = document.createElement('div');
        toast.style.cssText = 'background: rgba(21, 28, 44, 0.95); border: 1px solid var(--accent-primary); color: #FFF; padding: 10px 16px; border-radius: 8px; font-size: 13px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); backdrop-filter: blur(8px); transition: all 0.3s ease;';
        toast.textContent = msg;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
