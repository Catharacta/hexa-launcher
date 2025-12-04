
Add-Type -AssemblyName System.Drawing

function Generate-HexIcon {
    param (
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Calculate hexagon points
    $center = $size / 2
    $radius = $size / 2 - ($size * 0.05) # Padding
    $points = @()
    for ($i = 0; $i -lt 6; $i++) {
        $angle = 60 * $i - 30
        $rad = $angle * [Math]::PI / 180
        $x = $center + $radius * [Math]::Cos($rad)
        $y = $center + $radius * [Math]::Sin($rad)
        $points += New-Object System.Drawing.PointF $x, $y
    }

    # Gradient Brush
    $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        $rect,
        [System.Drawing.Color]::FromArgb(255, 0, 242, 234), # Cyan
        [System.Drawing.Color]::FromArgb(255, 0, 68, 255),  # Blue
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )

    # Fill Hexagon
    $g.FillPolygon($brush, $points)

    # Stroke (White border)
    $penWidth = $size * 0.03
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), $penWidth
    $g.DrawPolygon($pen, $points)

    # Inner Detail (Optional: smaller hexagon outline)
    $innerRadius = $radius * 0.6
    $innerPoints = @()
    for ($i = 0; $i -lt 6; $i++) {
        $angle = 60 * $i - 30
        $rad = $angle * [Math]::PI / 180
        $x = $center + $innerRadius * [Math]::Cos($rad)
        $y = $center + $innerRadius * [Math]::Sin($rad)
        $innerPoints += New-Object System.Drawing.PointF $x, $y
    }
    $innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(100, 255, 255, 255)), ($size * 0.01)
    $g.DrawPolygon($innerPen, $innerPoints)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $outputPath"
}

# Generate icons
Generate-HexIcon -size 512 -outputPath "src-tauri\icons\icon.png"
Generate-HexIcon -size 128 -outputPath "src-tauri\icons\128x128.png"
Generate-HexIcon -size 32 -outputPath "src-tauri\icons\32x32.png"
Generate-HexIcon -size 256 -outputPath "src-tauri\icons\256x256.png"
