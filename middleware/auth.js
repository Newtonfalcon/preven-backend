import { getAuth } from "@clerk/express";


export const requireClerkAuth = (req, res, next) => {
  const authState = getAuth(req)

  if (!authState || !authState.userId) {
    return res.status(401).json({
      error: "Unauthorized. please sign in to access resource"
    })
  }

  req.userId = authState.userId
  next()
}
