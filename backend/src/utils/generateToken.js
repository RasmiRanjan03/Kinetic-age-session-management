import jwt from 'jsonwebtoken';

/**
 * Sign a JSON Web Token for the user session.
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'super_secret_session_key_kinetic',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

export default generateToken;
