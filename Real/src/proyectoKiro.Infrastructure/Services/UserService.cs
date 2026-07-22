using Microsoft.EntityFrameworkCore;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Interfaces;
using proyectoKiro.Domain.Models;
using proyectoKiro.Infrastructure.Data;

namespace proyectoKiro.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User> Syncronizacion(SyncUserRequest request)
    {
        var existingUser = await _context.Users.FindAsync(request.Id);

        if (existingUser == null)
        {
            var newUser = new User
            {
                Id = request.Id,
                Email = request.Email,
                NombreUsuario = request.NombreUsuario,
                Avatar = request.Avatar,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return newUser;
        }

        existingUser.NombreUsuario = request.NombreUsuario;
        existingUser.Avatar = request.Avatar;
        
        await _context.SaveChangesAsync();
        return existingUser;
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
    }
}