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

                var targetLangId = request.LanguageId > 0 ? request.LanguageId : 51;
                var sourceCodeToRun = request.SourceCode;

                if (targetLangId == 62 || targetLangId == 91) // Java
                {
                    var javaClassRegex = new System.Text.RegularExpressions.Regex(@"(public\s+)?class\s+[A-Za-z0-9_]+");
                    sourceCodeToRun = javaClassRegex.Replace(sourceCodeToRun, "public class Main", 1);
                }

                var payload = new
                {
                    source_code = sourceCodeToRun,
                    language_id = targetLangId, // 51 = C#, 62 = Java, 74 = TypeScript
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

        public async Task<TestSuiteRunResponse> ExecuteTestSuiteAsync(string sourceCode, Personality personality, string? customJudge0Url, int languageId = 51)
        {
            if (personality.TestCases == null || personality.TestCases.Count == 0)
            {
                return new TestSuiteRunResponse
                {
                    Success = false,
                    ErrorMessage = "Este ejercicio no tiene test cases definidos."
                };
            }

            if (languageId <= 0) languageId = 51;

            var sb = new StringBuilder();

            string langKey = (languageId == 62 || languageId == 91) ? "java" : ((languageId == 74) ? "typescript" : "csharp");

            if (languageId == 62 || languageId == 91) // Java
            {
                var javaClassRegex = new System.Text.RegularExpressions.Regex(@"(public\s+)?class\s+[A-Za-z0-9_]+");
                var safeUserCode = javaClassRegex.Replace(sourceCode, "public class Main", 1);
                safeUserCode = safeUserCode.Replace("public static void main", "public static void userMainOriginal");

                var testMainSb = new StringBuilder();
                testMainSb.AppendLine();
                testMainSb.AppendLine("    public static void main(String[] args) {");
                foreach (var test in personality.TestCases)
                {
                    var rawCall = (test.MethodCalls != null && test.MethodCalls.TryGetValue("java", out var c) && !string.IsNullOrWhiteSpace(c)) ? c : test.MethodCall;
                    var directCall = System.Text.RegularExpressions.Regex.Replace(rawCall, @"^[A-Za-z0-9_]+\.", "");
                    testMainSb.AppendLine("        try {");
                    testMainSb.AppendLine($"            String output_{test.Id} = String.valueOf({directCall});");
                    testMainSb.AppendLine($"            System.out.println(\"KIRO_TEST_RES:{test.Id}:\" + output_{test.Id});");
                    testMainSb.AppendLine("        } catch(Exception ex) {");
                    testMainSb.AppendLine($"            System.out.println(\"KIRO_TEST_ERR:{test.Id}:\" + (ex.getMessage() != null ? ex.getMessage() : ex.toString()));");
                    testMainSb.AppendLine("        }");
                }
                testMainSb.AppendLine("    }");

                var lastBraceIndex = safeUserCode.LastIndexOf('}');
                if (lastBraceIndex >= 0)
                {
                    safeUserCode = safeUserCode.Substring(0, lastBraceIndex) + testMainSb.ToString() + "\n}";
                }
                else
                {
                    safeUserCode = safeUserCode + "\n" + testMainSb.ToString();
                }

                sb.AppendLine(safeUserCode);
            }
            else if (languageId == 74) // TypeScript / JavaScript
            {
                sb.AppendLine(sourceCode);
                sb.AppendLine();
                foreach (var test in personality.TestCases)
                {
                    var call = (test.MethodCalls != null && test.MethodCalls.TryGetValue("typescript", out var c) && !string.IsNullOrWhiteSpace(c)) ? c : test.MethodCall;
                    sb.AppendLine("try {");
                    sb.AppendLine($"    const output_{test.Id} = String({call});");
                    sb.AppendLine($"    console.log('KIRO_TEST_RES:{test.Id}:' + output_{test.Id});");
                    sb.AppendLine("} catch(ex) {");
                    sb.AppendLine($"    console.log('KIRO_TEST_ERR:{test.Id}:' + (ex.message || ex));");
                    sb.AppendLine("}");
                }
            }
            else // C# (51)
            {
                var safeUserCode = sourceCode.Replace("static void Main", "static void UserMainOriginal");
                sb.AppendLine(safeUserCode);
                sb.AppendLine();
                sb.AppendLine("public class KiroTestRunnerHarness");
                sb.AppendLine("{");
                sb.AppendLine("    public static void Main()");
                sb.AppendLine("    {");
                foreach (var test in personality.TestCases)
                {
                    var call = (test.MethodCalls != null && test.MethodCalls.TryGetValue("csharp", out var c) && !string.IsNullOrWhiteSpace(c)) ? c : test.MethodCall;
                    sb.AppendLine("        try {");
                    sb.AppendLine($"            var output_{test.Id} = Convert.ToString({call});");
                    sb.AppendLine($"            Console.WriteLine($\"KIRO_TEST_RES:{test.Id}:{{output_{test.Id}}}\");");
                    sb.AppendLine("        } catch(Exception ex) {");
                    sb.AppendLine($"            Console.WriteLine($\"KIRO_TEST_ERR:{test.Id}:{{ex.Message}}\");");
                    sb.AppendLine("        }");
                }
                sb.AppendLine("    }");
                sb.AppendLine("}");
            }

            var compileRequest = new Judge0CompileRequest
            {
                SourceCode = sb.ToString(),
                LanguageId = languageId,
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
