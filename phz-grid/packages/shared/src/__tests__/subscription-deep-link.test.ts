/**
 * Tests for Subscription Deep Link helper (C-2.07)
 *
 * Verifies the existing buildSubscriptionDeepLink function works correctly,
 * including URL parameter encoding and edge cases.
 */
import { describe, it, expect } from 'vitest';
import { buildSubscriptionDeepLink } from '@phozart/phz-shared/types';

describe('buildSubscriptionDeepLink', () => {
  it('builds a basic deep link', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub_123');
    expect(url).toBe('https://app.example.com/subscriptions?id=sub_123');
  });

  it('includes artifactId when provided', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub_123', 'report_456');
    expect(url).toContain('id=sub_123');
    expect(url).toContain('artifactId=report_456');
  });

  it('strips trailing slashes from base URL', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com///', 'sub_1');
    expect(url).toMatch(/^https:\/\/app\.example\.com\/subscriptions\?/);
  });

  it('encodes special characters in subscription ID', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub id&foo=bar');
    expect(url).toContain('id=sub+id%26foo%3Dbar');
  });

  it('handles empty artifactId', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com', 'sub_1', '');
    // Empty string is falsy, so no artifactId param
    expect(url).not.toContain('artifactId');
  });

  it('works with localhost URLs', () => {
    const url = buildSubscriptionDeepLink('http://localhost:3000', 'sub_1');
    expect(url).toBe('http://localhost:3000/subscriptions?id=sub_1');
  });

  it('works with base path', () => {
    const url = buildSubscriptionDeepLink('https://app.example.com/workspace', 'sub_1');
    expect(url).toBe('https://app.example.com/workspace/subscriptions?id=sub_1');
  });
});
