using Microsoft.EntityFrameworkCore;
using proyectoKiro.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Registrar Razor Pages y Controllers
builder.Services.AddRazorPages();
builder.Services.AddControllers();

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

app.MapRazorPages();
app.MapControllers();

app.Run();
