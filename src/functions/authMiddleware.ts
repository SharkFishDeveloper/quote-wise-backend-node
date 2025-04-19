import jwt from 'jsonwebtoken'


//@ts-ignore
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        return res.status(300).json({ message: 'No token provided' })
    }
    
    try {
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET as string)
        //@ts-ignore
        req.userId = decoded.userId;
        // console.log("decoded",decoded)
        next()
  } catch (err) {
    //@ts-ignore
    if (err.name === 'TokenExpiredError') {
      return res.status(300).json({ error: 'Token expired, please login again' })
    }
    return res.status(300).json({ error: 'Invalid token' })
  }
}
