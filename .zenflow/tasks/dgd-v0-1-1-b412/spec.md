# Technical Specification: Refactor v0.1.0 to Dojo Genesis Design Language v2

**Task ID:** dgd-v0-1-1-b412  
**Version:** 1.0  
**Date:** January 23, 2026  
**Complexity:** Medium  
**Estimated Duration:** 16-24 hours

---

## 1. Overview

This specification outlines the work required to refactor the existing Dojo Genesis Desktop v0.1.0 codebase to fully comply with the **Dojo Genesis Design Language v2.0**. The design language, inspired by the official Dojo Genesis logo, emphasizes a nature-inspired, contemplative aesthetic with layered depth, warm accents on a cool base, and glassmorphism effects.

### Current State (v0.1.0)

The application currently has:
- **Backend**: Go 1.23 with Gin framework serving REST API
- **Frontend**: React 19 with Vite, TanStack Router, and Tailwind CSS 4
- **Partial design implementation**: Some design tokens exist but don't fully align with the v2 design language
- **Styling**: Uses custom theme.css and tailwind.config.js with some Dojo colors

### Target State (After Refactoring)

- **Complete design language alignment**: All colors, gradients, typography, and animations match the v2 spec exactly
- **Enhanced visual hierarchy**: Proper use of glassmorphism, depth layers, and warm/cool color balance
- **Nature-inspired animations**: All transitions use natural, organic easing functions
- **Consistent component styling**: All UI components follow the design system

---

## 2. Technical Context

### Technology Stack
- **Frontend Framework**: React 19.1.0
- **Build Tool**: Vite 6.3.5
- **CSS Framework**: Tailwind CSS 4.1.9
- **Styling**: CSS Variables + Tailwind utility classes
- **Typography**: Google Fonts (Inter, Outfit, JetBrains Mono)
- **Animation**: Framer Motion 12.17.0 + CSS transitions

### Key Files to Modify
- `app/ui/app/src/styles/theme.css` - Core CSS variables and design tokens
- `app/ui/app/tailwind.config.js` - Tailwind configuration and theme extension
- `app/ui/app/src/index.css` - Global styles and base typography
- `app/ui/app/index.html` - Font loading and base HTML
- `app/ui/app/src/components/ui/*.tsx` - UI component library
- `app/ui/app/src/components/trace/TraceNode.tsx` - Trail of Thought nodes

---

## 3. Design Language Analysis

### 3.1 Color Palette Discrepancies

**Current vs Target:**

| Element | Current (v0.1.0) | Target (v2.0) | Status |
|---------|------------------|---------------|--------|
| `--bg-primary` | #0a1e2e | #0a1e2e | ✅ Match |
| `--bg-secondary` | #0f2a3d | #0f2a3d | ✅ Match |
| `--bg-tertiary` | #1a3647 | #143847 | ❌ **Needs update** |
| `--accent-primary` | #f4a261 | #f4a261 | ✅ Match |
| `--accent-secondary` | #e76f51 | #e76f51 | ✅ Match |
| `--accent-tertiary` | #ffd166 | #ffd166 | ✅ Match |
| `--text-primary` | #ffffff | #ffffff | ✅ Match |
| `--text-secondary` | #b0c4de | #d4e4ed | ❌ **Needs update** |
| `--text-tertiary` | #8a9fb8 | #8aa8b8 | ✅ Match |
| Neutral colors | Missing | Required | ❌ **Needs addition** |

**Missing Variables:**
```css
--neutral-dark: #1a3a4a;
--neutral-mid: #4a6a7a;
--neutral-light: #8aa8b8;
```

### 3.2 Gradient System Discrepancies

**Current Gradients:**
- `--gradient-sunset` (exists but angle differs)
- `--gradient-ocean` (custom, not in v2 spec)
- `--gradient-glass` (custom, not in v2 spec)

