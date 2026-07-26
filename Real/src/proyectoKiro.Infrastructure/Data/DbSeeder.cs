using Microsoft.EntityFrameworkCore;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Infrastructure.Services;
using System.Text.RegularExpressions;

namespace proyectoKiro.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, PersonalityService personalityService)
    {
        try
        {
            var personalities = personalityService.GetAll();
            if (personalities == null || !personalities.Any()) return;

            int autoExId = 1;
            foreach (var p in personalities)
            {
                // 1. Seed Personality
                var existingP = await context.Personalities.FirstOrDefaultAsync(x => x.Id == p.Id);
                if (existingP == null)
                {
                    context.Personalities.Add(new Personality
                    {
                        Id = p.Id,
                        Emoji = p.Emoji,
                        Name = p.Name,
                        Avatar = p.Avatar ?? "",
                        Description = p.Description,
                        SystemInstruction = p.SystemInstruction,
                        StarterCode = p.StarterCode,
                        Temperature = p.Temperature,
                        IsCustom = p.IsCustom
                    });
                }

                // 2. Seed Exercise Entity (requerido por FK en la tabla Submissions)
                int exerciseId = autoExId;
                if (!int.TryParse(p.Id, out exerciseId))
                {
                    var match = Regex.Match(p.Id ?? "", @"\d+");
                    if (match.Success)
                    {
                        int.TryParse(match.Value, out exerciseId);
                    }
                }
                if (exerciseId <= 0) exerciseId = autoExId;

                var existingEx = await context.Exercises.FirstOrDefaultAsync(x => x.Id == exerciseId);
                if (existingEx == null)
                {
                    context.Exercises.Add(new Exercise
                    {
                        Id = exerciseId,
                        Title = p.Name ?? $"Ejercicio {exerciseId}",
                        Description = p.Description ?? "",
                        InitialCode = p.StarterCode ?? "",
                        MentorRules = p.SystemInstruction ?? ""
                    });
                }

                autoExId++;
            }

            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbSeeder Warning]: {ex.Message}");
        }
    }
}
