/**
 * Lazy Loading Integration Examples
 * This file shows how to integrate lazy loading into existing components
 */

import { useState, useEffect } from 'preact/hooks';
import { useLazyComponent } from '../utils/lazyLoading';
import { useToast } from './Toast';

/**
 * Example: Lazy loading a heavy chart component
 */
export const LazyChart = ({ data, type = 'line', ...props }) => {
  const { Component: ChartComponent, loading, error, retry } = useLazyComponent(
    () => {
      // Simulate loading a chart library (like Chart.js or D3)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            default: ({ data, type, ...props }) => (
              <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center border">
                <div className="text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-lg font-medium text-gray-700">Mock {type} Chart</p>
                  <p className="text-sm text-gray-500 mt-1">Data points: {data?.length || 0}</p>
                  <div className="mt-3 flex justify-center space-x-1">
                    {data?.slice(0, 6).map((value, index) => (
                      <div 
                        key={index}
                        className="w-3 bg-blue-500 rounded-t"
                        style={{ height: `${(value / Math.max(...data)) * 40 + 10}px` }}
                        title={`Value: ${value}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            )
          });
        }, 600); // Simulate loading time
      });
    },
    [data, type],
    { componentName: 'Chart Component' }
  );

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-2">⚠️</div>
          <p className="text-red-700 mb-2">Failed to load chart</p>
          <button 
            onClick={retry}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <ChartComponent data={data} type={type} {...props} />;
};

/**
 * Example: Lazy loading a code editor component
 */
export const LazyCodeEditor = ({ value, language = 'javascript', onChange, ...props }) => {
  const { Component: EditorComponent, loading, error, retry } = useLazyComponent(
    () => {
      // This would load a real code editor like Monaco or CodeMirror
      return Promise.resolve({
        default: ({ value, language, onChange, ...props }) => (
          <div className="border rounded-lg">
            <div className="bg-gray-800 text-white px-3 py-2 text-sm font-mono">
              {language} editor
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-full h-64 p-3 font-mono text-sm border-none resize-none focus:outline-none"
              placeholder="// Your code here..."
              {...props}
            />
          </div>
        )
      });
    },
    [language],
    { componentName: 'Code Editor' }
  );

  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="bg-gray-200 animate-pulse h-8 rounded-t-lg"></div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-b-lg flex items-center justify-center">
          <span className="text-gray-600">Loading editor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 rounded-lg bg-red-50">
        <div className="p-4 text-center">
          <p className="text-red-700 mb-2">Failed to load code editor</p>
          <button 
            onClick={retry}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <EditorComponent value={value} language={language} onChange={onChange} {...props} />;
};

/**
 * Example: Lazy loading a complex data table
 */
export const LazyDataTable = ({ data, columns, ...props }) => {
  const { Component: TableComponent, loading, error, retry } = useLazyComponent(
    () => {
      // Simulate loading a heavy table component
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            default: ({ data, columns, ...props }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((col, idx) => (
                        <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.map((row, idx) => (
                      <tr key={idx}>
                        {columns.map((col, colIdx) => (
                          <td key={colIdx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          });
        }, 800); // Simulate loading time
      });
    },
    [data?.length, columns?.length],
    { componentName: 'Data Table' }
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-2"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-center">
        <p className="text-red-700 mb-2">Failed to load data table</p>
        <button 
          onClick={retry}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return <TableComponent data={data} columns={columns} {...props} />;
};

/**
 * Example: Lazy modal component
 */
export const LazyModal = ({ isOpen, onClose, title, children, ...props }) => {
  const { Component: ModalComponent, loading, error, retry } = useLazyComponent(
    () => {
      // This would load a real modal library
      return Promise.resolve({
        default: ({ isOpen, onClose, title, children, ...props }) => {
          if (!isOpen) return null;
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-10">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  {children}
                </div>
              </div>
            </div>
          );
        }
      });
    },
    [isOpen],
    { componentName: 'Modal' }
  );

  // Don't show loading state if modal is not open
  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50"></div>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-10 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p>Loading modal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-10 p-8 text-center">
          <p className="text-red-700 mb-3">Failed to load modal</p>
          <button 
            onClick={retry}
            className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
          >
            Retry
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return <ModalComponent isOpen={isOpen} onClose={onClose} title={title} {...props}>
    {children}
  </ModalComponent>;
};

/**
 * Demo component showing all lazy components
 */
export const LazyComponentsDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [editorValue, setEditorValue] = useState('console.log("Hello, World!");');
  const toast = useToast();

  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' }
  ];

  const tableColumns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Role' }
  ];

  const chartData = [10, 20, 30, 25, 35, 40];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <toast.ToastContainer />
      
      <div>
        <h1 className="text-3xl font-bold mb-4">Lazy Loading Components Demo</h1>
        <p className="text-gray-600 mb-6">
          This page demonstrates various components loaded lazily for optimal performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Lazy Chart</h2>
          <LazyChart data={chartData} type="line" />
        </div>

        {/* Code Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Lazy Code Editor</h2>
          <LazyCodeEditor 
            value={editorValue}
            language="javascript"
            onChange={setEditorValue}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Lazy Data Table</h2>
        <LazyDataTable data={sampleData} columns={tableColumns} />
      </div>

      {/* Modal Demo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Lazy Modal</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Open Lazy Modal
        </button>
        
        <LazyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Lazy Loaded Modal"
        >
          <p className="mb-4">
            This modal was loaded lazily only when you clicked the button!
          </p>
          <p className="text-sm text-gray-600">
            This improves initial page load performance by only loading
            components when they're actually needed.
          </p>
        </LazyModal>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Lazy Loading Benefits:</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Faster initial page load times</li>
          <li>• Reduced bundle size for the initial load</li>
          <li>• Better user experience with loading states</li>
          <li>• Automatic error handling and retry functionality</li>
          <li>• Only load components when actually needed</li>
          <li>• Improved performance on slower devices/connections</li>
        </ul>
      </div>
    </div>
  );
};