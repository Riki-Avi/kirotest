using Microsoft.EntityFrameworkCore;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Interfaces;
using proyectoKiro.Domain.Models;
using proyectoKiro.Infrastructure.Data;

namespace proyectoKiro.Infrastructure.Services;

public class SubmissionService : ISubmissionService
{
    private readonly ApplicationDbContext _context;

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

        // Asegurar que el usuario existe en la tabla Users (evita FK violation)
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

    public async Task<List<Submission>> GetUserSubmissionsAsync(string userId)
    {
        return await _context.Submissions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
    }
}