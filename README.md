# Kiro Code Lab — Plataforma Web de Aprendizaje y Práctica de Algoritmos

Proyecto desarrollado para el **Hackathon IA Masivo Online AWS por Código Facilito (Kiro + AWS)**.

---

## 1. Descripción del Proyecto

Kiro Code Lab es una plataforma web interactiva orientada a estudiantes y desarrolladores que buscan perfeccionar sus habilidades en resolución de algoritmos y estructuras de datos.

El sistema proporciona un entorno de ejecución de código en tiempo real con soporte multi-lenguaje (C#, Java y TypeScript), evaluación automatizada de suites de pruebas unitarias, tutoría socrática impulsada por Inteligencia Artificial y un sintetizador de audio de enfoque basado en ruido marrón para maximizar la concentración durante sesiones de programación.

---

## 2. Impacto Tecnológico y Educativo

Uno de los mayores desafíos en el aprendizaje de la programación es la deserción causada por la falta de retroalimentación inmediata y la frustración al enfrentar errores de sintaxis o lógica.

Kiro Code Lab resuelve este problema mediante:

- **Tutoría Socrática Adaptativa**: El asistente de IA no entrega respuestas resueltas directamente. En su lugar, analiza el código del usuario y formula preguntas o pistas progresivas para guiar el aprendizaje.
- **Niveles de Intensidad Configurable**: Permite ajustar la respuesta del tutor entre tres modos (Conciso, Normal y Detallado), adaptándose al nivel de experiencia del estudiante.
- **Evaluación Remota Multi-lenguaje**: Ejecución segura y aislada de pruebas en C#, Java y TypeScript a través de un runner remoto.
- **Zona de Enfoque Cognitivo**: Integración de un sintetizador de sonido ambiente (Ruido Marrón) desarrollado con la Web Audio API para reducir distracciones y mejorar la retención mental.

---

## 3. Uso de Kiro y AWS

### Desarrollo con Kiro
La totalidad de la arquitectura, componentes MVC en ASP.NET Core, lógica de backend en C#, integraciones con APIs externas y estilos de interfaz fueron conceptualizados, estructurados y desarrollados utilizando **Kiro** como entorno agentico de desarrollo de software.

### Infraestructura en la Nube con AWS
El proyecto está empaquetado en contenedores de producción mediante Docker, diseñado para su despliegue continuo en la infraestructura de **Amazon Web Services (AWS)** utilizando servicios como:

- **AWS App Runner / Elastic Container Service (ECS)**: Alojamiento escalable del contenedor de producción de la aplicación web.
- **AWS Elastic Container Registry (ECR)**: Almacenamiento de imágenes de contenedor del proyecto.

---

## 4. Características Principales

- **Editor Integrado Monaco**: Resaltado de sintaxis, autocompletado e inspección de código.
- **Soporte Multi-lenguaje**: Alternancia en tiempo real entre C#, Java y TypeScript.
- **Runner de Pruebas Unitarias**: Evaluación instantánea con indicación visual de casos aprobados.
- **Tutor IA Socrático**: Tres niveles de respuesta (Conciso, Normal, Detallado) con soporte para entrada de voz.
- **Historial de Soluciones Guardadas**: Gestión de entregas vinculadas al perfil del usuario.
- **Zona de Enfoque**: Reproductor de sonido envolvente con filtro pasa-bajos para concentración.

---

## 5. Arquitectura del Sistema

```
+-----------------------------------------------------------------------+
|                             CLIENTE WEB                               |
|   Monaco Editor | Web Audio API | HTML5 / Vanilla CSS / JavaScript   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                      BACKEND (ASP.NET Core 10 MVC)                    |
|   ChatController | EditorController | ProfileController | Services   |
+-----------------------------------------------------------------------+
                 /                 |                 \
                /                  v                  \
               v            +--------------+           v
  +------------------+      |  EF CORE 10  |      +-------------------+
  |   GEMINI IA API  |      +--------------+      |    JUDGE0 API     |
  | (Tutor Socrático)|             |              | (Ejecutor Remoto) |
  +------------------+             v              +-------------------+
                            +--------------+
                            |  POSTGRESQL  |
                            +--------------+
```

---

## 6. Instrucciones de Ejecución Local

### Requisitos Previos
- .NET 10 SDK o superior
- Docker (opcional para ejecución en contenedor)

### Pasos para Ejecutar

1. Clonar el repositorio:
```bash
git clone https://github.com/Riki-Avi/kirotest.git
cd kirotest/Real
```

2. Restaurar dependencias y compilar:
```bash
dotnet restore
dotnet build
```

3. Ejecutar la aplicación:
```bash
dotnet run --project src/proyectoKiro.Web
```

4. Abrir en el navegador:
`http://localhost:5062`

---

## 7. Despliegue en AWS mediante Docker

Para desplegar la aplicación en AWS (App Runner o ECS):

1. Construir la imagen de Docker:
```bash
docker build -t kiro-code-lab .
```

2. Ejecutar el contenedor localmente para verificación:
```bash
docker run -p 8080:8080 kiro-code-lab
```

---

## 8. Entregables del Hackathon

- **Repositorio Código Fuente**: [https://github.com/Riki-Avi/kirotest](https://github.com/Riki-Avi/kirotest)
- **Demostración en Línea**: `http://localhost:5062` (o enlace de producción desplegado)
- **Video de Presentación Pitch**: Enlace al video explicativo de 5 minutos.
