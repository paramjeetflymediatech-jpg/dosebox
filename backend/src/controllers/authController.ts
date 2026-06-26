import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforauth';

export class AuthController {
  
  /**
   * Register standard customer
   */
  public static async register(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered' });
      }

      // Default to Role ID 3 (Customer)
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        roleId: 3, // Customer
        status: 'active'
      });

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Login standard user
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = await User.findOne({
        where: { email },
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.password) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is suspended' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const roleName = user.role ? (user.role as any).name : 'Customer';

      // Generate Tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, roleId: user.roleId, roleName },
        JWT_SECRET,
        { expiresIn: (process.env.JWT_EXPIRE || '1h') as any }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as any }
      );

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: roleName
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Refresh access token
   */
  public static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number };
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || user.status !== 'active') {
        return res.status(401).json({ success: false, message: 'Session is invalid or user suspended' });
      }

      const roleName = user.role ? (user.role as any).name : 'Customer';

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, roleId: user.roleId, roleName },
        JWT_SECRET,
        { expiresIn: (process.env.JWT_EXPIRE || '1h') as any }
      );

      return res.status(200).json({
        success: true,
        accessToken
      });
    } catch (error) {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }
  }

  /**
   * Mock Google Login
   */
  public static async googleLogin(req: Request, res: Response) {
    try {
      const { googleId, email, name, avatar } = req.body;

      if (!googleId || !email || !name) {
        return res.status(400).json({ success: false, message: 'Google authentication details missing' });
      }

      // Check if user exists by email or googleId
      let user = await User.findOne({
        where: { email },
        include: [{ model: Role, as: 'role' }]
      });

      if (!user) {
        // Create user with default role (Customer)
        user = await User.create({
          name,
          email,
          googleId,
          roleId: 3, // Customer
          status: 'active'
        });
        
        user = await User.findByPk(user.id, {
          include: [{ model: Role, as: 'role' }]
        }) as any;
      } else if (!user.googleId) {
        // Link google account
        user.googleId = googleId;
        await user.save();
      }

      if (user!.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Account is suspended' });
      }

      const roleName = user!.role ? (user!.role as any).name : 'Customer';

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user!.id, email: user!.email, roleId: user!.roleId, roleName },
        JWT_SECRET,
        { expiresIn: (process.env.JWT_EXPIRE || '1h') as any }
      );

      const refreshToken = jwt.sign(
        { id: user!.id },
        JWT_REFRESH_SECRET,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRE || '7d') as any }
      );

      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        accessToken,
        refreshToken,
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          phone: user!.phone,
          role: roleName
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default AuthController;
