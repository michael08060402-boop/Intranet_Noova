$ErrorActionPreference = 'Stop'
$destinoSecreto = Join-Path $PSScriptRoot '../functions/.secret.local'
$puntero = [IntPtr]::Zero
try {
    Read-Host 'Copia ahora el VALOR del Client Secret del ERP. Vuelve y pulsa Enter sin pegar' | Out-Null
    $valor = (Get-Clipboard -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($valor) -or $valor.Contains("`n") -or $valor.Contains("`r")) { throw 'Entrada vacia o con saltos de linea' }
    $longitud = $valor.Length
    [System.IO.File]::WriteAllText($destinoSecreto, 'MICROSOFT_CLIENT_SECRET=' + $valor + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
    $valor = $null
    try { Set-Clipboard -Value ' ' } catch { }
    Write-Output ('Secreto local guardado. Caracteres recibidos: ' + $longitud)
    Write-Output 'Archivo functions/.secret.local excluido de Git y del deploy. No lo compartas.'
} catch {
    Write-Output 'No se pudo preparar el secreto local. No se mostro su valor.'
    exit 1
} finally { $valor = $null }