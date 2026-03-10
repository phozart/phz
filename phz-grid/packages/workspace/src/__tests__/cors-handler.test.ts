import { describe, it, expect } from 'vitest';
import {
  diagnoseCORSError,
  type CORSDiagnosis,
} from '../adapters/cors-handler.js';

describe('CORS Handler', () => {
  describe('diagnoseCORSError', () => {
    it('diagnoses a TypeError (network error) as likely CORS', () => {
      const error = new TypeError('Failed to fetch');
      const diagnosis = diagnoseCORSError(error, 'https://external-api.com/data');

      expect(diagnosis.isCORS).toBe(true);
      expect(diagnosis.url).toBe('https://external-api.com/data');
      expect(diagnosis.resolutions).toContain('download-manually');
      expect(diagnosis.resolutions).toContain('configure-server');
      expect(diagnosis.message).toBeTruthy();
    });

    it('diagnoses TypeError with "NetworkError" message', () => {
      const error = new TypeError('NetworkError when attempting to fetch resource');
      const diagnosis = diagnoseCORSError(error, 'https://api.example.com');

      expect(diagnosis.isCORS).toBe(true);
    });

    it('diagnoses generic Error with CORS keyword', () => {
      const error = new Error('CORS policy: No Access-Control-Allow-Origin header');
      const diagnosis = diagnoseCORSError(error, 'https://api.example.com');

      expect(diagnosis.isCORS).toBe(true);
      expect(diagnosis.resolutions).toContain('configure-server');
    });

    it('returns isCORS false for non-CORS errors', () => {
      const error = new Error('Timeout exceeded');
      const diagnosis = diagnoseCORSError(error, 'https://api.example.com');

      expect(diagnosis.isCORS).toBe(false);
      expect(diagnosis.url).toBe('https://api.example.com');
    });

    it('returns isCORS false for null error', () => {
      const diagnosis = diagnoseCORSError(null, 'https://api.example.com');
      expect(diagnosis.isCORS).toBe(false);
    });

    it('includes use-local-server resolution for localhost/127.0.0.1', () => {
      const error = new TypeError('Failed to fetch');
      const diag1 = diagnoseCORSError(error, 'http://localhost:3000/data');
      expect(diag1.resolutions).not.toContain('use-local-proxy');

      const diag2 = diagnoseCORSError(error, 'https://external-api.com/data');
      expect(diag2.resolutions).toContain('use-local-proxy');
    });

    it('provides human-readable message', () => {
      const error = new TypeError('Failed to fetch');
      const diagnosis = diagnoseCORSError(error, 'https://api.example.com/data');

      expect(diagnosis.message).toContain('CORS');
      expect(typeof diagnosis.message).toBe('string');
      expect(diagnosis.message.length).toBeGreaterThan(10);
    });

    it('CORSDiagnosis has expected shape', () => {
      const diagnosis: CORSDiagnosis = {
        isCORS: true,
        url: 'https://example.com',
        message: 'CORS error',
        resolutions: ['download-manually', 'configure-server'],
      };
      expect(diagnosis.resolutions).toHaveLength(2);
    });

    it('handles DOMException with AbortError (not CORS)', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      const diagnosis = diagnoseCORSError(error, 'https://api.example.com');

      expect(diagnosis.isCORS).toBe(false);
    });
  });
});
