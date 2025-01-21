#!/bin/bash

# Check if environment is provided
if [ -z "$1" ]; then
    echo "Error: Environment required"
    echo "Usage: ./reset-and-migrate.sh <dev|development|prod|production>"
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

# Extract project ref and platform key from env file
PLATFORM_URL=$(grep PLATFORM_URL $ENV_FILE | cut -d '=' -f2)
PLATFORM_KEY=$(grep PLATFORM_KEY $ENV_FILE | cut -d '=' -f2)

if [ -z "$PLATFORM_URL" ] || [ -z "$PLATFORM_KEY" ]; then
    echo "Error: PLATFORM_URL or PLATFORM_KEY not found in $ENV_FILE"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $PLATFORM_URL | sed -E 's/https:\/\/([^.]+).supabase.co/\1/')
if [ -z "$PROJECT_REF" ]; then
    echo "Error: Could not extract project ref from PLATFORM_URL"
    exit 1
fi

# Debug info
echo "Project ref: $PROJECT_REF"
echo "Database host: db.${PROJECT_REF}.supabase.co"

# Confirm reset
read -p "This will COMPLETELY RESET the database in the $1 environment. Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled"
    exit 1
fi

# Update config.toml with project ref
sed -i.bak "s/project_id = \".*\"/project_id = \"$PROJECT_REF\"/" supabase/config.toml
rm supabase/config.toml.bak

# Link project
echo "Linking project..."
supabase link --project-ref $PROJECT_REF

# Run migrations (this will run our reset migration first, then recreate everything)
echo "Running migrations..."
SUPABASE_ACCESS_TOKEN="$PLATFORM_KEY" supabase migration up --linked

echo "Reset complete for $1 project: $PROJECT_REF" 