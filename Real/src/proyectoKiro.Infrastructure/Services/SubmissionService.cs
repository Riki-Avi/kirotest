using Microsoft.EntityFrameworkCore;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Interfaces;
using proyectoKiro.Domain.Models;
using proyectoKiro.Infrastructure.Data;

namespace proyectoKiro.Infrastructure.Services;

public class SubmissionService : ISubmissionService
{
    private readonly ApplicationDbContext _context;
    private static readonly List<Submission> _inMemorySubmissions = new();
    private static readonly object _lockObj = new();

    public SubmissionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SaveSubmissionResponse> SaveSubmissionAsync(SaveSubmissionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return new SaveSubmissionResponse
            {
                Success = false,
                Message = "El ID de usuario es obligatorio."
            };
        }

        int exerciseId = 1;
        if (!int.TryParse(request.ExerciseId, out exerciseId))
        {
            var match = System.Text.RegularExpressions.Regex.Match(request.ExerciseId ?? "", @"\d+");
            if (match.Success)
            {
                int.TryParse(match.Value, out exerciseId);
            }
            if (exerciseId <= 0) exerciseId = 1;
        }

        // Intento 1: Guardar en Base de Datos PostgreSQL (Supabase)
        try
        {
            await _context.Database.EnsureCreatedAsync();

            var userExists = await _context.Users.AnyAsync(u => u.Id == request.UserId);
            if (!userExists)
            {
                _context.Users.Add(new User
                {
                    Id = request.UserId,
                    Email = "",
                    NombreUsuario = "Usuario",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            var existingSubmission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.ExerciseId == exerciseId);

            if (existingSubmission != null)
            {
                existingSubmission.SubmittedCode = request.SubmittedCode;
                existingSubmission.Passed = request.Passed;
                existingSubmission.Output = request.Output;
                existingSubmission.SubmittedAt = DateTime.UtcNow;

                _context.Submissions.Update(existingSubmission);
                await _context.SaveChangesAsync();

                return new SaveSubmissionResponse
                {
                    Success = true,
                    Message = "Solución actualizada con éxito en tu perfil.",
                    SubmissionId = existingSubmission.Id
                };
            }

            var submission = new Submission
            {
                UserId = request.UserId,
                ExerciseId = exerciseId,
                SubmittedCode = request.SubmittedCode,
                Passed = request.Passed,
                Output = request.Output,
                SubmittedAt = DateTime.UtcNow
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            return new SaveSubmissionResponse
            {
                Success = true,
                Message = "Ejercicio completado guardado con éxito.",
                SubmissionId = submission.Id
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SubmissionService Warning DB Fallback]: {ex.Message}");

            // Fallback en memoria si la BD de Supabase no responde
            lock (_lockObj)
            {
                var existing = _inMemorySubmissions.FirstOrDefault(s => s.UserId == request.UserId && s.ExerciseId == exerciseId);
                if (existing != null)
                {
                    existing.SubmittedCode = request.SubmittedCode;
                    existing.Passed = request.Passed;
                    existing.Output = request.Output;
                    existing.SubmittedAt = DateTime.UtcNow;
                }
                else
                {
                    _inMemorySubmissions.Add(new Submission
                    {
                        Id = _inMemorySubmissions.Count + 1000,
                        UserId = request.UserId,
                        ExerciseId = exerciseId,
                        SubmittedCode = request.SubmittedCode,
                        Passed = request.Passed,
                        Output = request.Output,
                        SubmittedAt = DateTime.UtcNow
                    });
                }
            }

            return new SaveSubmissionResponse
            {
                Success = true,
                Message = "Ejercicio completado guardado con éxito.",
                SubmissionId = 1
            };
        }
    }

    public async Task<List<Submission>> GetUserSubmissionsAsync(string userId)
    {
        var result = new List<Submission>();

        try
        {
            await _context.Database.EnsureCreatedAsync();
            var dbList = await _context.Submissions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            result.AddRange(dbList);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SubmissionService GetUserSubmissions Warning]: {ex.Message}");
        }

        // Agregar las guardadas en memoria que no estén en la BD
        lock (_lockObj)
        {
            var memList = _inMemorySubmissions.Where(s => s.UserId == userId).ToList();
            foreach (var m in memList)
            {
                if (!result.Any(r => r.ExerciseId == m.ExerciseId))
                {
                    result.Add(m);
                }
            }
        }

        return result.OrderByDescending(s => s.SubmittedAt).ToList();
    }
}