using Microsoft.AspNetCore.Mvc;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Models;
using proyectoKiro.Infrastructure.Services;

namespace proyectoKiro.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly GeminiService _geminiService;
        private readonly PersonalityService _personalityService;
        private readonly QuickHelpPromptService _quickHelpPromptService;
        private readonly WhisperService _whisperService;

        public ChatController(
            GeminiService geminiService,
            PersonalityService personalityService,
            QuickHelpPromptService quickHelpPromptService,
            WhisperService whisperService)
        {
            _geminiService = geminiService;
            _personalityService = personalityService;
            _quickHelpPromptService = quickHelpPromptService;
            _whisperService = whisperService;
        }

        [HttpPost]
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatSendRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new ChatSendResponse
                {
                    Success = false,
                    ErrorMessage = "El mensaje no puede estar vacío."
                });
            }

            var personality = _personalityService.GetById(request.PersonalityId);
            if (personality == null)
            {
                personality = _personalityService.GetAll().FirstOrDefault() ?? new Personality
                {
                    Name = "Asistente Gemini Standard",
                    SystemInstruction = "Eres un asistente útil, amable y conciso.",
                    Temperature = 0.7
                };
            }

            var result = await _geminiService.SendMessageAsync(request, personality);
            return Ok(result);
        }

        [HttpPost("quick-help")]
        public async Task<IActionResult> SendQuickHelp([FromBody] QuickHelpRequest request)
        {
            if (!Enum.IsDefined(typeof(QuickHelpType), request.HelpType))
            {
                return BadRequest(new ChatSendResponse
                {
                    Success = false,
                    ErrorMessage = "El tipo de ayuda rápida no es válido."
                });
            }

            var personality = _personalityService.GetById(request.PersonalityId);
            if (personality == null)
            {
                return NotFound(new ChatSendResponse
                {
                    Success = false,
                    ErrorMessage = "No se encontró el ejercicio activo."
                });
            }

            var quickHelpPrompt = _quickHelpPromptService.BuildPrompt(
                request.HelpType,
                personality,
                request.CurrentCode,
                request.Language);

            var geminiRequest = new ChatSendRequest
            {
                PersonalityId = request.PersonalityId,
                Message = quickHelpPrompt.UserContext,
                History = NormalizeHistory(request.History),
                CustomApiKey = request.CustomApiKey,
                Model = request.Model,
                Intensity = request.Intensity
            };

            var result = await _geminiService.SendMessageAsync(
                geminiRequest,
                personality,
                quickHelpPrompt.SystemInstruction);
            return Ok(result);
        }

        [HttpGet("models")]
        public async Task<IActionResult> GetModels([FromQuery] string? apiKey)
        {
            var models = await _geminiService.GetAvailableModelsAsync(apiKey);
            return Ok(models);
        }

        [HttpPost("transcribe")]
        public async Task<IActionResult> TranscribeAudio([FromBody] TranscribeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.AudioBase64))
            {
                return BadRequest(new { success = false, text = string.Empty });
            }

            try
            {
                var audioBytes = Convert.FromBase64String(request.AudioBase64);
                // Si el formato enviado es WAV, usar Whisper.net directamente
                if (request.AudioMimeType.Contains("wav"))
                {
                    var whisperText = await _whisperService.TranscribeWavAsync(audioBytes);
                    if (!string.IsNullOrWhiteSpace(whisperText))
                    {
                        return Ok(new { success = true, text = whisperText, source = "Whisper.net" });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Nota Whisper.net: {ex.Message}. Usando Gemini fallback...");
            }

            var text = await _geminiService.TranscribeAudioAsync(request.AudioBase64, request.AudioMimeType, request.CustomApiKey);
            return Ok(new { success = true, text, source = "Gemini" });
        }

        private static List<ChatMessageDto> NormalizeHistory(IEnumerable<ChatMessageDto>? history)
        {
            const int maxHistoryItems = 30;
            const int maxMessageLength = 12000;

            return (history ?? Enumerable.Empty<ChatMessageDto>())
                .Where(item => item != null && !string.IsNullOrWhiteSpace(item.Message))
                .TakeLast(maxHistoryItems)
                .Select(item => new ChatMessageDto
                {
                    Role = string.Equals(item.Role, "user", StringComparison.OrdinalIgnoreCase)
                        ? "user"
                        : "model",
                    Message = item.Message.Length <= maxMessageLength
                        ? item.Message
                        : item.Message[..maxMessageLength]
                })
                .ToList();
        }
    }
}
