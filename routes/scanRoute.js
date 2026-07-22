import express from 'express'
import multer from 'multer'
import { getVisualLogById, scan } from '../controllers/scan.js'
import { requireAuth } from '../middleware/auth.middle.js'
import { getUserLongitudinalSummary } from '../controllers/summary.js'

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})

// Protected: requires a signed-in Clerk user before the image is accepted
router.post('/scan', requireAuth, upload.single('photo'), scan)
router.get('/log/:id', requireAuth, getVisualLogById);
router.get('/summary', requireAuth, getUserLongitudinalSummary);

export default router