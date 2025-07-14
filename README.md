# screensharing

# 🖥️ Screen Share Validator

A browser-based system that enforces full screen sharing and rejects tab or window sharing attempts. Built with Next.js and native browser APIs.

## 🎯 Goal

This system ensures users share their **entire screen** and prevents them from sharing individual browser tabs or application windows. It provides immediate validation with clear feedback and retry mechanisms.

**NEW**: Includes simple **multi-monitor detection** that shows a popup alert when the cursor moves outside screen boundaries.

## ✅ System Behavior

### 1. **Screen Share Request**
- Uses `navigator.mediaDevices.getDisplayMedia()` to request screen sharing
- Prompts user with clear instructions on what to select

### 2. **Validation Logic**
- Inspects the video track label using `getVideoTracks()[0].label`
- Validates the label against known patterns:
  - **❌ Invalid**: `"tab"`, `"window"`, `"chrome tab"`, `"firefox tab"`, `"application window"`
  - **✅ Valid**: `"screen"`, `"monitor"`, `"desktop"`, `"entire screen"`, `"full screen"`

### 3. **Rejection Handling**
- Immediately stops the stream using `track.stop()`
- Shows blocking modal with specific error message
- Provides retry mechanism with improved guidance

### 4. **Success Flow**
- Displays "✅ Screen shared successfully" message
- Shows video preview of shared screen
- **Activates multi-monitor detection system**
- Enables application to proceed

### 5. **Multi-Monitor Detection** (NEW)
- **Real-time mouse tracking** using `mousemove` events
- **Boundary detection** comparing `screenX/screenY` to `screen.availWidth/availHeight`
- **Simple popup alert** when cursor goes outside screen boundaries
- **Debounced detection** to prevent false positives

## 🏗️ Architecture

### Core Components

#### 1. **Main Page Component** (`pages/index.js`)
- **State Management**: Tracks current step, stream, errors, and attempts
- **Screen Share Logic**: Handles `getDisplayMedia()` calls and validation
- **Error Handling**: Manages different error types and retry scenarios

#### 2. **Instruction Screen**
- Pre-prompt screen with visual guide
- Clear checklist of do's and don'ts
- Attempt counter with enhanced guidance

#### 3. **Validation Engine**
```javascript
const validateTrackLabel = (label) => {
  // Check for invalid patterns (tab/window)
  const invalidPatterns = ['tab', 'window', 'chrome tab', 'firefox tab'];
  
  // Check for valid patterns (screen/monitor)
  const validPatterns = ['screen', 'monitor', 'desktop'];
  
  // Return validation result
}
```

#### 4. **Retry Modal**
- Context-aware error messages
- Progressive help after multiple attempts
- Cancel and retry options

#### 5. **Success Screen**
- Video preview of shared screen
- Multi-monitor detection dashboard
- Continuation options
- Stream management controls

#### 6. **Multi-Monitor Detection System** (NEW)
- **Mouse Tracker Hook** (`useMouseTracker`): Simple cursor position monitoring with popup alerts

### Data Flow

```mermaid
graph TD
    A[Instructions Screen] --> B[Click 'Start Screen Sharing']
    B --> C[Call getDisplayMedia()]
    C --> D[Get Video Track Label]
    D --> E{Validate Label}
    E -->|Invalid| F[Stop Stream]
    F --> G[Show Retry Modal]
    G --> H[User Clicks Retry]
    H --> C
    E -->|Valid| I[Show Success Screen]
    I --> J[Display Video Preview]
    J --> K[Continue Application]
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Modern browser with getDisplayMedia support
- HTTPS connection (required for screen sharing API)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
# or
yarn install
```

2. **Run development server**:
```bash
npm run dev
# or
yarn dev
```

3. **Open in browser**:
```
https://localhost:3015
```

⚠️ **Important**: The screen sharing API requires HTTPS. Use `https://localhost:3015` or deploy to a secure server.

### Production Deployment

```bash
npm run build
npm start
```

## 🔧 Browser Compatibility

| Browser | Screen Share | Multi-Monitor Detection | Track Label Examples |
|---------|-------------|------------------------|---------------------|
| Chrome | ✅ Full | ✅ Full Support | `"Screen 1"`, `"Chrome Tab"`, `"Application Window"` |
| Firefox | ✅ Full | ✅ Full Support | `"Screen"`, `"Firefox Tab"`, `"Window"` |
| Safari | ✅ Full | ✅ Full Support | `"Screen"`, `"Safari Tab"` |
| Edge | ✅ Full | ✅ Full Support | `"Screen 1"`, `"Edge Tab"` |

