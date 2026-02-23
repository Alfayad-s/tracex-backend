import { describe, it, expect } from 'vitest';
import { signUpSchema, signInSchema } from './auth.js';

describe('auth schemas', () => {
  describe('signUpSchema', () => {
    it('accepts valid email and password', () => {
      const result = signUpSchema.safeParse({
        body: { email: 'a@b.com', password: 'secret12' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
      const result = signUpSchema.safeParse({
        body: { email: 'a@b.com', password: 'short' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = signUpSchema.safeParse({
        body: { email: 'not-email', password: 'secret12' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = signUpSchema.safeParse({
        body: { email: 'a@b.com', password: '' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('accepts valid email and password', () => {
      const result = signInSchema.safeParse({
        body: { email: 'a@b.com', password: 'any' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = signInSchema.safeParse({
        body: { email: 'a@b.com', password: '' },
      });
      expect(result.success).toBe(false);
    });
  });
});
