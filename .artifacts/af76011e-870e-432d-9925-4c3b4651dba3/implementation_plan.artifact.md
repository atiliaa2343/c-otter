# Fix Health API Integration and Backend Errors

This plan addresses the Metro resolution error for `expo-healthkit` and ensures the backend doesn't crash or return errors when a database is missing.

## Proposed Changes

### [Frontend] Health Service Refactoring

#### [MODIFY] [health.ts](file:///C:/Users/chasz/Downloads/PNIRD/Otter_App/c-otter/services/health.ts)
- Remove top-level `import * as HealthKit from 'expo-healthkit'`.
- Use `require('expo-healthkit')` inside platform-specific blocks to prevent Android build failures.
- Add error handling for cases where the module is missing.

#### [MODIFY] [app.json](file:///C:/Users/chasz/Downloads/PNIRD/Otter_App/c-otter/app.json)
- Fix the `permissions` array for Android. `android.health.HealthPermission` is incorrect.
- Add correct Health Connect permissions (e.g., `android.permission.health.READ_STEPS`).

### [Backend] Health Sync Robustness

#### [MODIFY] [index.js](file:///C:/Users/chasz/Downloads/PNIRD/Otter_App/c-otter/backend/index.js)
- Update `/api/health/sync` to use `loadSample`/`saveSample` logic as a fallback if MongoDB is not connected.
- Create a `health_data.json` file to store synced data locally for mock testing.

## Verification Plan

### Automated Tests
- Run `expo start` and verify Metro no longer fails with "Unable to resolve module".
- Trigger a sync from the app and check if `backend/health_data.json` is created.

### Manual Verification
- Verify the "Sync Health Data" button in the UI doesn't show a 500 error.
- Check that the backend console logs "Health data synced locally (no DB)".
