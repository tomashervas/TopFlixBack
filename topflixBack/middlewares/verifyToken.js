const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.query.token;
  
    if (!token) {
      return res.status(403).json({ message: 'No token' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('ERROR', err)
        return res.status(401).json({ message: 'Invalid token' });
      }

     console.log("decoded",decoded)

      req.user = decoded.user;

     if(!decoded.admin) return res.status(403).json({ message: 'Forbidden' });

      next();
    });
  };

  module.exports = verifyToken