namespace proyectoKiro.Domain.Entities;

public class Personality
{
    public string Id { get; set; } = string.Empty;
    public string Emoji { get; set; } = "💻";
    public string Name { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SystemInstruction { get; set; } = string.Empty;
    public double Temperature { get; set; } = 0.7;
    public string StarterCode { get; set; } = string.Empty;
    public bool IsCustom { get; set; }
    public List<TestCaseItem> TestCases { get; set; } = new();
}

public class TestCaseItem
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public string MethodCall { get; set; } = string.Empty;
}
