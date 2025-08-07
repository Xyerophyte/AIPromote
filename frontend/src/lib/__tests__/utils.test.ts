import { cn } from '../utils';

describe('utils', () => {
  describe('cn (classname utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-6')).toBe('p-6'); // Later class should override
    });

    it('should handle object-style class definitions', () => {
      expect(cn({
        'active': true,
        'inactive': false,
        'base-class': true
      })).toBe('active base-class');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle empty/null/undefined values', () => {
      expect(cn(null, undefined, '', 'valid-class')).toBe('valid-class');
    });

    it('should merge complex Tailwind utility combinations', () => {
      // Test conflicting utilities are properly merged
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('text-center', 'font-bold', 'bg-blue-500')).toBe('text-center font-bold bg-blue-500');
    });

    it('should handle variant-based class merging', () => {
      const baseClasses = 'px-4 py-2 rounded';
      const variantClasses = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-200 text-gray-900',
        destructive: 'bg-red-500 text-white'
      };
      
      expect(cn(baseClasses, variantClasses.primary)).toBe('px-4 py-2 rounded bg-blue-500 text-white');
    });
  });
});
