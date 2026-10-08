$ErrorActionPreference = 'Stop'
$configVideos = @{}
Get-Content -LiteralPath (Join-Path $PSScriptRoot '../functions/.env.noova-intranet') | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') { $configVideos[$matches[1]] = $matches[2].Trim() }
}
try {
    $etapa = 'lectura del portapapeles'
    Read-Host 'Ahora copia el VALOR completo del Client Secret. Vuelve aqui y pulsa solo Enter; no pegues la clave' | Out-Null
    $valorPortapapeles = Get-Clipboard -Raw
    if ([string]::IsNullOrWhiteSpace($valorPortapapeles)) { throw 'Portapapeles vacio' }
    $secretoOculto = ConvertTo-SecureString -String $valorPortapapeles.Trim() -AsPlainText -Force
    $valorPortapapeles = $null
    # La limpieza del portapapeles no debe impedir comprobar Microsoft.
    try { Set-Clipboard -Value ' ' } catch { Write-Output 'No se pudo limpiar el portapapeles; borralo manualmente al terminar.' }
    $punteroSecreto = [IntPtr]::Zero
    try {
        $punteroSecreto = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretoOculto)
        $secretoVideos = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($punteroSecreto)
    } finally {
        if ($punteroSecreto -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($punteroSecreto) }
    }
    Write-Output ('Caracteres recibidos: ' + $secretoOculto.Length)
    if ([string]::IsNullOrWhiteSpace($secretoVideos)) { throw 'Entrada vacia' }
    $etapa = 'autenticacion con Microsoft'
    $tokenVideos = Invoke-RestMethod -Method Post -Uri ('https://login.microsoftonline.com/' + $configVideos['MS_TENANT_ID'] + '/oauth2/v2.0/token') -Body @{
        client_id = $configVideos['MS_CLIENT_ID']
        client_secret = $secretoVideos
        scope = 'https://graph.microsoft.com/.default'
        grant_type = 'client_credentials'
    }
    $secretoVideos = $null
    $etapa = 'consulta del video'
    $rutaVideo = 'NOOVA SAC/11.  MULTIMEDIA/CONTENIDO DISCO/CURSOS/Curso de Aplicacion Pumpsim 3D 01.mp4'
    $rutaCodificada = (($rutaVideo -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    $archivo = Invoke-RestMethod -Uri ('https://graph.microsoft.com/v1.0/users/contactos%40noovasac.com/drive/root:/' + $rutaCodificada) -Headers @{ Authorization = ('Bearer ' + $tokenVideos.access_token) }
    Write-Output ('Archivo encontrado: ' + $archivo.name)
    Write-Output ('Enlace temporal disponible: ' + [bool]$archivo.'@microsoft.graph.downloadUrl')
} catch {
    Write-Output ('La prueba fallo en: ' + $etapa + '. No se mostraron secretos ni enlaces.')
    Write-Output ('Tipo de error: ' + $_.Exception.GetType().Name)
    if ($_.Exception.Response) { Write-Output ('Estado HTTP: ' + [int]$_.Exception.Response.StatusCode) }
    # Mostrar solo codigos numericos AADSTS; nunca el cuerpo completo del error.
    $detalleSeguro = $_.ErrorDetails.Message
    if (-not $detalleSeguro -and $_.Exception.Response) {
        try {
            $lectorError = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            try { $detalleSeguro = $lectorError.ReadToEnd() } finally { $lectorError.Dispose() }
        } catch { }
    }
    if ($etapa -eq 'autenticacion con Microsoft' -and $detalleSeguro) {
        try {
            $errorMicrosoft = $detalleSeguro | ConvertFrom-Json
            foreach ($codigoMicrosoft in $errorMicrosoft.error_codes) {
                if ([string]$codigoMicrosoft -match '^\d+$') { Write-Output ('Codigo Microsoft: AADSTS' + $codigoMicrosoft) }
            }
        } catch { }
    }
    exit 1
} finally {
    $secretoVideos = $null
    $tokenVideos = $null
    $archivo = $null
    if ($secretoOculto) { $secretoOculto.Dispose() }
}