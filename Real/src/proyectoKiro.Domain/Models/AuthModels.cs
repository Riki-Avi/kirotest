namespace proyectoKiro.Domain.Models;

public class SyncUserRequest
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";
    public string NombreUsuario { get; set; } = "";
    public string? Avatar { get; set; }
}