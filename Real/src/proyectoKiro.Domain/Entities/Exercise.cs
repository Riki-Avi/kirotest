namespace proyectoKiro.Domain.Entities;

public class Exercise
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string InitialCode { get; set; } = string.Empty;
    public string MentorRules { get; set; } = string.Empty; //chekearlo bien

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
