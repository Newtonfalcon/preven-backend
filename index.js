import express from 'express'
import multer from 'multer'
import { clerkMiddleware } from '@clerk/express'
import { GoogleGenAI } from '@google/genai'
import visualLog from './models/visualLog.js'
import 'dotenv/config'


import router from './routes/scanRoute.js'
import { connectDB } from './db.js'
import { requireClerkAuth } from './middleware/auth.js'
import syncRouter from './routes/syncRoute.js'
import { requireAuth } from './middleware/auth.middle.js'



const app = express()
const port = process.env.PORT || 3000
const apikey = process.env.GEMINI_API_KEY


// here we connect db

connectDB()
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})


//app.use("/api/v1", syncRouter)

app.use(express.json())
app.use(clerkMiddleware())



//app.use('/api/v1/upload',requireAuth, upload.single('photo'), router)
app.get('/protected-route', (req, res) => {
  console.log('Authorization Header Received:', req.headers.authorization);
  console.log('Clerk Auth Object:', getAuth(req));
  // Access full MongoDB user object
  res.json({
    message: `Hi ${req.user } }!`,
    user: req.user,
  });
});







// GET /api/user/profile
app.get('api/user/profile', async (req, res) => {
  try {
    // req.user is attached automatically by requireAuth
    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        imageUrl: req.user.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});



app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
