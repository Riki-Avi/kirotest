namespace proyectoKiro.Domain.Models;

public class SaveSubmissionRequest
{
    public string UserId { get; set; } = string.Empty;
    public string ExerciseId { get; set; } = string.Empty;
    public string SubmittedCode { get; set; } = string.Empty;
    public bool Passed { get; set; } = true;
    public string Output { get; set; } = string.Empty;
}

public class SaveSubmissionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int SubmissionId { get; set; }
}
