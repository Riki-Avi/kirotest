using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Infrastructure.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<ChatSendResponse> SendMessageAsync(ChatSendRequest request, Personality personality)
        {
            try
            {
                var apiKey = !string.IsNullOrWhiteSpace(request.CustomApiKey) 
                    ? request.CustomApiKey 
                    : Environment.GetEnvironmentVariable("GEMINI_API_KEY") 
                      ?? _configuration["Gemini:ApiKey"];

                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    return new ChatSendResponse
                    {
                        Success = false,
                        ErrorMessage = "No se configuró una API Key de Gemini. Por favor proporciona una en appsettings.json o en la interfaz.",
                        UsedPersonality = personality.Name
                    };
                }

                var modelName = (!string.IsNullOrWhiteSpace(request.Model) 
                    ? request.Model 
                    : _configuration["Gemini:DefaultModel"] ?? "gemini-3.5-flash-lite").Replace("models/", "");

                var systemInstructionText = personality.SystemInstruction ?? "";
                
                // REGLA FUNDAMENTAL SOCRÁTICA
                systemInstructionText += "\n\n[REGLA DE ORO DEL TUTOR IA]: NUNCA escribas la solución o el método de código completo del ejercicio directamente en tu respuesta (a menos que el usuario te lo pida explícitamente diciendo 'dame la solución'). Tu rol es ser un mentor socrático: guía al usuario con pistas progresivas, explicaciones de conceptos, analogías o fragmentos genéricos de apoyo para que ÉL escriba el código por sí mismo.";

                if (!string.IsNullOrWhiteSpace(request.Intensity))
                {
                    var intensity = request.Intensity.Trim().ToLower();
                    if (intensity == "concise")
                    {
                        systemInstructionText += "\n\n[ESTILO DE RESPUESTA - CONCISO]: Responde de forma muy breve (máximo 2 a 3 oraciones), directa al grano, dando solo una pequeña pista o concepto sin dar la solución en código.";
                    }
                    else if (intensity == "detailed")
                    {
                        systemInstructionText += "\n\n[ESTILO DE RESPUESTA - DETALLADO]: Proporciona explicaciones conceptuales exhaustivas paso a paso, analogías y análisis de complejidad O(N), pero NUNCA incluyas la función de solución terminada en código. Deja que el alumno escriba el código.";
                    }
                }

                // ADJUNTAR CÓDIGO DEL EDITOR DE FORMA INVISIBLE PARA EL CHAT DEL USUARIO
                if (!string.IsNullOrWhiteSpace(request.CurrentCode))
                {
                    systemInstructionText += $"\n\n[CÓDIGO ACTUAL EN EL EDITOR DE CÓDIGO DEL ALUMNO]:\n```\n{request.CurrentCode}\n```";
                    
                    if (!string.IsNullOrWhiteSpace(request.PreviousCode) && request.PreviousCode != request.CurrentCode)
                    {
                        systemInstructionText += $"\n\n[CÓDIGO ANTERIOR EN EL EDITOR DEL ALUMNO (MENSAJE PREVIO)]:\n```\n{request.PreviousCode}\n```\n(Nota: El alumno ha realizado cambios en su código desde la última interacción. Analiza los avances, errores o correcciones realizadas).";
                    }
                }

                // Construir la estructura de la solicitud
                var geminiReq = new GeminiRequest
                {
                    SystemInstruction = GeminiSystemInstruction.FromText(systemInstructionText),
                    GenerationConfig = new GeminiGenerationConfig
                    {
                        Temperature = personality.Temperature,
                        MaxOutputTokens = 4096
                    }
                };

                // Agregar historial si existe
                if (request.History != null && request.History.Count > 0)
                {
                    foreach (var h in request.History)
                    {
                        geminiReq.Contents.Add(new GeminiContent
                        {
                            Role = h.Role.ToLower() == "user" ? "user" : "model",
                            Parts = new List<GeminiPart> { new GeminiPart { Text = h.Message } }
                        });
                    }
                }

                // Agregar el mensaje actual del usuario y/o datos de audio
                var userParts = new List<GeminiPart>();

                if (!string.IsNullOrWhiteSpace(request.AudioBase64))
                {
                    userParts.Add(new GeminiPart
                    {
                        InlineData = new GeminiInlineData
                        {
                            MimeType = !string.IsNullOrWhiteSpace(request.AudioMimeType) ? request.AudioMimeType : "audio/webm",
                            Data = request.AudioBase64
                        }
                    });
                }

                if (!string.IsNullOrWhiteSpace(request.Message))
                {
                    userParts.Add(new GeminiPart { Text = request.Message });
                }

                if (userParts.Count == 0)
                {
                    userParts.Add(new GeminiPart { Text = "Hola" });
                }

                geminiReq.Contents.Add(new GeminiContent
                {
                    Role = "user",
                    Parts = userParts
                });

                var jsonOptions = new JsonSerializerOptions 
                { 
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull 
                };

                var payloadJson = JsonSerializer.Serialize(geminiReq, jsonOptions);

                var candidateModels = new List<string> { modelName, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash" }
                    .Distinct()
                    .ToList();

                HttpResponseMessage? response = null;
                string responseJson = "";

                foreach (var currentModel in candidateModels)
                {
                    var endpointUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{currentModel}:generateContent?key={apiKey}";
                    var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

                    response = await _httpClient.PostAsync(endpointUrl, content);
                    responseJson = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }

                    // Si Google responde 503 (High Demand) o 429/404, intentar automáticamente con el siguiente modelo
                    if ((int)response.StatusCode == 503 || (int)response.StatusCode == 429 || (int)response.StatusCode == 404)
                    {
                        continue;
                    }
                    else
                    {
                        break;
                    }
                }

                if (response == null || !response.IsSuccessStatusCode)
                {
                    string errorMsg = response != null ? $"Error HTTP {(int)response.StatusCode} ({response.StatusCode}): {responseJson}" : "Error al conectar con Gemini.";
                    try
                    {
                        var errObj = JsonSerializer.Deserialize<GeminiResponse>(responseJson);
                        if (errObj?.Error != null)
                        {
                            errorMsg = $"Error de Gemini ({errObj.Error.Code}): {errObj.Error.Message}";
                        }
                    }
                    catch { }

                    return new ChatSendResponse
                    {
                        Success = false,
                        ErrorMessage = errorMsg,
                        UsedPersonality = personality.Name
                    };
                }

                var geminiRes = JsonSerializer.Deserialize<GeminiResponse>(responseJson);
                var textResponse = geminiRes?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

                if (string.IsNullOrWhiteSpace(textResponse))
                {
                    return new ChatSendResponse
                    {
                        Success = false,
                        ErrorMessage = "Gemini devolvió una respuesta vacía o no válida.",
                        UsedPersonality = personality.Name
                    };
                }

                return new ChatSendResponse
                {
                    Success = true,
                    Response = textResponse,
                    UsedPersonality = personality.Name
                };
            }
            catch (Exception ex)
            {
                return new ChatSendResponse
                {
                    Success = false,
                    ErrorMessage = $"Excepción interna al conectar con Gemini API: {ex.Message}",
                    UsedPersonality = personality.Name
                };
            }
        }

        public async Task<List<string>> GetAvailableModelsAsync(string? customApiKey = null)
        {
            try
            {
                var apiKey = !string.IsNullOrWhiteSpace(customApiKey) 
                    ? customApiKey 
                    : _configuration["Gemini:ApiKey"];

                if (string.IsNullOrWhiteSpace(apiKey)) return new List<string>();

                var url = $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}";
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) return new List<string>();

                var json = await response.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<GeminiListModelsResponse>(json);
                
                if (data?.Models == null) return new List<string>();

                return data.Models
                    .Where(m => m.SupportedGenerationMethods != null && m.SupportedGenerationMethods.Contains("generateContent"))
                    .Select(m => m.Name.Replace("models/", ""))
                    .ToList();
            }
            catch
            {
                return new List<string>();
            }
        }

        public async Task<string> TranscribeAudioAsync(string audioBase64, string mimeType, string? customApiKey = null)
        {
            try
            {
                var apiKey = !string.IsNullOrWhiteSpace(customApiKey) 
                    ? customApiKey 
                    : _configuration["Gemini:ApiKey"];
                if (string.IsNullOrWhiteSpace(apiKey)) return string.Empty;

                var modelName = _configuration["Gemini:DefaultModel"] ?? "gemini-3.5-flash";
                var endpointUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";

                var geminiReq = new GeminiRequest
                {
                    Contents = new List<GeminiContent>
                    {
                        new GeminiContent
                        {
                            Role = "user",
                            Parts = new List<GeminiPart>
                            {
                                new GeminiPart
                                {
                                    InlineData = new GeminiInlineData
                                    {
                                        MimeType = mimeType,
                                        Data = audioBase64
                                    }
                                },
                                new GeminiPart
                                {
                                    Text = "Transcribe exactamente las palabras habladas en este audio al español. Devuelve ÚNICAMENTE la transcripción literal del texto, sin comillas, introducciones ni explicaciones adicionales."
                                }
                            }
                        }
                    }
                };

                var jsonOptions = new JsonSerializerOptions 
                { 
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull 
                };

                var payloadJson = JsonSerializer.Serialize(geminiReq, jsonOptions);
                var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(endpointUrl, content);
                if (!response.IsSuccessStatusCode) return string.Empty;

                var jsonStr = await response.Content.ReadAsStringAsync();
                var geminiResp = JsonSerializer.Deserialize<GeminiResponse>(jsonStr);

                var transcript = geminiResp?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
                return transcript?.Trim() ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }
    }
}
