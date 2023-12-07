const jwt = require('jsonwebtoken');

const generateToken = (email) => {
    const payload = {
        user: email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return token;
};

module.exports = generateToken