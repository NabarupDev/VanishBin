import { useState } from 'preact/hooks';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">VanishBin</span>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden sm:flex space-x-4">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Share
            </a>
            <a
              href="/all"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Browse All
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              About
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 py-3">
            <div className="space-y-1">
              <a
                href="/"
                className="block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Share
              </a>
              <a
                href="/all"
                className="block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse All
              </a>
              <a
                href="#"
                className="block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
