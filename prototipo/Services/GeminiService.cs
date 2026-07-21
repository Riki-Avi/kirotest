using System.Text;
using System.Text.Json;
using proyectoKiro.Models;

namespace proyectoKiro.Services
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
                    : _configuration["Gemini:ApiKey"];

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
                    : _configuration["Gemini:DefaultModel"] ?? "gemini-3.5-flash").Replace("models/", "");

                var endpointUrl = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey}";

                // Construir la estructura de la solicitud
                var geminiReq = new GeminiRequest
                {
                    SystemInstruction = GeminiSystemInstruction.FromText(personality.SystemInstruction),
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
                var content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(endpointUrl, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    string errorMsg = $"Error HTTP {(int)response.StatusCode} ({response.StatusCode}): {responseJson}";
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
