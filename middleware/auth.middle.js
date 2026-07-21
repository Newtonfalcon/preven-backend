import { getAuth, clerkClient } from '@clerk/express';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    // ALWAYS use getAuth(req) with @clerk/express
    const { userId } = getAuth(req);
    console.log(req)
    console.log(userId)

    if (!userId) {
      console.log("please log in")
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }

    let user = await User.findOne({ clerkId: userId });

    // Fallback sync if database record doesn't exist yet
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ error: 'Authentication failed.' });
  }
};
