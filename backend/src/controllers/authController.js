import User from '../models/User.js';
import Client from '../models/Client.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation checks
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all required fields (name, email, password)');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('A user with this email address already exists');
    }

    // Automatically check or create Client profile first
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

    // Create user in database linked to client
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
      clientId: client._id,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        token: generateToken(user._id, user.role),
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: client._id,
        },
      });
    } else {
      res.status(400);
      throw new Error('Invalid user details provided');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if input is provided
    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter both email and password');
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Match input password with database hash
    if (user && (await user.matchPassword(password))) {
      // Dynamic Super Admin Check
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@kineticage.com';
      const isSuperAdmin = user.email.toLowerCase() === superAdminEmail.toLowerCase();
      const expectedRole = isSuperAdmin ? 'admin' : 'user';

      if (user.role !== expectedRole) {
        user.role = expectedRole;
      }

      // Self-healing: Ensure user has a Client profile linked
      let client = null;
      if (user.clientId) {
        client = await Client.findById(user.clientId);
      }
      if (!client) {
        client = await Client.findOne({ email: user.email });
        if (!client) {
          client = await Client.create({
            fullName: user.name,
            email: user.email,
            phone: '9999999999',
            age: 65,
            gender: 'Other',
            address: '123 Wellness Center Drive',
            emergencyContact: 'N/A',
            status: 'Active',
            subscriptionStatus: 'None'
          });
        }
        user.clientId = client._id;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: generateToken(user._id, user.role),
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: client._id,
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Self-healing: Ensure user has a Client profile linked
    let client = null;
    if (req.user.clientId) {
      client = await Client.findById(req.user.clientId);
    }
    if (!client) {
      client = await Client.findOne({ email: req.user.email });
      if (!client) {
        client = await Client.create({
          fullName: req.user.name,
          email: req.user.email,
          phone: '9999999999',
          age: 65,
          gender: 'Other',
          address: '123 Wellness Center Drive',
          emergencyContact: 'N/A',
          status: 'Active',
          subscriptionStatus: 'None'
        });
      }
      req.user.clientId = client._id;
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        authProvider: req.user.authProvider,
        createdAt: req.user.createdAt,
        phone: client.phone,
        address: client.address,
        age: client.age,
        gender: client.gender,
        emergencyContact: client.emergencyContact || 'N/A',
        clientId: client._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password reset handler
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter both email and new password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('No user found with this email address');
    }

    // Set the new password. The pre-save hook in user model will hash it automatically.
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
