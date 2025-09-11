using ExcelDataManipulator.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ✅ Configure CORS to allow React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", corsBuilder =>
    {
        corsBuilder
            .WithOrigins("http://localhost:3000", "http://localhost:3001") // React dev server ports
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Register streaming services
builder.Services.AddSingleton<SessionService>();
builder.Services.AddScoped<StreamingDataOperationsService>();

builder.Services.AddLogging();
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
app.UseHttpsRedirection();

// ✅ IMPORTANT: Use CORS before other middleware
app.UseCors("AllowReactApp");

app.UseAuthorization();
app.MapControllers();

// Background service to cleanup expired sessions
var sessionService = app.Services.GetRequiredService<SessionService>();
var timer = new Timer(_ => sessionService.CleanupExpiredSessions(TimeSpan.FromHours(24)),
                     null, TimeSpan.Zero, TimeSpan.FromHours(1));

app.Run();
