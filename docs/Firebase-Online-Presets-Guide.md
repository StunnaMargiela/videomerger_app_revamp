# Firebase Guide: Online YouTube Presets

This guide defines a Firebase-ready structure for syncing YouTube defaults and quick presets per Google account.

## Goals

- Keep each user's presets private and account-scoped.
- Support save/load from multiple devices.
- Preserve compatibility with current local `youtubeOnlinePresetsByUser` storage.

## Recommended Firebase Services

- Authentication: Firebase Auth with Google provider.
- Database: Cloud Firestore.
- Optional: Cloud Functions for validation/migrations.

## Auth Mapping

- Sign in users with Google OAuth via Firebase Auth.
- Use Firebase `uid` as the canonical document key.
- Store email as denormalized metadata only.

## Firestore Data Model

Collection path:

- `users/{uid}/youtube/presets`

Document shape (`users/{uid}/youtube/presets/default`):

```json
{
  "userEmail": "creator@example.com",
  "updatedAt": "2026-03-16T14:20:00.000Z",
  "defaults": {
    "ytDefaultTitle": "",
    "ytDefaultDescription": "",
    "ytDefaultPrivacy": "private",
    "ytDefaultCategoryId": "22",
    "ytDefaultTags": "",
    "ytDefaultLanguage": "en",
    "ytDefaultMadeForKids": false,
    "ytDefaultNotifySubscribers": true,
    "ytDefaultLicense": "youtube",
    "ytDefaultEmbeddable": true,
    "ytDefaultPublicStatsViewable": true
  },
  "presets": [
    {
      "name": "Weekly Highlights",
      "title": "Weekly Highlights",
      "description": "Top moments of the week",
      "privacy": "unlisted",
      "categoryId": "24",
      "tags": "weekly,highlights",
      "defaultLanguage": "en",
      "madeForKids": false,
      "notifySubscribers": true,
      "license": "youtube",
      "embeddable": true,
      "publicStatsViewable": true
    }
  ],
  "schemaVersion": 1
}
```

## Security Rules (Starter)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/youtube/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Save Flow

1. Renderer gathers `defaults` + `ytQuickPresets`.
2. Main process validates shape and required fields.
3. Write to `users/{uid}/youtube/presets/default`.
4. Return server timestamp to renderer for status message.

## Load Flow

1. Main process reads `users/{uid}/youtube/presets/default`.
2. If missing, return empty defaults/presets.
3. Normalize values to local schema.
4. Renderer updates settings form and quick preset list.

## Validation Notes

- `privacy`: `private | unlisted | public`
- `license`: `youtube | creativeCommon`
- `name` is required for each preset.
- Keep max preset count bounded (for example 100) to avoid oversized documents.

## Migration Strategy

- Current local key: `youtubeOnlinePresetsByUser[email]`.
- On first Firebase sign-in:
  - read local account record,
  - write to Firestore if remote doc is missing,
  - mark `schemaVersion`.
- Keep local cache for offline fallback.

## Suggested IPC Contract

- `youtube-online-presets-save`: accepts `{ defaults, presets }`, returns `{ success, updatedAt }`.
- `youtube-online-presets-load`: returns `{ success, defaults, presets, updatedAt }`.

The current desktop implementation already follows this contract, so backend storage can be switched from Electron Store to Firestore with minimal renderer change.
