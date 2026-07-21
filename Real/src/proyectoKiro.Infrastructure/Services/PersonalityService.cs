using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using proyectoKiro.Domain.Entities;

namespace proyectoKiro.Infrastructure.Services
{
    public class PersonalityService
    {
        private readonly string _filePath;
        private readonly List<Personality> _personalities = new();
        private readonly object _lockObj = new();

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public PersonalityService(IWebHostEnvironment env)
        {
            _filePath = Path.Combine(env.ContentRootPath, "personalities.json");
            InitializePersonalities();
        }

        private void InitializePersonalities()
        {
            lock (_lockObj)
            {
                if (File.Exists(_filePath))
                {
                    try
                    {
                        var json = File.ReadAllText(_filePath);
                        var loaded = JsonSerializer.Deserialize<List<Personality>>(json, _jsonOptions);
                        if (loaded != null && loaded.Count > 0)
                        {
                            _personalities.Clear();
                            _personalities.AddRange(loaded);
                            return;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Error al cargar personalidades]: {ex.Message}");
                    }
                }

                // Cargar personalidades predeterminadas por defecto
                _personalities.Clear();
                _personalities.AddRange(GetDefaultPersonalities());
                SaveToFile();
            }
        }

        public List<Personality> GetAll()
        {
            lock (_lockObj)
            {
                return new List<Personality>(_personalities);
            }
        }

        public Personality? GetById(string id)
        {
            lock (_lockObj)
            {
                return _personalities.FirstOrDefault(p => p.Id == id);
            }
        }

        public Personality Add(Personality personality)
        {
            lock (_lockObj)
            {
                personality.Id = Guid.NewGuid().ToString("N");
                personality.IsCustom = true;
                _personalities.Add(personality);
                SaveToFile();
                return personality;
            }
        }

        public bool Update(string id, Personality updated)
        {
            lock (_lockObj)
            {
                var index = _personalities.FindIndex(p => p.Id == id);
                if (index == -1) return false;

                updated.Id = id;
                _personalities[index] = updated;
                SaveToFile();
                return true;
            }
        }

        public bool Delete(string id)
        {
            lock (_lockObj)
            {
                var existing = _personalities.FirstOrDefault(p => p.Id == id);
                if (existing == null) return false;

                _personalities.Remove(existing);
                SaveToFile();
                return true;
            }
        }

        private void SaveToFile()
        {
            try
            {
                var json = JsonSerializer.Serialize(_personalities, _jsonOptions);
                File.WriteAllText(_filePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Error al guardar personalidades]: {ex.Message}");
            }
        }

