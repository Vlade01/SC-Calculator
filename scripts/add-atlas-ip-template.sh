#!/usr/bin/env bash
# Replace these placeholders with your Atlas project info and API keys.
# Usage: EDIT the variables below, then run: bash add-atlas-ip-template.sh
PUBLIC_KEY="<YOUR_ATLAS_PUBLIC_KEY>"
PRIVATE_KEY="<YOUR_ATLAS_PRIVATE_KEY>"
PROJECT_ID="69bfa38555fdaf0d623772b7"

# Get current public IP
MY_IP=$(curl -s https://ipinfo.io/ip)
if [ -z "$MY_IP" ]; then
  echo "Could not determine public IP. Set MY_IP manually."
  exit 1
fi

echo "Adding IP $MY_IP to Atlas project $PROJECT_ID"

curl -u "$PUBLIC_KEY:$PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "[{ \"ipAddress\": \"$MY_IP\", \"comment\": \"added by script\" }]" \
  "https://cloud.mongodb.com/api/atlas/v1.0/groups/$PROJECT_ID/accessList"

# Note: Requires Atlas API keys with Project Owner or Project IP Whitelist management privileges.
# For production, prefer adding a single IP or a narrow CIDR. Avoid 0.0.0.0/0 unless necessary.