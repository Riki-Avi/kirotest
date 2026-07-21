using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace proyectoKiro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSupabaseMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    InitialCode = table.Column<string>(type: "text", nullable: false),
                    MentorRules = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Personalities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Avatar = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    SystemInstruction = table.Column<string>(type: "text", nullable: false),
                    Temperature = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personalities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Submissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExerciseId = table.Column<int>(type: "integer", nullable: false),
                    SubmittedCode = table.Column<string>(type: "text", nullable: false),
                    Passed = table.Column<bool>(type: "boolean", nullable: false),
                    Output = table.Column<string>(type: "text", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Submissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Submissions_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Exercises",
                columns: new[] { "Id", "CreatedAt", "Description", "InitialCode", "MentorRules", "Title" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Crea un algoritmo que invierta una cadena de texto sin usar funciones nativas como Array.Reverse() ni LINQ.", "using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        string resultado = Invertir(\"Hola Mundo\");\n        Console.WriteLine($\"Resultado: {resultado}\");\n    }\n\n    public static string Invertir(string texto)\n    {\n        // Escribe tu solución aquí\n        return \"\";\n    }\n}", "RESTRICCIÓN: No puedes utilizar métodos nativos como 'Array.Reverse()' ni LINQ.", "Ejercicio 1: Invertir Cadena" });

            migrationBuilder.InsertData(
                table: "Personalities",
                columns: new[] { "Id", "Avatar", "Description", "Name", "SystemInstruction", "Temperature" },
                values: new object[] { 1, "⚡", "Tutor paciente enfocado en buenas prácticas de C# y rendimiento.", "Mentor C# Senior", "Eres un mentor experto en C#. Da pistas progresivas sin revelar la solución de inmediato.", 0.69999999999999996 });

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_ExerciseId",
                table: "Submissions",
                column: "ExerciseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Personalities");

            migrationBuilder.DropTable(
                name: "Submissions");

            migrationBuilder.DropTable(
                name: "Exercises");
        }
    }
}
