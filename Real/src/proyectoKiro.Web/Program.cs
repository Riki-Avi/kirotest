using Microsoft.EntityFrameworkCore;
using proyectoKiro.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Registrar MVC (Controllers + Views Views/{Controller}/{Action}.cshtml) y Razor Pages
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// Registrar DbContext con PostgreSQL (Supabase)
var connectionString = builder.Configuration.GetConnectionString("SupabaseConnection") 
    ?? "Host=localhost;Database=proyectoKiroDb;Username=postgres;Password=postgres;";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// Ruta MVC predeterminada: Views/{Controller}/{Action}.cshtml
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();
app.MapControllers();

app.Run();
