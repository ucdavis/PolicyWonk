# Auth Setup

We need to use SAML for auth so we can integrate w/ UCTrust + InCommon.

This is done using BoxyHQ SAML Jackson as a service provider (SP) to basically proxy auth our NextJS app.

Full details [are in notion](https://www.notion.so/caes-cru/SAML-Shibboleth-1b4e70f6741180d9b780fb1354c0b380?pvs=4).

## Setup

We need to deploy the BoxyHQ SAML Jackson service provider (SP) to an azure webapp.

To make it easy and repeatable, we'll use a bicep template plus the azure cli.

## Bicep template

The bicep template is in `auth/boxy.bicep`.

It will define the Azure resources we need and is idempotent, so we can run it multiple times and it'll only create or update the resources as needed.

## Deploy

You'll need the azure cli installed and logged in. Make sure you are in the right subscription. ex: `az account set --subscription "UC Davis CAES Production"`

```bash
az deployment group create \
  --name pwssoDeploy \
  --resource-group policy \
  --template-file boxy.bicep
```

## Configure Networking App <--> DB

We need to talk to the DB and the easiest way is to just add the outbound IPs of the app to the DB firewall.

This take a lot of time by hand so I wrote a script to do it

```bash
sh network.sh
```
