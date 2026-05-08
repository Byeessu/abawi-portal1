# Edge Function Replicate Image

Cette Edge Function Supabase sert de proxy pour l'API Replicate, contournant les problèmes CORS du navigateur.

## Prérequis

- Supabase CLI installé: `npm install -g supabase`
- Projet Supabase configuré
- Token Replicate API

## Configuration

1. **Créer le secret Replicate dans Supabase:**

```bash
supabase secrets set REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
```

2. **Déployer la Edge Function:**

```bash
supabase functions deploy replicate-image
```

3. **Vérifier l'URL de la function:**

```
https://[PROJECT-REF].supabase.co/functions/v1/replicate-image
```

## Variables d'environnement frontend

Ajoutez dans votre `.env`:

```env
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[votre-clé-anon]
VITE_REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
```

## Test

```bash
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/replicate-image/predictions \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "black-forest-labs/flux-schnell",
    "input": {
      "prompt": "Un entrepreneur africain professionnel",
      "width": 1024,
      "height": 1024
    }
  }'
```

## Dépannage

- **401 Unauthorized**: Vérifiez `REPLICATE_API_TOKEN` dans les secrets Supabase
- **404 Not Found**: La function n'est pas déployée, faites `supabase functions deploy replicate-image`
- **CORS errors**: Vérifiez que vous appelez bien l'URL Supabase et non l'API Replicate directement
