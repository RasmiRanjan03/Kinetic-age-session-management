import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Client from '../models/Client.js';

// Setup Passport Google Strategy
const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth credentials missing in environment variables. Google sign-in will not function correctly.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5003/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (!email) {
            return done(new Error('Google account must have an email address associated with it'), null);
          }

          const googleId = profile.id;
          let name = profile.displayName;
          if (!name || name.includes('@')) {
            name = (profile.name?.givenName && profile.name?.familyName)
              ? `${profile.name.givenName} ${profile.name.familyName}`
              : 'Google User';
          }
          name = name.replace(/\s+/g, ' ').trim();
          if (name.length < 3) {
            name = 'Google User';
          }
          const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          // 1. Automatically find or create Client profile
          let client = await Client.findOne({ email: email.toLowerCase() });
          if (!client) {
            client = await Client.create({
              fullName: name,
              email: email.toLowerCase(),
              phone: '9999999999',
              age: 65,
              gender: 'Other',
              address: '123 Wellness Center Drive',
              emergencyContact: 'N/A',
              status: 'Active',
              subscriptionStatus: 'None'
            });
          }

          // 2. Search for user by googleId
          let user = await User.findOne({ googleId });
          
          if (!user) {
            // 3. Search for user by email to link standard accounts
            user = await User.findOne({ email: email.toLowerCase() });
            
            if (user) {
              // Link account
              user.googleId = googleId;
              user.authProvider = 'Google';
              if (profilePicture && !user.profilePicture) {
                user.profilePicture = profilePicture;
              }
              user.clientId = client._id;
              await user.save();
            } else {
              // 4. Create a new User linked to client
              user = await User.create({
                name,
                email: email.toLowerCase(),
                googleId,
                profilePicture,
                authProvider: 'Google',
                role: 'user',
                clientId: client._id,
              });
            }
          } else {
            // Ensure pre-existing Google user has clientId linked
            if (!user.clientId) {
              user.clientId = client._id;
              await user.save();
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};

export default configurePassport;
