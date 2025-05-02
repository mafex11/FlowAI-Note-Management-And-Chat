# NotesAI - AI-Powered Study Notes Platform

NotesAI is a Next.js application that helps students organize, visualize, and interact with their study notes using AI. The platform allows you to upload PDF documents, which are then processed to extract key topics, generate summaries, and create interactive 3D topic flowcharts.

## Features

- **PDF Upload**: Upload your study notes and documents in PDF format
- **AI-Powered Analysis**: Automatic extraction of key topics and generation of summaries
- **3D Topic Visualization**: Interactive 3D flowcharts showing connections between topics
- **Intelligent Chat**: Ask questions about your notes and get AI-powered answers with citations
- **Organization**: Notes are automatically organized by subject and course code
- **Document Management**: Easily browse, search, and manage your uploaded documents
- **Authentication**: Secure user authentication system

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS, shadcn UI components
- **Backend**: Next.js API Routes, MongoDB (with Mongoose)
- **Authentication**: NextAuth.js
- **AI Integration**: Perplexity AI API
- **File Storage**: Cloudinary
- **3D Visualization**: Three.js, React Three Fiber, Drei

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database
- Cloudinary account
- Perplexity AI API key

### Environment Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in the required values:

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/notes-ai

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Perplexity AI
PERPLEXITY_API_KEY=your-perplexity-api-key
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at http://localhost:3000.

## Project Structure

```
notes-ai/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── page.tsx           # Landing page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   └── ui/                # UI components (shadcn)
│   ├── lib/                   # Utility functions
│   ├── models/                # Mongoose models
│   ├── providers/             # React context providers
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
└── ...
```

## API Routes

- `/api/auth/*` - Authentication endpoints (NextAuth.js)
- `/api/upload` - Upload and process PDF documents
- `/api/documents` - Get all user documents
- `/api/documents/[id]` - Get, update, or delete a specific document
- `/api/chat` - Ask questions about documents

## Deployment

This project can be deployed on Vercel or any other Next.js compatible hosting platform:

```bash
# Build for production
npm run build

# Start the production server
npm start
```

## License

[MIT](LICENSE)
