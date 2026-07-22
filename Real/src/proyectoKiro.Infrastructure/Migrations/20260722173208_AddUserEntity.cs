using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace proyectoKiro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Personalities",
                keyColumn: "Id",
                keyValue: "1");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Exercises");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Submissions",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("ALTER TABLE \"Personalities\" ALTER COLUMN \"Id\" DROP IDENTITY;");
            migrationBuilder.Sql("ALTER TABLE \"Personalities\" ALTER COLUMN \"Id\" TYPE text;");

            migrationBuilder.AddColumn<string>(
                name: "Emoji",
                table: "Personalities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsCustom",
                table: "Personalities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StarterCode",
                table: "Personalities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    NombreUsuario = table.Column<string>(type: "text", nullable: false),
                    Avatar = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Personalities",
                columns: new[] { "Id", "Avatar", "Description", "Emoji", "IsCustom", "Name", "StarterCode", "SystemInstruction", "Temperature" },
                values: new object[] { "1", "⚡", "Crea un algoritmo que invierta una cadena de texto sin usar funciones nativas como Array.Reverse() ni LINQ.", "🔤", false, "Ejercicio 1: Invertir Cadena", "using System;\n\npublic class Program\n{\n    public static void Main()\n    {\n        string resultado = Invertir(\"Hola Mundo\");\n        Console.WriteLine($\"Resultado: {resultado}\");\n    }\n\n    public static string Invertir(string texto)\n    {\n        // Escribe tu solución aquí\n        return \"\";\n    }\n}", "Eres un mentor experto en C#. Da pistas progresivas sin revelar la solución de inmediato.", 0.69999999999999996 });

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_UserId",
                table: "Submissions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Submissions_Users_UserId",
                table: "Submissions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Submissions_Users_UserId",
                table: "Submissions");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Submissions_UserId",
                table: "Submissions");

            migrationBuilder.DeleteData(
                table: "Personalities",
                keyColumn: "Id",
                keyValue: "1");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "Emoji",
                table: "Personalities");

            migrationBuilder.DropColumn(
                name: "IsCustom",
                table: "Personalities");

            migrationBuilder.DropColumn(
                name: "StarterCode",
                table: "Personalities");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Personalities",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Exercises",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.InsertData(
                table: "Personalities",
                columns: new[] { "Id", "Avatar", "Description", "Name", "SystemInstruction", "Temperature" },
                values: new object[] { 1, "⚡", "Tutor paciente enfocado en buenas prácticas de C# y rendimiento.", "Mentor C# Senior", "Eres un mentor experto en C#. Da pistas progresivas sin revelar la solución de inmediato.", 0.69999999999999996 });
        }
    }
}
