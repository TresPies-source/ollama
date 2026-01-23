Add-Type -AssemblyName System.Windows.Forms,System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, ref RECT lpRect);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
}
"@

# Find Dojo Genesis Desktop window
$process = Get-Process | Where-Object { $_.MainWindowTitle -eq "Dojo Genesis Desktop" } | Select-Object -First 1
if (-not $process) {
    Write-Host "Window not found! Looking for dgd-desktop process..."
    $process = Get-Process dgd-desktop -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($process) {
    $hwnd = $process.MainWindowHandle
    Write-Host "Found window: $($process.MainWindowTitle)"
    Write-Host "Window handle: $hwnd"
    
    # Bring window to front
    [Win32]::ShowWindow($hwnd, 9)  # SW_RESTORE
    [Win32]::SetForegroundWindow($hwnd)
    Start-Sleep -Milliseconds 500
    
    # Get window rect
    $rect = New-Object RECT
    [Win32]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
    
    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    
    Write-Host "Window position: ($($rect.Left), $($rect.Top))"
    Write-Host "Window size: ${width}x${height}"
    
    # Capture the window area
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, [System.Drawing.Size]::new($width, $height))
    
    $outputPath = "$PSScriptRoot\dojo-genesis-desktop-window.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    $graphics.Dispose()
    
    Write-Host "Screenshot saved to: $outputPath"
} else {
    Write-Host "ERROR: Could not find Dojo Genesis Desktop process"
}