**Target Gradients (v2.0):**
```css
--gradient-sunset: linear-gradient(135deg, #ffd166 0%, #f4a261 50%, #e76f51 100%);
--gradient-depth: linear-gradient(180deg, #0a1e2e 0%, #143847 100%);
--gradient-layers: linear-gradient(180deg, 
  rgba(138, 168, 184, 0.1) 0%, 
  rgba(74, 106, 122, 0.2) 50%, 
  rgba(26, 58, 74, 0.3) 100%);
```

**Action Required:**
- Update `--gradient-sunset` to match exact spec (different color order)
- Replace `--gradient-ocean` with `--gradient-depth`
- Replace `--gradient-glass` with `--gradient-layers`

### 3.3 Typography System

**Current Fonts:**
- Sans: Inter (✅ Correct)
- Mono: JetBrains Mono (✅ Correct)
- Missing: **Outfit** (accent font for brand elements)

**Type Scale (Missing):**
The design language specifies a complete type scale:
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

**Action Required:**
- Add Outfit font to `index.html` via Google Fonts
- Define `--font-accent` variable
- Add complete type scale to theme.css

### 3.4 Animation System

**Current Easing:**
- `--ease-natural`: cubic-bezier(0.4, 0, 0.2, 1) ✅
- `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55) ✅

**Missing from v2 spec:**
```css
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

**Duration Variables:**
- Current: `--duration-fast`, `--duration-normal`, `--duration-slow`
- Target (v2): `--duration-fast`, `--duration-base`, `--duration-slow`

**Action Required:**
- Add missing easing functions
- Rename `--duration-normal` to `--duration-base`

---

## 4. Implementation Plan

### Phase 1: Core Design Tokens (4-6 hours)

**Task 1.1: Update CSS Variables in `theme.css`**
- Fix `--bg-tertiary` color: `#1a3647` → `#143847`
- Fix `--text-secondary` color: `#b0c4de` → `#d4e4ed`
- Add neutral color variables:
  - `--neutral-dark: #1a3a4a`
  - `--neutral-mid: #4a6a7a`
  - `--neutral-light: #8aa8b8`
- Update gradient definitions:
  - Fix `--gradient-sunset` color order
  - Rename and update `--gradient-ocean` → `--gradient-depth`
  - Rename and update `--gradient-glass` → `--gradient-layers`
- Add missing easing functions
- Rename `--duration-normal` to `--duration-base`
- Add complete type scale variables

**Task 1.2: Update Tailwind Config**
- Update `tailwind.config.js` to match new color values
- Add neutral color variants to Tailwind theme
- Update gradient utilities to use new gradient definitions

**Task 1.3: Add Outfit Font**
- Add Google Fonts link in `index.html` for Outfit font
- Define `--font-accent: 'Outfit', 'Inter', sans-serif;` in theme.css
- Add `font-accent` utility to Tailwind config

### Phase 2: Component Refactoring (6-8 hours)

**Task 2.1: Button Component**
File: `app/ui/app/src/components/ui/button.tsx`

Current implementation already has good foundation. Verify:
- Primary button uses correct sunset gradient (update if needed)
- Secondary button uses glassmorphism with correct values
- Hover states use natural easing
- Box shadows match design spec

**Task 2.2: Card Component**
File: `app/ui/app/src/components/ui/card.tsx`

Current implementation is good. Verify:
- Border radius uses `--radius-lg` (12px) ✅
- Glassmorphism values match spec ✅
- Hover transitions use `--ease-natural` ✅

**Task 2.3: Trail of Thought Nodes**
File: `app/ui/app/src/components/trace/TraceNode.tsx`

Update node styling to match design language metaphors:
- **Supervisor nodes** (tree trunk): Use sunset gradient background
- **Agent nodes** (branches): Use `--bg-tertiary` with accent border
- **Tool nodes** (leaves): Use `--neutral-dark` with subtle border

Current implementation uses event-type-based coloring. Need to map to design metaphors.

**Task 2.4: Layout Components**
File: `app/ui/app/src/components/layout/layout.tsx`

