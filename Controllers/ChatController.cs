using Microsoft.AspNetCore.Mvc;
using proyectoKiro.Models;
using proyectoKiro.Services;

namespace proyectoKiro.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly GeminiService _geminiService;
        private readonly PersonalityService _personalityService;

        public ChatController(GeminiService geminiService, PersonalityService personalityService)
        {
            _geminiService = geminiService;
            _personalityService = personalityService;
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

            // Buscar la personalidad por ID o usar la predeterminada por defecto
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
    }
}
