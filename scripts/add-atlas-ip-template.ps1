# PowerShell template to add your current IP to MongoDB Atlas project access list.
# Fill in $publicKey, $privateKey, $projectId then run in PowerShell.
$publicKey = '<YOUR_ATLAS_PUBLIC_KEY>'
$privateKey = '<YOUR_ATLAS_PRIVATE_KEY>'
$projectId = '<YOUR_ATLAS_PROJECT_ID>'

$myIp = (Invoke-RestMethod -Uri 'https://ipinfo.io/ip' -UseBasicParsing).Trim()
if (-not $myIp) { Write-Error 'Could not determine public IP'; exit 1 }

Write-Host "Adding IP $myIp to Atlas project $projectId"

$body = @(
  @{ ipAddress = $myIp; comment = 'added by script' }
) | ConvertTo-Json

$uri = "https://cloud.mongodb.com/api/atlas/v1.0/groups/$projectId/accessList"

Invoke-RestMethod -Uri $uri -Method Post -Credential (New-Object System.Management.Automation.PSCredential($publicKey, (ConvertTo-SecureString $privateKey -AsPlainText -Force))) -ContentType 'application/json' -Body $body

# Note: Requires Atlas API public/private keys with suitable permissions. Avoid wide CIDRs in production.