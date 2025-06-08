# MailScribe

MailScribe is a web application designed to streamline your email management process. It leverages the power of AI to help you search, summarize, and manage your emails more efficiently. This starter kit is built with Next.js and Firebase, providing a robust foundation for building a powerful email productivity tool.

## Features

- **AI-Powered Email Search**: Quickly find the emails you need with natural language search queries.
- **Email Summarization**: Get the gist of long emails and threads without reading through everything.
- **Gmail Integration**: Securely connect your Gmail account to manage your emails within MailScribe.
- **User Authentication**: Secure user authentication using Firebase Authentication.
- **Cloud Functions**: Scalable backend logic powered by Firebase Cloud Functions.
- **Enhanced Screenshot Capabilities**: Capture and analyze screenshots of your emails for more complex workflows.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- A Google account with Gmail enabled

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mailscribe.git
    cd mailscribe
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    - Follow the instructions in the `AUTH-SETUP-GUIDE.md` to configure Firebase Authentication and enable the Gmail API.

4.  **Set up environment variables:**
    - Create a `.env.local` file in the root of the project.
    - Add the necessary Firebase configuration and other environment variables to this file. You can find a template in `.env.example`.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- **`src/app`**: Contains the main application pages and API routes.
- **`src/components`**: Reusable React components for the UI.
- **`src/lib`**: Utility functions and libraries.
- **`src/hooks`**: Custom React hooks.
- **`src/ai`**: AI-related logic and flows.
- **`functions`**: Firebase Cloud Functions source code.
- **`docs`**: Project documentation.

## Key Dependencies

- [Next.js](https.nextjs.org/) - React framework for building the user interface.
- [Firebase](https://firebase.google.com/) - Platform for building web and mobile applications.
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for styling.
- [Puppeteer](https://pptr.dev/) - Headless Chrome Node.js library for browser automation.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.
