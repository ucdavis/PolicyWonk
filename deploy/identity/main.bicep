@description('Deploy to the existing policywonk-dev or policy resource group in its own subscription.')
@allowed(['test', 'prod'])
param environmentName string

param location string = resourceGroup().location
param registrySubscriptionId string = '003283b1-cc5e-417a-b037-01ff3c05537b'
param registryResourceGroup string = 'policy'
param registryName string = 'PolicyWonkContainers'

@description('Copy the issuer returned by the new Azure DevOps federation service connection. Leave both federation parameters empty for initial identity creation.')
param federationIssuer string = ''
@description('Copy the subject returned by the new Azure DevOps federation service connection. Do not construct or guess this value.')
param federationSubject string = ''

resource pullIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'policywonk-${environmentName}-pull'
  location: location
}

resource deploymentIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'policywonk-${environmentName}-deploy'
  location: location
}

resource federation 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = if (!empty(federationIssuer) && !empty(federationSubject)) {
  parent: deploymentIdentity
  name: 'azure-pipelines'
  properties: {
    issuer: federationIssuer
    subject: federationSubject
    audiences: ['api://AzureADTokenExchange']
  }
}

// Deployment access is limited to this application's resource group.
resource deploymentAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, deploymentIdentity.id, 'contributor')
  properties: {
    principalId: deploymentIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c')
  }
}

module registryAccess './registry-pull.bicep' = {
  name: 'policywonk-${environmentName}-registry-pull'
  scope: resourceGroup(registrySubscriptionId, registryResourceGroup)
  params: {
    registryName: registryName
    principalId: pullIdentity.properties.principalId
  }
}

output pullIdentityResourceId string = pullIdentity.id
output pullIdentityClientId string = pullIdentity.properties.clientId
output deploymentIdentityResourceId string = deploymentIdentity.id
output deploymentIdentityClientId string = deploymentIdentity.properties.clientId
output tenantId string = tenant().tenantId
