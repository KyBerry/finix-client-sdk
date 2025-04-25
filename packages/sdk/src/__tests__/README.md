# SDK Testing Documentation

This document outlines testing best practices, current test coverage, and recommendations for the Finix Client SDK.

## Testing Approach

We use Vitest for testing, with the following approach:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test interactions between components within the SDK
- **DOM Interaction Tests**: Test interactions with the DOM and iframe elements
- **Mock Tests**: Use mocks for external dependencies like message passing and fraud detection

## Current Coverage Status

The SDK currently includes tests for:

1. **Core Components**:

   - PaymentFormCreator (creation, fraud detection initialization)
   - BasePaymentForm (message handling, rendering, event callbacks)
   - CardPaymentForm (field rendering, submission, dynamic State/Region display)
   - TokenPaymentForm (toggle UI, field display, state management during toggle)
   - BankPaymentForm (field rendering, submission, dynamic US/CAN bank field display)

2. **Utilities**:

   - createIframeFieldConfig (field configuration generation)
   - getDefaultFieldProps (field properties lookup)
   - ID generation and branding utilities

3. **Message Handling**:
   - Parent-to-iframe messaging
   - Iframe-to-parent message reception
   - Field state updates based on received messages
   - Form submission and token handling

## Test Coverage Gaps

The following areas need improved test coverage:

1. **Submit Method Implementation**: More thorough testing of the submission process across all product types, including error handling and timeouts.

2. **Validation Logic**: Better coverage of field validation state management, error display, and form validity determination.

3. **Form State Management**: More comprehensive tests for state management during field updates, especially for TokenPaymentForm which has dynamic field sets.

4. **Configuration Options**: Testing for various configuration combinations (error messages, styling, fonts, etc.) and their effects.

5. **Edge Cases**: Tests for error scenarios, network failures, and iframe loading failures.

## Best Practices Recommendations

### 1. Test Organization

- Group tests by feature/functionality, not by code structure
- Use descriptive test names that indicate the expected behavior
- Arrange tests in a Given-When-Then or Arrange-Act-Assert structure

### 2. Mocking

- Mock external dependencies like postMessage and DOM APIs
- Use vi.mock() to substitute implementation of imported modules
- Keep mocks as simple as possible while still exercising the code

### 3. TypeScript Usage

- Use proper typing in test files (avoid `any` when possible)
- Create proper mock implementations of abstract classes
- Define type-safe factories for test object creation

### 4. Test Isolation

- Reset mocks between tests with beforeEach/afterEach
- Clear DOM modifications between tests
- Avoid test interdependence

### 5. Test Coverage

- Aim for high coverage but prioritize test value over coverage metrics
- Ensure all message types are covered in message handling tests
- Test both success and failure paths
- Include tests for all product-specific implementations

## Examples

### Good Test Example

```typescript
it("should update submit button state based on form validity", () => {
  form.render(mockContainer.id);

  // Create a test submit button
  const submitBtn = document.createElement("button");
  submitBtn.id = `${(form as any).formId}-submit-button`;
  mockContainer.appendChild(submitBtn);

  // Initially button should be disabled (form not valid)
  expect(submitBtn.disabled).toBe(true);

  // Simulate form becoming valid
  (form as any).updateSubmitButtonState(true);

  // Button should now be enabled
  expect(submitBtn.disabled).toBe(false);
});
```

### Test Improvement Example

```typescript
// Before
it("should call onTokenize callback", async () => {
  // ... setup code ...
  expect(mockCallbacks.onTokenize).toHaveBeenCalled();
});

// After
it("should process successful tokenization response with correct data", async () => {
  const mockToken = { data: { id: "tok_123abc" } };
  // ... setup code ...

  // Simulate response received from iframe
  handleMessageActual({
    data: {
      formId: form.getFormId(),
      messageName: "response-received",
      messageId: "msg-123",
      messageData: mockToken,
    },
    origin: "https://js.finix.com",
  });

  // Check specific interactions
  expect(mockCallbacks.onTokenize).toHaveBeenCalledWith("tok_123abc");
  expect(mockCallbacks.onTokenizeError).not.toHaveBeenCalled();
});
```

## Running Tests

```bash
# Run all tests for all packages (via TurboRepo)
pnpm test

# Run all tests within the SDK package specifically
pnpm --filter @kyberry/finix-client-sdk run test

# Run a specific test file within the SDK package
pnpm --filter @kyberry/finix-client-sdk run test -- <path/to/test-file.test.ts>

# Run tests with coverage
pnpm run coverage

# Run tests in watch mode
pnpm run test -- --watch
```

## Next Steps

1. Implement detailed tests for validating TokenPaymentForm behavior during UI toggling
2. Add tests for fraud detection error handling edge cases
3. Implement tests for the submitWithData method with various data payloads
4. Add tests for parent-to-iframe messaging during form lifecycle events
5. Create tests for device fingerprinting integration
