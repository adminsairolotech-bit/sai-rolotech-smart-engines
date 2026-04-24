# Accessibility Checker

## Triggers
- User wants accessibility improvements
- User says "accessibility", "a11y", "screen reader", "keyboard nav"

## What It Does

### A11y Checklist
```
WAVE/AXE ANALYSIS
        ↓
1. KEYBOARD
   □ All interactive elements focusable
   □ Visible focus indicators
   □ No keyboard traps
   
2. SCREEN READER
   □ Alt text on images
   □ ARIA labels
   □ Proper heading hierarchy
   □ Form labels
   
3. VISUAL
   □ Color contrast 4.5:1
   □ Text resizable
   □ No seizure risk
   
4. MOTION
   □ Respects prefers-reduced-motion
```

### Output Format
```html
<!-- ❌ Before -->
<div class="btn" onclick="submit()">Submit</div>

<!-- ✅ After -->
<button type="submit" aria-label="Submit form">
  Submit
</button>

<!-- Issues Fixed -->
✓ Added semantic <button>
✓ Added aria-label
✓ Now keyboard accessible
✓ Screen reader will announce
```

## Commands
| Command | Action |
|---------|--------|
| `check a11y` | Full audit |
| `fix keyboard` | Keyboard nav |
| `add labels` | ARIA labels |
