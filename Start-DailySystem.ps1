param(
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Server = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)

function Get-MimeType {
  param([string]$Path)
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".svg" { "image/svg+xml" }
    default { "application/octet-stream" }
  }
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType
  )

  $Header = "HTTP/1.1 $Status $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

Write-Host "Daily System running on this PC at http://localhost:$Port/"
Write-Host "From your iPhone, open http://YOUR-PC-IP:$Port/ while on the same Wi-Fi."
Write-Host "Press Ctrl+C to stop."

$Server.Start()
try {
  while ($true) {
    $Client = $Server.AcceptTcpClient()
    try {
      $Stream = $Client.GetStream()
      $Buffer = New-Object byte[] 4096
      $Read = $Stream.Read($Buffer, 0, $Buffer.Length)
      $Request = [System.Text.Encoding]::ASCII.GetString($Buffer, 0, $Read)
      $FirstLine = ($Request -split "`r?`n")[0]
      $Parts = $FirstLine -split " "
      $RequestPath = if ($Parts.Length -ge 2) { $Parts[1] } else { "/" }
      $RequestPath = [Uri]::UnescapeDataString(($RequestPath -split "\?")[0].TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($RequestPath)) {
        $RequestPath = "index.html"
      }

      $FullPath = Join-Path $Root $RequestPath
      $ResolvedRoot = (Resolve-Path $Root).Path
      $ResolvedPath = if (Test-Path $FullPath -PathType Leaf) { (Resolve-Path $FullPath).Path } else { $null }

      $InsideRoot = $ResolvedPath -and (
        $ResolvedPath.Equals($ResolvedRoot, [StringComparison]::OrdinalIgnoreCase) -or
        $ResolvedPath.StartsWith($ResolvedRoot + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
      )

      if ($InsideRoot) {
        $Body = [System.IO.File]::ReadAllBytes($ResolvedPath)
        Send-Response $Stream 200 "OK" $Body (Get-MimeType $ResolvedPath)
      } else {
        $Body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
        Send-Response $Stream 404 "Not Found" $Body "text/plain; charset=utf-8"
      }
    } finally {
      $Client.Close()
    }
  }
} finally {
  $Server.Stop()
}
