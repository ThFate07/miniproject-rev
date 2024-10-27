const jwt = require('jsonwebtoken');
const secret = "your_jwt_secret";

const authMiddleware = (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.body.email = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;