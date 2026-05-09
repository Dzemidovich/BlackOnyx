FROM ://microsoft.com AS build
WORKDIR /src
COPY ["Diplom.csproj", "./"]
RUN dotnet restore "Diplom.csproj"
COPY . .
RUN dotnet publish "Diplom.csproj" -c Release -o /app/publish

FROM ://microsoft.com
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "Diplom.dll"]
