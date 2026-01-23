# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 93b1a1ba-8888-4abd-bd92-40c3198dae09 -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [x] Step: Phase 1 - Core Design Tokens
<!-- chat-id: cfebe2f0-f300-4c8b-90ff-9370d727c8fe -->

Update CSS variables and Tailwind configuration to match Design Language v2 exactly.

**Files to modify:**
- `app/ui/app/src/styles/theme.css`
- `app/ui/app/tailwind.config.js`
- `app/ui/app/index.html`

**Tasks:**
1. Update color variables in theme.css (fix `--bg-tertiary`, `--text-secondary`, add neutral colors)
2. Update gradient definitions (fix sunset gradient, replace ocean/glass with depth/layers)
3. Add missing easing functions and rename `--duration-normal` to `--duration-base`
4. Add complete type scale variables
5. Add Outfit font to index.html via Google Fonts
6. Define `--font-accent` variable
7. Update Tailwind config to match new values

**Verification:**
```bash
cd app/ui/app
npm run lint
npm run build
```

---

### [x] Step: Phase 2 - Component Refactoring
<!-- chat-id: 6aed12f3-2ff3-4aa7-8bb9-302167f1e060 -->

Update all UI components to use the new design system values.

**Files to modify:**
- `app/ui/app/src/components/ui/button.tsx`
- `app/ui/app/src/components/ui/card.tsx`
- `app/ui/app/src/components/trace/TraceNode.tsx`
- `app/ui/app/src/components/layout/layout.tsx`

**Tasks:**
1. Verify button component styling (primary = sunset gradient, secondary = glass)
2. Verify card component glassmorphism values
3. Update TraceNode to follow tree metaphor (supervisor = trunk, agent = branch, tool = leaf)
4. Verify layout components use correct backgrounds and depth

**Verification:**
```bash
cd app/ui/app
npm run test
npm run dev  # Manual visual verification
```

---

### [x] Step: Phase 3 - Typography Implementation
<!-- chat-id: 943ac3ed-6c68-462e-baea-882a3b44af6b -->

Apply the type scale system and Outfit font across the application.

**Files to modify:**
- `app/ui/app/src/index.css`
- All components using typography (h1-h6, headings, brand elements)

**Tasks:**
1. Update base typography in index.css to use type scale
2. Apply Outfit font to brand elements (logo, hero text)
3. Update all components to use type scale variables instead of hardcoded sizes
4. Verify font hierarchy and readability

**Verification:**
```bash
cd app/ui/app
npm run dev  # Visual verification of typography
```

---

### [x] Step: Phase 4 - Animation Refinement
<!-- chat-id: c83d5f67-c585-432e-b1bc-8bc8ba3f0d85 -->

Ensure all animations use natural, organic easing functions.

**Files to modify:**
- Components with animations (buttons, cards, modals, transitions)
- Framer Motion configuration if present

**Tasks:**
1. Update all CSS transitions to use `--ease-natural` or appropriate easing
2. Verify hover effects feel warm and welcoming
3. Add loading animations that suggest growth/patience
4. Test animation performance on lower-end devices

**Verification:**
```bash
cd app/ui/app
npm run dev  # Test all interactive animations
```

---

### [x] Step: Phase 5 - Testing & Documentation
<!-- chat-id: fa10c42a-f59b-4f3a-90ca-35c698576924 -->

Comprehensive testing and documentation of changes.

**Tasks:**
1. Run all automated tests and fix any regressions
2. Perform visual regression testing (take screenshots, compare with design spec)
3. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
4. Test responsiveness at different viewport sizes
5. Verify glassmorphism rendering with fallbacks
6. Document CSS variables and usage in design system doc

**Verification:**
```bash
cd app/ui/app
npm run test
npm run test:coverage
npm run lint
npm run build
```

**Create report:**
Write `{@artifacts_path}/report.md` with:
- Summary of all changes made
- Visual comparison screenshots
- Test results
- Any issues encountered and how they were resolved
