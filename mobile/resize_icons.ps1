Add-Type -AssemblyName System.Drawing
$sourceImg = [System.Drawing.Image]::FromFile('d:\dosebox\mobile\src\assets\images\mobile-uper.png')
$sizes = @{
    'mdpi' = 48;
    'hdpi' = 72;
    'xhdpi' = 96;
    'xxhdpi' = 144;
    'xxxhdpi' = 192;
}
foreach ($size in $sizes.GetEnumerator()) {
    $folder = "d:\dosebox\mobile\android\app\src\main\res\mipmap-$($size.Name)"
    if (!(Test-Path $folder)) { New-Item -ItemType Directory -Force $folder }
    $destImg = New-Object System.Drawing.Bitmap($size.Value, $size.Value)
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($sourceImg, 0, 0, $size.Value, $size.Value)
    $destImg.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $destImg.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destImg.Dispose()
}
$sourceImg.Dispose()
