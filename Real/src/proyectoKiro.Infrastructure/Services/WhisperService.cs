namespace proyectoKiro.Infrastructure.Services;

public class WhisperService
{
    private readonly GeminiService _geminiService;

    public WhisperService(GeminiService geminiService)
    {
        _geminiService = geminiService;
    }

    public async Task<string> TranscribeWavAsync(byte[] wavBytes)
    {
        try
        {
            var base64 = Convert.ToBase64String(wavBytes);
            return await _geminiService.TranscribeAudioAsync(base64, "audio/wav");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TranscribeWav Warning]: {ex.Message}");
            return string.Empty;
        }
    }
}