## 🖱️ Multi-Monitor Detection Features

### Simple Detection
- **Out-of-bounds cursor tracking**: Detects when cursor moves beyond screen boundaries
- **Popup alerts**: Shows "Multiple Monitor Used" message when detected
- **Debounced detection**: Prevents spam alerts (max one every 3 seconds)
- **Browser native alerts**: Uses standard `alert()` function for maximum compatibility

## 🛡️ Security Features

### 1. **Immediate Stream Termination**
```javascript
if (!isValidScreenShare) {
  // Stop stream immediately to prevent unauthorized access
  mediaStream.getTracks().forEach(track => track.stop());
}
```

### 2. **Permission Headers**
```javascript
// next.config.js
headers: [{
  key: 'Permissions-Policy',
  value: 'display-capture=self'
}]
```

### 3. **Label Validation**
- Conservative approach: assumes invalid unless proven valid
- Multiple pattern checks for cross-browser compatibility
- Debug logging for troubleshooting

## 🎨 User Experience Features

### Visual Guidance
- Clear before/after examples
- Color-coded instructions (✅ green for correct, ❌ red for incorrect)
- Progressive disclosure of help content

### Error Handling
- Context-aware error messages
- Attempt tracking with enhanced guidance
- Graceful fallbacks for unsupported browsers

### Responsive Design
- Mobile-friendly interface
- Accessible components
- Smooth animations and transitions

## 🔍 Testing Scenarios

### Manual Testing

#### Screen Share Validation
1. **Valid Selection**: Choose "Entire Screen" → Should succeed
2. **Tab Selection**: Choose a browser tab → Should be rejected
3. **Window Selection**: Choose an application window → Should be rejected
4. **Permission Denied**: Cancel the prompt → Should show appropriate error
5. **Multiple Attempts**: Retry several times → Should show progressive help

#### Multi-Monitor Detection Testing
1. **Single Monitor**: Normal cursor movement → No alerts
2. **Multi-Monitor Setup**: Move cursor to secondary monitor → Should show popup alert
3. **Alert Frequency**: Test multiple detections → Should not spam (max one per 3 seconds)

### Debug Mode
- Check browser console for track labels
- Monitor network requests
- Verify stream termination

## 🚀 Customization

### Modify Validation Logic
```javascript
// Add custom patterns to validateTrackLabel function
const customInvalidPatterns = ['your-custom-pattern'];
const customValidPatterns = ['your-valid-pattern'];
```

### Styling
- Edit `styles/globals.css` for global styles
- Modify Tailwind classes in components
- Customize colors and animations

### Error Messages
```javascript
const getErrorMessage = (label) => {
  // Customize messages based on label content
  return 'Your custom error message';
};
```

## 📊 Analytics Integration

Add tracking for:
- Screen share attempts
- Validation failures
- User retry patterns
- Success rates

```javascript
// Example analytics integration
const trackEvent = (eventName, properties) => {
  // Your analytics implementation
};
```

## 🐛 Troubleshooting

### Common Issues

1. **API Not Available**
   - Ensure HTTPS connection
   - Check browser compatibility
   - Verify permissions policy

2. **Validation Failures**
   - Check console for track labels
   - Verify pattern matching logic
   - Test across different browsers

3. **Stream Not Stopping**
   - Ensure all tracks are stopped
   - Check for memory leaks
   - Verify cleanup on component unmount

## 📝 Technical Notes

### Track Label Patterns by Browser

**Chrome**:
- Full screen: `"Screen 1"`, `"Screen 2"`
- Tab: `"Chrome Tab"`
- Window: `"Window - Application Name"`

**Firefox**:
- Full screen: `"Screen"`
- Tab: `"Firefox Tab"`
- Window: `"Window"`

**Safari**:
- Full screen: `"Screen"`
- Tab: `"Safari Tab"`

### API Requirements
- Requires user gesture (button click)
- HTTPS-only API
- Browser compatibility varies

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure cross-browser compatibility
5. Submit pull request

## 📄 License

MIT License - feel free to use in your projects!

---

**🔒 Security Note**: This system provides client-side validation only. For sensitive applications, implement additional server-side verification and monitoring. 