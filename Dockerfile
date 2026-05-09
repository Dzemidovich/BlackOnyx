# FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
# FROM mcr.microsoft.com/dotnet/aspnet:8.0

# А это рабочий вариант (раскомментируйте для использования)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .
ENV ASPNETCORE_URLS=http://+:80
ENTRYPOINT ["dotnet", "Diplom.dll"]
