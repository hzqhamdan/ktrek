import React, { useState } from "react";
import Loading from "../components/common/Loading";
import ClassicLoader from "../components/ui/loader";
import ModifiedClassicLoader from "../components/ui/demo";
import Button from "../components/common/Button";

/**
 * Real-world examples of how to use the loader components
 * in different scenarios within the K-Trek application
 */
const LoaderExampleUsage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
  };

  // Simulate data fetching
  const handleFetchData = async () => {
    setIsFetchingData(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsFetchingData(false);
  };

  // Simulate processing
  const handleProcess = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background-default p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-gray-800 mb-2">
          Loader Usage Examples
        </h1>
        <p className="text-gray-600 mb-8">
          Real-world scenarios for using loader components in K-Trek
        </p>

        {/* Example 1: Button with inline loader */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            1. Button with Inline Loader
          </h2>
          <p className="text-gray-600 mb-4">
            Use the ClassicLoader directly inside a button during form submission
          </p>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <ClassicLoader />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Form</span>
            )}
          </button>
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`<button disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <ClassicLoader />
      <span>Submitting...</span>
    </>
  ) : (
    <span>Submit Form</span>
  )}
</button>`}
          </pre>
        </section>

        {/* Example 2: Content loading state */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            2. Content Loading State
          </h2>
          <p className="text-gray-600 mb-4">
            Show a loading indicator while fetching data from API
          </p>
          <button
            onClick={handleFetchData}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors mb-4"
          >
            Fetch Attractions
          </button>
          
          <div className="border-2 border-gray-200 rounded-lg min-h-[200px]">
            {isFetchingData ? (
              <Loading variant="classic" message="Loading attractions..." />
            ) : (
              <div className="p-6 text-center text-gray-600">
                Click the button above to load attractions
              </div>
            )}
          </div>
          
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{isFetchingData ? (
  <Loading variant="classic" message="Loading attractions..." />
) : (
  <div>Your content here</div>
)}`}
          </pre>
        </section>

        {/* Example 3: Full screen blocking operation */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            3. Full Screen Blocking Operation
          </h2>
          <p className="text-gray-600 mb-4">
            Use full screen loader for operations that require user to wait
          </p>
          <button
            onClick={handleProcess}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Process Task Submission
          </button>
          
          {isProcessing && (
            <Loading 
              variant="modified" 
              fullScreen 
              message="Processing your task submission..." 
            />
          )}
          
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{isProcessing && (
  <Loading 
    variant="modified" 
    fullScreen 
    message="Processing your task submission..." 
  />
)}`}
          </pre>
        </section>

        {/* Example 4: Small inline loader */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            4. Small Inline Loader
          </h2>
          <p className="text-gray-600 mb-4">
            Perfect for showing loading state next to text or icons
          </p>
          <div className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-lg">
            <ModifiedClassicLoader />
            <span className="text-gray-600">Checking prerequisites...</span>
          </div>
          
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`<div className="flex items-center space-x-4">
  <ModifiedClassicLoader />
  <span>Checking prerequisites...</span>
</div>`}
          </pre>
        </section>

        {/* Example 5: Card with loading state */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            5. Card with Loading State
          </h2>
          <p className="text-gray-600 mb-4">
            Show loader within a card component
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-primary-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px]">
              <Loading variant="classic" size="sm" />
              <p className="text-gray-600 text-sm mt-2">Loading stats...</p>
            </div>
            <div className="border-2 border-primary-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px]">
              <Loading variant="modified" size="sm" />
              <p className="text-gray-600 text-sm mt-2">Loading badges...</p>
            </div>
            <div className="border-2 border-primary-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px]">
              <Loading variant="gradient" size="sm" />
              <p className="text-gray-600 text-sm mt-2">Loading rewards...</p>
            </div>
          </div>
          
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`<div className="card">
  <Loading variant="classic" size="sm" />
  <p>Loading stats...</p>
</div>`}
          </pre>
        </section>

        {/* Best Practices */}
        <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            💡 Best Practices
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <span><strong>Classic loader</strong> for quick, inline loading states like buttons and small content areas</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <span><strong>Modified loader</strong> for alternative style when you need visual variety</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <span><strong>Gradient loader</strong> for full-page loads or when you want the colorful K-Trek branding</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <span><strong>Full screen mode</strong> for operations that block user interaction (task submissions, checkouts)</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <span><strong>Always add messages</strong> to provide context for what's loading</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-500 mr-2">✓</span>
              <span><strong>Use appropriate sizes</strong> - small for compact spaces, large for emphasis</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default LoaderExampleUsage;
