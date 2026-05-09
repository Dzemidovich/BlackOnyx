# Этап сборки
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем только csproj для восстановления зависимостей (кеширование)
COPY ["Diplom.csproj", "."]
RUN dotnet restore

# Копируем остальной код и собираем приложение
COPY . .
RUN dotnet publish -c Release -o /app --no-restore

# Этап рантайма
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Копируем собранное приложение из build-этапа
COPY --from=build /app .

# Открываем порт (по умолчанию 80)
EXPOSE 80

# Переменная окружения для Kestrel (можно переопределить при запуске)
ENV ASPNETCORE_URLS=http://+:80

# Точка входа
ENTRYPOINT ["dotnet", "Diplom.dll"]
