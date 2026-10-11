import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * POST /api/auth/login
 * Public route to authenticate a user and return a JWT token.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {email, password} = req.body;
    
    if(!email || !password){
      res.status(400).json({success: false, error:{message: 'Email and password not found'}});
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');


    if(!user){
      res.status(401).json({success: false, error:{message: 'Invalid credentials'}});
      return;
    }

    if(user.isActive === false){
      res.status(403).json({success: false, error: {message: 'Account has been deactivated'}});
      return;
    }

    const isMatch = await user.comparePassword(password);
    if(!isMatch){
      res.status(401).json({success: false, error:{message: 'Invalid credentials'}});
      return;
    }else{
      const token = generateToken({userId: user._id.toString(), role: user.role});

      res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Protected route returning the current authenticated user.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
