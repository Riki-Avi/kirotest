using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Domain.Interfaces;

public interface ISubmissionService
{
    Task<SaveSubmissionResponse> SaveSubmissionAsync(SaveSubmissionRequest request);
    Task<List<Submission>> GetUserSubmissionsAsync(string userId);
}
