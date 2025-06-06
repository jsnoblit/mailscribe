# MailScribe - Email Audit Tool
## Product Requirements Document

### 1. Product Overview

**Product Name:** MailScribe  
**Version:** 1.0  
**Purpose:** A web application for auditing email communications across multiple brands by searching, filtering, and capturing visual screenshots of emails for analysis and documentation.

**Target Users:** Internal audit teams, marketing teams, compliance teams  
**Primary Use Case:** Visual documentation and analysis of email campaigns across multiple brand portfolios for audit purposes in Figma

### 2. Core Features

#### 2.1 Authentication & Access
- **Gmail OAuth Integration**: Secure authentication using Gmail API with read-only access
- **Single Account Access**: Initially designed for one test account, expandable for team use
- **Persistent Session**: Maintain authentication across browser sessions

#### 2.2 Email Search & Filtering

**Search Parameters:**
- **Brand Filter**: 
  - Dropdown or text input for specific brand/sender domains
  - "All" option to search across all brands
  - Support for multiple sender email patterns (e.g., @expedia.com, @hotels.com)
- **Subject Filter**:
  - Text input for keyword search in subject lines
  - "All" option to include all subjects
  - Case-insensitive partial matching
- **Date Range Filter**:
  - Start date and end date pickers
  - Default to last 30 days
  - Support for Gmail API date operators

**Search Logic:**
- Combine filters using AND logic (Brand AND Subject AND Date Range)
- Handle "All" selections appropriately (no filter applied)
- Return individual emails only (no thread grouping)
- Maximum 50 results per search to manage performance

#### 2.3 Email Results Display
- **Results List View**:
  - Sender email address
  - Subject line (truncated if long)
  - Date sent
  - Preview snippet (first 100 characters)
- **Selection Interface**:
  - Individual checkboxes for each email
  - "Select All" / "Deselect All" toggle
  - Visual indication of selected items
  - Selected count display

#### 2.4 Screenshot Capture
- **Full Content Screenshots**: Capture complete email content as rendered HTML
- **PNG Format**: High-quality PNG files suitable for Figma import
- **Content Scope**: Email body content only (exclude Gmail UI, headers, navigation)
- **Responsive Rendering**: Ensure proper display across different screen sizes
- **Batch Processing**: Handle multiple emails in sequence with progress indication

#### 2.5 File Management & Downloads
- **Individual Downloads**: Single email screenshots
- **Batch Downloads**: ZIP file containing all selected screenshots
- **File Naming Convention**: `{brand}_{subject}_{date}_{emailId}.png`
- **Progress Tracking**: Real-time progress bar during screenshot generation
- **Error Handling**: Skip failed screenshots, continue with batch

### 3. Technical Requirements

#### 3.1 Architecture
- **Frontend**: Next.js React application
- **Backend**: Firebase Functions for API calls and screenshot generation
- **Authentication**: Firebase Auth with Google OAuth
- **Hosting**: Firebase Hosting
- **Storage**: Local downloads (future: SharePoint integration)

#### 3.2 APIs & Integrations
- **Gmail API**: 
  - Scope: `gmail.readonly`
  - Rate limiting: Respect Gmail API quotas
  - Error handling: Graceful degradation on API failures
- **Puppeteer**: Headless browser for screenshot generation
- **Firebase SDK**: Authentication, functions, hosting

#### 3.3 Performance Requirements
- **Search Response Time**: < 5 seconds for typical queries
- **Screenshot Generation**: < 10 seconds per email
- **Batch Processing**: Support up to 20 emails per batch
- **Error Recovery**: Retry failed operations, continue batch processing

### 4. User Interface Requirements

#### 4.1 Search Interface
- **Clean, Professional Design**: Minimal, intuitive layout
- **Form Validation**: Required field indicators, input validation
- **Search State Management**: Loading states, error messages
- **Responsive Design**: Mobile-friendly layout

#### 4.2 Results Interface
- **Scannable List View**: Easy to review multiple emails quickly
- **Bulk Actions**: Clear selection management
- **Action Buttons**: Prominent screenshot and download buttons
- **Status Indicators**: Processing status, completion status

#### 4.3 Processing Interface
- **Progress Visualization**: Progress bars, step indicators
- **Real-time Updates**: Live status of screenshot generation
- **Error Reporting**: Clear error messages for failed operations
- **Completion Actions**: Download prompts, success confirmations

### 5. Error Handling & Edge Cases

#### 5.1 API Limitations
- **Rate Limiting**: Implement backoff strategies for Gmail API limits
- **Quota Exhaustion**: User-friendly messages when limits are reached
- **Network Failures**: Retry logic with exponential backoff

#### 5.2 Screenshot Failures
- **Rendering Issues**: Handle malformed HTML, missing images
- **Memory Constraints**: Optimize Puppeteer for large emails
- **Timeout Handling**: Set reasonable timeouts, provide fallback options

#### 5.3 User Experience
- **Empty Results**: Clear messaging when searches return no results
- **Large Batches**: Warning messages for large screenshot batches
- **Browser Compatibility**: Support for modern browsers (Chrome, Firefox, Safari, Edge)

### 6. Security & Privacy

#### 6.1 Data Handling
- **Minimal Data Retention**: No storage of email content beyond session
- **Secure Authentication**: OAuth 2.0 best practices
- **API Key Management**: Secure storage of Firebase and Gmail API credentials

#### 6.2 Access Control
- **Read-Only Access**: Gmail integration limited to read operations
- **Session Management**: Secure session handling, automatic logout
- **Data Transmission**: HTTPS for all communications

### 7. Future Enhancements

#### 7.1 Phase 2 Features
- **SharePoint Integration**: Direct upload to SharePoint folders
- **Team Collaboration**: Multi-user access with role management
- **Advanced Filtering**: Custom filters, saved searches
- **Export Formats**: PDF export, bulk metadata export

#### 7.2 Phase 3 Features
- **Email Analytics**: Campaign performance metrics
- **Template Detection**: Identify and categorize email templates
- **Automated Auditing**: Scheduled audits with reporting
- **Integration APIs**: Connect with other audit tools

### 8. Success Metrics

#### 8.1 Performance Metrics
- **Search Accuracy**: Relevant results returned for queries
- **Screenshot Quality**: High-fidelity captures suitable for audit work
- **Processing Speed**: Efficient batch operations
- **Uptime**: 99%+ availability

#### 8.2 User Experience Metrics
- **Task Completion**: Successfully complete audit workflows
- **Error Rate**: < 5% failure rate for screenshot generation
- **User Satisfaction**: Positive feedback on ease of use

### 9. Technical Constraints

#### 9.1 Gmail API Limits
- **Daily Quota**: 1 billion quota units per day
- **Per-user Rate Limit**: 250 quota units per user per 100 seconds
- **Batch Size**: Maximum 100 requests per batch

#### 9.2 Firebase Function Limits
- **Memory**: 1GB maximum memory per function
- **Timeout**: 9 minutes maximum execution time
- **Concurrent Executions**: 1000 concurrent function executions

#### 9.3 Browser Limitations
- **File Download**: Handle browser download restrictions
- **Memory Usage**: Manage client-side memory for large operations
- **Cross-Origin**: Ensure proper CORS configuration

### 10. Implementation Phases

#### Phase 1: Core Functionality (MVP)
- Gmail authentication and basic search
- Screenshot generation for individual emails
- Local file downloads

#### Phase 2: Enhanced Features
- Batch processing and ZIP downloads
- Advanced search filters
- Improved error handling

#### Phase 3: Enterprise Features
- SharePoint integration
- Multi-user support
- Advanced analytics and reporting