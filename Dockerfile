# Сборка
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Diplom.csproj", "./"]
RUN dotnet restore "Diplom.csproj"
COPY . .
# Важно: UseAppHost=false убирает бинарный загрузчик, который часто дает 139
RUN dotnet publish "Diplom.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Рантайм
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Принудительно отключаем глобализацию на уровне ОС контейнера
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
ENV ASPNETCORE_URLS=http://+:10000

ENTRYPOINT ["dotnet", "Diplom.dll"]
