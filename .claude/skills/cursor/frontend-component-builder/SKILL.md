# Frontend Component Builder

## Triggers
- User wants to create React/UI components
- User says "create component", "build UI", "React component", "make a button"

## What It Does

### Component Generation
```
UI REQUIREMENT
        ↓
1. DESIGN COMPONENT
   → Props interface
   → State management
   → Lifecycle
   → Accessibility
        ↓
2. BUILD COMPONENT
   → JSX structure
   → Styles (Tailwind/inline)
   → Event handlers
   → Conditional rendering
        ↓
3. ADD TESTS
   → Unit tests
   → Interaction tests
   → Accessibility tests
        ↓
OUTPUT: Production-ready component
```

### Output Format
```typescript
// src/components/{ComponentName}.tsx
import React from 'react';

interface {ComponentName}Props {
  /** Primary content */
  children: React.ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function {ComponentName}({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  className = '',
}: {ComponentName}Props) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
```

## Commands
| Command | Action |
|---------|--------|
| `create component` | Full component |
| `make button` | Simple button |
| `make form` | Form component |
| `make modal` | Modal/dialog |
