  import { useState } from 'preact/hooks';
import Router from 'preact-router';
import UploadForm from './components/UploadForm';
import ResultCard from './components/ResultCard';
import ViewPage from './components/ViewPage';
import AllContentPage from './components/AllContentPage';
import Header from './components/Header';
import Footer from './components/Footer';
import NotFound from './components/NotFound';
import './app.css';

// Home Page Component
const HomePage = () => {
  const [uploadResult, setUploadResult] = useState(null);

  const handleUploadSuccess = (result) => {
    setUploadResult(result);
  };

  const handleBackToUpload = () => {
    setUploadResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {uploadResult ? (
          <ResultCard result={uploadResult} onBack={handleBackToUpload} />
        ) : (
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        )}
      </div>
    </div>
  );
};

// View Content Component (for routing)
const ViewContent = ({ matches }) => {
  return (
    <ViewPage id={matches.id} />
  );
};

// All Content Component (for routing)
const AllContent = () => {
  return (
    <AllContentPage />
  );
};

export function App() {
  return (
    <div className="app">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        <Router>
          <HomePage path="/" />
          <AllContent path="/all" />
          <ViewContent path="/view/:id" />
          <NotFound default />
        </Router>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
