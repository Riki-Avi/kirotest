using System.Text.Json.Serialization;

namespace proyectoKiro.Domain.Models
{
    public class Judge0CompileRequest
    {
        [JsonPropertyName("source_code")]
        public string SourceCode { get; set; } = string.Empty;

        [JsonPropertyName("sourceCode")]
        public string SourceCodeAlt { set { if (!string.IsNullOrWhiteSpace(value)) SourceCode = value; } }

        [JsonPropertyName("language_id")]
        public int LanguageId { get; set; } = 51;

        [JsonPropertyName("languageId")]
        public int LanguageIdAlt { set { if (value > 0) LanguageId = value; } }

        [JsonPropertyName("stdin")]
        public string? Stdin { get; set; }

        [JsonPropertyName("rapidApiKey")]
        public string? RapidApiKey { get; set; }

        [JsonPropertyName("customJudge0Url")]
        public string? CustomJudge0Url { get; set; }
    }

    public class Judge0Status
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }

    public class Judge0CompileResponse
    {
        [JsonPropertyName("stdout")]
        public string? Stdout { get; set; }

        [JsonPropertyName("stderr")]
        public string? Stderr { get; set; }

        [JsonPropertyName("compile_output")]
        public string? CompileOutput { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("status")]
        public Judge0Status? Status { get; set; }

        [JsonPropertyName("time")]
        public string? Time { get; set; }

        [JsonPropertyName("memory")]
        public double? Memory { get; set; }

        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class TestSuiteRunRequest
    {
        [JsonPropertyName("personalityId")]
        public string PersonalityId { get; set; } = string.Empty;

        [JsonPropertyName("sourceCode")]
        public string SourceCode { get; set; } = string.Empty;

        [JsonPropertyName("customJudge0Url")]
        public string? CustomJudge0Url { get; set; }
    }

    public class TestSingleResult
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string MethodCall { get; set; } = string.Empty;
        public string ExpectedOutput { get; set; } = string.Empty;
        public string ActualOutput { get; set; } = string.Empty;
        public bool Passed { get; set; }
    }

    public class TestSuiteRunResponse
    {
        public bool Success { get; set; }
        public int TotalTests { get; set; }
        public int PassedCount { get; set; }
        public bool IsAllPassed { get; set; }
        public List<TestSingleResult> Results { get; set; } = new();
        public string? CompileOutput { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
