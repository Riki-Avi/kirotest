namespace proyectoKiro.Domain.Entities;

public class Personality
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SystemInstruction { get; set; } = string.Empty;
    public double Temperature { get; set; } = 0.7;
}
