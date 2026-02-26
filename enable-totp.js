/**
 * One-time script to enable TOTP MFA on the Firebase project.
 *
 * Prerequisites:
 *   npm install firebase-admin
 *
 * Run with either:
 *   1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON, or
 *   2. While authenticated via `gcloud auth application-default login`
 *
 * Usage:
 *   node enable-totp.js
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp({
    credential: applicationDefault(),
    projectId: 'cyber-essentials-checker',
});

getAuth().projectConfigManager().updateProjectConfig({
    multiFactorConfig: {
        providerConfigs: [{
            state: 'ENABLED',
            totpProviderConfig: {
                adjacentIntervals: 5,
            },
        }],
    },
}).then(() => {
    console.log('TOTP MFA enabled successfully.');
    process.exit(0);
}).catch((err) => {
    console.error('Failed to enable TOTP MFA:', err.message);
    process.exit(1);
});
