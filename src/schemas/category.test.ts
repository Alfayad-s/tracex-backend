import { describe, it, expect } from 'vitest';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './category.js';

describe('category schemas', () => {
  describe('createCategorySchema', () => {
    it('accepts valid name only', () => {
      const result = createCategorySchema.safeParse({
        body: { name: 'Groceries' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts name, color, icon', () => {
      const result = createCategorySchema.safeParse({
        body: { name: 'Food', color: '#ff0000', icon: 'tag' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createCategorySchema.safeParse({
        body: { name: '' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects name over 100 chars', () => {
      const result = createCategorySchema.safeParse({
        body: { name: 'a'.repeat(101) },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('categoryIdParamSchema', () => {
    it('accepts valid UUID', () => {
      const result = categoryIdParamSchema.safeParse({
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID', () => {
      const result = categoryIdParamSchema.safeParse({
        params: { id: 'not-uuid' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCategorySchema', () => {
    it('accepts partial body and valid id', () => {
      const result = updateCategorySchema.safeParse({
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
        body: { name: 'Updated' },
      });
      expect(result.success).toBe(true);
    });
  });
});
