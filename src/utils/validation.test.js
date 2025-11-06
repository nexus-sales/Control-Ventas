import { describe, it, expect } from 'vitest';
import { 
  sanitizeString, 
  sanitizeEmail, 
  sanitizeNumber,
  validateEmail,
  validatePassword,
  validateSchema,
  sanitizeAndValidate
} from './validation';
import { ValidationError } from './errorHandler';

describe('Validation Utils', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });

    it('should limit length to 1000 chars', () => {
      const longString = 'a'.repeat(2000);
      expect(sanitizeString(longString)).toHaveLength(1000);
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should trim and lowercase email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should limit length to 254 chars', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(sanitizeEmail(longEmail)).toHaveLength(254);
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('123.45')).toBe(123.45);
    });

    it('should return default value for invalid input', () => {
      expect(sanitizeNumber('abc', 0)).toBe(0);
      expect(sanitizeNumber(null, 10)).toBe(10);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow();
      expect(() => validateEmail('user.name+tag@example.co.uk')).not.toThrow();
    });

    it('should reject invalid emails', () => {
      expect(() => validateEmail('invalid')).toThrow(ValidationError);
      expect(() => validateEmail('@example.com')).toThrow(ValidationError);
      expect(() => validateEmail('test@')).toThrow(ValidationError);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(() => validatePassword('Abcd1234')).not.toThrow();
    });

    it('should reject short passwords', () => {
      expect(() => validatePassword('Ab1')).toThrow(ValidationError);
    });

    it('should reject passwords without uppercase', () => {
      expect(() => validatePassword('abcd1234')).toThrow(ValidationError);
    });

    it('should reject passwords without lowercase', () => {
      expect(() => validatePassword('ABCD1234')).toThrow(ValidationError);
    });

    it('should reject passwords without numbers', () => {
      expect(() => validatePassword('Abcdabcd')).toThrow(ValidationError);
    });

    it('should respect custom options', () => {
      expect(() => validatePassword('abcd', { minLength: 4, requireUppercase: false, requireNumbers: false }))
        .not.toThrow();
    });
  });

  describe('validateSchema', () => {
    const schema = {
      name: { required: true, type: 'string', minLength: 2 },
      age: { required: true, type: 'number', min: 0, max: 120 },
      email: { required: false, type: 'string' },
    };

    it('should accept valid data', () => {
      const data = { name: 'John', age: 30 };
      expect(() => validateSchema(data, schema)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const data = { age: 30 };
      expect(() => validateSchema(data, schema)).toThrow(ValidationError);
    });

    it('should reject invalid types', () => {
      const data = { name: 'John', age: 'thirty' };
      expect(() => validateSchema(data, schema)).toThrow(ValidationError);
    });

    it('should reject values outside range', () => {
      const data = { name: 'John', age: 150 };
      expect(() => validateSchema(data, schema)).toThrow(ValidationError);
    });

    it('should reject strings shorter than minLength', () => {
      const data = { name: 'J', age: 30 };
      expect(() => validateSchema(data, schema)).toThrow(ValidationError);
    });
  });

  describe('sanitizeAndValidate', () => {
    it('should sanitize and validate producto', () => {
      const input = {
        nombre: '  Test Product  ',
        operador_id: 'op-123',
        comision_base: 15.5,
        activo: true,
      };

      const result = sanitizeAndValidate(input, 'producto');
      expect(result.nombre).toBe('Test Product');
      expect(result.comision_base).toBe(15.5);
      expect(result.activo).toBe(true);
    });

    it('should throw on invalid producto', () => {
      const input = {
        nombre: 'T',
        operador_id: 'op-123',
        comision_base: -5,
        activo: true,
      };

      expect(() => sanitizeAndValidate(input, 'producto')).toThrow(ValidationError);
    });
  });
});
