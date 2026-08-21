using taskManagmentCofc.Server.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services
    .AddApiErrorHandling()
    .AddDatabase(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddApplicationServices(builder.Configuration)
    .AddOpenApiDocumentation();

var app = builder.Build();

if (app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
{
    await app.ApplyDatabaseMigrationsAsync();
}

app.UseApiErrorHandling();

var hasWebRoot = Directory.Exists(app.Environment.WebRootPath);
if (hasWebRoot)
{
    app.UseDefaultFiles();
    app.MapStaticAssets();
}

await app.SeedConfiguredAdminAsync();

if (app.Environment.IsDevelopment())
{

    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Task Management API v1");
        options.RoutePrefix = "swagger";
    });
}

if (app.Configuration.GetValue("HttpsRedirection:Enabled", true))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.MapFallback("/api/{**path}", () => Results.NotFound());
if (hasWebRoot)
{
    app.MapFallbackToFile("/index.html");
}

app.Run();

public partial class Program;
