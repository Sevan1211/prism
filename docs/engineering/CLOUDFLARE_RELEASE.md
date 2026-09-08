# Cloudflare release operations

## Release path

The owner authorized the first public Cloudflare release on September 7, 2026.
The deployment target is **https://prism.sevanlewispayne.com**. Previous hosting
holds are superseded by that request; live acceptance still must be recorded.

Work is committed on `sevan-dev`, checked in a pull request, then merged to `main`.
The `quality` workflow checks Python, generated contracts, the React application,
account Worker contracts and native Cloudflare packaging. Only a successful
`main` push (or manually dispatched `main` run) reaches the production deployment
job. Pull requests and `sevan-dev` never deploy.

The production job builds with the live Clerk publishable key, rejects private
assets and development credentials, stamps `release.json` with the commit, applies
forward D1 migrations and deploys the Worker plus static assets. It refuses a stale
commit if `main` advanced. Deployments are serialized and are not interrupted by
new pushes. Post-deploy checks verify the commit, homepage, library route and
unauthenticated account boundary. A green build alone is not browser acceptance.

## Configuration

`wrangler.jsonc` owns the custom domain, private R2/D1 bindings, hourly account
cleanup, edge burst limiter, production origin and issuer. Wrangler provisions
the Worker custom-domain DNS and certificate. Clerk's authentication and mail
CNAME records are separate DNS records and must remain DNS-only.

GitHub repository variable:

- `VITE_CLERK_PUBLISHABLE_KEY`: live public frontend key.

GitHub `production` environment secret (deployment branch rule: `main` only):

- `CLOUDFLARE_API_TOKEN`: dedicated scoped deploy token; do not use a developer's
  short-lived Wrangler OAuth token. The account-owned token grants Workers Scripts
  Write and D1 Write on the account, and Workers Routes Write plus Zone Read only
  on `sevanlewispayne.com`. R2 file content
  is not sent through GitHub; runtime access comes from the private bucket binding.

Cloudflare Worker secret:

- `CLERK_SECRET_KEY`: live backend key. Never a `VITE_` value and never in Git.

Local development continues using `.env.local` and `.dev.vars`, both ignored.
The production CLI environment file is ignored and separate from the local app.
The old Sites adapter, manifest and plugin have been removed from the build.

## Identity and deletion

Production verification uses Clerk's SDK remote JWKS discovery instead of a
pinned development key. Requests require the exact issuer, origin, session subject,
expiry and completed session. Tokens with lifetimes above 120 seconds are rejected;
revocation is bounded by token expiry, not instantaneous. Signing-key cache refresh
is handled by the SDK. Every cloud object and revision also checks ownership.

Deleting a cloud library blocks writes immediately and purges files in bounded
batches. The hourly scheduled job resumes pending deletions and checks the identity
provider for deleted accounts. Only an authenticated provider 404 authorizes that
account cleanup; network/provider errors preserve data and retry later. The cleanup
retains minimal deletion receipts and does not erase copies on other devices.

## Cost and availability boundaries

The initial beta caps enrollment at 50 libraries and storage at 1 GB/account,
50 GB globally. Retained history and unfinished reservations count toward the
same allowance. Per-account API limits are 2,400/hour. A coarse pre-authentication
limit of 300/minute per connecting address at each Cloudflare edge reduces bursts;
shared networks may share it. It is not exact global accounting or a billing cap.

At 50 GB stored for a whole month, R2 storage alone was estimated at about $0.60
after its shared 10 GB free allowance. Actual account-wide operations, Worker CPU
and D1 usage must be observed after deployment. Hourly cleanup makes at most 50
identity lookups per run. No paid subscription has been activated by this release
preparation. Service quotas can stop cloud transfers; local files remain available.

## First hosted acceptance

Before calling the public beta fully working, record:

1. GitHub commit, successful quality/deploy run, Worker version and HTTPS/DNS state.
2. Production username/password, Google and recovery in a supported browser.
3. Empty library on a fresh browser; local import and direct Reader route reload.
4. Synthetic PDF/lesson/folder/revision transfer across two separate browser caches,
   including saved reading position, interrupted transfer, conflict and sign-out.
5. Account isolation, explicit agent grants and confirmed cloud deletion.
6. Deployed CPU and storage/operation observations; limits and any remaining risks.

## Rollback and recovery

For a bad frontend/Worker release, use Cloudflare's previous known-good Worker
version, then revert the faulty change through `sevan-dev` and a pull request.
Do not automatically roll back D1 migrations: they may contain new user data or be
incompatible with old code. Use additive migrations and review compatibility.
Restore normal CI deployment after fixing the regression; its next successful
`main` run becomes authoritative. A failed smoke check marks deployment failed,
but does not pretend the uploaded version was rolled back.

References: [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/),
[custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[Clerk production setup](https://clerk.com/docs/guides/development/deployment/production).
