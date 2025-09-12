  import { useState, useEffect } from 'preact/hooks';
import Router from 'preact-router';
import Header from './components/Header';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import { ErrorBoundary, AsyncErrorBoundary } from './components/ErrorBoundary';
import { useToast } from './components/Toast';
import { lazy, preloadComponent } from './utils/lazyLoading';
import { scrollToTop } from './utils/helpers';
import './app.css';

// Lazy-loaded components
const UploadForm = lazy(
  () => import('./components/UploadForm'),
  {
    componentName: 'Upload Form',
    useSkeleton: true,
    skeletonType: 'form'
  }
);

const ResultCard = lazy(
  () => import('./components/ResultCard'),
  {
    componentName: 'Result Card',
    useSkeleton: true,
    skeletonType: 'card'
  }
);

const ViewPage = lazy(
  () => import('./components/ViewPage'),
  {
    componentName: 'View Page',
    useSkeleton: true,
    skeletonType: 'card'
  }
);

const AllContentPage = lazy(
  () => import('./components/AllContentPage'),
  {
    componentName: 'Content List',
    useSkeleton: true,
    skeletonType: 'list'
  }
);

const ErrorHandlingDemo = lazy(
  () => import('./components/ErrorHandlingDemo'),
  {
    componentName: 'Error Demo',
    useSkeleton: true,
    skeletonType: 'default'
  }
);

const LazyComponentsDemo = lazy(
  () => import('./components/LazyComponentsDemo'),
  {
    componentName: 'Lazy Components Demo',
    useSkeleton: true,
    skeletonType: 'default'
  }
);

// Home Page Component
const HomePage = ({ toast }) => {
  const [uploadResult, setUploadResult] = useState(null);

  const handleUploadSuccess = (result) => {
    setUploadResult(result);
    toast?.showSuccess('Content uploaded successfully!');
  };

  const handleBackToUpload = () => {
    setUploadResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {uploadResult ? (
          <AsyncErrorBoundary 
            title="Upload Result Error"
            message="Failed to display upload result."
          >
            <ResultCard result={uploadResult} onBack={handleBackToUpload} />
          </AsyncErrorBoundary>
        ) : (
          <AsyncErrorBoundary 
            title="Upload Form Error"
            message="Failed to load upload form."
          >
            <UploadForm onUploadSuccess={handleUploadSuccess} toast={toast} />
          </AsyncErrorBoundary>
        )}
      </div>
    </div>
  );
};

// View Content Component (for routing)
const ViewContent = ({ matches, toast }) => {
  return (
    <AsyncErrorBoundary 
      title="Content Loading Error"
      message="Failed to load shared content."
    >
      <ViewPage id={matches.id} toast={toast} />
    </AsyncErrorBoundary>
  );
};

// All Content Component (for routing)
const AllContent = ({ toast }) => {
  return (
    <AsyncErrorBoundary 
      title="Content List Error"
      message="Failed to load content list."
    >
      <AllContentPage toast={toast} />
    </AsyncErrorBoundary>
  );
};

// Error Demo Component (for routing)
const ErrorDemo = ({ toast }) => {
  return (
    <AsyncErrorBoundary 
      title="Error Demo Loading Error"
      message="Failed to load error demonstration."
    >
      <ErrorHandlingDemo toast={toast} />
    </AsyncErrorBoundary>
  );
};

// Lazy Components Demo (for routing)
const LazyDemo = ({ toast }) => {
  return (
    <AsyncErrorBoundary 
      title="Lazy Demo Loading Error"
      message="Failed to load lazy components demonstration."
    >
      <LazyComponentsDemo toast={toast} />
    </AsyncErrorBoundary>
  );
};

export function App() {
  const toast = useToast();

  // Preload components on app initialization
  useEffect(() => {
    // Preload critical components
    const preloadCriticalComponents = async () => {
      try {
        // Preload upload form since it's likely to be used first
        await preloadComponent(() => import('./components/UploadForm'));
        console.log('Critical components preloaded');
      } catch (error) {
        console.warn('Failed to preload critical components:', error);
      }
    };

    preloadCriticalComponents();

    // Preload other components after a delay to avoid blocking initial render
    const preloadOtherComponents = setTimeout(async () => {
      try {
        await Promise.all([
          preloadComponent(() => import('./components/ViewPage')),
          preloadComponent(() => import('./components/AllContentPage')),
          preloadComponent(() => import('./components/ResultCard')),
          preloadComponent(() => import('./components/ErrorHandlingDemo')),
          preloadComponent(() => import('./components/LazyComponentsDemo'))
        ]);
        console.log('Additional components preloaded');
      } catch (error) {
        console.warn('Failed to preload additional components:', error);
      }
    }, 2000);

    return () => clearTimeout(preloadOtherComponents);
  }, []);

  // Handle route changes for smooth scroll to top
  const handleRouteChange = () => {
    scrollToTop(300); // 300ms smooth scroll duration
  };

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      toast.showError('An unexpected error occurred. Please try again.');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [toast]);

  return (
    <ErrorBoundary>
      <div className="app">
        {/* Toast Notifications */}
        <toast.ToastContainer />

        {/* Header */}
        <ErrorBoundary fallback={
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Header failed to load. Some navigation features may not be available.
                </p>
              </div>
            </div>
          </div>
        }>
          <Header />
        </ErrorBoundary>

        {/* Main Content */}
        <main>
          <ErrorBoundary>
            <Router onChange={handleRouteChange}>
              <HomePage path="/" toast={toast} />
              <AllContent path="/all" toast={toast} />
              <ViewContent path="/view/:id" toast={toast} />
              <ErrorDemo path="/error-demo" toast={toast} />
              <LazyDemo path="/lazy-demo" toast={toast} />
              <NotFound default />
            </Router>
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <ErrorBoundary fallback={
          <div className="bg-gray-100 border-t p-4 text-center text-gray-600 text-sm">
            Footer unavailable
          </div>
        }>
          <Footer />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
