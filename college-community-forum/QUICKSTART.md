# Quick Start Guide

Get the College Community Forum up and running in 5 minutes!

## 🚀 Fast Setup

### 1. Install Dependencies

```bash
cd college-community-forum
npm install
```

### 2. Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login
3. Create a new FREE cluster
4. Click "Connect" → "Connect your application"
5. Copy your connection string

### 3. Configure Environment

Create a `.env` file:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Edit `.env` and add your values:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/college-forum?retryWrites=true&w=majority
JWT_SECRET=my-super-secret-key-at-least-32-characters-long-abc123
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ Test It Out

### Create Your First Account

1. Click "Sign Up" in the navbar
2. Fill in:
   - Name: John Doe
   - Email: john@college.edu
   - Password: password123
   - Branch: Computer Science
   - Year: 2
3. Click "Create Account"

### Create Your First Post

1. Click "Create Post" in the navbar
2. Add:
   - Title: "Welcome to the Forum!"
   - Content: "This is my first post..."
   - Category: General
   - Tags: welcome, introduction
3. Click "Create Post"

### Test Features

- ❤️ Like the post
- 💬 Add a comment
- 👤 View your profile
- 🎨 Toggle dark/light theme
- 🔍 Search and filter posts

## 🎯 Next Steps

1. **Customize**: Update colors, branding, and features
2. **Deploy**: Follow the deployment guide in README.md
3. **Share**: Invite your college community!

## 📱 Features You Can Use Now

- ✅ User registration & authentication
- ✅ Create, edit, delete posts
- ✅ Like posts
- ✅ Comment on posts
- ✅ User profiles
- ✅ Search & filter
- ✅ Dark/light theme
- ✅ Responsive design

## 🆘 Having Issues?

### MongoDB Connection Failed?

1. Check your connection string in `.env`
2. Verify MongoDB Atlas allows connections from all IPs:
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0`
3. Restart the dev server

### Can't Login?

1. Clear browser cookies
2. Make sure JWT_SECRET is set in `.env`
3. Restart the dev server

### Port 3000 Already in Use?

```bash
# Kill the process
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

## 📚 Learn More

- Full documentation: See `README.md`
- API documentation: See API section in `README.md`
- Deployment guide: See Deployment section in `README.md`

---

**Enjoy building your community! 🎉**
