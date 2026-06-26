import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    roleId: number;
    roleName: string;
  };
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
    const decoded = jwt.verify(token, secret) as { id: number; email: string; roleId: number };
    
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User is suspended or does not exist' });
    }

    (req as AuthenticatedRequest).user  = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role ? (user.role as any).name : 'Customer'
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { roleName } = authReq.user;
    if (!allowedRoles.includes(roleName)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${roleName}' is unauthorized to access this resources. Required: [${allowedRoles.join(', ')}]` 
      });
    }

    return next();
  };
};