Verify:
- Background uses `--bg-primary`
- Glass panels use correct glassmorphism values
- Depth layers create visual hierarchy

### Phase 3: Typography Implementation (2-3 hours)

**Task 3.1: Update Base Typography**
File: `app/ui/app/src/index.css`

- Apply type scale to heading elements (h1-h6)
- Use Outfit font for special headings (brand elements)
- Ensure all text uses design system colors

**Task 3.2: Component Typography**
- Update all components to use type scale variables
- Replace hardcoded font sizes with CSS variables
- Apply Outfit font to brand elements (logo, hero text)

### Phase 4: Animation Refinement (2-3 hours)

**Task 4.1: Update Keyframe Animations**
- Verify all animations use natural easing
- Ensure transitions feel organic and flowing
- Add "tree growth" animation for loading states
- Add "sunset glow" hover effects where appropriate

**Task 4.2: Framer Motion Config**
- Create motion variants that use design system easing functions
- Ensure all page transitions feel natural and calm

### Phase 5: Testing & Verification (2-4 hours)

**Task 5.1: Visual Regression Testing**
- Take screenshots of all major UI components
- Compare with design language spec
- Verify color accuracy using color picker
- Check glassmorphism rendering on different backgrounds

**Task 5.2: Cross-browser Testing**
- Test in Chrome, Firefox, Safari, Edge
- Verify backdrop-filter support and fallbacks
- Check font rendering across browsers

**Task 5.3: Responsive Testing**
- Verify design system works at different viewport sizes
- Test glassmorphism on mobile devices
- Ensure animations are smooth on lower-end devices

---

## 5. File Structure Changes

### New Files
None (all changes are modifications to existing files)

### Modified Files

**CSS/Styling:**
1. `app/ui/app/src/styles/theme.css` - Update all design tokens
2. `app/ui/app/tailwind.config.js` - Update Tailwind theme configuration
3. `app/ui/app/src/index.css` - Update base styles and typography
4. `app/ui/app/index.html` - Add Outfit font link

**Components:**
5. `app/ui/app/src/components/ui/button.tsx` - Verify button styling
6. `app/ui/app/src/components/ui/card.tsx` - Verify card styling
7. `app/ui/app/src/components/trace/TraceNode.tsx` - Update node metaphors
8. `app/ui/app/src/components/layout/layout.tsx` - Verify layout styling
9. All components using typography - Update to use type scale

---

## 6. Data Model Changes

**No database or API changes required.** This is purely a frontend visual refactoring.

---

## 7. Verification Approach

### Automated Testing
```bash
# Run existing tests to ensure no regressions
cd app/ui/app
npm run test

# Run linter
npm run lint

# Type checking
npm run build
```

### Manual Verification Checklist

**Color Palette:**
- [ ] All colors match design language v2 exactly
- [ ] Neutral colors are properly defined and used
- [ ] Gradients render correctly with proper color stops

**Typography:**
- [ ] Outfit font loads correctly
- [ ] Type scale is properly applied across all components
- [ ] Font weights are appropriate for hierarchy

**Glassmorphism:**
- [ ] All glass effects use correct blur and opacity values
- [ ] Borders are subtle and use design system colors
- [ ] Glass panels stack properly with z-index

**Animations:**
- [ ] All transitions use natural/organic easing functions
- [ ] Hover effects feel warm and welcoming
- [ ] Loading animations suggest growth/patience

**Component Styling:**
- [ ] Buttons match design spec (primary = sunset gradient)
- [ ] Cards use proper glassmorphism and shadows
- [ ] Trail of Thought nodes follow tree metaphor
- [ ] Layout creates proper depth and layering

### Screenshot Comparison
Take screenshots of:
1. Button variants (primary, secondary, ghost)
2. Card with and without hover
3. Trail of Thought graph with multiple node types
4. Main layout with glass panels
5. Typography scale demonstration

Compare with design language document to ensure visual accuracy.

