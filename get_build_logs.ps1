$session = '{"id":"eb3242e1-9030-4779-a0f1-78021a32a20e","version":1,"expires_at":2086646400000}'
$buildId = "8a5c81e0-dac3-4424-b2fc-9af9084ce267"

$query = @"
{
  "query": "{ builds { byId(buildId: \"$buildId\") { id status error { message errorCode } artifacts { buildUrl } } } }"
}
"@

$headers = @{
    "expo-session" = $session
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.expo.dev/graphql" -Method POST -Headers $headers -Body $query
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
    Write-Host $_.Exception.Message
}
