---
name: Code Quality Guidelines
description: Standards for writing maintainable, high-quality code
category: development
tags: [code-quality, best-practices, testing, documentation]
---

# Code Quality Guidelines

## Clean Code Principles

### 1. Meaningful Names

- **Variables**: Descriptive nouns (`userCount`, not `uc`)
- **Functions**: Verb phrases (`getUserById`, not `get`)
- **Classes**: Nouns (`UserManager`, not `Manager`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

### 2. Functions Should Do One Thing

```typescript
// ❌ Bad: Function does multiple things
function processUser(user: User) {
  validateUser(user);
  saveToDatabase(user);
  sendEmail(user);
  logActivity(user);
}

// ✅ Good: Single responsibility
function processUser(user: User) {
  const validated = validateUser(user);
  return saveUser(validated);
}
```

### 3. Keep Functions Small

- Aim for < 20 lines
- If it doesn't fit on screen, it's too long
- Extract complex logic into separate functions

### 4. DRY (Don't Repeat Yourself)

- Extract common logic into utilities
- Use composition over repetition
- Create reusable components

### 5. Error Handling

```typescript
// ❌ Bad: Swallowing errors
try {
  await fetchData();
} catch (e) {
  // Silent failure
}

// ✅ Good: Proper error handling
try {
  await fetchData();
} catch (error) {
  console.error("Failed to fetch data:", error);
  throw new DataFetchError("Failed to fetch data", error);
}
```

## Testing

### Test Pyramid

1. **Unit Tests** (70%) - Test individual functions
2. **Integration Tests** (20%) - Test component interactions
3. **E2E Tests** (10%) - Test full user flows

### Test Structure (AAA Pattern)

```typescript
test("should calculate total price with tax", () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(330);
});
```

## Documentation

### Code Comments

- Explain **why**, not **what**
- Document complex algorithms
- Add JSDoc for public APIs

### README.md

- Project overview
- Installation instructions
- Usage examples
- API documentation
- Contributing guidelines

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests are included and passing
- [ ] No console.logs or debugger statements
- [ ] Error handling is proper
- [ ] Performance is acceptable
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Commits are meaningful
