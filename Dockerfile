# Dockerfile para despliegue en AWS App Runner / ECS / EC2
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copiar archivos de proyecto y restaurar dependencias
COPY Real/src/proyectoKiro.Domain/proyectoKiro.Domain.csproj Real/src/proyectoKiro.Domain/
COPY Real/src/proyectoKiro.Infrastructure/proyectoKiro.Infrastructure.csproj Real/src/proyectoKiro.Infrastructure/
COPY Real/src/proyectoKiro.Web/proyectoKiro.Web.csproj Real/src/proyectoKiro.Web/
RUN dotnet restore Real/src/proyectoKiro.Web/proyectoKiro.Web.csproj

# Copiar el resto del código y compilar la aplicación
COPY Real/src/ Real/src/
COPY Real/personalities.json Real/src/proyectoKiro.Web/
WORKDIR /app/Real/src/proyectoKiro.Web
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Etapa final de ejecución
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "proyectoKiro.Web.dll"]
