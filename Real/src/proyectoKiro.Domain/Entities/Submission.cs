namespace proyectoKiro.Domain.Entities;

public class Submission
{
    public int Id { get; set; }
    public int ExerciseId { get; set; }
    public Exercise? Exercise { get; set; }
    public string SubmittedCode { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public string Output { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
