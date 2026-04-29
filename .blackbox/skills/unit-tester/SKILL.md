---
name: unit-tester
description: Use this Skill to create, review, and improve unit tests for Flutter mobile applications, especially for business logic, services, repositories, state management, and utility classes.
---

# Unit Tester

## When to use this Skill
Use this Skill when working on Flutter code that needs reliable automated unit tests.

This includes:
- Testing pure Dart logic
- Testing services, repositories, and controllers
- Testing state management logic such as Provider, Riverpod, Bloc, or Cubit
- Validating input handling, edge cases, and error flows
- Improving test coverage for existing Flutter code
- Refactoring weak or incomplete tests

Do not use this Skill for:
- Widget tests that verify UI rendering or user interaction
- Integration tests that depend on the full app, platform APIs, or backend systems

## Instructions
Provide clear, practical, step-by-step help for generating and improving Flutter unit tests.

### 1. Identify the test target
First determine:
- The class, function, or method under test
- Its inputs and outputs
- Its dependencies
- Whether it contains async behavior, exceptions, or side effects

Prefer testing business logic in isolation.

### 2. Separate unit-testable logic from Flutter UI
If logic is mixed into widgets, recommend extracting it into:
- Services
- Repositories
- Controllers
- Use cases
- View models
- Helpers or utility classes

Focus unit tests on Dart logic, not widget trees.

### 3. Use Flutter/Dart testing conventions
Write tests using:
- `flutter_test` or `test`
- `group`
- `test`
- `setUp` / `tearDown` when helpful

Use clear test names in this format:
- `returns expected value when input is valid`
- `throws Exception when API call fails`
- `emits loading then success state`

### 4. Mock dependencies correctly
When a class depends on external systems, mock or fake them.

Typical dependencies to mock:
- API clients
- Local storage
- Repositories
- Platform services
- Analytics or logging services

Use common Flutter/Dart mocking tools when appropriate, such as:
- `mocktail`
- `mockito`

Prefer simple fakes when they are easier to understand than heavy mocks.

### 5. Cover the important scenarios
For each unit under test, include:
- Happy path behavior
- Edge cases
- Invalid input handling
- Failure states
- Async completion
- Exception throwing or propagation
- State transitions where relevant

Do not stop at a single happy-path test.

### 6. Verify observable behavior, not implementation details
Test:
- Returned values
- State changes
- Emitted states
- Calls to dependencies when behavior requires verification

Avoid brittle tests that depend on private internals or refactor-sensitive structure.

### 7. Handle async code carefully
For async methods:
- Use `async` / `await`
- Ensure Futures complete in tests
- Verify thrown async exceptions with the proper matcher
- For streams or Bloc/Cubit state changes, assert emitted sequences clearly

### 8. Keep tests maintainable
Tests should be:
- Small
- Focused
- Readable
- Independent
- Deterministic

Avoid unnecessary setup and duplicated boilerplate. Extract helpers only when they improve clarity.

### 9. Improve existing tests critically
When reviewing existing unit tests:
- Remove redundant tests
- Strengthen weak assertions
- Add missing failure and edge-case coverage
- Fix over-mocking
- Rename vague test descriptions
- Reduce coupling to implementation details

### 10. Output format
When generating tests, provide:
1. A brief explanation of what is being tested
2. The test file code
3. Any required mocks/fakes
4. Short notes on missing edge cases or refactoring opportunities

## Examples

### Example 1: Testing a simple validator
**Target code**
```dart
class EmailValidator {
  bool isValid(String email) {
    return email.contains('@') && email.contains('.');
  }
}