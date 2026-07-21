using Microsoft.EntityFrameworkCore;
using proyectoKiro.Domain.Entities;

namespace proyectoKiro.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Personality> Personalities => Set<Personality>();
    public DbSet<Submission> Submissions => Set<Submission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Exercise>().HasData(
            new Exercise
            {
                Id = 1,
                Title = "Ejercicio 1: Invertir Cadena",
                Description = "Crea un algoritmo que invierta una cadena de texto sin usar funciones nativas como Array.Reverse() ni LINQ.",
                InitialCode = "using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        string resultado = Invertir(\"Hola Mundo\");\n        Console.WriteLine($\"Resultado: {resultado}\");\n    }\n\n    public static string Invertir(string texto)\n    {\n        // Escribe tu solución aquí\n        return \"\";\n    }\n}",
                MentorRules = "RESTRICCIÓN: No puedes utilizar métodos nativos como 'Array.Reverse()' ni LINQ.",
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );

        modelBuilder.Entity<Personality>(b =>
        {
            b.Ignore(p => p.TestCases);
            b.HasData(
                new Personality
                {
                    Id = "1",
                    Emoji = "🔤",
                    Name = "Ejercicio 1: Invertir Cadena",
                    Avatar = "⚡",
                    Description = "Crea un algoritmo que invierta una cadena de texto sin usar funciones nativas como Array.Reverse() ni LINQ.",
                    SystemInstruction = "Eres un mentor experto en C#. Da pistas progresivas sin revelar la solución de inmediato.",
                    StarterCode = "using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        string resultado = Invertir(\"Hola Mundo\");\n        Console.WriteLine($\"Resultado: {resultado}\");\n    }\n\n    public static string Invertir(string texto)\n    {\n        // Escribe tu solución aquí\n        return \"\";\n    }\n}",
                    Temperature = 0.7,
                    IsCustom = false
                }
            );
        });
    }
}
