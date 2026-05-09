# КОРРЕКТНЫЙ DOCKERFILE для вашей структуры
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем файл проекта (он находится в той же папке, что и Dockerfile)
COPY Diplom.csproj ./
RUN dotnet restore

# Копируем остальные файлы проекта
COPY . ./
RUN dotnet publish -c Release -o /app --no-restore

# Этап рантайма
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

EXPOSE 80
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "Diplom.dll"]
