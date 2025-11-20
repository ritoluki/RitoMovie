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
    const { email, password } = req.body;
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

    // Generate token
    const token = user.getSignedJwtToken();

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

