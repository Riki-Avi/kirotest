using Microsoft.AspNetCore.Mvc;

namespace proyectoKiro.Web.Controllers;

public class EditorController : Controller
{
    // Ruta: /Editor
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }
}
