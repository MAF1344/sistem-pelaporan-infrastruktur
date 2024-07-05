const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secretKey = 'kuncirahasia'; // Use a secure key in production

function hashPassword(password) {
  return bcrypt.hashSync(password, 8);
}

function comparePassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    password: user.password,
  };

  return jwt.sign(payload, secretKey, {expiresIn: '5h'});
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
};
