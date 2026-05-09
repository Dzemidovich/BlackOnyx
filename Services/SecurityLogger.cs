using System;
using System.IO;

namespace Diplom.Services
{
    public class SecurityLogger
    {
        private static readonly string LogPath = "logs/security.log";
        private static readonly object LockObject = new object();

        static SecurityLogger()
        {
            // Создаём папку logs если не существует
            var directory = Path.GetDirectoryName(LogPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
        }

        public static void LogLoginAttempt(string email, bool success, string? ipAddress = null, string? reason = null)
        {
            var message = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] LOGIN_ATTEMPT | Email: {email} | Success: {success} | IP: {ipAddress ?? "unknown"} | Reason: {reason ?? "N/A"}";
            WriteLog(message);
        }

        public static void LogRegistration(string email, bool success, string? ipAddress = null, string? reason = null)
        {
            var message = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] REGISTRATION | Email: {email} | Success: {success} | IP: {ipAddress ?? "unknown"} | Reason: {reason ?? "N/A"}";
            WriteLog(message);
        }

        public static void LogSuspiciousActivity(string activity, string? userId = null, string? ipAddress = null, string? details = null)
        {
            var message = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] SUSPICIOUS | Activity: {activity} | User: {userId ?? "anonymous"} | IP: {ipAddress ?? "unknown"} | Details: {details ?? "N/A"}";
            WriteLog(message);
        }

        public static void LogPasswordChange(string userId, bool success, string? ipAddress = null)
        {
            var message = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] PASSWORD_CHANGE | User: {userId} | Success: {success} | IP: {ipAddress ?? "unknown"}";
            WriteLog(message);
        }

        public static void LogUnauthorizedAccess(string endpoint, string? userId = null, string? ipAddress = null)
        {
            var message = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] UNAUTHORIZED_ACCESS | Endpoint: {endpoint} | User: {userId ?? "anonymous"} | IP: {ipAddress ?? "unknown"}";
            WriteLog(message);
        }

        private static void WriteLog(string message)
        {
            try
            {
                lock (LockObject)
                {
                    File.AppendAllText(LogPath, message + Environment.NewLine);
                }
            }
            catch (Exception ex)
            {
                // Если не можем записать в файл, выводим в консоль
                Console.WriteLine($"[SecurityLogger Error] {ex.Message}");
                Console.WriteLine(message);
            }
        }

        // Очистка старых логов (вызывать периодически)
        public static void CleanOldLogs(int daysToKeep = 30)
        {
            try
            {
                if (!File.Exists(LogPath)) return;

                var lines = File.ReadAllLines(LogPath);
                var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
                var filteredLines = new List<string>();

                foreach (var line in lines)
                {
                    // Парсим дату из лога
                    if (line.Length > 21 && DateTime.TryParse(line.Substring(1, 19), out var logDate))
                    {
                        if (logDate >= cutoffDate)
                        {
                            filteredLines.Add(line);
                        }
                    }
                    else
                    {
                        filteredLines.Add(line); // Сохраняем строки без даты
                    }
                }

                lock (LockObject)
                {
                    File.WriteAllLines(LogPath, filteredLines);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SecurityLogger CleanOldLogs Error] {ex.Message}");
            }
        }
    }
}
