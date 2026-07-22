import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import 'dotenv/config'

import { connectDB } from './db.js'
import scanRouter from './routes/scanRoute.js'
import syncRouter from './routes/syncRoute.js'
import userRouter from './routes/userRoute.js'
import { summarizeText } from './controllers/summary.js'

const app = express()
const port = process.env.PORT || 3000

connectDB()

// Only browser-based clients (e.g. Expo web) are subject to CORS — native
// iOS/Android builds hit this API directly and are unaffected either way.
// Set ALLOWED_ORIGINS as a comma-separated list in production (e.g.
// "https://app.preven.com,https://preven.expo.dev"); everything below is a
// sane default for local dev with the Expo web/Metro server.
const defaultDevOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
]
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : defaultDevOrigins

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (curl, native apps, server-to-server) and
      // any explicitly allow-listed browser origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  })
)

// Clerk's webhook signature check needs the raw, unparsed request body,
// so this must be mounted before express.json() touches the body.
// (routes/syncRoute.js applies express.raw() itself for this exact route.)
app.use('/api/v1', syncRouter)

app.use(express.json())
app.use(clerkMiddleware())

app.use('/api/v1', scanRouter)
app.use('/api/v1', userRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/sum', async (req, res) => {
  const { summary } = req.body;

  if (!summary) {
    return res.status(400).json({
      status: false,
      message: "No summary provided"
    });
  }

  try {
    // Renamed variable to summaryResult to avoid shadowing express 'res'
    const summaryResult = await summarizeText(summary);

    return res.status(200).json({
      status: true,
      message: summaryResult
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message || "An unexpected error occurred"
    });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})



// Centralized error handler — Express 5 forwards rejected async
// handlers here automatically, so this catches anything unhandled.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})