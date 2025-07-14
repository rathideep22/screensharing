import { useState, useRef } from 'react';
import Head from 'next/head';
import { useMouseTracker } from '../hooks/useMouseTracker';

export default function ScreenShareValidator() {
  const [currentStep, setCurrentStep] = useState('instructions'); // 'instructions', 'requesting', 'success', 'error'
  const [stream, setStream] = useState(null);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const videoRef = useRef(null);
  
  // Multi-monitor detection state
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [testDetectionFn, setTestDetectionFn] = useState(null);
  
  // Use the simplified mouse tracker
  const { screenInfo, currentMousePos } = useMouseTracker(
    currentStep === 'success' && monitoringEnabled,
    setTestDetectionFn
  );

  // Screen sharing validation logic
  const validateScreenShare = async () => {
    try {
      setCurrentStep('requesting');
      setAttempts(prev => prev + 1);

      // Request screen sharing
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Get the video track and inspect its label
      const videoTrack = mediaStream.getVideoTracks()[0];
      const trackLabel = videoTrack.label.toLowerCase();

      console.log('Track label:', trackLabel); // Debug log

      // Validate if it's a full screen share
      const isValidScreenShare = validateTrackLabel(trackLabel);

      if (!isValidScreenShare) {
        // Stop the stream immediately
        mediaStream.getTracks().forEach(track => track.stop());
        
        // Show retry modal
        setErrorMessage(getErrorMessage(trackLabel));
        setShowRetryModal(true);
        setCurrentStep('error');
        return;
      }

      // Success - full screen was shared
      setStream(mediaStream);
      setCurrentStep('success');
      
      // Display the stream in video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

    } catch (error) {
      console.error('Screen sharing error:', error);
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('❌ Screen sharing permission denied. Please allow access and try again.');
      } else if (error.name === 'NotSupportedError') {
        setErrorMessage('❌ Screen sharing is not supported in this browser.');
      } else {
        setErrorMessage('❌ An error occurred while requesting screen share. Please try again.');
      }
      
      setShowRetryModal(true);
      setCurrentStep('error');
    }
  };

  // Validate track label to determine if full screen was shared
  const validateTrackLabel = (label) => {
    // Common patterns that indicate NOT full screen
    const invalidPatterns = [
      'tab', 'window', 'chrome tab', 'firefox tab', 'safari tab',
      'application window', 'browser window'
    ];

    // Common patterns that indicate full screen
    const validPatterns = [
      'screen', 'monitor', 'desktop', 'entire screen', 'full screen'
    ];

    // Check for invalid patterns first
    for (const pattern of invalidPatterns) {
      if (label.includes(pattern)) {
        return false;
      }
    }

    // Check for valid patterns
    for (const pattern of validPatterns) {
      if (label.includes(pattern)) {
        return true;
      }
    }

    // If no clear pattern, assume it's invalid for safety
    // Most browsers include clear indicators in the label
    return false;
  };

  // Get appropriate error message based on what was shared
  const getErrorMessage = (label) => {
    if (label.includes('tab')) {
      return '❗ You selected a browser tab. Please share your entire screen instead.';
    } else if (label.includes('window')) {
      return '❗ You selected a window. Please share your entire screen instead.';
    } else {
      return '❗ Please share your entire screen — tab or window sharing is not allowed.';
    }
  };

  // Retry screen sharing
  const retryScreenShare = () => {
    setShowRetryModal(false);
    setErrorMessage('');
    validateScreenShare();
  };

  // Stop current stream and restart
  const restartProcess = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCurrentStep('instructions');
    setShowRetryModal(false);
    setErrorMessage('');
    setAttempts(0);
  };

  // Toggle monitoring settings
  const toggleMonitoring = () => {
    setMonitoringEnabled(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Screen Share Validator</title>
        <meta name="description" content="Secure screen sharing validation system" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Instructions Screen */}
        {currentStep === 'instructions' && (
          <InstructionScreen onStart={validateScreenShare} attempts={attempts} />
        )}

        {/* Requesting Screen Share */}
        {currentStep === 'requesting' && (
          <RequestingScreen />
        )}

        {/* Success Screen */}
        {currentStep === 'success' && (
          <SuccessScreen 
            stream={stream} 
            videoRef={videoRef} 
            onRestart={restartProcess}
            monitoringEnabled={monitoringEnabled}
            onToggleMonitoring={toggleMonitoring}
            screenInfo={screenInfo}
            testDetectionFn={testDetectionFn}
            currentMousePos={currentMousePos}
          />
        )}

        {/* Retry Modal */}
        {showRetryModal && (
          <RetryModal
            message={errorMessage}
            onRetry={retryScreenShare}
            onCancel={() => setCurrentStep('instructions')}
            attempts={attempts}
          />
        )}
      </div>
    </div>
  );
}

