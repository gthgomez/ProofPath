param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Canvas([int]$Size, [bool]$Round) {
  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  if ($Round) {
    $clip = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clip.AddEllipse(0, 0, $Size, $Size)
    $graphics.SetClip($clip)
  }

  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function New-ShieldPath([float]$Scale) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $points = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF (126 * $Scale), (112 * $Scale)),
    (New-Object System.Drawing.PointF (386 * $Scale), (112 * $Scale)),
    (New-Object System.Drawing.PointF (424 * $Scale), (164 * $Scale)),
    (New-Object System.Drawing.PointF (398 * $Scale), (344 * $Scale)),
    (New-Object System.Drawing.PointF (256 * $Scale), (426 * $Scale)),
    (New-Object System.Drawing.PointF (114 * $Scale), (344 * $Scale)),
    (New-Object System.Drawing.PointF (88 * $Scale), (164 * $Scale))
  )
  $path.AddPolygon($points)
  return $path
}

function Draw-ForgeSpark([System.Drawing.Graphics]$Graphics, [float]$Scale) {
  $sparkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
  $sparkPoints = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF (366 * $Scale), (76 * $Scale)),
    (New-Object System.Drawing.PointF (382 * $Scale), (116 * $Scale)),
    (New-Object System.Drawing.PointF (422 * $Scale), (132 * $Scale)),
    (New-Object System.Drawing.PointF (382 * $Scale), (148 * $Scale)),
    (New-Object System.Drawing.PointF (366 * $Scale), (188 * $Scale)),
    (New-Object System.Drawing.PointF (350 * $Scale), (148 * $Scale)),
    (New-Object System.Drawing.PointF (310 * $Scale), (132 * $Scale)),
    (New-Object System.Drawing.PointF (350 * $Scale), (116 * $Scale))
  )
  $Graphics.FillPolygon($sparkBrush, $sparkPoints)
  $sparkBrush.Dispose()
}

function Draw-CareerForgeIcon([System.Drawing.Graphics]$Graphics, [int]$Size, [bool]$IncludeBackground = $true) {
  $scale = $Size / 512.0
  $rect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size

  if ($IncludeBackground) {
    $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 11, 16, 23)), ([System.Drawing.Color]::FromArgb(255, 18, 87, 82)), 45
    $Graphics.FillRectangle($backgroundBrush, $rect)
    $backgroundBrush.Dispose()

    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(34, 255, 255, 255)), ([float](2 * $scale))
    for ($line = 64; $line -lt 512; $line += 64) {
      $Graphics.DrawLine($gridPen, [float]($line * $scale), 0, [float]($line * $scale), [float]$Size)
      $Graphics.DrawLine($gridPen, 0, [float]($line * $scale), [float]$Size, [float]($line * $scale))
    }
    $gridPen.Dispose()
  }

  $shieldPath = New-ShieldPath $scale
  $shadowPath = New-ShieldPath $scale
  $matrix = New-Object System.Drawing.Drawing2D.Matrix
  $matrix.Translate((8 * $scale), (10 * $scale))
  $shadowPath.Transform($matrix)
  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(96, 0, 0, 0))
  $Graphics.FillPath($shadowBrush, $shadowPath)

  $shieldBounds = New-Object System.Drawing.RectangleF (88 * $scale), (112 * $scale), (336 * $scale), (314 * $scale)
  $plateBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $shieldBounds, ([System.Drawing.Color]::FromArgb(255, 49, 92, 162)), ([System.Drawing.Color]::FromArgb(255, 14, 130, 121)), 92
  $Graphics.FillPath($plateBrush, $shieldPath)

  $shineBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(48, 255, 255, 255))
  $shinePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $shinePoints = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF (126 * $scale), (112 * $scale)),
    (New-Object System.Drawing.PointF (386 * $scale), (112 * $scale)),
    (New-Object System.Drawing.PointF (406 * $scale), (140 * $scale)),
    (New-Object System.Drawing.PointF (104 * $scale), (218 * $scale)),
    (New-Object System.Drawing.PointF (88 * $scale), (164 * $scale))
  )
  $shinePath.AddPolygon($shinePoints)
  $Graphics.FillPath($shineBrush, $shinePath)

  $platePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(178, 255, 255, 255)), ([float](8 * $scale))
  $platePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Graphics.DrawPath($platePen, $shieldPath)

  Draw-ForgeSpark $Graphics $scale

  $cutoutColor = [System.Drawing.Color]::FromArgb(255, 11, 16, 23)
  $promptPen = New-Object System.Drawing.Pen $cutoutColor, ([float](30 * $scale))
  $promptPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $promptPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $promptPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Graphics.DrawLine($promptPen, [float](164 * $scale), [float](226 * $scale), [float](208 * $scale), [float](256 * $scale))
  $Graphics.DrawLine($promptPen, [float](208 * $scale), [float](256 * $scale), [float](164 * $scale), [float](286 * $scale))
  $Graphics.DrawLine($promptPen, [float](230 * $scale), [float](256 * $scale), [float](282 * $scale), [float](256 * $scale))

  $checkPen = New-Object System.Drawing.Pen $cutoutColor, ([float](32 * $scale))
  $checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $Graphics.DrawLine($checkPen, [float](208 * $scale), [float](322 * $scale), [float](252 * $scale), [float](358 * $scale))
  $Graphics.DrawLine($checkPen, [float](252 * $scale), [float](358 * $scale), [float](340 * $scale), [float](236 * $scale))

  $terminalGlow = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(86, 255, 255, 255)), ([float](7 * $scale))
  $terminalGlow.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $terminalGlow.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($terminalGlow, [float](230 * $scale), [float](256 * $scale), [float](282 * $scale), [float](256 * $scale))

  $terminalGlow.Dispose()
  $checkPen.Dispose()
  $promptPen.Dispose()
  $platePen.Dispose()
  $shinePath.Dispose()
  $shineBrush.Dispose()
  $plateBrush.Dispose()
  $shadowBrush.Dispose()
  $matrix.Dispose()
  $shadowPath.Dispose()
  $shieldPath.Dispose()
}

