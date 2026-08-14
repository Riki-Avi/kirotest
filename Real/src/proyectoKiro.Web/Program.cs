using Microsoft.EntityFrameworkCore;
using proyectoKiro.Infrastructure.Data;
using proyectoKiro.Infrastructure.Services;
using proyectoKiro.Domain.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Registrar servicios de la aplicación
builder.Services.AddSingleton<PersonalityService>();
builder.Services.AddSingleton<QuickHelpPromptService>();
builder.Services.AddSingleton<WhisperService>();
builder.Services.AddHttpClient<GeminiService>();
builder.Services.AddHttpClient<Judge0Service>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ISubmissionService, SubmissionService>();

// Registrar MVC (Controllers + Views Views/{Controller}/{Action}.cshtml) y Razor Pages
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddRazorPages();

// Registrar DbContext con PostgreSQL (Supabase)
var connectionString = Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("SupabaseConnection") 
    ?? "Host=localhost;Database=proyectoKiroDb;Username=postgres;Password=postgres;";

if (connectionString.Contains("db.bzaifpevfuwlaznmhiee.supabase.co", StringComparison.OrdinalIgnoreCase))
{
    connectionString = connectionString.Replace("db.bzaifpevfuwlaznmhiee.supabase.co", "aws-0-us-east-1.pooler.supabase.com")
                                       .Replace("Port=5432", "Port=6543")
                                       .Replace("Username=postgres;", "Username=postgres.bzaifpevfuwlaznmhiee;");
}

if (connectionString.Contains("supabase", StringComparison.OrdinalIgnoreCase) 
    && !connectionString.Contains("SslMode", StringComparison.OrdinalIgnoreCase) 
    && !connectionString.Contains("SSL Mode", StringComparison.OrdinalIgnoreCase))
{
    connectionString += ";SslMode=Require;TrustServerCertificate=true;";
}

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

// Sincronizar automáticamente los 10 ejercicios desde personalities.json a la BD en Supabase
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        var personalityService = scope.ServiceProvider.GetRequiredService<PersonalityService>();
        await DbSeeder.SeedAsync(dbContext, personalityService);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Seed Exception]: {ex.Message}");
    }
}

app.Run();
