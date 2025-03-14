// Parameters for customization
param acrRepository string = 'policywonk' // Repository name in ACR for the image
param acrTag string = 'latest' // Tag of the image to deploy
param webAppLocation string = 'westus2' // Location for the web app

// Existing App Service Plan parameters
param appServicePlanName string = 'Nibbler'
param appServicePlanResourceGroup string = 'service-plans-linux'

// Container Registry resource in the current resource group ("policy")
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'PolicyWonkContainers'
  location: resourceGroup().location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Retrieve ACR credentials via listCredentials and assign to a variable
var acrCreds = acr.listCredentials()

// Reference to the existing App Service Plan in another resource group
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' existing = {
  name: appServicePlanName
  scope: resourceGroup(appServicePlanResourceGroup)
}

// Web App resource that will run the container from ACR
resource webApp 'Microsoft.Web/sites@2021-03-01' = {
  name: 'policywonk'
  location: webAppLocation
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      // Specify the container image in the format: DOCKER|<loginServer>/<repository>:<tag>
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/${acrRepository}:${acrTag}'
    }
  }
}

// Web App configuration resource for app settings (runs as a separate resource)
resource webAppSettings 'Microsoft.Web/sites/config@2021-03-01' = {
  parent: webApp
  name: 'appsettings'
  properties: {
    DOCKER_REGISTRY_SERVER_URL: 'https://${acr.properties.loginServer}'
    DOCKER_REGISTRY_SERVER_USERNAME: acrCreds.username
    DOCKER_REGISTRY_SERVER_PASSWORD: acrCreds.passwords[0].value
  }
}
