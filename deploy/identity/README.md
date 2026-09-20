# Moving deployment and image pulls to identities

Most of this migration can be automated. Bicep manages Azure identities, role assignments, and federated credentials. Azure DevOps service-connection configuration is a separate API/CLI operation. The existing ARM connections were created manually, so Azure DevOps' automatic conversion option does not apply.

The templates here prepare new identities alongside existing connections. They do not change running web apps, workers, pipeline references, existing secrets, or the registry's admin setting.

## What the Bicep creates

Deploy `main.bicep` into each environment's existing resource group:

- A `policywonk-<environment>-pull` user-assigned identity with `AcrPull` on the shared production registry.
- A `policywonk-<environment>-deploy` user-assigned identity with Contributor on that application's resource group.
- Optionally, a federated credential on the deployment identity using the exact issuer and subject returned by Azure DevOps.

The registry role assignment is deployed through a module into the production subscription. The bootstrap operator needs permission to create identities and grant these roles at both scopes. The runtime identity receives no database, search, or deployment permissions.

Validate with `az bicep build --file deploy/identity/main.bicep`. Review Azure what-if for test using:

```bash
az deployment group what-if   --subscription 105dede4-4731-492e-8c28-5121226319b0   --resource-group policywonk-dev   --template-file deploy/identity/main.bicep   --parameters environmentName=test
```

After approving the preview, `az deployment group create` with the same arguments provisions the identities and grants. Use subscription `003283b1-cc5e-417a-b037-01ff3c05537b`, resource group `policy`, and `environmentName=prod` for production after validating test.

The test preview succeeds and leaves existing services unchanged. It reports the registry role assignment as unsupported because its name depends on the new identity's not-yet-created principal ID. Verify that cross-subscription grant after provisioning; a successful preview alone does not prove it.

## Staged cutover

1. Provision the test identities and save the deployment outputs. Keep the existing working credentials.
2. Create a new Azure Resource Manager service connection in the Policy Wonk project using workload identity federation and the new deployment identity's client ID. Scope it to the test resource group. This can use the Azure DevOps service-endpoint REST API or `az devops service-endpoint create` with a reviewed configuration file. Authorize only the two PolicyWonk pipelines.
3. Read the issuer and subject returned by that connection. Reapply the Bicep with both `federationIssuer` and `federationSubject`, then verify the connection. Do not assume the older `sc://` subject or issuer format.
4. Attach the pull identity to the test web app with `az webapp identity assign --identities <pullIdentityResourceId>`. Patch its container configuration using `acrUseManagedIdentityCreds=true` and `acrUserManagedIdentityID=<pullIdentityClientId>`. Preserve all other app settings. Ensure the registry accepts ARM-audience tokens and allow role-assignment propagation.
5. Change the test worker deployment to pass `--assign-identity <pullIdentityResourceId>` and `--acr-identity <pullIdentityResourceId>` instead of registry username/password. ACI uses the identity's resource ID; App Service's `acrUserManagedIdentityID` uses its client ID.
6. Update only the test pipeline service-connection references. Deploy and verify actual container pulls, dependency readiness, sign-in/chat, and controlled ingestion.
7. Repeat the reviewed cutover for production through its normal approval process.
8. Remove obsolete runtime registry credentials and retire old ARM connections only after verifying all consumers. Other legacy resources exist in the `policy` group; inventory them before disabling the registry admin account or revoking shared credentials.

The existing ACR pipeline push connection already uses federation and can remain in place. Changes to the runtime identity and deployment identity are independent of that build connection.

## References

- [Azure Pipelines federation and conversion requirements](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/connect-to-azure?view=azure-devops)
- [App Service managed-identity image pulls](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container?pivots=container-linux#use-managed-identity-to-pull-an-image-from-azure-container-registry)
- [ACI managed-identity image pulls](https://learn.microsoft.com/en-us/azure/container-instances/using-azure-container-registry-mi)
