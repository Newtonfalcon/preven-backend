import express from 'express'
import { requireAuth } from '../middleware/auth.middle.js'
import { getProfile } from '../controllers/user.js'

const router = express.Router()

// Protected: requires a signed-in Clerk user
router.get('/user/profile', requireAuth, getProfile)

export default router