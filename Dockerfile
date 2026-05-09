FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем файл проекта
COPY ["Diplom.csproj", "."]
RUN dotnet restore

# Копируем всё остальное и собираем
COPY . .
RUN dotnet publish -c Release -o /app

# Финальный образ
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# Настройки порта
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Запуск
ENTRYPOINT ["dotnet", "Diplom.dll"]
