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

2. Set environment variables in `.env.development`:
```bash
PLATFORM_URL=your_supabase_project_url
PLATFORM_KEY=your_service_role_key
```

3. Deploy function and set secrets:
```bash
# Set environment variables
supabase secrets set --env-file .env.development --project-ref your_project_ref

# Deploy function
supabase functions deploy sign-in-with-username --project-ref your_project_ref
```

The function will be available at:
`https://[PROJECT_REF].supabase.co/functions/v1/sign-in-with-username`

### Testing the Function

```bash
# Test with curl
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/sign-in-with-username' \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your_anon_key" \
-d '{"username":"test", "password":"test"}'
```

### Function Details

The function handles:
- Username to email lookup
- Password verification
- CORS headers for browser access
- Proper error responses
- Session management

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

### Environment Variables

- `PLATFORM_URL`: Your Supabase project URL (from Project Settings -> API)
- `PLATFORM_KEY`: Your Supabase service role key (from Project Settings -> API)

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