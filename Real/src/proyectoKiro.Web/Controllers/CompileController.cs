using Microsoft.AspNetCore.Mvc;
using proyectoKiro.Domain.Models;
using proyectoKiro.Infrastructure.Services;

namespace proyectoKiro.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompileController : ControllerBase
    {
        private readonly Judge0Service _judge0Service;

        public CompileController(Judge0Service judge0Service)
        {
            _judge0Service = judge0Service;
        }

        [HttpPost]
        public async Task<IActionResult> Execute([FromBody] Judge0CompileRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SourceCode))
            {
                return BadRequest(new Judge0CompileResponse
                {
                    Success = false,
                    ErrorMessage = "El código fuente no puede estar vacío."
                });
            }

            var result = await _judge0Service.ExecuteCodeAsync(request);
            return Ok(result);
        }

        [HttpPost("test")]
        public async Task<IActionResult> RunTestSuite([FromServices] PersonalityService personalityService, [FromBody] TestSuiteRunRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SourceCode))
            {
                return BadRequest(new TestSuiteRunResponse
                {
                    Success = false,
                    ErrorMessage = "El código fuente no puede estar vacío."
                });
            }

            var personality = personalityService.GetById(request.PersonalityId);
            if (personality == null)
            {
                return NotFound(new TestSuiteRunResponse
                {
                    Success = false,
                    ErrorMessage = "Ejercicio no encontrado."
                });
            }

            var result = await _judge0Service.ExecuteTestSuiteAsync(request.SourceCode, personality, request.CustomJudge0Url);
            return Ok(result);
        }
    }
}
