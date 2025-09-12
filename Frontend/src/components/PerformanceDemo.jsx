/**
 * Performance comparison demonstration
 * Shows the impact of lazy loading on bundle size and load times
 */

import { useState, useEffect } from 'preact/hooks';

const PerformanceDemo = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    bundleSize: 0,
    componentsLoaded: 0
  });

  useEffect(() => {
    // Simulate performance metrics
    const startTime = performance.now();
    
    // Simulate bundle analysis
    setTimeout(() => {
      setMetrics({
        loadTime: Math.round(performance.now() - startTime),
        bundleSize: Math.round(Math.random() * 500 + 200), // KB
        componentsLoaded: Math.floor(Math.random() * 5 + 3)
      });
    }, 100);
  }, []);

  const lazyMetrics = {
    loadTime: Math.round(metrics.loadTime * 0.6), // 40% faster
    bundleSize: Math.round(metrics.bundleSize * 0.4), // 60% smaller initial
    componentsLoaded: 2 // Only essential components
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Performance Impact</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Without Lazy Loading */}
        <div className="border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Without Lazy Loading
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Initial Load Time:</span>
              <span className="font-mono text-red-600">{metrics.loadTime}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Initial Bundle Size:</span>
              <span className="font-mono text-red-600">{metrics.bundleSize}KB</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Components Loaded:</span>
              <span className="font-mono text-red-600">{metrics.componentsLoaded}</span>
            </div>
          </div>
          
          <div className="mt-4 bg-red-50 rounded p-3">
            <p className="text-xs text-red-700">
              All components loaded upfront, including those not immediately needed.
            </p>
          </div>
        </div>

        {/* With Lazy Loading */}
        <div className="border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            With Lazy Loading
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Initial Load Time:</span>
              <span className="font-mono text-green-600">{lazyMetrics.loadTime}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Initial Bundle Size:</span>
              <span className="font-mono text-green-600">{lazyMetrics.bundleSize}KB</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Components Loaded:</span>
              <span className="font-mono text-green-600">{lazyMetrics.componentsLoaded}</span>
            </div>
          </div>
          
          <div className="mt-4 bg-green-50 rounded p-3">
            <p className="text-xs text-green-700">
              Only essential components loaded initially. Others load on-demand.
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(((metrics.loadTime - lazyMetrics.loadTime) / metrics.loadTime) * 100)}%
          </div>
          <div className="text-xs text-blue-700">Faster Load</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(((metrics.bundleSize - lazyMetrics.bundleSize) / metrics.bundleSize) * 100)}%
          </div>
          <div className="text-xs text-purple-700">Smaller Initial Bundle</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600">
            {metrics.componentsLoaded - lazyMetrics.componentsLoaded}
          </div>
          <div className="text-xs text-orange-700">Fewer Initial Components</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDemo;