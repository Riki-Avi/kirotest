using Microsoft.AspNetCore.Mvc;
using proyectoKiro.Domain.Interfaces;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Web.Controllers;

public class AuthController : Controller
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public IActionResult Login()
    {
        return View();
    }

    [HttpGet]
    public IActionResult Register()
    {
        return RedirectToAction("Login");
    }

    [HttpPost]
    public async Task<IActionResult> SyncUser([FromBody] SyncUserRequest request)
    {
        if (string.IsNullOrEmpty(request.Id))
        {
            return BadRequest(new { message = "El ID de usuario es requerido." });
        }

        try
        {
            var user = await _userService.Syncronizacion(request);
            return Ok(new { message = "Usuario sincronizado con éxito.", userId = user.Id });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AuthController SyncUser Warning]: {ex.Message}");
            return Ok(new { message = "Usuario autenticado.", userId = request.Id });
        }
    }
}