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
        private readonly WhisperService _whisperService;

        public ChatController(GeminiService geminiService, PersonalityService personalityService, WhisperService whisperService)
        {
            _geminiService = geminiService;
            _personalityService = personalityService;
            _whisperService = whisperService;
        }

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
    }
}
