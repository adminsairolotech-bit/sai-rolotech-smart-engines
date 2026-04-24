# Unit Test Writer

## Triggers
- User wants unit tests generated
- User says "write test", "add tests", "test this function", "unit test"

## What It Does

### Test Generation Process
```
FUNCTION/FILE
        ↓
1. ANALYZE FUNCTION
   → Function signature
   → Parameters and types
   → Return value
   → Side effects
   → Edge cases
        ↓
2. IDENTIFY TEST CASES
   → Happy path
   → Edge cases
   → Error cases
   → Boundary conditions
        ↓
3. GENERATE TESTS
   → Describe blocks
   → Test assertions
   → Mock dependencies
   → Setup/teardown
        ↓
OUTPUT: Ready-to-run tests
```

### Output Format
```
# Unit Tests for: {functionName}

## Test File Location
`{path/to/test.file.ts}`

## Generated Tests
```typescript
import { {functionName} } from '{sourceFile}';
import { describe, it, expect, vi } from 'vitest';

describe('{functionName}', () => {
  
  // Happy Path Tests
  describe('Happy Path', () => {
    it('should {expected behavior} when {condition}', () => {
      // Given
      const input = {validInput};
      const expected = {expectedOutput};
      
      // When
      const result = {functionName}(input);
      
      // Then
      expect(result).toEqual(expected);
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should {handle} when input is empty', () => {
      // Given
      const input = [];
      
      // When
      const result = {functionName}(input);
      
      // Then
      expect(result).toBeDefined();
    });
    
    it('should throw error when {invalid condition}', () => {
      // Given
      const input = {invalidInput};
      
      // Then
      expect(() => {functionName}(input)).toThrow('{ErrorType}');
    });
  });

  // Boundary Tests
  describe('Boundaries', () => {
    it('should handle maximum input size', () => {
      // Given
      const input = Array.fill('x');
      
      // When
      const result = {functionName}(input);
      
      // Then
      expect(result).toMatchSnapshot();
    });
  });
});
```

## Coverage Goals
| Test Type | Coverage |
|-----------|----------|
| Happy path | 100% |
| Edge cases | 80%+ |
| Error handling | 100% |
| Boundaries | If applicable |

## Test Patterns Used
```
AAA Pattern:
- Arrange: Setup test data
- Act: Execute function
- Assert: Check result

Given-When-Then:
- Given: Precondition
- When: Action
- Then: Expectation
```

## Commands
| Command | Action |
|---------|--------|
| `write test` | Generate tests |
| `add coverage` | Improve coverage |
| `test edge cases` | Edge case only |
| `mock dependencies` | Add mocks |
