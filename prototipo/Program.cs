using proyectoKiro.Services;

var builder = WebApplication.CreateBuilder(args);

// Registrar servicios de la aplicación
builder.Services.AddSingleton<PersonalityService>();
builder.Services.AddSingleton<WhisperService>();
builder.Services.AddHttpClient<GeminiService>();
builder.Services.AddHttpClient<Judge0Service>();

builder.Services.AddControllers();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.MapControllers();

app.Run();
