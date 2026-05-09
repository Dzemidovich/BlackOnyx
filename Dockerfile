# Этап сборки
FROM ://microsoft.com AS build
WORKDIR /src

# Копируем файл проекта и восстанавливаем зависимости
COPY ["Diplom.csproj", "./"]
RUN dotnet restore "Diplom.csproj"

# Копируем все файлы и собираем проект
COPY . .
RUN dotnet publish "Diplom.csproj" -c Release -o /app/publish

# Этап запуска (вот здесь была ошибка на скриншоте)
FROM ://microsoft.com
WORKDIR /app
COPY --from=build /app/publish .

# Настройка порта для Render
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "Diplom.dll"]
