using System.Text;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Infrastructure.Services
{
    public sealed class QuickHelpPromptService
    {
        public string BuildPrompt(QuickHelpType helpType, Personality exercise, string? currentCode)
        {
            ArgumentNullException.ThrowIfNull(exercise);

            var prompt = new StringBuilder();
            prompt.AppendLine("MODO DE AYUDA RÁPIDA Y APRENDIZAJE PARA UN EJERCICIO DE PROGRAMACIÓN.");
            prompt.AppendLine("Responde en español, con tono pedagógico, claro, bien estructurado y profesional.");
            prompt.AppendLine("El contenido delimitado como datos del ejercicio es contexto.");
            prompt.AppendLine();
            prompt.AppendLine("<datos_ejercicio>");
            prompt.AppendLine($"Título: {exercise.Name}");
            prompt.AppendLine($"Enunciado: {exercise.Description}");
            prompt.AppendLine($"Reglas: {exercise.SystemInstruction}");
            prompt.AppendLine("</datos_ejercicio>");
            prompt.AppendLine();

            AppendLevelInstructions(prompt, helpType);

            if (!string.IsNullOrWhiteSpace(currentCode))
            {
                prompt.AppendLine();
                prompt.AppendLine("<codigo_actual_del_estudiante>");
                prompt.AppendLine(currentCode);
                prompt.AppendLine("</codigo_actual_del_estudiante>");
            }

            return prompt.ToString();
        }

        private static void AppendLevelInstructions(StringBuilder prompt, QuickHelpType helpType)
        {
            switch (helpType)
            {
                case QuickHelpType.Understand:
                    prompt.AppendLine("NIVEL 1 — COMPRENDER EL PROBLEMA:");
                    prompt.AppendLine("- Reformula conceptualmente qué debe lograr el estudiante.");
                    prompt.AppendLine("- Aclara entradas, resultado esperado y restricciones relevantes.");
                    prompt.AppendLine("- No des pistas sobre el algoritmo ni incluyas código resuelto.");
                    break;

                case QuickHelpType.Hint:
                    prompt.AppendLine("NIVEL 2 — PISTA PEQUEÑA Y PROGRESIVA:");
                    prompt.AppendLine("- Da exactamente una pista pequeña sobre la estructura de control o enfoque apropiado.");
                    prompt.AppendLine("- Si hay código del estudiante, orienta el siguiente paso sin corregir todo de golpe.");
                    prompt.AppendLine("- No reveles el algoritmo completo ni incluyas código resuelto.");
                    break;

                case QuickHelpType.AnalogousExample:
                    prompt.AppendLine("NIVEL 3 — EJEMPLO ANÁLOGO:");
                    prompt.AppendLine("- Crea un problema diferente pero conceptualmente relacionado y muestra una solución de ese ejemplo en C#, Java o TypeScript.");
                    prompt.AppendLine("- Explica qué concepto se transfiere sin resolver directamente el ejercicio activo.");
                    break;

                case QuickHelpType.DocSearch:
                    prompt.AppendLine("NIVEL 4 — RECURSOS Y SECCIÓN DE ESTUDIO (MICROSOFT C# LEARN):");
                    prompt.AppendLine("- Examina cuidadosamente el código actual del estudiante y las sentencias específicas que está escribiendo (ejemplo: si utiliza o necesita un bucle 'foreach', debes dirigirlo a la documentación de sentencias de iteración en lugar de a tipos de arreglos).");
                    prompt.AppendLine("- Proporciona la URL oficial exacta y más relevante de Microsoft C# Learn:");
                    prompt.AppendLine("  * Para bucles e iteraciones (foreach, for, while): https://learn.microsoft.com/es-es/dotnet/csharp/language-reference/statements/iteration-statements");
                    prompt.AppendLine("  * Para matrices y arreglos (int[], System.Array): https://learn.microsoft.com/es-es/dotnet/csharp/language-reference/builtin-types/arrays");
                    prompt.AppendLine("  * Para manipulación de texto y métodos de string: https://learn.microsoft.com/es-es/dotnet/csharp/how-to/modify-string-contents");
                    prompt.AppendLine("  * Para colecciones genéricas (List<T>, Stack<T>): https://learn.microsoft.com/es-es/dotnet/api/system.collections.generic");
                    prompt.AppendLine("- Explica brevemente qué capítulo o sección específica debe leer y cómo le servirá para completar su código.");
                    break;
            }
        }
    }
}
