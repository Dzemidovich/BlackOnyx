FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем всё
COPY . .

# Восстанавливаем первый найденный .csproj файл
RUN dotnet restore $(find . -name "*.csproj" | head -1)

# Публикуем
RUN dotnet publish $(find . -name "*.csproj" | head -1) -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

EXPOSE 80
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "Diplom.dll"]
