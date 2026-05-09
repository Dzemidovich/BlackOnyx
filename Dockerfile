# Этап сборки
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем только файлы проекта и восстанавливаем зависимости. 
# Это ускорит сборку, так как слои будут кешироваться.
COPY ["Diplom.csproj", "./"]
RUN dotnet restore "Diplom.csproj"

# Теперь копируем всё остальное и собираем
COPY . .
RUN dotnet publish "Diplom.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Этап запуска
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Render автоматически подставляет переменную $PORT.
# Мы заставляем ASP.NET слушать именно этот порт.
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "Diplom.dll"]
