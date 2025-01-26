# Edge Function Authentication Problem

## Current Issue

When one edge function needs to call another edge function, we're hitting authentication errors. The key example is `create-ticket` calling `auto-process-ticket`:

1. The calling function (`create-ticket`) is called with a user's JWT token
2. When it calls another function (`auto-process-ticket`), we try to use service role auth but it's not working
3. The called function is checking for service role incorrectly:
   ```typescript
   // WRONG: Looking for string match
   const isServiceRole = req.headers.get('Authorization')?.includes('service_role')

   // CORRECT: Check the JWT claims
   const isServiceRole = auth.jwt()?.role === 'service_role'
   ```

## Current Pattern (NOT WORKING)

### 1. Initialize Supabase Client with Service Role
```typescript
const supabase = createClient(
  Deno.env.get('PLATFORM_URL') ?? '',
  Deno.env.get('PLATFORM_KEY') ?? ''
)
```

### 2. Call Other Functions Without Headers
```typescript
// The client should add the service role JWT automatically
supabase.functions.invoke('auto-process-ticket', {
  body: { ticket_id: ticket.id }
}).catch(err => console.error('Error auto-processing ticket:', err))
```

### 3. Check for Service Role in Receiving Function
```typescript
// Check the JWT claims for service_role
const isServiceRole = auth.jwt()?.role === 'service_role'

// Only check user auth for non-service role calls
let user
if (!isServiceRole) {
  const authHeader = req.headers.get('Authorization')?.split(' ')[1]
  if (!authHeader) throw new Error('no auth header')
  
  const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(authHeader)
  if (userError || !authUser) throw new Error('invalid auth')
  user = authUser
}
```

## Problem Points

1. We were incorrectly checking for service role by looking for a string match
2. Need to check the actual JWT claims to detect service role calls
3. The Supabase client should be adding a proper service role JWT
4. We need to verify the JWT contains the correct role claim

## Previous Attempted Solutions

### 1. String Match Check (WRONG)
```typescript
const isServiceRole = req.headers.get('Authorization')?.includes('service_role')
```
Problem: Looking for a string match is unreliable and doesn't verify the actual JWT claims.

### 2. Use PLATFORM_KEY Directly
```typescript
headers: { Authorization: `Bearer ${Deno.env.get('PLATFORM_KEY')}` }
```
Problem: This sends the raw service role key, but we need a proper JWT with role claims.

### 3. Manual Service Role Header
```typescript
headers: { Authorization: 'Bearer service_role' }
```
Problem: This doesn't provide a valid JWT with the required claims.

### 4. Supabase Client with Service Role
```typescript
const supabase = createClient(
  Deno.env.get('PLATFORM_URL'),
  Deno.env.get('PLATFORM_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```
This should work if we check the JWT claims correctly.

## Next Steps

1. Update all functions to check JWT claims instead of string matching
2. Verify the JWT being sent by the Supabase client has the correct role claim
3. Add logging to see the actual JWT claims in the receiving function
4. Consider adding a debug mode to log all auth-related headers and claims 