function Save-Png([string]$Path, [int]$Size, [bool]$Round = $false, [bool]$IncludeBackground = $true) {
  $canvas = New-Canvas $Size $Round
  try {
    Draw-CareerForgeIcon $canvas.Graphics $Size $IncludeBackground
    $directory = Split-Path -Parent $Path
    if (!(Test-Path -LiteralPath $directory)) {
      New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    $canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
  }
}

function Write-TextFile([string]$Path, [string]$Content) {
  $directory = Split-Path -Parent $Path
  if (!(Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  Set-Content -LiteralPath $Path -Value $Content -Encoding UTF8
}

function Write-AdaptiveIconXml([string]$Path) {
  Write-TextFile $Path @'
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/careerforge_icon_background"/>
  <foreground android:drawable="@drawable/careerforge_icon_foreground"/>
</adaptive-icon>
'@
}

function Write-VectorForeground([string]$Path) {
  Write-TextFile $Path @'
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="108dp"
  android:height="108dp"
  android:viewportWidth="108"
  android:viewportHeight="108">
  <path
    android:fillColor="#315CA2"
    android:pathData="M27,23.5L81,23.5L89,34.5L83.5,72.5L54,89.5L24.5,72.5L19,34.5Z"/>
  <path
    android:fillColor="#0E8279"
    android:pathData="M54,23.5L81,23.5L89,34.5L83.5,72.5L54,89.5Z"/>
  <path
    android:fillColor="#55FFFFFF"
    android:pathData="M27,23.5L81,23.5L85,29L20,46L19,34.5Z"/>
  <path
    android:strokeColor="#CCFFFFFF"
    android:strokeWidth="1.8"
    android:strokeLineJoin="round"
    android:fillColor="@android:color/transparent"
    android:pathData="M27,23.5L81,23.5L89,34.5L83.5,72.5L54,89.5L24.5,72.5L19,34.5Z"/>
  <path
    android:fillColor="#F59E0B"
    android:pathData="M76.5,16L79.8,24.3L88,27.5L79.8,30.7L76.5,39L73.2,30.7L65,27.5L73.2,24.3Z"/>
  <path
    android:strokeColor="#0B1017"
    android:strokeWidth="6.4"
    android:strokeLineCap="round"
    android:strokeLineJoin="round"
    android:fillColor="@android:color/transparent"
    android:pathData="M34.5,47.8L44,54L34.5,60.2M48.5,54L59.5,54"/>
  <path
    android:strokeColor="#0B1017"
    android:strokeWidth="6.8"
    android:strokeLineCap="round"
    android:strokeLineJoin="round"
    android:fillColor="@android:color/transparent"
    android:pathData="M44,68L53,75.5L71.5,49.8"/>
  <path
    android:strokeColor="#60FFFFFF"
    android:strokeWidth="1.4"
    android:strokeLineCap="round"
    android:fillColor="@android:color/transparent"
    android:pathData="M48.5,54L59.5,54"/>
</vector>
'@
}

function Write-SplashBackgroundXml([string]$Path) {
  Write-TextFile $Path @'
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/splashscreen_logo"/>
  </item>
</layer-list>
'@
}

$docsDir = Join-Path $Root "docs"
$assetsDir = Join-Path $Root "assets"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "careerforge-icon"
$resDir = Join-Path $Root "android\app\src\main\res"
New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$storeIcon = Join-Path $docsDir "careerforge-icon-512.png"
Save-Png $storeIcon 512 $false $true
Copy-Item -LiteralPath $storeIcon -Destination (Join-Path $assetsDir "careerforge-icon.png") -Force

Write-VectorForeground (Join-Path $resDir "drawable\careerforge_icon_foreground.xml")
Write-SplashBackgroundXml (Join-Path $resDir "drawable\ic_launcher_background.xml")
Write-AdaptiveIconXml (Join-Path $resDir "mipmap-anydpi-v26\ic_launcher.xml")
Write-AdaptiveIconXml (Join-Path $resDir "mipmap-anydpi-v26\ic_launcher_round.xml")

$splashDensities = @{
  "drawable-mdpi" = 288
  "drawable-hdpi" = 432
  "drawable-xhdpi" = 576
  "drawable-xxhdpi" = 864
  "drawable-xxxhdpi" = 1152
}

foreach ($entry in $splashDensities.GetEnumerator()) {
  $folder = Join-Path $resDir $entry.Key
  Save-Png (Join-Path $folder "splashscreen_logo.png") ([int]$entry.Value) $false $true
}

$launcherDensities = @{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}

$ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpegCommand) {
  $workspaceFfmpeg = "C:\Workspace\tools\ffmpeg\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"
  if (Test-Path -LiteralPath $workspaceFfmpeg) {
    $ffmpegCommand = Get-Item -LiteralPath $workspaceFfmpeg
  }
}
if (-not $ffmpegCommand) {
  throw "ffmpeg is required to write WebP launcher assets."
}

foreach ($entry in $launcherDensities.GetEnumerator()) {
  $folder = Join-Path $resDir $entry.Key
  $size = [int]$entry.Value
  $squarePng = Join-Path $tempDir "$($entry.Key)-ic_launcher.png"
  $roundPng = Join-Path $tempDir "$($entry.Key)-ic_launcher_round.png"
  $squareWebp = Join-Path $tempDir "$($entry.Key)-ic_launcher.webp"
  $roundWebp = Join-Path $tempDir "$($entry.Key)-ic_launcher_round.webp"
  Save-Png $squarePng $size $false $true
  Save-Png $roundPng $size $true $true

  & $ffmpegCommand.Source -y -v error -i $squarePng -lossless 1 $squareWebp
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while generating $squareWebp"
  }
  & $ffmpegCommand.Source -y -v error -i $roundPng -lossless 1 $roundWebp
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while generating $roundWebp"
  }

  if (!(Test-Path -LiteralPath $folder)) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
  }
  Move-Item -LiteralPath $squareWebp -Destination (Join-Path $folder "ic_launcher.webp") -Force
  Move-Item -LiteralPath $roundWebp -Destination (Join-Path $folder "ic_launcher_round.webp") -Force
}

Write-Output "Generated CareerForge shield/forge launcher icons, splash logos, adaptive icon XML, and Play listing icon."
