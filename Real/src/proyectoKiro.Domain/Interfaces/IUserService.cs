using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Domain.Interfaces;

public interface IUserService
{
    Task<User> Syncronizacion(SyncUserRequest request);
    Task<User?> GetByIdAsync(string id);
}