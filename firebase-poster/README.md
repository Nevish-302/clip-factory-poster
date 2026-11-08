# Firebase poster (isolated)

Replaces the GitHub Actions job (`.github/workflows/post.yml`), which is blocked by a GitHub billing lock.
One scheduled function, `clipPosterTick`, in its own codebase `poster` inside project `gymapp-c9c34`.

## Isolation (why it cannot touch the app)
- Lives outside the app repo, with its own `firebase.json`. The app's `firebase deploy` never includes it; this one deploys only `functions:poster`.
- Imports nothing from the app. Own bucket `gs://gymapp-c9c34-clip-poster` (queue + clips), no Firestore, no app Storage bucket.
- Own secret `CLIP_META_ACCESS_TOKEN` (not the app's Meta secrets) and own service account `clip-poster` with access to that bucket and that secret only.
- `maxInstances 1`, `retryCount 0`, never throws. Name `clipPosterTick` does not collide with any app function.

## Activation (nothing below has been run yet)
1. `gcloud storage buckets create gs://gymapp-c9c34-clip-poster --project gymapp-c9c34 --location us-central1 --uniform-bucket-level-access`
2. `gcloud iam service-accounts create clip-poster --project gymapp-c9c34`; grant it `roles/storage.objectAdmin` on that bucket only, and `roles/secretmanager.secretAccessor` on the secret only (step 3).
3. `security find-generic-password -a clipfactory -s META_ACCESS_TOKEN -w | firebase functions:secrets:set CLIP_META_ACCESS_TOKEN --data-file - --project gymapp-c9c34`
4. Create `functions/.env` (git-ignored): `CLIP_META_PAGE_ID=1397014833495300` and `CLIP_META_IG_USER_ID=17841417343562675`.
5. `node sync.mjs push` (uploads unposted clips and queue.json).
6. `firebase deploy --only functions:poster --project gymapp-c9c34` (from this folder), then turn the GitHub schedule off (do not run both).

## Daily use
`node sync.mjs pull` -> `node add-batch.mjs ...` -> `node sync.mjs push`. The function owns results; never edit a queue.json that is older than the bucket's.

## Test
`cd functions && npm test` (fake store and fake Meta, no network).
