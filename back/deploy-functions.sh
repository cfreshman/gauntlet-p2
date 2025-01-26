#!/bin/bash

# Check if environment is provided
if [ -z "$1" ]; then
    echo "Error: Environment required"
    echo "Usage: ./deploy.sh <dev|development|prod|production>"
    exit 1
fi

# Convert environment argument to standard form
case $1 in
  "dev"|"development")
    ENV_FILE=".env.development"
    ;;
  "prod"|"production")
    ENV_FILE=".env.production"
    ;;
  *)
    echo "Error: Invalid environment. Use dev|development|prod|production"
    exit 1
    ;;
esac

# Check if env file exists
if [ ! -f $ENV_FILE ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

# Extract project ref from PLATFORM_URL
PLATFORM_URL=$(grep PLATFORM_URL $ENV_FILE | cut -d '=' -f2)
if [ -z "$PLATFORM_URL" ]; then
    echo "Error: PLATFORM_URL not found in $ENV_FILE"
    exit 1
fi

# Extract PLATFORM_KEY
PLATFORM_KEY=$(grep PLATFORM_KEY $ENV_FILE | cut -d '=' -f2)
if [ -z "$PLATFORM_KEY" ]; then
    echo "Error: PLATFORM_KEY not found in $ENV_FILE"
    exit 1
fi

# Extract OPENAI_API_KEY
OPENAI_API_KEY=$(grep OPENAI_API_KEY $ENV_FILE | cut -d '=' -f2)
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY not found in $ENV_FILE"
    exit 1
fi

# Extract project ref from URL (assumes format: https://<project-ref>.supabase.co)
PROJECT_REF=$(echo $PLATFORM_URL | sed -E 's/https:\/\/([^.]+).supabase.co/\1/')
if [ -z "$PROJECT_REF" ]; then
    echo "Error: Could not extract project ref from PLATFORM_URL"
    exit 1
fi

# Set environment variables
echo "Setting environment variables..."
supabase secrets set --project-ref $PROJECT_REF PLATFORM_URL=$PLATFORM_URL PLATFORM_KEY=$PLATFORM_KEY OPENAI_API_KEY=$OPENAI_API_KEY

# Deploy all functions
supabase functions deploy create-ticket --project-ref $PROJECT_REF
supabase functions deploy update-ticket --project-ref $PROJECT_REF
supabase functions deploy delete-ticket --project-ref $PROJECT_REF
supabase functions deploy create-comment --project-ref $PROJECT_REF
supabase functions deploy delete-comment --project-ref $PROJECT_REF
supabase functions deploy create-team --project-ref $PROJECT_REF
supabase functions deploy update-team --project-ref $PROJECT_REF
supabase functions deploy update-profile --project-ref $PROJECT_REF
supabase functions deploy sign-up --project-ref $PROJECT_REF
supabase functions deploy sign-in-with-username --project-ref $PROJECT_REF
supabase functions deploy reset-password --project-ref $PROJECT_REF
supabase functions deploy invite-team-member --project-ref $PROJECT_REF
supabase functions deploy get-template --project-ref $PROJECT_REF
supabase functions deploy upsert-article --project-ref $PROJECT_REF
supabase functions deploy generate-embedding --project-ref $PROJECT_REF
supabase functions deploy update-kb-embedding --project-ref $PROJECT_REF
supabase functions deploy search-kb --project-ref $PROJECT_REF
supabase functions deploy generate-ticket-embedding --project-ref $PROJECT_REF
supabase functions deploy search-similar-tickets --project-ref $PROJECT_REF

echo "All functions deployed to $1 project: $PROJECT_REF" 