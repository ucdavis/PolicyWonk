#!/usr/bin/env bash

# This script creates firewall rules in an Azure Database for PostgreSQL server to allow traffic from the outbound IPs of a Web App.

# Variables
WEBAPP_NAME="policywonk-prod-sso"
WEBAPP_RG="policy"
PG_SERVER_NAME="policywonk-prod-db"
PG_SERVER_RG="policy"

# 1. Get outbound IPs from the Web App
outboundIPs=$(az webapp show \
  --name "$WEBAPP_NAME" \
  --resource-group "$WEBAPP_RG" \
  --query outboundIpAddresses \
  --output tsv)

echo "Outbound IPs: $outboundIPs"

# 2. Loop through them and create firewall rules
# Splitting the comma-separated list into an array
IFS=',' read -ra ipArray <<< "$outboundIPs"

counter=1
for ip in "${ipArray[@]}"; do
  ruleName="Allow${WEBAPP_NAME}IP${counter}"

  echo "Creating firewall rule '$ruleName' for IP: $ip"

  az postgres flexible-server firewall-rule create \
    --name "$PG_SERVER_NAME" \
    --resource-group "$PG_SERVER_RG" \
    --rule-name "$ruleName" \
    --start-ip-address "$ip" \
    --end-ip-address "$ip"

  ((counter++))
done

echo "Done creating firewall rules for each Web App outbound IP."
