# 🚀 Kiro Code Lab — Guía de Instalación para el Equipo

## Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión | Descarga |
|-------------|---------|----------|
| **.NET SDK** | 10.0 o superior | [https://dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) |
| **Git** | Cualquier versión reciente | [https://git-scm.com/downloads](https://git-scm.com/downloads) |
| **Editor** | Visual Studio 2022 / VS Code / Rider | El que prefieras |

Para verificar que tenés .NET instalado, abrí una terminal y ejecutá:
```bash
dotnet --version
```

---

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Riki-Avi/kirotest.git
cd kirotest
```

---

## Paso 2: Configurar las Credenciales Secretas

> ⚠️ **IMPORTANTE**: Las claves de API y contraseñas **NO están en GitHub** por seguridad. Cada desarrollador debe configurarlas en su máquina local.

Creá el archivo `Real/src/proyectoKiro.Web/appsettings.Development.json` (Git lo ignora automáticamente, nunca se sube):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "SupabaseConnection": "Host=db.bzaifpevfuwlaznmhiee.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=PEDIR_A_RIKI;"
  },
  "Gemini": {
    "ApiKey": "PEDIR_A_RIKI",
    "DefaultModel": "gemini-3.5-flash"
  }
}
```

> 📩 **Pedile la contraseña de Supabase y la API Key de Gemini a Riki por WhatsApp/Discord.**

---

## Paso 3: Compilar el Proyecto

Desde la raíz del repositorio (`kirotest/`):

```bash
cd Real
dotnet restore
dotnet build
```

Si la compilación sale con **0 Errores**, estás listo. ✅

---

## Paso 4: Ejecutar la Aplicación

```bash
dotnet run --project src/proyectoKiro.Web
```

La aplicación se levanta en:
👉 **http://localhost:5062**

Abrí esa URL en tu navegador y ya deberías ver **Kiro Code Lab** funcionando con el editor Monaco, el chat de Mentores IA y los ejercicios de C#.

---

## Paso 5: Aplicar Migraciones a la Base de Datos (solo si es necesario)

Si hay migraciones nuevas pendientes (después de un `git pull`), ejecutá:

```bash
dotnet ef database update --project src/proyectoKiro.Infrastructure --startup-project src/proyectoKiro.Web
```

> 💡 Si no tenés el tool `dotnet ef`, instalalo con:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

---

## 📂 Estructura del Proyecto

```
kirotest/
├── prototipo/          ← Versión prototipo (solo referencia, NO tocar)
├── Real/               ← 🔥 PROYECTO PRINCIPAL (acá se trabaja)
│   ├── proyectoKiro.slnx
│   └── src/
│       ├── proyectoKiro.Domain/          ← Entidades y DTOs
│       │   ├── Entities/                 (Exercise, Personality, Submission)
│       │   └── Models/                   (GeminiModels, Judge0Models)
│       │
│       ├── proyectoKiro.Infrastructure/  ← Servicios y Base de Datos
│       │   ├── Data/                     (ApplicationDbContext - EF Core)
│       │   ├── Services/                 (GeminiService, Judge0Service, etc.)
│       │   └── Migrations/               (Migraciones Code-First)
│       │
│       └── proyectoKiro.Web/            ← Capa Web (lo que se ejecuta)
│           ├── Controllers/              (API endpoints)
│           ├── Pages/                    (Razor Pages + Layout)
│           ├── Views/                    (Vistas MVC)
│           ├── wwwroot/                  (CSS, JS, assets estáticos)
│           ├── Program.cs                (Entry point)
│           └── appsettings.json          (Config pública - SIN secretos)
```

---

## 🔄 Flujo de Trabajo Diario

```bash
# 1. Traer últimos cambios
git pull origin main

# 2. Compilar
cd Real
dotnet build

# 3. Ejecutar
dotnet run --project src/proyectoKiro.Web

# 4. Trabajar, hacer cambios...

# 5. Commitear y pushear
git add .
git commit -m "Descripción de lo que hiciste"
git push origin main
```

---

## 🛠️ Tecnologías que Usamos

- **ASP.NET Core 10** con Razor Pages + MVC
- **Entity Framework Core** (Code-First) con **PostgreSQL** (Supabase)
- **Gemini API** (IA para mentores)
- **Judge0 API** (Compilador remoto de C#)
- **Monaco Editor** (Editor de código en el browser)
- **Whisper.net** (Transcripción de voz)

---

## ❓ Problemas Comunes

### "No se ha podido encontrar un proyecto para ejecutar"
→ Asegurate de estar en la carpeta `Real/` o usar `--project`:
```bash
dotnet run --project src/proyectoKiro.Web
```

### "Connection refused" o error de base de datos
→ Verificá que tu `appsettings.Development.json` tenga las credenciales correctas de Supabase.

### "API Key de Gemini no configurada"
→ Podés configurarla en `appsettings.Development.json` o directamente en la interfaz web (botón ⚙️ Configuración).
