# Deploying the API to Cloud Run

`.github/workflows/deploy-cloud-run.yml` builds the Dockerfile, pushes the image to Artifact
Registry and rolls it out to Cloud Run. `ci.yml` calls it after `verify` passes on a push to
`develop`, `UAT` or `main`; it can also be run by hand from the Actions tab.

| Branch    | GitHub Environment | Suggested service |
| --------- | ------------------ | ----------------- |
| `develop` | `qa`               | `advisory-api-qa` |
| `UAT`     | `uat`              | `advisory-api-uat` |
| `main`    | `production`       | `advisory-api`    |

The workflow never migrates Supabase. Run `pnpm db:migrate` yourself, against the session
pooler URL, before deploying a release that adds a migration.

## One-time Google Cloud setup

Billing must be enabled on the project first — Cloud Run refuses to deploy without it, even
inside the free tier. Then, with `gcloud` signed in as a project owner:

```sh
PROJECT_ID=project-bb9b4669-b5d3-4263-8b3
REGION=asia-southeast1
REPO=SmartYoungImmortal/AdvisoryPlatformAPI
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  --project "$PROJECT_ID"

# Where the images go.
gcloud artifacts repositories create advisory --repository-format=docker \
  --location "$REGION" --project "$PROJECT_ID"

# The identity the running container uses: it only reads its own secrets.
gcloud iam service-accounts create advisory-api-runtime --project "$PROJECT_ID"
RUNTIME_SA=advisory-api-runtime@$PROJECT_ID.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:$RUNTIME_SA" --role roles/secretmanager.secretAccessor

# The identity GitHub Actions deploys as.
gcloud iam service-accounts create github-deployer --project "$PROJECT_ID"
DEPLOY_SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com
for role in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member "serviceAccount:$DEPLOY_SA" --role "$role"
done
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member "serviceAccount:$DEPLOY_SA" --role roles/iam.serviceAccountUser --project "$PROJECT_ID"

# Workload Identity Federation: only this repository may assume the deployer.
gcloud iam workload-identity-pools create github --location global --project "$PROJECT_ID"
gcloud iam workload-identity-pools providers create-oidc github-actions \
  --location global --workload-identity-pool github --project "$PROJECT_ID" \
  --issuer-uri https://token.actions.githubusercontent.com \
  --attribute-mapping 'google.subject=assertion.sub,attribute.repository=assertion.repository' \
  --attribute-condition "assertion.repository == '$REPO'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" --project "$PROJECT_ID" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"
```

### Secrets

One set per environment, named `<SECRET_PREFIX>-<name>`. Type each value yourself — never
paste it into a file that could be committed. For the `qa` environment:

```sh
for name in database-url better-auth-secret omise-public-key omise-secret-key \
            seaweedfs-access-key seaweedfs-secret-key; do
  printf 'qa-%s: ' "$name"; read -rs value; echo
  printf '%s' "$value" | gcloud secrets create "qa-$name" --data-file=- --project "$PROJECT_ID"
done
```

`database-url` is Supabase's **session** pooler string (port 5432), for the same reasons
`.env.example` gives. Add a new version later with `gcloud secrets versions add`.

### GitHub

Repository variable: `CLOUD_RUN_DEPLOY_ENABLED=true` — until it is set the deploy job is
skipped, so CI stays green before the setup above exists.

Variables on each Environment (`qa`, `uat`, `production`):

| Variable | Example (qa) |
| --- | --- |
| `GCP_PROJECT_ID` | `project-bb9b4669-b5d3-4263-8b3` |
| `GCP_REGION` | `asia-southeast1` |
| `ARTIFACT_REPOSITORY` | `advisory` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<number>/locations/global/workloadIdentityPools/github/providers/github-actions` |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `github-deployer@<project>.iam.gserviceaccount.com` |
| `GCP_RUNTIME_SERVICE_ACCOUNT` | `advisory-api-runtime@<project>.iam.gserviceaccount.com` |
| `CLOUD_RUN_SERVICE` | `advisory-api-qa` |
| `SECRET_PREFIX` | `qa` |
| `BETTER_AUTH_URL` | the service URL, known after the first deploy |
| `TRUSTED_ORIGINS` | `https://advisory-platform-qa.nsza.workers.dev` |
| `SEAWEEDFS_S3_ENDPOINT` / `_PORT` / `_USE_SSL` / `_BUCKET` / `_REGION` | the SeaweedFS gateway |
| `CURRENCY_CODE` (optional) | `thb` |
| `CLOUD_RUN_MAX_INSTANCES` (optional) | `2` |

## Before the frontend signs in against it

The frontend is served from `*.workers.dev` and the API from `*.run.app` — two different
sites. better-auth's session cookie is `SameSite=Lax` by default, so the browser will not
attach it to the frontend's `fetch` calls: sign-in appears to work and every request after it
is anonymous. `SameSite=None` would fix Chrome but not Safari, which blocks third-party cookies
outright — and the PWA is mostly used on phones. Put both behind one registrable domain
(`app.<domain>` and `api.<domain>` through Cloud Run domain mapping), or proxy `/api/*` from
the frontend's own origin, before wiring the screens to this API.
