# Deploy from Azure DevOps to Azure Static Web Apps

Azure DevOps has no built-in static hosting. Deploy to Azure Static Web Apps from an Azure Pipeline with
the `AzureStaticWebApp@0` task. This needs an Azure subscription. Requires `az`, logged in; the
`azure-devops` extension is needed to set the pipeline secret.

Reference: [AzureStaticWebApp@0](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/azure-static-web-app-v0?view=azure-pipelines),
[`az staticwebapp`](https://learn.microsoft.com/en-us/cli/azure/staticwebapp?view=azure-cli-latest).

## Create the Static Web App

Ask the user for the subscription, the resource group, and the app name. Creating the resource can cost
money on paid tiers, so confirm before running:

```bash
az staticwebapp create --name <APP_NAME> --resource-group <RESOURCE_GROUP> --sku Free
```

Skip this if the app exists (`az staticwebapp show --name <APP_NAME> --resource-group <RESOURCE_GROUP>`).

## Base path

A Static Web App serves the site at the root of its own domain, so `BASE` is `/`.

```bash
az staticwebapp show --name <APP_NAME> --resource-group <RESOURCE_GROUP> --query defaultHostname -o tsv
```

`SITE_URL` is `https://` followed by that hostname, or `https://<domain>` when a custom domain is bound.

## Deployment token

The pipeline authenticates with the app's deployment token. Store it as a secret pipeline variable named
`deployment_token`, and never commit it:

```bash
az staticwebapp secrets list --name <APP_NAME> --resource-group <RESOURCE_GROUP> --query properties.apiKey -o tsv
```

Do not print the token in the conversation. Pipe it into
`az pipelines variable create --name deployment_token --secret true --pipeline-name <PIPELINE> --value "$(…)"`
once the pipeline exists, or ask the user to add it in the pipeline's variables UI.

## Pipeline

Add a job to `azure-pipelines.yml`. Merge it in if the file exists.

```yaml
trigger:
  branches:
    include: [<DEFAULT_BRANCH>]
  paths:
    include:
      - <SITE_DIR>
      - azure-pipelines.yml

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self
  - task: UseNode@1
    inputs:
      version: '<NODE_VERSION>'
  # <PACKAGE_MANAGER_SETUP>: `- script: corepack enable` for pnpm or yarn
  - script: <INSTALL_CMD>
  - script: <BUILD_CMD>
  - task: AzureStaticWebApp@0
    inputs:
      app_location: <DIST_DIR>
      output_location: ''
      skip_app_build: true
      skip_api_build: true
      azure_static_web_apps_api_token: $(deployment_token)
```

- Leave out `paths` when the site is the whole repo.
- The task runs only on Linux agents.
- `skip_app_build: true` deploys the output the pipeline already built. `output_location` must then be
  empty.

If the repo has no pipeline yet, create one from the file with
`az pipelines create --name <PIPELINE> --yaml-path azure-pipelines.yml`, then add the secret.

## Check

After the first run, open `SITE_URL` and check that the page loads with its CSS.
