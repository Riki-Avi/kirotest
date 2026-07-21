using Whisper.net;
using Whisper.net.Ggml;

namespace proyectoKiro.Services;

public class WhisperService
{
    private WhisperFactory? _factory;
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public async Task EnsureInitializedAsync()
    {
        if (_factory != null) return;

        await _semaphore.WaitAsync();
        try
        {
            if (_factory != null) return;

            var modelPath = Path.Combine(Directory.GetCurrentDirectory(), "ggml-tiny.bin");
            if (!File.Exists(modelPath))
            {
                Console.WriteLine("Descargando modelo local Whisper.net (ggml-tiny.bin)...");
                using var modelStream = await WhisperGgmlDownloader.Default.GetGgmlModelAsync(GgmlType.Tiny);
                using var fileStream = File.Create(modelPath);
                await modelStream.CopyToAsync(fileStream);
                Console.WriteLine("Modelo Whisper.net listo.");
            }

            _factory = WhisperFactory.FromPath(modelPath);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<string> TranscribeWavAsync(byte[] wavBytes)
    {
        await EnsureInitializedAsync();

        if (_factory == null)
            throw new InvalidOperationException("Whisper model failed to initialize.");

        using var processor = _factory.CreateBuilder()
            .WithLanguage("es")
            .Build();

        using var ms = new MemoryStream(wavBytes);
        var sb = new System.Text.StringBuilder();

        await foreach (var result in processor.ProcessAsync(ms))
        {
            sb.Append(result.Text);
        }

        return sb.ToString().Trim();
    }
}
