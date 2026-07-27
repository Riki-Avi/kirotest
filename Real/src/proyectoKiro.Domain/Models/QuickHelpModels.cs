namespace proyectoKiro.Domain.Models
{
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
        public QuickHelpType HelpType { get; set; }
        public string? CurrentCode { get; set; }
        public List<ChatMessageDto>? History { get; set; }
        public string? CustomApiKey { get; set; }
        public string? Model { get; set; }
        public string? Intensity { get; set; }
    }
}
