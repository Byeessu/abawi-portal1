@echo off
chcp 65001 >nul
echo ==========================================
echo Déploiement Edge Function Replicate
echo ==========================================
echo.

:: Vérifier si supabase CLI est installé
supabase --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Supabase CLI non trouvé.
    echo Installation: npm install -g supabase
    pause
    exit /b 1
)

echo [1/3] Connexion à Supabase...
supabase login
if errorlevel 1 (
    echo [ERREUR] Connexion échouée
    pause
    exit /b 1
)

echo.
echo [2/3] Configuration du secret REPLICATE_API_TOKEN...
supabase secrets set REPLICATE_API_TOKEN=$env:REPLICATE_API_TOKEN --project-ref nqpfmnsecjhqxuvfkqhi
if errorlevel 1 (
    echo [ERREUR] Configuration du secret échouée
    pause
    exit /b 1
)

echo.
echo [3/3] Déploiement de la fonction replicate-image...
supabase functions deploy replicate-image --project-ref nqpfmnsecjhqxuvfkqhi
if errorlevel 1 (
    echo [ERREUR] Déploiement échoué
    pause
    exit /b 1
)

echo.
echo ==========================================
echo ✅ Déploiement réussi !
echo ==========================================
echo.
echo URL de la fonction:
echo https://nqpfmnsecjhqxuvfkqhi.supabase.co/functions/v1/replicate-image
echo.
pause