// Instruction Screen Component
function InstructionScreen({ onStart, attempts }) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          🖥️ Screen Share Validation
        </h1>
        
        {attempts > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800">
              ⚠️ Previous attempt failed. Please follow the instructions carefully.
            </p>
          </div>
        )}

        <div className="text-left max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            📋 Before you begin:
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-green-500 text-xl">✅</span>
              <div>
                <p className="font-medium text-gray-800">Select "Entire Screen"</p>
                <p className="text-gray-600 text-sm">Choose your full desktop/monitor when prompted</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-red-500 text-xl">❌</span>
              <div>
                <p className="font-medium text-gray-800">Do NOT select browser tabs</p>
                <p className="text-gray-600 text-sm">Tab sharing will be rejected</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-red-500 text-xl">❌</span>
              <div>
                <p className="font-medium text-gray-800">Do NOT select application windows</p>
                <p className="text-gray-600 text-sm">Window sharing will be rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Guide */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            📸 What you should see:
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-2">
                <div className="text-green-600 text-3xl mb-2">🖥️</div>
                <p className="font-medium text-green-800">Entire Screen</p>
                <p className="text-sm text-green-600">✅ This is correct!</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-2">
                <div className="text-red-600 text-3xl mb-2">🪟</div>
                <p className="font-medium text-red-800">Browser Tab/Window</p>
                <p className="text-sm text-red-600">❌ This will be rejected!</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200"
        >
          🚀 Start Screen Sharing
        </button>
      </div>
    </div>
  );
}

// Requesting Screen Share Component
function RequestingScreen() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-spin text-6xl mb-6">🔄</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Requesting Screen Share...
        </h2>
        <p className="text-gray-600">
          Please select your <strong>entire screen</strong> in the browser popup.
        </p>
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Look for "Entire Screen" or "Monitor" option in the popup
          </p>
        </div>
      </div>
    </div>
  );
}

