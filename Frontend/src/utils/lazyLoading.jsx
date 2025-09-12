import { Component } from 'preact';
import { useState, useEffect } from 'preact/hooks';

/**
 * Lazy loading utility for Preact components
 * Provides loading states, error handling, and retry functionality
 */

/**
 * Loading component shown while lazy component is loading
 */
const DefaultLoadingComponent = ({ componentName = 'Component' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
      <p className="text-gray-600 text-sm">Loading {componentName}...</p>
    </div>
  </div>
);

/**
 * Error component shown when lazy loading fails
 */
const DefaultErrorComponent = ({ error, retry, componentName = 'Component' }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.182 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    
    <h3 className="text-lg font-semibold text-red-900 text-center mb-2">
      Failed to load {componentName}
    </h3>
    
    <p className="text-red-700 text-center mb-4 text-sm">
      {error?.message || 'Unable to load the requested component.'}
    </p>
    
    <div className="flex justify-center space-x-3">
      <button
        onClick={retry}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Retry
      </button>
      
      <button
        onClick={() => window.location.reload()}
        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

/**
 * Skeleton loading component for specific component types
 */
const SkeletonLoader = ({ type = 'default', className = '' }) => {
  const skeletons = {
    card: (
      <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="mt-4 h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    ),
    form: (
      <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-6 h-10 bg-gray-200 rounded w-1/4"></div>
      </div>
    ),
    list: (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    default: (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  };

  return skeletons[type] || skeletons.default;
};

/**
 * HOC for lazy loading components
 */
export const withLazyLoading = (
  importFunction,
  options = {}
) => {
  const {
    LoadingComponent = DefaultLoadingComponent,
    ErrorComponent = DefaultErrorComponent,
    componentName = 'Component',
    skeletonType = 'default',
    useSkeleton = false,
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  class LazyWrapper extends Component {
    constructor(props) {
      super(props);
      this.state = {
        Component: null,
        loading: true,
        error: null,
        retryCount: 0
      };
    }

    async componentDidMount() {
      await this.loadComponent();
    }

    loadComponent = async () => {
      try {
        this.setState({ loading: true, error: null });
        
        const module = await importFunction();
        const Component = module.default || module;
        
        // Simulate minimum loading time to prevent flash
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.setState({
          Component,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error(`Failed to load ${componentName}:`, error);
        this.setState({
          loading: false,
          error,
          Component: null
        });
      }
    };

    retry = async () => {
      const { retryCount } = this.state;
      
      if (retryCount >= maxRetries) {
        console.warn(`Max retries (${maxRetries}) reached for ${componentName}`);
        return;
      }

      this.setState({ retryCount: retryCount + 1 });
      
      // Add exponential backoff
      const delay = retryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await this.loadComponent();
    };

    render() {
      const { Component, loading, error } = this.state;
      const { forwardedRef, ...props } = this.props;

      if (error) {
        return (
          <ErrorComponent
            error={error}
            retry={this.retry}
            componentName={componentName}
          />
        );
      }

      if (loading) {
        if (useSkeleton) {
          return <SkeletonLoader type={skeletonType} />;
        }
        return <LoadingComponent componentName={componentName} />;
      }

      if (!Component) {
        return <ErrorComponent error={new Error('Component not found')} retry={this.retry} componentName={componentName} />;
      }

      return <Component ref={forwardedRef} {...props} />;
    }
  }

  // Add display name for debugging
  LazyWrapper.displayName = `LazyWrapper(${componentName})`;

  // Forward refs if needed
  return (props) => <LazyWrapper {...props} />;
};

/**
 * Functional component version for hooks-based lazy loading
 */
export const useLazyComponent = (
  importFunction,
  dependencies = [],
  options = {}
) => {
  const {
    componentName = 'Component',
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  const [state, setState] = useState({
    Component: null,
    loading: true,
    error: null,
    retryCount: 0
  });

  const loadComponent = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const module = await importFunction();
      const Component = module.default || module;
      
      // Simulate minimum loading time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setState({
        Component,
        loading: false,
        error: null,
        retryCount: 0
      });
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error,
        Component: null
      }));
    }
  };

  const retry = async () => {
    if (state.retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) reached for ${componentName}`);
      return;
    }

    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
    
    const delay = retryDelay * Math.pow(2, state.retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await loadComponent();
  };

  useEffect(() => {
    loadComponent();
  }, dependencies);

  return {
    Component: state.Component,
    loading: state.loading,
    error: state.error,
    retry
  };
};

/**
 * Utility function to create lazy-loaded components
 */
export const lazy = (importFunction, options = {}) => {
  return withLazyLoading(importFunction, options);
};

/**
 * Preload function to load components before they're needed
 */
export const preloadComponent = async (importFunction) => {
  try {
    await importFunction();
  } catch (error) {
    console.warn('Failed to preload component:', error);
  }
};

export {
  DefaultLoadingComponent,
  DefaultErrorComponent,
  SkeletonLoader
};