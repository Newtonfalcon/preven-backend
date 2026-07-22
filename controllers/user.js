// req.user is attached by the requireAuth middleware (see middleware/auth.middle.js)
export const getProfile = async (req, res) => {
  try {
    const { _id, clerkId, email, firstName, lastName, imageUrl, profileStatus } = req.user

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: _id,
        clerkId,
        email,
        firstName,
        lastName,
        imageUrl,
        profileStatus,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return res.status(500).json({ error: 'Failed to fetch user profile' })
  }
}