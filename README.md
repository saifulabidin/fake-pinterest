# Pinterest Clone - MERN Stack Application

A full-featured Pinterest clone built using the MERN stack (MongoDB, Express, React, Node.js) with Firebase authentication. This application allows users to browse, upload, and manage images in a masonry-style grid layout similar to Pinterest.

## Features

- **User Authentication**
  - Sign up and login using GitHub OAuth via Firebase
  - Protected routes for authenticated users
  - User profile management
  
- **Image Management**
  - Upload images from local files
  - Add images via URL links
  - Delete your own images with modern confirmation dialogs
  - Add titles, descriptions, and tags to images
  
- **Pinterest-Style Layout**
  - Responsive masonry grid layout for images
  - Smooth animations and transitions using Framer Motion
  - Dark/light mode theme support
  - Mobile-responsive design
  
- **Profile Pages**
  - View user profiles with their uploaded images
  - User stats and image collections
  - Filter images by tags
  
- **Image Viewing**
  - Dedicated image detail page
  - Related images suggestions
  - User information for each image
  
- **Robust Image Handling**
  - Automatic fallback for broken images
  - Preview before upload
  - Image upload progress indicators
  - Image URL validation

## Tech Stack

### Frontend
- **React 19**: Modern UI library
- **Bootstrap 5**: CSS framework for responsive design
- **Vite**: Next-generation frontend build tool
- **React Router**: Client-side routing
- **Axios**: Promise-based HTTP client
- **Framer Motion**: Animation library
- **Context API**: State management
- **Custom Hooks**: Reusable logic

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Firebase Admin**: Authentication and security
- **Multer**: File uploads handling
- **Express Session**: Session management
- **Helmet**: Security middleware

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Firebase account for authentication
- GitHub OAuth set up in Firebase

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/saifulabidin/copy-pinterest.git
cd copy-pinterest
```

2. **Set up environment variables**

Create a `.env` file in the server directory:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/pinterest-clone

# Session Configuration
SESSION_SECRET=your-session-secret

# Firebase Admin Config
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Client URL (for CORS)
CLIENT_ORIGIN=http://localhost:5173
```

Create a `.env` file in the client directory:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id

VITE_API_BASE_URL=http://localhost:5000
```

3. **Install dependencies and start servers**

```bash
# Install server dependencies
cd server
npm install

# Start the server in development mode
npm run dev

# In a new terminal, install client dependencies
cd ../client
npm install

# Start the client
npm run dev
```

4. **Open your browser**

Navigate to `http://localhost:5173` to view the application.

## API Endpoints

### Authentication
- `POST /api/auth/firebase-auth`: Authenticate with Firebase token
- `GET /api/auth/user`: Get current authenticated user
- `GET /api/auth/user/:username`: Get user by username
- `GET /api/auth/logout`: Logout user

### Images
- `GET /api/images`: Get all images with pagination
- `GET /api/images/:id`: Get a specific image by ID
- `GET /api/images/myimages`: Get images for the logged-in user
- `GET /api/images/user/:username`: Get images for a specific user
- `GET /api/images/search`: Search for images by title, description, or tags
- `POST /api/images/url`: Add a new image via URL
- `POST /api/images/upload`: Upload a new image file
- `DELETE /api/images/:id`: Delete an image

## Project Structure

```
├── client/               # Frontend code
│   ├── public/           # Static assets
│   └── src/
│       ├── assets/       # Images, fonts, etc.
│       ├── components/   # Reusable components
│       ├── config/       # Configuration files
│       ├── context/      # Context providers
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Page components
│       ├── services/     # API services
│       └── utils/        # Utility functions
│
└── server/               # Backend code
    ├── config/           # Configuration files
    ├── middleware/       # Express middleware
    ├── models/           # Mongoose models
    ├── routes/           # API routes
    └── uploads/          # Uploaded images storage
```

## Deployment

### Backend
1. Set up MongoDB Atlas for production
2. Deploy to any Node.js hosting service (Heroku, Railway, Render, etc.)
3. Configure environment variables for production

### Frontend
1. Build the production version:
```bash
cd client
npm run build
```
2. Deploy the `dist` directory to any static hosting service (Vercel, Netlify, etc.)

## Future Improvements

- Implement image search optimization
- Add social features (likes, comments)
- Create collections/boards functionality
- Add image editing capabilities
- Implement infinite scrolling

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and continuous deployment, automatically building, testing, and deploying both client and server components to Railway.app.

### Workflow Configuration

Three separate workflows handle the CI/CD process:

1. **Client CI/CD** (`.github/workflows/client-ci-cd.yml`)
   - Triggers on changes to the client code
   - Builds and tests the React application
   - Deploys to Railway.app when merged to main branch

2. **Server CI/CD** (`.github/workflows/server-ci-cd.yml`)
   - Triggers on changes to the server code
   - Builds and validates the Node.js application
   - Deploys to Railway.app when merged to main branch

3. **Full Project CI/CD** (`.github/workflows/full-ci-cd.yml`)
   - Handles project-wide changes that affect both components
   - Can be manually triggered to deploy either or both components
   - Used for coordinated deployments

### Setup Requirements

To enable the CI/CD pipeline:

1. **Add Railway API Token to GitHub Secrets**
   - Generate a Railway API token from the Railway dashboard
   - Add it as a secret named `RAILWAY_TOKEN` in your GitHub repository settings

2. **Ensure Railway Services are Configured**
   - Make sure you have services named "client" and "server" set up in Railway
   - The railway.toml files in both directories should match your Railway configuration

### Manual Deployment

You can manually trigger a full deployment using the "workflow_dispatch" event in GitHub Actions:

1. Go to the Actions tab in your GitHub repository
2. Select the "Full Project CI/CD" workflow
3. Click "Run workflow"
4. Choose which components to deploy (client, server, or both)
5. Start the workflow

### Monitoring Deployments

- Check the GitHub Actions tab for build and deployment status
- Railway.app dashboard provides deployment logs and environment information
- Set up notifications in GitHub to get alerts for failed deployments

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Bootstrap](https://getbootstrap.com/) for UI components
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Firebase](https://firebase.google.com/) for authentication
- [Pinterest](https://pinterest.com) for design inspiration