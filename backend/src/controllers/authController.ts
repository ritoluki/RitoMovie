import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import emailService from '../services/emailService';
import settingsService from '../services/settingsService';

// Type for i18n request with translation function
type TFunction = (key: string, options?: Record<string, unknown>) => string;

// Helper to get translation with fallback
const getTranslation = (t: TFunction, key: string, fallback: string, options?: Record<string, unknown>): string => {
  const result = t(key, options);
  // If translation returns the key itself, use fallback
  return result === key ? (options ? fallback.replace(/\{\{(\w+)\}\}/g, (_, k) => String(options[k] || '')) : fallback) : result;
};

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
      throw new ApiError(400, getTranslation(t, 'auth.emailExists', 'Email already exists'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified: false, // Default to unverified
    });

    // Check if email verification is required
    const requireVerification = await settingsService.getSetting<boolean>('require_email_verification', false);
    
    if (requireVerification === true) {
      // Generate verification token
      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      try {
        // Send verification email
        await emailService.sendVerificationEmail(user.email, verificationToken, user.name);
      } catch (error) {
        console.error('Error sending verification email:', error);
        // Don't fail registration if email fails
      }
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: getTranslation(t, 'auth.registerSuccess', 'Registration successful'),
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          watchlist: user.watchlist,
          isEmailVerified: user.isEmailVerified,
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
      throw new ApiError(400, getTranslation(t, 'validation.required', 'Email and password are required', { field: 'Email and password' }));
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ApiError(401, getTranslation(t, 'auth.invalidCredentials', 'Invalid email or password'));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new ApiError(401, getTranslation(t, 'auth.invalidCredentials', 'Invalid email or password'));
    }

    // Check if user is banned
    if (user.isBanned) {
      const banReason = user.banReason || 'Violation of terms';
      throw new ApiError(403, getTranslation(t, 'auth.accountBanned', `Your account has been banned. Reason: ${banReason}`, { reason: banReason }));
    }

    // Update login stats
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Generate token with appropriate expiry based on rememberMe
    const token = user.getSignedJwtToken(rememberMe);

    res.status(200).json({
      success: true,
      message: getTranslation(t, 'auth.loginSuccess', 'Login successful'),
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
      throw new ApiError(400, getTranslation(t, 'validation.required', 'Google credential is required', { field: 'Google credential' }));
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
        message: getTranslation(t, 'auth.loginSuccess', 'Login successful'),
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
      message: getTranslation(t, 'auth.profileUpdated', 'Profile updated successfully'),
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
      throw new ApiError(400, getTranslation(t, 'validation.required', 'Current and new password are required', { field: 'Current and new password' }));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      throw new ApiError(404, getTranslation(t, 'user.notFound', 'User not found'));
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      throw new ApiError(401, getTranslation(t, 'auth.incorrectPassword', 'Current password is incorrect'));
    }

  user.password = newPassword;
  await user.save();

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    message: getTranslation(t, 'auth.passwordUpdated', 'Password updated successfully'),
    data: { token },
  });
}
);

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.body;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    if (!email) {
      throw new ApiError(400, getTranslation(t, 'validation.required', 'Email is required', { field: 'Email' }));
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists for security
      res.status(200).json({
        success: true,
        message: getTranslation(t, 'auth.resetEmailSent', 'If that email exists, a password reset link has been sent'),
      });
      return;
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);

      res.status(200).json({
        success: true,
        message: getTranslation(t, 'auth.resetEmailSent', 'Password reset email sent successfully'),
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      // Clear reset token on error
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, getTranslation(t, 'auth.emailError', 'Error sending email. Please try again later'));
    }
  }
);

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { token, newPassword } = req.body;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    if (!token || !newPassword) {
      throw new ApiError(400, getTranslation(t, 'validation.required', 'Token and new password are required', { field: 'Token and password' }));
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, getTranslation(t, 'auth.invalidToken', 'Invalid or expired reset token'));
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate JWT token
    const jwtToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: getTranslation(t, 'auth.passwordReset', 'Password reset successfully'),
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          watchlist: user.watchlist,
          isEmailVerified: user.isEmailVerified,
        },
        token: jwtToken,
      },
    });
  }
);

// @desc    Verify email with token
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { token } = req.params;
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    if (!token) {
      throw new ApiError(400, getTranslation(t, 'validation.required', 'Verification token is required', { field: 'Token' }));
    }

    // Hash token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, getTranslation(t, 'auth.invalidToken', 'Invalid or expired verification token'));
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail verification if welcome email fails
    }

    // Generate JWT token
    const jwtToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: getTranslation(t, 'auth.emailVerified', 'Email verified successfully'),
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          watchlist: user.watchlist,
          isEmailVerified: user.isEmailVerified,
        },
        token: jwtToken,
      },
    });
  }
);

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const t: TFunction = (req as unknown as { t: TFunction }).t || ((key: string) => key);

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, getTranslation(t, 'user.notFound', 'User not found'));
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, getTranslation(t, 'auth.alreadyVerified', 'Email is already verified'));
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationToken, user.name);

      res.status(200).json({
        success: true,
        message: getTranslation(t, 'auth.verificationEmailSent', 'Verification email sent successfully'),
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // Clear verification token on error
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, getTranslation(t, 'auth.emailError', 'Error sending email. Please try again later'));
    }
  }
);
