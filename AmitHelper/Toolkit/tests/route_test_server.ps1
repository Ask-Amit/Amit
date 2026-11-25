# route_test_server.ps1 (2026-11-24): a tiny stand-in for the Helper bridge that serves ONLY /api/script/* using the real amit_script_routes.ps1. Used by test_routes.ps1.
param([int]$Port = 18731)
$AmitSiteOrigins = @('https://askamit.org', 'https://www.askamit.org', 'https://ask-amit.github.io')
function Send-JsonRaw($response, $jsonString, $statusCode = 200) {
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
    $response.StatusCode = $statusCode
    $response.ContentType = 'application/json'
    $response.KeepAlive = $false
    $response.Headers.Add('Access-Control-Allow-Origin', '*')
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
}
. (Join-Path (Split-Path -Parent $PSScriptRoot) 'amit_script_routes.ps1')
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add('http://localhost:' + $Port + '/')
$l.Start()
while ($true) {
    $ctx = $l.GetContext()
    try {
        $p = $ctx.Request.Url.AbsolutePath
        if ($p -like '/api/script/*') { Invoke-AmitScriptRoute -Path $p -Request $ctx.Request -Response $ctx.Response -SiteOrigins $AmitSiteOrigins }
        else { Send-JsonRaw $ctx.Response '{"error":"not found"}' 404 }
    } catch {
        try { [System.IO.File]::AppendAllText((Join-Path $env:TEMP 'route_test_server_err.txt'), ((Get-Date).ToString('s') + ' ' + ($_ | Out-String) + "`r`n")) } catch { }
        try { Send-JsonRaw $ctx.Response ('{"error":"' + ($_.Exception.Message -replace '"', "'") + '"}') 500 } catch { }
    }
}
