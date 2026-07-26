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
    const profileBtn = document.getElementById('profileBtn');
    const loginHeaderBtn = document.getElementById('loginHeaderBtn');
    const prevExerciseBtn = document.getElementById('prevExerciseBtn');
    const nextExerciseBtn = document.getElementById('nextExerciseBtn');

    function updateAuthHeaderUI(userObj) {
        const headerAvatar = document.getElementById('headerUserAvatar');
        const headerLabel = document.getElementById('headerProfileLabel');

        if (window.currentUserId) {
            profileBtn?.classList.remove('hidden');
            loginHeaderBtn?.classList.add('hidden');

            const metadata = userObj?.user_metadata || window.currentUserMetadata || {};
            const googlePhotoUrl = metadata.picture 
                || metadata.avatar_url 
                || userObj?.identities?.[0]?.identity_data?.picture 
                || userObj?.identities?.[0]?.identity_data?.avatar_url;

            if (headerAvatar && googlePhotoUrl) {
                headerAvatar.src = googlePhotoUrl;
                headerAvatar.style.display = 'inline-block';
                if (headerLabel) headerLabel.textContent = 'Mi Perfil';
            }
        } else {
            profileBtn?.classList.add('hidden');
            loginHeaderBtn?.classList.remove('hidden');
        }
    }

    function requireUserAuth(callback) {
        if (!window.currentUserId) {
            window.KiroModals?.openAuthRequiredModal();
            return false;
        }
        if (callback) callback();
        return true;
    }

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

    // 2. Cargar Entregas del Usuario (Si hay sesión activa)
    await window.KiroSubmissions?.fetchUserSubmissions();
    updateAuthHeaderUI();

    // 3. Cargar Lista de Ejercicios / Personalidades
    const personalities = await window.KiroEjercicios?.fetchAll() || [];
    window.KiroEjercicios?.renderList('personalitiesList', activePersonality, onSelectPersonality);

    if (personalities.length > 0) {
        onSelectPersonality(personalities[0]);
    }

    // Callback cuando Supabase restaura la sesión de usuario
    window.onUserAuthenticated = async (userId, userObj) => {
        window.currentUserId = userId;
        updateAuthHeaderUI(userObj);
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

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = window.KiroEditor?.getCurrentLanguage() || 'csharp';

        languageSelect.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            window.KiroEditor?.setLanguage(selectedLang);

            if (activePersonality) {
                window.KiroEditor?.loadSavedOrStarterCode(
                    activePersonality.id,
                    activePersonality.starterCode || '',
                    activePersonality
                );
            }
        });
    }

    function updateExerciseNavState() {
        if (!personalities || personalities.length === 0 || !activePersonality) return;
        const index = personalities.findIndex(x => x.id === activePersonality.id);

        if (prevExerciseBtn) {
            prevExerciseBtn.disabled = index <= 0;
            prevExerciseBtn.style.opacity = index <= 0 ? '0.4' : '1';
            prevExerciseBtn.style.cursor = index <= 0 ? 'not-allowed' : 'pointer';
        }
        if (nextExerciseBtn) {
            nextExerciseBtn.disabled = index >= personalities.length - 1;
            nextExerciseBtn.style.opacity = index >= personalities.length - 1 ? '0.4' : '1';
            nextExerciseBtn.style.cursor = index >= personalities.length - 1 ? 'not-allowed' : 'pointer';
        }
    }

    prevExerciseBtn?.addEventListener('click', () => {
        if (!personalities || personalities.length === 0 || !activePersonality) return;
        const index = personalities.findIndex(x => x.id === activePersonality.id);
        if (index > 0) {
            onSelectPersonality(personalities[index - 1]);
        }
    });

    nextExerciseBtn?.addEventListener('click', () => {
        if (!personalities || personalities.length === 0 || !activePersonality) return;
        const index = personalities.findIndex(x => x.id === activePersonality.id);
        if (index >= 0 && index < personalities.length - 1) {
            onSelectPersonality(personalities[index + 1]);
        }
    });

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
            p.starterCode || '',
            p
        );

        window.KiroSubmissions?.checkExerciseCompletion(p, completeExerciseBtn);
        window.KiroEjercicios?.renderList('personalitiesList', p, onSelectPersonality);
        window.KiroChat?.renderCurrentChatHistory(p, chatHistories);
        updateExerciseNavState();
    }

    // 4. Conectar Eventos con Verificación de Autenticación (Auth Guard)
    runJudge0Btn?.addEventListener('click', () => {
        if (!requireUserAuth()) return;
        const code = window.KiroEditor?.getValue();
        if (code) window.KiroJudge0?.compileCode(code);
    });

    runTestsBtn?.addEventListener('click', () => {
        if (!requireUserAuth()) return;
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
        if (!requireUserAuth()) return;
        const code = window.KiroEditor?.getValue();
        if (code && activePersonality && messageInput) {
            const curLang = window.KiroEditor?.getCurrentLanguage() || 'csharp';
            messageInput.value = `Por favor revisa mi código ${curLang.toUpperCase()} actual para el ejercicio "${activePersonality.name}":\n\n\`\`\`${curLang}\n${code}\n\`\`\`\n\n¿Es correcto? ¿Tengo algún error de lógica o sintaxis?`;
            chatForm?.dispatchEvent(new Event('submit'));
        }
    });

    resetStarterCodeBtn?.addEventListener('click', () => {
        if (activePersonality) {
            const curLang = window.KiroEditor?.getCurrentLanguage() || 'csharp';
            const defaultCode = window.KiroEditor?.getStarterCodeForLanguage(activePersonality, activePersonality.starterCode, curLang);
            window.KiroEditor?.setValue(defaultCode);
        }
    });

    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!requireUserAuth()) return;
        const text = messageInput?.value;
        if (text && activePersonality) {
            messageInput.value = '';
            window.KiroChat?.sendPrompt(text, activePersonality, chatHistories);
        }
    });

    // 5. Modales & Guardado de Entregas en Perfil
    completeExerciseBtn?.addEventListener('click', () => {
        if (!requireUserAuth()) return;
        window.KiroModals?.openCompleteModal();
    });

    document.getElementById('closeCompleteModalBtn')?.addEventListener('click', () => window.KiroModals?.closeCompleteModal());
    document.getElementById('cancelCompleteBtn')?.addEventListener('click', () => window.KiroModals?.closeCompleteModal());

    confirmSaveProgressBtn?.addEventListener('click', async () => {
        if (!requireUserAuth()) return;
        const code = window.KiroEditor?.getValue();
        let userId = window.currentUserId;

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

    // Eventos del modal de autenticación requerida
    document.getElementById('closeAuthRequiredModalBtn')?.addEventListener('click', () => window.KiroModals?.closeAuthRequiredModal());
    document.getElementById('cancelAuthRequiredBtn')?.addEventListener('click', () => window.KiroModals?.closeAuthRequiredModal());

    // 6. Voz / Micrófono
    window.KiroVoice?.init();
});
