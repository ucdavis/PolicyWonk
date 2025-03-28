@description('Name of the existing App Service Plan to use.')
param servicePlanName string = 'Nibbler'

@description('Resource Group of the existing App Service Plan.')
param servicePlanResourceGroup string = 'service-plans-linux'

@description('Name for the Web App to create or update.')
param webAppName string = 'policywonk-prod-sso'

@description('Azure region for the Web App.')
param webAppLocation string = 'westus2'

@description('Container image name to run (including tag).')
param containerImage string = 'boxyhq/jackson:1.42.0'

// Create or update the Web App in this *resource group* deployment
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: webAppName
  location: webAppLocation
  properties: {
    // Reference plan in a different RG (same subscription)
    serverFarmId: resourceId(servicePlanResourceGroup, 'Microsoft.Web/serverfarms', servicePlanName)
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
    }
  }
}
