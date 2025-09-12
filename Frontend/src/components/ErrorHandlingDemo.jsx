/**
 * Example usage of Error Boundaries and Error Handling utilities
 * This file demonstrates how to properly handle errors in your components
 */

import { useState } from 'preact/hooks';
import { ErrorBoundary, AsyncErrorBoundary, useErrorHandler } from './ErrorBoundary';
import { useToast } from './Toast';
import { safeFetch, parseError, logError, retryWithBackoff } from '../utils/errorHandler';

// Example 1: Using ErrorBoundary for component-level error catching
const ExampleComponentWithErrorBoundary = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  const throwError = () => {
    setShouldThrow(true);
  };

  if (shouldThrow) {
    throw new Error('This is a test error thrown by the component');
  }

  return (
    <div className="p-4 border rounded">
      <h3>Component with Error Boundary</h3>
      <button 
        onClick={throwError}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Throw Error
      </button>
    </div>
  );
};

// Wrap the component with ErrorBoundary
const SafeExampleComponent = () => (
  <ErrorBoundary>
    <ExampleComponentWithErrorBoundary />
  </ErrorBoundary>
);

// Example 2: Using AsyncErrorBoundary for async operations
const AsyncComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // This might fail
      const response = await safeFetch('/api/some-endpoint');
      const result = await response.json();
      setData(result);
    } catch (error) {
      // AsyncErrorBoundary will catch this
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Async Component</h3>
      <button 
        onClick={fetchData}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};

// Wrap async component
const SafeAsyncComponent = () => (
  <AsyncErrorBoundary
    title="Data Loading Error"
    message="Failed to load data from the server."
    onRetry={() => {
      // Custom retry logic
      console.log('Retrying data fetch...');
    }}
  >
    <AsyncComponent />
  </AsyncErrorBoundary>
);

// Example 3: Using useErrorHandler hook
const ComponentWithErrorHandler = () => {
  const { error, handleError, clearError } = useErrorHandler();
  const toast = useToast();

  const performRiskyOperation = async () => {
    try {
      // Clear any previous errors
      clearError();

      // Perform operation that might fail
      const result = await retryWithBackoff(async () => {
        const response = await safeFetch('/api/risky-operation');
        return response.json();
      }, 3);

      toast.showSuccess('Operation completed successfully!');
      console.log('Success:', result);
    } catch (error) {
      // Handle the error
      handleError(error);
      logError(error, { operation: 'performRiskyOperation' });
      
      const parsedError = parseError(error);
      toast.showError(parsedError.message);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Component with Error Handler Hook</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700">{error.message}</p>
          <button 
            onClick={clearError}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
          >
            Clear Error
          </button>
        </div>
      )}
      
      <button 
        onClick={performRiskyOperation}
        className="bg-purple-500 text-white px-4 py-2 rounded"
      >
        Perform Risky Operation
      </button>
    </div>
  );
};

// Example 4: Network error handling
const NetworkExample = () => {
  const toast = useToast();

  const testNetworkError = async () => {
    try {
      // This will likely fail
      await safeFetch('https://nonexistent-api.example.com/data');
    } catch (error) {
      const parsedError = parseError(error);
      toast.showError(parsedError.message);
      logError(error, { context: 'Network test' });
    }
  };

  const testValidationError = async () => {
    try {
      // Simulate validation error
      const error = new Error('Invalid email format');
      error.response = { status: 400, data: { error: 'Invalid email format' } };
      throw error;
    } catch (error) {
      const parsedError = parseError(error);
      toast.showWarning(parsedError.message);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Network Error Examples</h3>
      <div className="space-y-2">
        <button 
          onClick={testNetworkError}
          className="block bg-orange-500 text-white px-4 py-2 rounded"
        >
          Test Network Error
        </button>
        <button 
          onClick={testValidationError}
          className="block bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Test Validation Error
        </button>
      </div>
    </div>
  );
};

// Main demo page
const ErrorHandlingDemo = () => {
  const toast = useToast();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Error Handling Demo</h1>
      
      <p className="text-gray-600">
        This page demonstrates different error handling patterns used in VanishBin.
        Open your browser's developer console to see error logs.
      </p>

      {/* Toast Container */}
      <toast.ToastContainer />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SafeExampleComponent />
        <SafeAsyncComponent />
        <ComponentWithErrorHandler />
        <NetworkExample />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Error Handling Best Practices:</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Use ErrorBoundary for component-level error catching</li>
          <li>• Use AsyncErrorBoundary for async operations with retry capabilities</li>
          <li>• Use useErrorHandler hook for manual error handling in components</li>
          <li>• Use safeFetch for network requests with automatic error parsing</li>
          <li>• Use retryWithBackoff for operations that might temporarily fail</li>
          <li>• Always log errors for debugging and monitoring</li>
          <li>• Provide meaningful error messages to users</li>
          <li>• Offer retry options when appropriate</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo;