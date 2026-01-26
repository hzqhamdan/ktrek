import React, { useState } from "react";
import Loading from "../components/common/Loading";
import ClassicLoader from "../components/ui/loader";
import ModifiedClassicLoader from "../components/ui/demo";

const LoaderDemoPage = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-light via-background-cream to-background-soft p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-gray-800 mb-8">
          Loader Components Demo
        </h1>

        {/* Standalone Loaders */}
        <section className="mb-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-heading font-semibold text-gray-700 mb-6">
            Standalone Loader Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Classic Loader</h3>
              <ClassicLoader />
              <p className="text-sm text-gray-600 text-center">
                Simple border spinner with transparent top
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<ClassicLoader />`}
              </code>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Modified Classic Loader</h3>
              <ModifiedClassicLoader />
              <p className="text-sm text-gray-600 text-center">
                Top and bottom border spinner with ease-linear animation
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<ModifiedClassicLoader />`}
              </code>
            </div>
          </div>
        </section>

        {/* Loading Component Variants */}
        <section className="mb-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-heading font-semibold text-gray-700 mb-6">
            Loading Component Variants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-primary-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Gradient (Default)</h3>
              <Loading variant="gradient" />
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<Loading variant="gradient" />`}
              </code>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-primary-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Classic</h3>
              <Loading variant="classic" />
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<Loading variant="classic" />`}
              </code>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-primary-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Modified</h3>
              <Loading variant="modified" />
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<Loading variant="modified" />`}
              </code>
            </div>
          </div>
        </section>

        {/* Size Variations */}
        <section className="mb-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-heading font-semibold text-gray-700 mb-6">
            Size Variations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Small</h3>
              <Loading variant="classic" size="sm" />
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<Loading variant="classic" size="sm" />`}
              </code>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Medium</h3>
              <Loading variant="classic" size="md" />
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<Loading variant="classic" size="md" />`}
              </code>
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Large</h3>
              <Loading variant="classic" size="lg" />
              <code className="text-xs bg-gray-100 p-2 rounded">
                {`<Loading variant="classic" size="lg" />`}
              </code>
            </div>
          </div>
        </section>

        {/* With Messages */}
        <section className="mb-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-heading font-semibold text-gray-700 mb-6">
            With Messages
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Classic with Message</h3>
              <Loading variant="classic" message="Loading attractions..." />
            </div>

            <div className="flex flex-col items-center space-y-4 p-6 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700">Modified with Message</h3>
              <Loading variant="modified" message="Processing your request..." />
            </div>
          </div>
        </section>

        {/* Full Screen Demo */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-heading font-semibold text-gray-700 mb-6">
            Full Screen Mode
          </h2>
          
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-600 text-center">
              Click the button below to see the full screen loading overlay
            </p>
            <button
              onClick={() => setShowFullScreen(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Show Full Screen Loader
            </button>
            <code className="text-xs bg-gray-100 p-2 rounded">
              {`<Loading variant="classic" fullScreen message="Loading..." />`}
            </code>
          </div>
        </section>

        {/* Usage Guide */}
        <section className="mt-12 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-heading font-semibold text-gray-800 mb-4">
            Usage Guide
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Props:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="bg-white px-2 py-1 rounded">variant</code>: "gradient" | "classic" | "modified" (default: "gradient")</li>
                <li><code className="bg-white px-2 py-1 rounded">size</code>: "sm" | "md" | "lg" (default: "md")</li>
                <li><code className="bg-white px-2 py-1 rounded">message</code>: string (optional)</li>
                <li><code className="bg-white px-2 py-1 rounded">fullScreen</code>: boolean (default: false)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Examples:</h3>
              <div className="bg-white p-4 rounded-lg space-y-2 font-mono text-sm">
                <div>{`import Loading from "../components/common/Loading";`}</div>
                <div className="text-gray-500">// Default gradient loader</div>
                <div>{`<Loading />`}</div>
                <div className="text-gray-500 mt-2">// Classic loader with message</div>
                <div>{`<Loading variant="classic" message="Loading..." />`}</div>
                <div className="text-gray-500 mt-2">// Full screen modified loader</div>
                <div>{`<Loading variant="modified" fullScreen />`}</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Full Screen Loading Demo */}
      {showFullScreen && (
        <Loading 
          variant="classic" 
          fullScreen 
          message="This is a full screen loader. Click anywhere to close." 
        />
      )}
      
      {/* Overlay to close full screen demo */}
      {showFullScreen && (
        <div 
          onClick={() => setShowFullScreen(false)}
          className="fixed inset-0 z-[60] cursor-pointer"
        />
      )}
    </div>
  );
};

export default LoaderDemoPage;
