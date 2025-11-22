import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';

// Type for i18n request with translation function
type TFunction = (key: string, options?: Record<string, unknown>) => string;

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, password } = req.body;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, t('auth.emailExists'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: t('auth.registerSuccess'),
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          watchlist: user.watchlist,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password, rememberMe = true } = req.body;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    // Validate email & password
    if (!email || !password) {
      throw new ApiError(400, t('validation.required', { field: 'Email and password' }));
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ApiError(401, t('auth.invalidCredentials'));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new ApiError(401, t('auth.invalidCredentials'));
    }

    // Generate token with appropriate expiry based on rememberMe
    const token = user.getSignedJwtToken(rememberMe);

    res.status(200).json({
      success: true,
      message: t('auth.loginSuccess'),
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          watchlist: user.watchlist,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  }
);

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { credential } = req.body;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    if (!credential) {
      throw new ApiError(400, t('validation.required', { field: 'Google credential' }));
    }

    try {
      // Get user info from Google using access token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      });

      if (!response.ok) {
        throw new ApiError(401, 'Invalid Google token');
      }

      const googleUser = await response.json();

      if (!googleUser || !(googleUser as any).email) {
        throw new ApiError(401, 'Invalid Google token');
      }

      const { email, name, picture } = googleUser as { email: string; name: string; picture: string };

      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        // Create new user with Google info
        user = await User.create({
          name: name || email.split('@')[0],
          email,
          avatar: picture || '',
          password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random secure password
          role: 'user',
        });
      } else if (picture && !user.avatar) {
        // Update avatar if user doesn't have one
        user.avatar = picture;
        await user.save();
      }

      // Generate token (Google login always uses remember me = true)
      const token = user.getSignedJwtToken(true);

      res.status(200).json({
        success: true,
        message: t('auth.loginSuccess'),
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            watchlist: user.watchlist,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw new ApiError(401, 'Google authentication failed');
    }
  }
);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      avatar: req.body.avatar,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) =>
        fieldsToUpdate[key as keyof typeof fieldsToUpdate] === undefined &&
        delete fieldsToUpdate[key as keyof typeof fieldsToUpdate]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: t('auth.profileUpdated'),
      data: user,
    });
  }
);

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, t('validation.required', { field: 'Current and new password' }));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      throw new ApiError(404, t('user.notFound'));
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      throw new ApiError(401, t('auth.invalidCredentials'));
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: t('auth.profileUpdated'),
      data: { token },
    });
  }
);

