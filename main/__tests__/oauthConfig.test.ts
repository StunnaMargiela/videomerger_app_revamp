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
});
