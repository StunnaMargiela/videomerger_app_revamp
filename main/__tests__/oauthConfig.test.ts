import { describe, expect, it } from 'vitest';
import { getGoogleOAuthConfig } from '../oauthConfig';

describe('getGoogleOAuthConfig', () => {
  it('returns config when env vars are present', () => {
    const config = getGoogleOAuthConfig({
      GOOGLE_CLIENT_ID: 'id-123',
      GOOGLE_CLIENT_SECRET: 'secret-456',
      GOOGLE_REDIRECT_URI: 'http://localhost:8976/oauth2callback',
    } as any);

    expect(config.clientId).toBe('id-123');
    expect(config.clientSecret).toBe('secret-456');
    expect(config.redirectUri).toBe('http://localhost:8976/oauth2callback');
  });

  it('throws when required env vars are missing', () => {
    expect(() => getGoogleOAuthConfig({} as any)).toThrow(/Google OAuth is not configured/i);
  });

  it('loads from inline GOOGLE_OAUTH_CLIENT_JSON when env vars are absent', () => {
    const config = getGoogleOAuthConfig({
      GOOGLE_OAUTH_CLIENT_JSON: JSON.stringify({
        installed: {
          client_id: 'json-client-id',
          client_secret: 'json-client-secret',
          redirect_uris: ['http://localhost:8976/oauth2callback'],
        },
      }),
    } as any);

    expect(config.clientId).toBe('json-client-id');
    expect(config.clientSecret).toBe('json-client-secret');
    expect(config.redirectUri).toBe('http://localhost:8976/oauth2callback');
  });
});