---

## 8. Risk Assessment

### Low Risk
- CSS variable updates (easily reversible)
- Typography additions (additive, won't break existing)
- Animation refinements (non-breaking changes)

### Medium Risk
- Gradient changes (may affect existing component appearance)
- TraceNode refactoring (may change user-familiar visuals)

### Mitigation Strategies
- Test all changes in development environment first
- Take screenshots before/after for comparison
- Maintain git history for easy rollback
- Get user feedback on visual changes before finalizing

---

## 9. Success Criteria

**The refactoring is considered complete when:**

1. ✅ All CSS variables in `theme.css` match the design language v2 spec exactly
2. ✅ Outfit font is loaded and used for brand elements
3. ✅ Complete type scale is defined and applied
4. ✅ All three gradients (sunset, depth, layers) are properly defined
5. ✅ Neutral color palette is added and used appropriately
6. ✅ All animations use natural easing functions
7. ✅ Button components follow exact design spec styling
8. ✅ Card components use proper glassmorphism values
9. ✅ TraceNode components follow tree metaphor (trunk/branches/leaves)
10. ✅ All tests pass without regressions
11. ✅ Visual comparison confirms alignment with design language
12. ✅ Application builds successfully with no errors

---

## 10. Dependencies

### External Dependencies
- **Google Fonts**: Outfit font family (web font, no npm package needed)
- All other dependencies already exist in package.json

### Internal Dependencies
- No new internal dependencies required
- All changes use existing Tailwind CSS and React infrastructure

---

## 11. Performance Considerations

### Font Loading
- Use `font-display: swap` for Outfit font to prevent FOIT (Flash of Invisible Text)
- Preload critical fonts in HTML head

### Glassmorphism
- Backdrop-filter can be performance-intensive
- Limit number of glass panels on screen simultaneously
- Provide fallback for browsers that don't support backdrop-filter

### Animation Performance
- Use CSS transforms and opacity for animations (GPU-accelerated)
- Avoid animating properties like width, height, top, left
- Use will-change sparingly for critical animations

---

## 12. Rollback Plan

If issues arise:

1. **CSS Variables**: Revert `theme.css` to previous commit
2. **Tailwind Config**: Revert `tailwind.config.js` to previous commit
3. **Components**: Revert individual component files as needed
4. **Fonts**: Remove Outfit font link from HTML

Git commands:
```bash
# Revert specific file
git checkout HEAD~1 app/ui/app/src/styles/theme.css

# Revert entire refactoring
git revert <commit-hash>
```

---

## 13. Documentation Updates

After completion, update:
- `app/ui/app/README.md` - Note design language v2 compliance
- Create `docs/design-system.md` - Document CSS variables and usage
- Update component storybook stories to showcase new styling

---

## Appendix A: Design Language v2 Reference

Full design language document location:
`dgd/docs/architecture/dojo_genesis_design_language_v2.md`

Key principles:
1. **Calm & Contemplative** - Peaceful, focused UI
2. **Layered Depth** - Glassmorphism and z-axis depth
3. **Organic & Natural** - Rounded corners, flowing animations
4. **Warm Accents, Cool Base** - Teal/navy + golden-orange

---

## Appendix B: Color Palette Quick Reference

```css
/* Backgrounds */
--bg-primary: #0a1e2e;
--bg-secondary: #0f2a3d;
--bg-tertiary: #143847;

/* Accents */
--accent-primary: #f4a261;
--accent-secondary: #e76f51;
--accent-tertiary: #ffd166;

/* Neutrals */
--neutral-dark: #1a3a4a;
--neutral-mid: #4a6a7a;
--neutral-light: #8aa8b8;

/* Text */
--text-primary: #ffffff;
--text-secondary: #d4e4ed;
--text-tertiary: #8aa8b8;

/* Semantic */
--success: #2a9d8f;
--warning: #f4a261;
--danger: #e63946;
--info: #457b9d;
```
