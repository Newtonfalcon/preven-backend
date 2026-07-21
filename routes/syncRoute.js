import express from "express"
import { syncUser } from "../controllers/syncUser.js"

const syncRouter = express.Router()

syncRouter.post("/webhooks/clerk", express.raw({type: 'application/json'}),  syncUser )

export default syncRouter
