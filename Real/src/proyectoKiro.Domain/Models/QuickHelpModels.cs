using System.Text.Json.Serialization;

namespace proyectoKiro.Domain.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum QuickHelpType
    {
        Understand,
        Hint,
        AnalogousExample,
        DocSearch
    }

    public class QuickHelpRequest
    {
        public string PersonalityId { get; set; } = string.Empty;

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public QuickHelpType HelpType { get; set; }

        public string? CurrentCode { get; set; }
        public List<ChatMessageDto>? History { get; set; }
        public string? CustomApiKey { get; set; }
        public string? Model { get; set; }
        public string? Intensity { get; set; }
    }
}
