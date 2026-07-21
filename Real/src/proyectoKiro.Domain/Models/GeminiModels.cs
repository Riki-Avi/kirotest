using System.Text.Json.Serialization;

namespace proyectoKiro.Domain.Models
{
    public class GeminiRequest
    {
        [JsonPropertyName("systemInstruction")]
        public GeminiSystemInstruction? SystemInstruction { get; set; }

        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();

        [JsonPropertyName("generationConfig")]
        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    public class GeminiSystemInstruction
    {
        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();

        public static GeminiSystemInstruction FromText(string text)
        {
            return new GeminiSystemInstruction
            {
                Parts = new List<GeminiPart> { new GeminiPart { Text = text } }
            };
        }
    }

    public class GeminiContent
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = "user";

        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();
    }

    public class GeminiPart
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("inlineData")]
        public GeminiInlineData? InlineData { get; set; }
    }

    public class GeminiInlineData
    {
        [JsonPropertyName("mimeType")]
        public string MimeType { get; set; } = "audio/webm";

        [JsonPropertyName("data")]
        public string Data { get; set; } = string.Empty;
    }

    public class GeminiGenerationConfig
    {
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; } = 0.7;

        [JsonPropertyName("maxOutputTokens")]
        public int? MaxOutputTokens { get; set; } = 4096;
    }

    public class GeminiResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate>? Candidates { get; set; }

        [JsonPropertyName("error")]
        public GeminiErrorDetail? Error { get; set; }
    }

    public class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }

        [JsonPropertyName("finishReason")]
        public string? FinishReason { get; set; }
    }

    public class GeminiErrorDetail
    {
        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } = "user";
        public string Message { get; set; } = string.Empty;
    }

    public class ChatSendRequest
    {
        public string PersonalityId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? AudioBase64 { get; set; }
        public string? AudioMimeType { get; set; }
        public List<ChatMessageDto> History { get; set; } = new();
        public string? CustomApiKey { get; set; }
        public string? Model { get; set; }
    }

    public class TranscribeRequest
    {
        public string AudioBase64 { get; set; } = string.Empty;
        public string AudioMimeType { get; set; } = "audio/webm";
        public string? CustomApiKey { get; set; }
    }

    public class ChatSendResponse
    {
        public bool Success { get; set; }
        public string Response { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public string UsedPersonality { get; set; } = string.Empty;
    }

    public class GeminiModelInfo
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = string.Empty;

        [JsonPropertyName("supportedGenerationMethods")]
        public List<string>? SupportedGenerationMethods { get; set; }
    }

    public class GeminiListModelsResponse
    {
        [JsonPropertyName("models")]
        public List<GeminiModelInfo>? Models { get; set; }
    }
}
