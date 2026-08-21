# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["taskManagmentCofc.Server/taskManagmentCofc.Server.csproj", "taskManagmentCofc.Server/"]
RUN dotnet restore "taskManagmentCofc.Server/taskManagmentCofc.Server.csproj" /p:SkipSpaProjectReference=true

COPY taskManagmentCofc.Server/ taskManagmentCofc.Server/
WORKDIR /src/taskManagmentCofc.Server
RUN dotnet publish "taskManagmentCofc.Server.csproj" \
    --configuration "$BUILD_CONFIGURATION" \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false \
    /p:SkipSpaProjectReference=true

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080
COPY --from=build --chown=app:app /app/publish .
USER app

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
    CMD curl --fail --silent http://127.0.0.1:8080/health > /dev/null || exit 1

ENTRYPOINT ["dotnet", "taskManagmentCofc.Server.dll"]
