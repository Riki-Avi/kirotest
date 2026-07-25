// main.js — Punto de Entrada Principal (Orquestador de Módulos Kiro)
document.addEventListener('DOMContentLoaded', async () => {
    // Estado de la aplicación
    let activePersonality = null;
    let chatHistories = {};

    // Elementos DOM principales
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const runJudge0Btn = document.getElementById('runJudge0Btn');
    const runTestsBtn = document.getElementById('runTestsBtn');
    const sendCodeToMentorBtn = document.getElementById('sendCodeToMentorBtn');
    const completeExerciseBtn = document.getElementById('completeExerciseBtn');
    const confirmSaveProgressBtn = document.getElementById('confirmSaveProgressBtn');
    const resetStarterCodeBtn = document.getElementById('resetStarterCodeBtn');

    // 1. Inicializar UI, Resizers y Monaco Editor
    window.KiroUI?.initUI();
    window.KiroEditor?.init('monacoEditorContainer', '', () => {
        if (activePersonality) {
            window.KiroEditor?.loadSavedOrStarterCode(
                activePersonality.id,
                activePersonality.starterCode || '// Escribe tu código C# aquí...\n'
            );
        }
    });

    // 2. Cargar Entregas del Usuario (Si hay sesión)
    await window.KiroSubmissions?.fetchUserSubmissions();

    // 3. Cargar Lista de Ejercicios / Personalidades
    const personalities = await window.KiroEjercicios?.fetchAll() || [];
    window.KiroEjercicios?.renderList('personalitiesList', activePersonality, onSelectPersonality);

    if (personalities.length > 0) {
        onSelectPersonality(personalities[0]);
    }

    // Callback cuando Supabase restaura la sesión de usuario
    window.onUserAuthenticated = async (userId) => {
        await window.KiroSubmissions?.fetchUserSubmissions();
        window.KiroEjercicios?.renderList('personalitiesList', activePersonality, onSelectPersonality);
        if (activePersonality) {
            window.KiroSubmissions?.checkExerciseCompletion(activePersonality, completeExerciseBtn);
        }
    };

    function renderExerciseDetails(p) {
        const exerciseContent = document.getElementById('exerciseContent');
        if (!exerciseContent || !p) return;

        const descriptionHtml = typeof marked !== 'undefined' ? marked.parse(p.description || '') : (p.description || '');

        exerciseContent.innerHTML = `
            <h2>${p.emoji || '💻'} ${escapeHtml(p.name)}</h2>
            <div class="exercise-body">${descriptionHtml}</div>
        `;
    }

    function escapeHtml(str) {
        return (str || '')
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function onSelectPersonality(p) {
        activePersonality = p;
        const activeEmoji = document.getElementById('activeEmoji');
        const activeName = document.getElementById('activeName');
        const activeDesc = document.getElementById('activeDesc');

        if (activeEmoji) activeEmoji.textContent = p.emoji;
        if (activeName) activeName.textContent = p.name;
        if (activeDesc) activeDesc.textContent = p.description;

        renderExerciseDetails(p);

        window.KiroEditor?.loadSavedOrStarterCode(
            p.id,
            p.starterCode || '// Escribe tu código C# aquí...\n'
        );

        window.KiroSubmissions?.checkExerciseCompletion(p, completeExerciseBtn);
        window.KiroEjercicios?.renderList('personalitiesList', p, onSelectPersonality);
        window.KiroChat?.renderCurrentChatHistory(p, chatHistories);
    }

    // 4. Conectar Eventos de la Cabecera y Botones de Acción
    runJudge0Btn?.addEventListener('click', () => {
        const code = window.KiroEditor?.getValue();
        if (code) window.KiroJudge0?.compileCode(code);
    });

    runTestsBtn?.addEventListener('click', () => {
        const code = window.KiroEditor?.getValue();
        if (code && activePersonality) {
            window.KiroJudge0?.runTestSuite(code, activePersonality, (isAllPassed) => {
                if (isAllPassed) {
                    completeExerciseBtn?.classList.remove('hidden');
                }
            });
        }
    });

    sendCodeToMentorBtn?.addEventListener('click', () => {
        const code = window.KiroEditor?.getValue();
        if (code && activePersonality && messageInput) {
            messageInput.value = `Por favor revisa mi código C# actual para el ejercicio "${activePersonality.name}":\n\n\`\`\`csharp\n${code}\n\`\`\`\n\n¿Es correcto? ¿Tengo algún error de lógica o sintaxis?`;
            chatForm?.dispatchEvent(new Event('submit'));
        }
    });

    resetStarterCodeBtn?.addEventListener('click', () => {
        if (activePersonality) {
            window.KiroEditor?.setValue(activePersonality.starterCode || '');
        }
    });

    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput?.value;
        if (text && activePersonality) {
            messageInput.value = '';
            window.KiroChat?.sendPrompt(text, activePersonality, chatHistories);
        }
    });

    // 5. Modales & Guardado de Entregas en Perfil
    completeExerciseBtn?.addEventListener('click', () => window.KiroModals?.openCompleteModal());
    document.getElementById('closeCompleteModalBtn')?.addEventListener('click', () => window.KiroModals?.closeCompleteModal());
    document.getElementById('cancelCompleteBtn')?.addEventListener('click', () => window.KiroModals?.closeCompleteModal());

    confirmSaveProgressBtn?.addEventListener('click', async () => {
        const code = window.KiroEditor?.getValue();
        let userId = window.currentUserId;

        if (!userId && window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            userId = data?.session?.user?.id;
        }

        if (!userId) {
            window.KiroUI?.showToast('⚠️ Debes iniciar sesión para guardar tu progreso');
            window.location.href = '/Auth/Login';
            return;
        }

        confirmSaveProgressBtn.disabled = true;
        confirmSaveProgressBtn.textContent = '⏳ Guardando...';

        const result = await window.KiroSubmissions?.saveSubmission(userId, activePersonality, code);
        confirmSaveProgressBtn.disabled = false;
        confirmSaveProgressBtn.textContent = 'Guardar en Mi Perfil';

        if (result?.success) {
            window.KiroUI?.showToast('🎉 ¡Ejercicio guardado en tu perfil con éxito!');
            window.KiroModals?.closeCompleteModal();
            window.KiroSubmissions?.checkExerciseCompletion(activePersonality, completeExerciseBtn);
            window.KiroEjercicios?.renderList('personalitiesList', activePersonality, onSelectPersonality);
        } else {
            alert('Error al guardar: ' + (result?.message || 'Error desconocido'));
        }
    });

    document.getElementById('openSettingsModalBtn')?.addEventListener('click', () => window.KiroModals?.openSettingsModal());
    document.getElementById('closeSettingsModalBtn')?.addEventListener('click', () => window.KiroModals?.closeSettingsModal());
    document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => window.KiroModals?.closeSettingsModal());

    document.getElementById('openNewPersonalityModalBtn')?.addEventListener('click', () => window.KiroModals?.openPersonalityModal());
    document.getElementById('closePersonalityModalBtn')?.addEventListener('click', () => window.KiroModals?.closePersonalityModal());
    document.getElementById('cancelPersonalityBtn')?.addEventListener('click', () => window.KiroModals?.closePersonalityModal());

    // 6. Voz / Micrófono
    window.KiroVoice?.init();
});
