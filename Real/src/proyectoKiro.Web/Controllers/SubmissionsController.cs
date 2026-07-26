using Microsoft.AspNetCore.Mvc;
using proyectoKiro.Domain.Interfaces;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public SubmissionsController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveSubmissionRequest request)
    {
        try
        {
            var result = await _submissionService.SaveSubmissionAsync(request);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new SaveSubmissionResponse
            {
                Success = false,
                Message = $"Error al guardar entrega en base de datos: {ex.Message}"
            });
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserSubmissions(string userId)
    {
        var submissions = await _submissionService.GetUserSubmissionsAsync(userId);
        return Ok(submissions);
    }
}