        public static List<Personality> GetDefaultPersonalities()
        {
            return new List<Personality>
            {
                new Personality
                {
                    Id = "exercise-1-reverse-string",
                    Name = "Ejercicio 1: Invertir Cadena",
                    Emoji = "🔤",
                    Description = "Crea un algoritmo que invierta una cadena de texto sin usar funciones nativas como Reverse().",
                    SystemInstruction = @"Eres un Evaluador y Mentor Interactivo para el Ejercicio: 'Invertir una Cadena de Texto en C#'.

ENUNCIADO DEL EJERCICIO:
Crea un método en C# llamado `string Invertir(string texto)` que reciba una cadena y devuelva el texto invertido (ej. 'hola' -> 'aloh').
RESTRICCIÓN: No puedes utilizar métodos nativos como `Array.Reverse()` ni LINQ.

REGLAS PARA EL MENTOR:
1. Si el usuario te saluda o pregunta qué hacer, dale el enunciado de forma clara y amigable.
2. Si el usuario te envía un bloque de código:
   - Analiza su solución.
   - Si tiene errores de sintaxis o lógica, NO le des la respuesta correcta directamente. Dale pistas progresivas para que razone por sí mismo.
   - Si la solución es correcta y cumple con la restricción, felicítalo, explica por qué su código es eficiente y proponle una pequeña optimización o pregunta conceptual de seguimiento.",
                    Temperature = 0.5,
                    IsCustom = false,
                    StarterCode = @"using System;

public class Program
{
    public static void Main()
    {
        string resultado = Invertir(""Hola Mundo"");
        Console.WriteLine($""Resultado: {resultado}"");
    }

    public static string Invertir(string texto)
    {
        // Escribe tu solución aquí (Sin usar Array.Reverse() ni LINQ)
        return """";
    }
}",
                    TestCases = new List<TestCaseItem>
                    {
                        new TestCaseItem { Id = "1", Description = "Cadena estándar con espacios", MethodCall = "Program.Invertir(\"Hola Mundo\")", ExpectedOutput = "odnuM aloH" },
                        new TestCaseItem { Id = "2", Description = "Palabra corta ('C#')", MethodCall = "Program.Invertir(\"C#\")", ExpectedOutput = "#C" },
                        new TestCaseItem { Id = "3", Description = "Cadena vacía ('')", MethodCall = "Program.Invertir(\"\")", ExpectedOutput = "" },
                        new TestCaseItem { Id = "4", Description = "Palabra minúscula ('kiro')", MethodCall = "Program.Invertir(\"kiro\")", ExpectedOutput = "orik" }
                    }
                },
                new Personality
                {
                    Id = "exercise-2-palindrome",
                    Name = "Ejercicio 2: Palíndromos",
                    Emoji = "🔄",
                    Description = "Verifica si una palabra o frase es un palíndromo (se lee igual al derecho y al revés).",
                    SystemInstruction = @"Eres un Mentor Interactivo para el Ejercicio: 'Verificar Palíndromos en C#'.

ENUNCIADO DEL EJERCICIO:
Escribe un método `bool EsPalindromo(string texto)` que devuelva true si el texto es un palíndromo (ej. 'Neuquen', 'Anita lava la tina') o false si no lo es. Debe ignorar mayúsculas, minúsculas y espacios.

REGLAS PARA EL MENTOR:
- Evalúa el código enviado por el alumno.
- Pon a prueba su código con casos borde (espacios, mayúsculas, cadenas vacías).
- Guíalo con preguntas socráticas si falla en algún caso borde.",
                    Temperature = 0.5,
                    IsCustom = false,
                    StarterCode = @"using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine($""¿Neuquen es palíndromo?: {EsPalindromo(""Neuquen"")}"");
        Console.WriteLine($""¿Hola es palíndromo?: {EsPalindromo(""Hola"")}"");
    }

    public static bool EsPalindromo(string texto)
    {
        // Tu solución aquí
        return false;
    }
}",
                    TestCases = new List<TestCaseItem>
                    {
                        new TestCaseItem { Id = "1", Description = "Palíndromo con mayúscula ('Neuquen')", MethodCall = "Program.EsPalindromo(\"Neuquen\")", ExpectedOutput = "True" },
                        new TestCaseItem { Id = "2", Description = "Frase palíndromo con espacios ('Anita lava la tina')", MethodCall = "Program.EsPalindromo(\"Anita lava la tina\")", ExpectedOutput = "True" },
                        new TestCaseItem { Id = "3", Description = "Palabra NO palíndromo ('Programacion')", MethodCall = "Program.EsPalindromo(\"Programacion\")", ExpectedOutput = "False" }
                    }
                },
                new Personality
                {
                    Id = "exercise-3-fizzbuzz",
                    Name = "Ejercicio 3: FizzBuzz",
                    Emoji = "🧩",
                    Description = "El clásico reto FizzBuzz: múltiplos de 3, 5 y ambos.",
                    SystemInstruction = @"Eres un Evaluador para el Ejercicio: 'FizzBuzz en C#'.

ENUNCIADO DEL EJERCICIO:
Escribe un método `string ObtenerFizzBuzz(int numero)` que devuelva:
- 'Fizz' si es múltiplo de 3
- 'Buzz' si es múltiplo de 5
- 'FizzBuzz' si es múltiplo de ambos (3 y 5)
- El número como cadena en cualquier otro caso.",
                    Temperature = 0.4,
                    IsCustom = false,
                    StarterCode = @"using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine(ObtenerFizzBuzz(15));
    }

    public static string ObtenerFizzBuzz(int n)
    {
        // Tu solución aquí
        return """";
    }
}",
                    TestCases = new List<TestCaseItem>
                    {
                        new TestCaseItem { Id = "1", Description = "Múltiplo de 3 (3)", MethodCall = "Program.ObtenerFizzBuzz(3)", ExpectedOutput = "Fizz" },
                        new TestCaseItem { Id = "2", Description = "Múltiplo de 5 (5)", MethodCall = "Program.ObtenerFizzBuzz(5)", ExpectedOutput = "Buzz" },
                        new TestCaseItem { Id = "3", Description = "Múltiplo de 3 y 5 (15)", MethodCall = "Program.ObtenerFizzBuzz(15)", ExpectedOutput = "FizzBuzz" },
                        new TestCaseItem { Id = "4", Description = "Número normal (7)", MethodCall = "Program.ObtenerFizzBuzz(7)", ExpectedOutput = "7" }
                    }
                },
                new Personality
                {
                    Id = "default-csharp-dev",
                    Name = "Desarrollador C# Senior",
                    Emoji = "💻",
                    Description = "Experto en C#, .NET 10, clean code, patrones de diseño y arquitectura de software.",
                    SystemInstruction = "Eres un arquitecto y desarrollador de software Senior especializado en C# y la plataforma .NET. Respondes con explicaciones claras, código limpio de producción, buenas prácticas y sugerencias de arquitectura modernas.",
                    Temperature = 0.4,
                    IsCustom = false,
                    StarterCode = @"using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine(""¡Hola Mundo desde C# y .NET 10!"");
    }
}"
                },
                new Personality
                {
                    Id = "default-teacher",
                    Name = "Profesor Paciente",
                    Emoji = "📚",
                    Description = "Explica conceptos complejos paso a paso con analogías sencillas.",
                    SystemInstruction = "Eres un profesor universitario sumamente paciente, pedagógico y empático. Tu objetivo es explicar cualquier concepto de forma muy clara, usando ejemplos cotidianos y analogías.",
                    Temperature = 0.6,
                    IsCustom = false,
                    StarterCode = @"using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine(""Escribe aquí tu código para consultar al profesor..."");
    }
}"
                }
            };
        }
    }
}
