namespace proyectoKiro.Domain.Entities;

public class User
{
    //este Id se vinculará el UUID que nos va a devolver supabas Auth (me gustaria hacerlo int pero bueno xd)
    public string Id {get; set;} = "";

    public string Email {get; set; } = "";

    public string NombreUsuario {get; set; } = "";

    public string? Avatar {get; set;}

    public DateTime CreatedAt {get; set;} = DateTime.UtcNow;

    public List<Submission> Submissions {get; set;} = new();
}