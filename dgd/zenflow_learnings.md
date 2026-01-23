# Zenflow Orchestration Learnings

**Source:** https://docs.zencoder.ai/zenflow/orchestrating-agents  
**Date:** 2026-01-22

## Key Insights for Writing Zenflow Prompts

### 1. **Spec-Driven Development**
- Zenflow operates on **structured workflows**, not ad-hoc prompts
- Each workflow defines: steps, owners, and artifacts
- Agents operate like a coordinated team, not isolated executors

### 2. **Three-Level Orchestration**
- **Projects**: Scope, repository, automation presets
- **Tasks**: Executable workflows with steps, changes, commits
- **Subtasks/Chats**: Step-aware conversations with live telemetry

### 3. **Workflow Types**
- Quick Change
- Fix Bug
- Spec and Build
- Full SDD (Software Design Document)

### 4. **Automated Verification**
- Dedicated verifier agents run after builders
- Execute tests, lint, security checks, spec validations
- Prevent regressions before code reaches user

### 5. **Parallel Execution**
- Run multiple agents simultaneously
- Cover independent steps (plan, code, docs)
- Have different models tackle same goal and compare outputs

## How to Write Effective Zenflow Prompts

### Structure
1. **Context** - What repository, what existing patterns
2. **Requirements** - What to build (not how)
3. **Success Criteria** - Measurable outcomes
4. **Reference Patterns** - Existing code to follow
5. **Verification** - How to test

### Best Practices
- **Spec first**: Define what, let Zenflow figure out how
- **Reference existing code**: Point to patterns in the repo
- **Enable verification**: Include test criteria
- **Support parallelism**: Break work into independent steps
- **Use step-aware tabs**: Each phase has its own chat context

### Anti-Patterns to Avoid
- ❌ Step-by-step instructions (too prescriptive)
- ❌ Single monolithic prompt (breaks parallelism)
- ❌ No verification criteria (can't validate)
- ❌ Ignoring existing patterns (creates inconsistency)

## Application to Dojo Genesis Desktop

### Current Approach (Good)
✅ Specification-driven requirements  
✅ Reference patterns from Ollama fork  
✅ Success criteria for each spec  
✅ Repository context provided  

### Improvements Needed
- [ ] Add verification steps (tests, lint, build checks)
- [ ] Enable parallel execution (independent specs)
- [ ] Use step-aware structure (Week 1 vs Week 2)
- [ ] Add automated verification criteria

### Recommended Structure

```markdown
## Spec N: [Feature Name]

**Duration:** X hours  
**Repository Context:** [Where to look]  
**Dependencies:** [Other specs that must complete first]

### Requirements
[What to build - specification, not steps]

### Success Criteria
[Measurable outcomes]

### Verification
- [ ] Tests pass
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Screenshot matches design

### Reference Patterns
[Existing code to follow]
```

## Next Steps

1. Restructure prompts to support parallel execution
2. Add verification steps to each spec
3. Define dependencies between specs
4. Enable step-aware orchestration (Week 1 = Phase 1, Week 2 = Phase 2)
