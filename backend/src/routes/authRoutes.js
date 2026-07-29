import express from 'express';
import passport from 'passport';
import { register, login, getMe, forgotPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

// Google OAuth Authorization initiation
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// Google OAuth Callback URL
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (err || !user) {
      const errMsg = err ? encodeURIComponent(err.message) : 'Google login failed';
      return res.redirect(`${clientUrl}/login?error=${errMsg}`);
    }

    // Dynamic Super Admin Check for Google logins
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@kineticage.com';
    const isSuperAdmin = user.email.toLowerCase() === superAdminEmail.toLowerCase();
    const expectedRole = isSuperAdmin ? 'admin' : 'user';

    if (user.role !== expectedRole) {
      user.role = expectedRole;
      await user.save();
    }

    const token = generateToken(user._id, user.role);
    res.redirect(`${clientUrl}/login?token=${token}`);
  })(req, res, next);
});

export default router;
