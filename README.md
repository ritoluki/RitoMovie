# RitoMovie - Movie Streaming Platform

A modern, full-featured movie streaming website built with React, TypeScript, Node.js, Express, and MongoDB.

## ⚠️ IMPORTANT NOTICE

**This project is for EDUCATIONAL and PERSONAL USE ONLY - NOT for commercial use.**

This is a learning project created to demonstrate web development skills and modern technologies. It is **NOT intended for commercial purposes, monetization, or business use**. The project uses TMDB API for educational purposes and all movie data belongs to their respective copyright owners.

🚫 **Prohibited Uses:**
- ❌ Commercial deployment or hosting
- ❌ Selling or monetizing this software
- ❌ Using for business purposes
- ❌ Distributing copyrighted content illegally

✅ **Permitted Uses:**
- ✔️ Learning and educational purposes
- ✔️ Portfolio demonstration
- ✔️ Personal development and testing
- ✔️ Contributing to open-source improvements

---

## 🎬 Features

- **Browse Movies**: Explore trending, popular movies and filter by genres
- **Movie Details**: View detailed information, trailers, cast, and similar movies
- **Video Streaming**: Watch movies with HLS video player and custom controls
- **User Authentication**: Register, login with JWT authentication
- **Personal Watchlist**: Save favorite movies to your list
- **Watch History**: Track viewing progress and resume watching
- **Movie Ratings**: Rate and review movies
- **Search**: Find movies by title with advanced filters
- **Responsive Design**: Beautiful UI that works on all devices

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **React Router** - Client-side routing
- **React Query** - Data fetching & caching
- **Zustand** - State management
- **Framer Motion** - Animations
- **HLS.js** - Video streaming
- **Axios** - HTTP client

### Backend
- **Node.js** with Express
- **TypeScript**
- **MongoDB** with Mongoose
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **TMDB API** - Movie data
- **Multer** - File uploads

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)

You'll also need:
- TMDB API Key (free) - Get it from [TMDB](https://www.themoviedb.org/settings/api)

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd RitoMovie
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

## 🏃 Running the Application

### Development Mode

**Backend** (from backend directory):
```bash
npm run dev
```
Server will run on http://localhost:5000

**Frontend** (from frontend directory):
```bash
npm run dev
```
App will run on http://localhost:5173

### Production Build

**Backend**:
```bash
npm run build
npm start
```

**Frontend**:
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
PersonalProject/
├── backend/
│   ├── src/
│   │   ├── models/          # Database models
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── config/          # Configuration
│   │   └── server.ts        # Entry point
│   ├── uploads/             # Uploaded files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   ├── styles/          # Global styles
│   │   ├── routes/          # Route configuration
│   │   └── lib/             # Third-party configs
│   └── package.json
└── README.md
```

## 🎨 Features in Detail

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes
- Profile management

### Movie Browsing
- Trending movies
- Popular movies
- Movies by genre
- Search functionality
- Advanced filters (genre, year, rating)

### Movie Details
- Full movie information
- Watch trailers
- View cast and crew
- Similar movie recommendations
- User ratings and reviews

### Video Player
- HLS streaming support
- Custom playback controls
- Quality selection
- Playback speed control
- Keyboard shortcuts
- Progress tracking
- Picture-in-picture mode

### User Features
- Personal watchlist
- Watch history with resume
- Movie ratings
- Profile customization

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/genre/:id` - Get movies by genre
- `GET /api/movies/search` - Search movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/:id/videos` - Get movie videos

### User Features
- `GET /api/users/watchlist` - Get user's watchlist
- `POST /api/users/watchlist/:id` - Add to watchlist
- `DELETE /api/users/watchlist/:id` - Remove from watchlist
- `GET /api/users/history` - Get watch history
- `POST /api/users/history` - Save watch progress

## 🎯 Future Enhancements

- [ ] TV Shows support
- [ ] Social features (comments, sharing)
- [ ] Advanced recommendation algorithm
- [ ] Multiple user profiles
- [ ] Download for offline viewing
- [ ] Subtitle support
- [ ] Multi-language support
- [ ] Admin dashboard
- [ ] Payment integration

## 📝 License

**NON-COMMERCIAL USE LICENSE**

This project is provided for **educational and personal use only**. 

### Terms:
- ✅ You MAY use this code for learning, studying, and personal projects
- ✅ You MAY modify and improve the code for educational purposes
- ✅ You MAY showcase this project in your portfolio (non-commercial)
- ❌ You MAY NOT use this project for any commercial purposes
- ❌ You MAY NOT sell, rent, or monetize this software or derivatives
- ❌ You MAY NOT deploy this for business or profit-making activities
- ❌ You MAY NOT distribute copyrighted content through this platform

**Copyright Notice:** This software is provided "AS IS" without warranty of any kind. All movie data, images, and related content are property of their respective copyright holders (TMDB, movie studios, etc.). This project does not claim ownership of any third-party content.

For any commercial inquiries or licensing questions, please contact the maintainers.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for providing the movie database API
- [React](https://react.dev/) for the amazing frontend library
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📧 Contact

For any questions or suggestions, please open an issue or contact the maintainers.

---

## ⚠️ DISCLAIMER

**This is a NON-COMMERCIAL educational project.**

RitoMovie is created solely for learning purposes and portfolio demonstration. It is NOT intended for production use, commercial deployment, or any profit-making activities. The developer(s) do not encourage or support piracy or illegal distribution of copyrighted content.

All trademarks, movie titles, images, and data are property of their respective owners. This project uses TMDB API for educational purposes under their terms of service.

**If you plan to create a commercial streaming platform, you must:**
1. Obtain proper licenses for content distribution
2. Comply with copyright laws in your jurisdiction
3. Secure commercial API agreements with data providers
4. Implement proper content protection (DRM, etc.)
5. Follow all applicable regulations and legal requirements

---

Built with ❤️ using React and Node.js | **For Educational Purposes Only** | **Not for Commercial Use**

