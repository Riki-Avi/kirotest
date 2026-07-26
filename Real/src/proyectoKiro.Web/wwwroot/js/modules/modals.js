// modals.js — Módulo de gestión de modales (Crear/Editar Ejercicio, Configuración APIs, Completar Ejercicio, Iniciar Sesión Requerido)
window.KiroModals = (function () {
    const personalityModal = document.getElementById('personalityModal');
    const modalTitle = document.getElementById('modalTitle');
    const editPersonalityId = document.getElementById('editPersonalityId');
    const pEmoji = document.getElementById('pEmoji');
    const pName = document.getElementById('pName');
    const pDescription = document.getElementById('pDescription');
    const pStarterCode = document.getElementById('pStarterCode');
    const pSystemInstruction = document.getElementById('pSystemInstruction');
    const pTemperature = document.getElementById('pTemperature');
    const tempValue = document.getElementById('tempValue');

    const settingsModal = document.getElementById('settingsModal');
    const customApiKeyInput = document.getElementById('customApiKey');
    const modelSelect = document.getElementById('modelSelect');
    const customJudge0UrlInput = document.getElementById('customJudge0Url');

    const completeModal = document.getElementById('completeModal');
    const authRequiredModal = document.getElementById('authRequiredModal');

    function openPersonalityModal(personality = null) {
        if (!personalityModal) return;
        if (personality) {
            modalTitle.textContent = 'Editar Ejercicio';
            editPersonalityId.value = personality.id;
            pEmoji.value = personality.emoji || '💻';
            pName.value = personality.name || '';
            pDescription.value = personality.description || '';
            pStarterCode.value = personality.starterCode || '';
            pSystemInstruction.value = personality.systemInstruction || '';
            pTemperature.value = personality.temperature ?? 0.5;
        } else {
            modalTitle.textContent = 'Crear Nuevo Ejercicio';
            editPersonalityId.value = '';
            pEmoji.value = '💻';
            pName.value = '';
            pDescription.value = '';
            pStarterCode.value = '';
            pSystemInstruction.value = '';
            pTemperature.value = 0.5;
        }
        if (tempValue) tempValue.textContent = pTemperature.value;
        personalityModal.classList.add('active');
    }

    function closePersonalityModal() {
        personalityModal?.classList.remove('active');
    }

    function openSettingsModal() {
        if (!settingsModal) return;
        if (customApiKeyInput) customApiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
        if (customJudge0UrlInput) customJudge0UrlInput.value = localStorage.getItem('judge0_url') || 'https://ce.judge0.com';
        settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
        settingsModal?.classList.remove('active');
    }

    function openCompleteModal() {
        completeModal?.classList.add('active');
    }

    function closeCompleteModal() {
        completeModal?.classList.remove('active');
    }

    function openAuthRequiredModal() {
        authRequiredModal?.classList.add('active');
    }

    function closeAuthRequiredModal() {
        authRequiredModal?.classList.remove('active');
    }

    return {
        openPersonalityModal,
        closePersonalityModal,
        openSettingsModal,
        closeSettingsModal,
        openCompleteModal,
        closeCompleteModal,
        openAuthRequiredModal,
        closeAuthRequiredModal
    };
})();
