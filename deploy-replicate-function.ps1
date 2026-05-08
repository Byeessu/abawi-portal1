# Script PowerShell de déploiement Edge Function Replicate
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Déploiement Edge Function Replicate" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier supabase CLI
try {
    $version = supabase --version 2>$null
    Write-Host "✓ Supabase CLI trouvé: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI non trouvé" -ForegroundColor Red
    Write-Host "Installation: npm install -g supabase" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "[1/4] Connexion à Supabase..." -ForegroundColor Blue
supabase login
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Connexion échouée" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "[2/4] Vérification du projet..." -ForegroundColor Blue
$projectRef = "nqpfmnsecjhqxuvfkqhi"
Write-Host "Project ref: $projectRef" -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Configuration du secret REPLICATE_API_TOKEN..." -ForegroundColor Blue
supabase secrets set REPLICATE_API_TOKEN=$env:REPLICATE_API_TOKEN --project-ref $projectRef
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Configuration du secret échouée" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}
Write-Host "✓ Secret configuré" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Déploiement de la fonction replicate-image..." -ForegroundColor Blue
supabase functions deploy replicate-image --project-ref $projectRef
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Déploiement échoué" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Déploiement réussi !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "URL de la fonction:" -ForegroundColor Cyan
Write-Host "https://$projectRef.supabase.co/functions/v1/replicate-image" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"
