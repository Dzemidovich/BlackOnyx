# Сборка
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем файл проекта и восстанавливаем пакеты
COPY ["Diplom.csproj", "./"]
RUN dotnet restore "Diplom.csproj"

# Копируем всё остальное и публикуем
COPY . .
# КРИТИЧНО: Добавляем /p:UseAppHost=false, чтобы избежать ошибки сегментации (139)
RUN dotnet publish "Diplom.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Финальный образ
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Настройка порта под Render
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Запускаем через dll (это надежнее для контейнера)
ENTRYPOINT ["dotnet", "Diplom.dll"]
