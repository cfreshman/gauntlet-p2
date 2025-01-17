# Supabase Edge Functions

This directory contains Supabase Edge Functions for username-based authentication.

## Function: sign-in-with-username

Allows users to sign in with username instead of email. The function:
1. Looks up the email for the given username
2. Signs in with Supabase auth using the email
3. Returns the session data

### Development Setup

1. Install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

2. Set up environment variables in `.env.development`:
```bash
PLATFORM_URL=your_project_url
PLATFORM_KEY=your_service_role_key
```

3. Deploy function and set secrets:
```bash
# Set environment variables
supabase secrets set --env-file .env.development --project-ref your_project_ref

# Deploy function
supabase functions deploy sign-in-with-username --project-ref your_project_ref
```

### Production Setup

1. Set up environment variables in `.env.production`

2. Deploy to production:
```bash
# Set environment variables
supabase secrets set --env-file .env.production --project-ref your_prod_project_ref

# Deploy function
supabase functions deploy sign-in-with-username --project-ref your_prod_project_ref
```

### Example Usage

```bash
# Success case
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/sign-in-with-username' \
-H "Content-Type: application/json" \
-d '{"username":"test", "password":"test123"}'

# Response:
{
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "id": "...",
      "email": "test@example.com"
    }
  }
}

# Error case (wrong password)
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/sign-in-with-username' \
-H "Content-Type: application/json" \
-d '{"username":"test", "password":"wrong"}'

# Response:
{
  "error": {
    "message": "invalid credentials",
    "status": 401
  }
}
```

### Directory Structure
```
back/
  supabase/
    functions/
      sign-in-with-username/
        index.ts      # Function code
      types.d.ts      # TypeScript types for Deno
  .env.development    # Development environment variables
  .env.production     # Production environment variables
```

### Important Notes

1. Keep your `.env` files in `.gitignore`
2. Never expose the service role key
3. The TypeScript error about URL imports can be ignored - it works in Deno
4. CORS is configured to allow all origins (`*`) for development
5. The function requires Docker for deployment

### Error Responses

The function returns:
- 401 for invalid credentials
- 500 for server errors
- All responses include proper CORS headers 