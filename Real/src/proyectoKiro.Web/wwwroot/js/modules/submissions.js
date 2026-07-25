// submissions.js — Módulo de entregas, autenticación Supabase y persistencia de progreso
window.KiroSubmissions = (function () {
    let userSubmissions = [];

    async function fetchUserSubmissions() {
        let userId = window.currentUserId;
        if (!userId && window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getSession();
            userId = data?.session?.user?.id;
            if (userId) window.currentUserId = userId;
        }

        if (!userId) return [];

        try {
            const res = await fetch(`/api/submissions/user/${userId}`);
            if (res.ok) {
                userSubmissions = await res.json();
            }
        } catch (err) {
            console.error('Error al cargar entregas del usuario:', err);
        }
        return userSubmissions;
    }

    function isExerciseCompleted(p) {
        if (!p || !userSubmissions || userSubmissions.length === 0) return false;
        const targetId = String(p.id).toLowerCase();

        return userSubmissions.some(s => {
            if (!s.passed) return false;
            const subExId = String(s.exerciseId).toLowerCase();

            if (subExId === targetId) return true;

            const subDigits = subExId.match(/\d+/)?.[0];
            const targetDigits = targetId.match(/\d+/)?.[0];
            if (subDigits && targetDigits && subDigits === targetDigits) return true;

            return false;
        });
    }

    function checkExerciseCompletion(p, completeBtn) {
        if (!p || !completeBtn) return;
        const completed = isExerciseCompleted(p);
        if (completed) {
            completeBtn.classList.remove('hidden');
            completeBtn.textContent = '✅ Completado';
        } else {
            completeBtn.classList.add('hidden');
            completeBtn.textContent = '✅ Completar Ejercicio';
        }
    }

    async function saveSubmission(userId, activePersonality, sourceCode) {
        if (!userId || !activePersonality || !sourceCode) {
            return { success: false, message: 'Faltan parámetros requeridos.' };
        }

        try {
            const res = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    exerciseId: String(activePersonality.id),
                    submittedCode: sourceCode,
                    passed: true,
                    output: 'Compilación y suite de tests 100% aprobadas'
                })
            });

            const data = await res.json();
            if (data.success) {
                // Actualizar o agregar localmente
                const existingIndex = userSubmissions.findIndex(s => isExerciseCompleted({ id: activePersonality.id }));
                const newRecord = {
                    id: data.submissionId,
                    userId: userId,
                    exerciseId: String(activePersonality.id),
                    submittedCode: sourceCode,
                    passed: true,
                    submittedAt: new Date().toISOString()
                };

                if (existingIndex >= 0) {
                    userSubmissions[existingIndex] = newRecord;
                } else {
                    userSubmissions.push(newRecord);
                }
            }
            return data;
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    return {
        fetchUserSubmissions,
        isExerciseCompleted,
        checkExerciseCompletion,
        saveSubmission,
        getUserSubmissions: () => userSubmissions
    };
})();
