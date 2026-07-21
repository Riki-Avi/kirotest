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

    // Reconocimiento de Voz (Web Speech API)
    const micBtn = document.getElementById('micBtn');
    let recognition = null;
    let isRecording = false;

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognitionClass();
        recognition.lang = 'es-ES';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isRecording = true;
            if (micBtn) {
                micBtn.classList.add('recording');
                micBtn.title = "Escuchando... Haz clic para detener";
            }
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            messageInput.value = transcript;
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        };

        recognition.onerror = (event) => {
            console.error('Error de micrófono:', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            stopRecording();
        };
    }

    function stopRecording() {
        isRecording = false;
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.title = "Hablar por micrófono";
        }
    }

    micBtn?.addEventListener('click', () => {
        if (!recognition) {
            alert('Tu navegador no soporta el reconocimiento de voz (Web Speech API). Te recomendamos utilizar Google Chrome o Microsoft Edge.');
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (err) {
                console.error('No se pudo iniciar el micrófono:', err);
            }
        }
    });

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
});
