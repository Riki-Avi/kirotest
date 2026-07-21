using Microsoft.AspNetCore.Mvc;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Infrastructure.Services;

namespace proyectoKiro.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonalitiesController : ControllerBase
    {
        private readonly PersonalityService _personalityService;

        public PersonalitiesController(PersonalityService personalityService)
        {
            _personalityService = personalityService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_personalityService.GetAll());
        }

        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            var personality = _personalityService.GetById(id);
            if (personality == null) return NotFound(new { message = "Personalidad no encontrada." });
            return Ok(personality);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Personality personality)
        {
            if (string.IsNullOrWhiteSpace(personality.Name) || string.IsNullOrWhiteSpace(personality.SystemInstruction))
            {
                return BadRequest(new { message = "El nombre y las instrucciones de sistema son requeridos." });
            }

            var created = _personalityService.Add(personality);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public IActionResult Update(string id, [FromBody] Personality personality)
        {
            var updated = _personalityService.Update(id, personality);
            if (!updated) return NotFound(new { message = "Personalidad no encontrada para actualizar." });
            return Ok(new { message = "Personalidad actualizada con éxito." });
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            var deleted = _personalityService.Delete(id);
            if (!deleted) return NotFound(new { message = "Personalidad no encontrada." });
            return Ok(new { message = "Personalidad eliminada con éxito." });
        }
    }
}
