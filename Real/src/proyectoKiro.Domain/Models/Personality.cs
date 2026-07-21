using System.Text.Json.Serialization;

namespace proyectoKiro.Models
{
    public class Personality
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString("N");

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("emoji")]
        public string Emoji { get; set; } = "🤖";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("systemInstruction")]
        public string SystemInstruction { get; set; } = string.Empty;

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; } = 0.7;

        [JsonPropertyName("isCustom")]
        public bool IsCustom { get; set; } = false;

        [JsonPropertyName("starterCode")]
        public string StarterCode { get; set; } = string.Empty;

        [JsonPropertyName("testCases")]
        public List<TestCaseItem> TestCases { get; set; } = new();
    }

    public class TestCaseItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("methodCall")]
        public string MethodCall { get; set; } = string.Empty; // ej. "Program.Invertir(\"Hola\")"

        [JsonPropertyName("expectedOutput")]
        public string ExpectedOutput { get; set; } = string.Empty; // ej. "aloH"
    }
}
