Param(
  [string]$BaseUrl = $(if ($env:BASE_URL) { $env:BASE_URL } else { 'http://localhost:3000' }),
  [string]$UpayApiKey = $(if ($env:UPAY_API_KEY) { $env:UPAY_API_KEY } else { '' })
)

$Endpoint = "$BaseUrl/payments/upay/webhook"
$Payload = '{"paymentId":"TEST_IDEMPOTENCY_123","status":"SUCCESS","eventId":"TEST_IDEMPOTENCY_EVENT_123"}'

function Get-HmacSha256Hex([string]$key, [string]$data) {
  if ([string]::IsNullOrEmpty($key)) { return '' }
  $enc = [System.Text.Encoding]::UTF8
  $hmac = New-Object System.Security.Cryptography.HMACSHA256 ($enc.GetBytes($key))
  $hash = $hmac.ComputeHash($enc.GetBytes($data))
  -join ($hash | ForEach-Object { $_.ToString('x2') })
}

Write-Host "[1/3] Target endpoint: $Endpoint"
if (-not [string]::IsNullOrEmpty($UpayApiKey)) {
  Write-Host "[2/3] Using HMAC signature from provided API key"
} else {
  Write-Host "[2/3] No API key provided - relying on mock mode (signature disabled)"
}

$Sig = Get-HmacSha256Hex -key $UpayApiKey -data $Payload

function Invoke-Webhook([string]$sig) {
  $headers = @{ 'Content-Type' = 'application/json' }
  if (-not [string]::IsNullOrEmpty($sig)) { $headers['x-upay-signature'] = $sig }
  try {
    return Invoke-RestMethod -Uri $Endpoint -Method Post -Headers $headers -Body $Payload -TimeoutSec 30
  } catch {
    # Return raw content on error to aid debugging
    if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      return $reader.ReadToEnd()
    }
    return $_.Exception.Message
  }
}

Write-Host "[3/3] Sending first webhook..."
$first = Invoke-Webhook -sig $Sig
Write-Host "First response:" ($first | ConvertTo-Json -Depth 5)

Start-Sleep -Seconds 1

Write-Host "Sending second webhook (should be deduped)..."
$second = Invoke-Webhook -sig $Sig
if ($second -is [string]) {
  Write-Host "Second response (raw): $second"
  $secondObj = $null
  try { $secondObj = $second | ConvertFrom-Json -ErrorAction Stop } catch {}
  if ($secondObj -and $secondObj.deduped -eq $true) { Write-Host "OK: deduped=true detected"; exit 0 } else { Write-Error "FAIL: deduped not detected"; exit 1 }
} else {
  Write-Host "Second response:" ($second | ConvertTo-Json -Depth 5)
  if ($second.deduped -eq $true) { Write-Host "OK: deduped=true detected"; exit 0 } else { Write-Error "FAIL: deduped not detected"; exit 1 }
}
