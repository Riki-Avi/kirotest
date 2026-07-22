using Microsoft.AspNetCore.Mvc;

namespace proyectoKiro.Web.Controllers;

public class ProfileController : Controller
{
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }
}