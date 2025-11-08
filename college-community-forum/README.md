# College Community Forum

A modern, production-ready community forum built for colleges, enabling students and faculty to connect, share knowledge, and engage through posts, comments, and discussions.

## 🌟 Features

- **User Authentication** - Secure JWT-based authentication with HTTP-only cookies
- **User Roles** - Support for Students, Faculty, and Admin users
- **Post Management** - Create, edit, delete, and like posts
- **Comments** - Real-time commenting system
- **Search & Filters** - Search posts by keywords, filter by category and tags
- **User Profiles** - Customizable user profiles with bio and user stats
- **Responsive Design** - Mobile-first, fully responsive UI
- **Dark/Light Theme** - Toggle between dark and light modes
- **Real-time Updates** - Optimistic UI updates for better UX

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** with **Mongoose** - NoSQL database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Deployment
- **Vercel** - Frontend and API hosting
- **MongoDB Atlas** - Cloud database

## 📁 Project Structure

```
college-community-forum/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.js
│   │   │   ├── login/route.js
│   │   │   ├── logout/route.js
│   │   │   └── me/route.js
│   │   ├── posts/
│   │   │   ├── route.js
│   │   │   ├── [id]/route.js
│   │   │   ├── [id]/like/route.js
│   │   │   └── [id]/comment/route.js
│   │   └── users/
│   │       └── [id]/route.js
│   ├── create/page.js
│   ├── login/page.js
│   ├── register/page.js
│   ├── post/[id]/page.js
│   ├── profile/[id]/page.js
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   ├── AuthProvider.jsx
│   ├── CommentSection.jsx
│   ├── Navbar.jsx
│   ├── PostCard.jsx
│   └── ThemeProvider.jsx
├── lib/
│   ├── auth.js
│   ├── dbConnect.js
│   └── utils.js
├── models/
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.17.0
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB installation)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd college-community-forum
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-forum?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**Generating a secure JWT secret:**

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Click "Connect" and select "Connect your application"
4. Copy the connection string and replace `<password>` with your database password
5. Add your IP address to the IP whitelist or allow access from anywhere (0.0.0.0/0)
6. Paste the connection string in your `.env` file as `MONGODB_URI`

### Local MongoDB

If using local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/college-forum
```

## 📡 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "branch": "Computer Science",
  "year": 2,
  "role": "student"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Get Current User
```http
GET /api/auth/me
```

### Posts

#### Get All Posts (with filters)
```http
GET /api/posts?page=1&limit=10&q=search&category=Academic&tag=programming
```

#### Create Post (Auth Required)
```http
POST /api/posts
Content-Type: application/json

{
  "title": "Introduction to React",
  "content": "React is a JavaScript library...",
  "category": "Academic",
  "tags": ["react", "javascript", "frontend"]
}
```

#### Get Single Post
```http
GET /api/posts/:id
```

#### Update Post (Auth Required, Author Only)
```http
PUT /api/posts/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

#### Delete Post (Auth Required, Author/Admin Only)
```http
DELETE /api/posts/:id
```

#### Like/Unlike Post (Auth Required)
```http
POST /api/posts/:id/like
```

#### Add Comment (Auth Required)
```http
POST /api/posts/:id/comment
Content-Type: application/json

{
  "content": "Great post!"
}
```

### Users

#### Get User Profile
```http
GET /api/users/:id
```

#### Update User Profile (Auth Required, Same User/Admin)
```http
PUT /api/users/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "This is my bio",
  "branch": "Computer Science",
  "year": 3
}
```

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds of 12
- **JWT Authentication** - Secure token-based authentication
- **HTTP-Only Cookies** - Tokens stored in secure HTTP-only cookies
- **Input Sanitization** - Server-side input validation and sanitization
- **CORS Protection** - Configured for production
- **Environment Variables** - Sensitive data stored in environment variables

### Production Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT_SECRET (at least 32 characters)
- [ ] Enable secure cookies (`secure: true`) in production
- [ ] Configure CORS for specific origins
- [ ] Rate limit authentication endpoints
- [ ] Implement CSRF protection
- [ ] Add input validation on all endpoints
- [ ] Keep dependencies updated

## 🚢 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **Deploy to Vercel**

- Go to [Vercel](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Add environment variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
  - `NODE_ENV=production`

3. **Update MongoDB Atlas**

- Add your Vercel deployment URL to MongoDB Atlas IP whitelist
- Or allow all IPs: `0.0.0.0/0` (less secure)

### Environment Variables for Production

```env
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## 🧪 Testing

### Manual Testing

1. **Authentication Flow**
   - Register a new user
   - Login with credentials
   - Access protected routes
   - Logout

2. **Post Operations**
   - Create a new post
   - View post details
   - Edit your post
   - Delete your post
   - Like/unlike posts

3. **Comments**
   - Add comments to posts
   - View comments

4. **User Profile**
   - View user profiles
   - Edit your profile
   - View user's posts

### Example Test Data

Create a test user:
```json
{
  "name": "Test User",
  "email": "test@college.edu",
  "password": "testpass123",
  "branch": "Computer Science",
  "year": 2,
  "role": "student"
}
```

## 📝 Additional Features to Implement

- [ ] Admin dashboard for user/post moderation
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Post categories management
- [ ] User notifications
- [ ] File upload for profile pictures
- [ ] Post voting system
- [ ] Bookmarks/favorites
- [ ] Direct messaging between users
- [ ] Search autocomplete
- [ ] Advanced filtering options

## 🐛 Troubleshooting

### Common Issues

**Issue: MongoDB Connection Error**
- Verify your MONGODB_URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure your database user has correct permissions

**Issue: JWT Authentication Fails**
- Verify JWT_SECRET is set in .env
- Clear browser cookies
- Check cookie settings (httpOnly, secure, sameSite)

**Issue: Build Errors**
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Ensure Node.js version >= 18.17.0

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributors

Built with ❤️ for college communities

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database
- Vercel for hosting
- Tailwind CSS for styling utilities
- The open-source community

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Happy Coding! 🎉**
