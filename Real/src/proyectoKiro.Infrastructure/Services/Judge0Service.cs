using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using proyectoKiro.Domain.Entities;
using proyectoKiro.Domain.Models;

namespace proyectoKiro.Infrastructure.Services
{
    public class Judge0Service
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public Judge0Service(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<Judge0CompileResponse> ExecuteCodeAsync(Judge0CompileRequest request)
        {
            try
            {
                var baseUrl = !string.IsNullOrWhiteSpace(request.CustomJudge0Url) 
                    ? request.CustomJudge0Url.TrimEnd('/')
                    : "https://ce.judge0.com";

                var endpoint = $"{baseUrl}/submissions?wait=true";

                var payload = new
                {
                    source_code = request.SourceCode,
                    language_id = request.LanguageId > 0 ? request.LanguageId : 51, // 51 = C#
                    stdin = request.Stdin ?? ""
                };

                var jsonOptions = new JsonSerializerOptions
                {
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                };

                var jsonPayload = JsonSerializer.Serialize(payload, jsonOptions);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var reqMsg = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = content
                };

                if (!string.IsNullOrWhiteSpace(request.RapidApiKey))
                {
                    reqMsg.Headers.Add("X-RapidAPI-Key", request.RapidApiKey);
                    reqMsg.Headers.Add("X-RapidAPI-Host", "judge0-extra-ce.p.rapidapi.com");
                }

                var response = await _httpClient.SendAsync(reqMsg);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new Judge0CompileResponse
                    {
                        Success = false,
                        ErrorMessage = $"Error HTTP {(int)response.StatusCode} desde Judge0: {responseJson}"
                    };
                }

                var result = JsonSerializer.Deserialize<Judge0CompileResponse>(responseJson);
                if (result != null)
                {
                    result.Success = true;
                    return result;
                }

                return new Judge0CompileResponse
                {
                    Success = false,
                    ErrorMessage = "No se pudo interpretar la respuesta enviada por Judge0 API."
                };
            }
            catch (Exception ex)
            {
                return new Judge0CompileResponse
                {
                    Success = false,
                    ErrorMessage = $"Excepción al conectar con la API de Judge0: {ex.Message}"
                };
            }
        }

        public async Task<TestSuiteRunResponse> ExecuteTestSuiteAsync(string sourceCode, Personality personality, string? customJudge0Url)
        {
            if (personality.TestCases == null || personality.TestCases.Count == 0)
            {
                return new TestSuiteRunResponse
                {
                    Success = false,
                    ErrorMessage = "Este ejercicio no tiene test cases definidos."
                };
            }

            // Preparar el código del usuario renombrando su Main() para que no colisione con el KiroTestRunner
            var safeUserCode = sourceCode.Replace("static void Main", "static void UserMainOriginal");

            var sb = new StringBuilder();
            sb.AppendLine(safeUserCode);
            sb.AppendLine();
            sb.AppendLine("public class KiroTestRunnerHarness");
            sb.AppendLine("{");
            sb.AppendLine("    public static void Main()");
            sb.AppendLine("    {");

            foreach (var test in personality.TestCases)
            {
                sb.AppendLine("        try {");
                sb.AppendLine($"            var output_{test.Id} = Convert.ToString({test.MethodCall});");
                sb.AppendLine($"            Console.WriteLine($\"KIRO_TEST_RES:{test.Id}:{{output_{test.Id}}}\");");
                sb.AppendLine("        } catch(Exception ex) {");
                sb.AppendLine($"            Console.WriteLine($\"KIRO_TEST_ERR:{test.Id}:{{ex.Message}}\");");
                sb.AppendLine("        }");
            }

            sb.AppendLine("    }");
            sb.AppendLine("}");

            var compileRequest = new Judge0CompileRequest
            {
                SourceCode = sb.ToString(),
                LanguageId = 51,
                CustomJudge0Url = customJudge0Url
            };

            var runResult = await ExecuteCodeAsync(compileRequest);

            if (!runResult.Success)
            {
                return new TestSuiteRunResponse
                {
                    Success = false,
                    ErrorMessage = runResult.ErrorMessage
                };
            }

            if (!string.IsNullOrWhiteSpace(runResult.CompileOutput))
            {
                return new TestSuiteRunResponse
                {
                    Success = false,
                    CompileOutput = runResult.CompileOutput,
                    ErrorMessage = "Error de compilación al ejecutar los test cases."
                };
            }

            var stdout = runResult.Stdout ?? "";
            var lines = stdout.Split('\n');
            var results = new List<TestSingleResult>();

            foreach (var test in personality.TestCases)
            {
                var prefixRes = $"KIRO_TEST_RES:{test.Id}:";
                var prefixErr = $"KIRO_TEST_ERR:{test.Id}:";
                var resLine = lines.FirstOrDefault(l => l.StartsWith(prefixRes));
                var errLine = lines.FirstOrDefault(l => l.StartsWith(prefixErr));

                string actualOutput = "";
                bool passed = false;

                if (resLine != null)
                {
                    actualOutput = resLine.Substring(prefixRes.Length).TrimEnd('\r', '\n');
                    passed = string.Equals(actualOutput.Trim(), test.ExpectedOutput.Trim(), StringComparison.OrdinalIgnoreCase);
                }
                else if (errLine != null)
                {
                    actualOutput = "ERROR: " + errLine.Substring(prefixErr.Length).TrimEnd('\r', '\n');
                    passed = false;
                }
                else
                {
                    actualOutput = "No producido";
                    passed = false;
                }

                results.Add(new TestSingleResult
                {
                    Id = test.Id,
                    Description = test.Description,
                    MethodCall = test.MethodCall,
                    ExpectedOutput = test.ExpectedOutput,
                    ActualOutput = actualOutput,
                    Passed = passed
                });
            }

            int passedCount = results.Count(r => r.Passed);

            return new TestSuiteRunResponse
            {
                Success = true,
                TotalTests = results.Count,
                PassedCount = passedCount,
                IsAllPassed = passedCount == results.Count,
                Results = results
            };
        }
    }
}
