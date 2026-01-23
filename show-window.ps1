Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@

# Find window by exact title "Dojo Genesis Desktop"
$process = Get-Process | Where-Object { $_.MainWindowTitle -eq "Dojo Genesis Desktop" } | Select-Object -First 1
if ($process) {
    $hwnd = $process.MainWindowHandle
    Write-Host "Found window: $($process.MainWindowTitle)"
    [Win32]::ShowWindow($hwnd, 9)  # SW_RESTORE
    [Win32]::SetForegroundWindow($hwnd)
    Write-Host "Window brought to foreground"
    Start-Sleep -Seconds 1
} else {
    Write-Host "No window found with exact title 'Dojo Genesis Desktop'"
    Write-Host "Searching for any Dojo Genesis window..."
    $processes = Get-Process | Where-Object { $_.MainWindowTitle -like "*Dojo Genesis*" }
    foreach ($p in $processes) {
        Write-Host "  - $($p.ProcessName): $($p.MainWindowTitle)"
        if ($p.ProcessName -eq "dgd-desktop") {
            Write-Host "    ^ This is the desktop app!"
            [Win32]::ShowWindow($p.MainWindowHandle, 9)
            [Win32]::SetForegroundWindow($p.MainWindowHandle)
            Start-Sleep -Seconds 1
        }
    }
}
