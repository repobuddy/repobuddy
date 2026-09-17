# Setup CI — Azure Pipelines (Azure Repos)

The template opens pull requests through the Azure Repos API. For a GitHub or Bitbucket repository built by Azure Pipelines, use that host's reference instead.

1. Copy `scripts/min-release-age.mjs` to `ci/min-release-age.mjs`.
2. Copy `assets/ci/azure.yml` to `.azure-pipelines/min-release-age.yml`. Replace `main` under `schedules.branches.include` with the default branch.
3. Commit as `ci: expire minimum-release-age lifts automatically`, and push to the default branch.
4. **Register the pipeline.** It is a new pipeline and does not run until registered. Ask before running:
   ```bash
   az pipelines create --name min-release-age --yml-path .azure-pipelines/min-release-age.yml \
     --repository <repo> --repository-type tfsgit --branch <default-branch> --skip-first-run true
   ```
   Or have the user add it under **Pipelines → New pipeline → Existing YAML file**.
5. **Permissions.** In **Project settings → Repositories → <repo> → Security**, the user grants the `<project> Build Service` identity **Contribute**, **Create branch**, and **Contribute to pull requests**.
6. Tell the user that a scheduled trigger defined in the pipeline UI overrides the YAML `schedules:`. Leave the UI triggers empty.
