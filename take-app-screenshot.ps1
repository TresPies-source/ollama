Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Write-Host "Waiting for app to load..."
Start-Sleep -Seconds 3

# Take screenshot
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$screenshot = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($screenshot)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

$outputPath = Join-Path $PSScriptRoot ".zenflow\tasks\dojo-genesis-desktop-frontend-9387\desktop_app_with_logo.png"
$screenshot.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$screenshot.Dispose()
$graphics.Dispose()

Write-Host "Screenshot saved to: $outputPath"