// Success Screen Component
function SuccessScreen({ 
  stream, 
  videoRef, 
  onRestart, 
  monitoringEnabled, 
  onToggleMonitoring,
  screenInfo,
  testDetectionFn,
  currentMousePos
}) {
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testScreenX, setTestScreenX] = useState('');
  const [testScreenY, setTestScreenY] = useState('');

  // Handle test detection
  const handleTestDetection = () => {
    const x = parseInt(testScreenX);
    const y = parseInt(testScreenY);
    
    if (isNaN(x) || isNaN(y)) {
      alert('Please enter valid numbers for X and Y coordinates');
      return;
    }

    if (testDetectionFn) {
      const detected = testDetectionFn(x, y);
      if (!detected) {
        alert('✅ No detection - coordinates are within screen bounds');
      }
    }
  };

  // Generate test values for out-of-bounds
  const generateOutOfBoundsTest = () => {
    setTestScreenX((screenInfo?.availWidth + 100).toString());
    setTestScreenY((screenInfo?.availHeight / 2).toString());
  };
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          Screen Shared Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Your entire screen is now being shared. 
          {monitoringEnabled ? ' Multi-monitor detection is active.' : ' Multi-monitor detection is disabled.'}
        </p>
        
        {/* Video Preview */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            style={{ maxHeight: '400px' }}
          />
        </div>
        
        {/* Monitoring Status */}
        <div className={`inline-flex items-center px-4 py-2 rounded-lg mb-4 ${
          monitoringEnabled 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          <span className="text-xl mr-2">{monitoringEnabled ? '👁️' : '⏸️'}</span>
          <span className="font-medium">
            Multi-Monitor Detection: {monitoringEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Live Mouse Coordinates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
          <h4 className="font-bold text-blue-800 mb-3">🖱️ Live Mouse Coordinates</h4>
          
          {/* Current Position */}
          <div className="text-sm mb-3 text-center">
            <div className="space-y-1">
              <p><strong>Screen X:</strong> <span className="font-mono text-blue-700 text-lg">{currentMousePos?.screenX || 0}</span></p>
              <p><strong>Screen Y:</strong> <span className="font-mono text-blue-700 text-lg">{currentMousePos?.screenY || 0}</span></p>
            </div>
          </div>

          {/* Screen Boundaries */}
          <div className="border-t border-blue-200 pt-3 mb-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Available Width:</strong> <span className="font-mono text-blue-700">{screenInfo?.availWidth || 0}</span></p>
                <p><strong>Available Height:</strong> <span className="font-mono text-blue-700">{screenInfo?.availHeight || 0}</span></p>
              </div>
              <div>
                <p><strong>Valid X Range:</strong> <span className="font-mono text-blue-700">0 - {screenInfo?.availWidth || 0}</span></p>
                <p><strong>Valid Y Range:</strong> <span className="font-mono text-blue-700">0 - {screenInfo?.availHeight || 0}</span></p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-blue-600">
            <p><strong>Status:</strong> 
              <span className={`ml-1 font-semibold ${
                (currentMousePos?.screenX >= 0 && currentMousePos?.screenX <= (screenInfo?.availWidth || 0) &&
                 currentMousePos?.screenY >= 0 && currentMousePos?.screenY <= (screenInfo?.availHeight || 0))
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {(currentMousePos?.screenX >= 0 && currentMousePos?.screenX <= (screenInfo?.availWidth || 0) &&
                  currentMousePos?.screenY >= 0 && currentMousePos?.screenY <= (screenInfo?.availHeight || 0))
                  ? '✅ In Bounds' : '⚠️ Out of Bounds'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={onRestart}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            🔄 Restart Process
          </button>
          
          <button
            onClick={onToggleMonitoring}
            className={`font-bold py-3 px-6 rounded-lg transition-colors duration-200 ${
              monitoringEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {monitoringEnabled ? '⏹️ Stop Monitoring' : '▶️ Start Monitoring'}
          </button>
          
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            🧪 Test Detection
          </button>
          
          <button
            onClick={() => alert('Continue with your application logic here!')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            ▶️ Continue Application
          </button>
        </div>
      </div>

      {/* Testing Panel */}
      {showTestPanel && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🧪 Multi-Monitor Detection Testing</h3>
          
          {/* Screen Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-blue-800 mb-2">📊 Current Screen Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Screen Width:</strong> {screenInfo?.width || 'N/A'}</p>
                <p><strong>Screen Height:</strong> {screenInfo?.height || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Available Width:</strong> {screenInfo?.availWidth || 'N/A'}</p>
                <p><strong>Available Height:</strong> {screenInfo?.availHeight || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-600">
              <p><strong>Valid Range:</strong> X: 0 to {screenInfo?.availWidth || 'N/A'}, Y: 0 to {screenInfo?.availHeight || 'N/A'}</p>
              <p><strong>Out-of-bounds examples:</strong> X: {(screenInfo?.availWidth || 0) + 100}, Y: -50</p>
            </div>
          </div>

          {/* Test Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screen X Coordinate
              </label>
              <input
                type="number"
                value={testScreenX}
                onChange={(e) => setTestScreenX(e.target.value)}
                placeholder="Enter X coordinate"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screen Y Coordinate
              </label>
              <input
                type="number"
                value={testScreenY}
                onChange={(e) => setTestScreenY(e.target.value)}
                placeholder="Enter Y coordinate"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleTestDetection}
              disabled={!testScreenX || !testScreenY || !monitoringEnabled}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              🎯 Test These Coordinates
            </button>
            
            <button
              onClick={generateOutOfBoundsTest}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              ⚡ Generate Out-of-Bounds Test
            </button>
            
            <button
              onClick={() => {
                setTestScreenX((screenInfo?.availWidth / 2).toString());
                setTestScreenY((screenInfo?.availHeight / 2).toString());
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              ✅ Generate In-Bounds Test
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2">📝 How to Test</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>In-bounds test:</strong> Enter coordinates within the screen range (should show no alert)</li>
              <li>• <strong>Out-of-bounds test:</strong> Enter coordinates outside the screen range (should show popup)</li>
              <li>• <strong>Quick test:</strong> Use the "Generate" buttons to automatically fill test values</li>
              <li>• <strong>Note:</strong> Monitoring must be enabled for tests to work</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Retry Modal Component
function RetryModal({ message, onRetry, onCancel, attempts }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❗</div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Invalid Screen Share
          </h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          {attempts > 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-amber-800 text-sm">
                💡 <strong>Having trouble?</strong> Make sure to select "Entire Screen" or "Monitor", not a tab or window.
              </p>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 