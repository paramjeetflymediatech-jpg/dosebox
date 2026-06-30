import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models';

export interface AuthenticatedUser {
  id: number;
  email: string;
  roleId: number;
  roleName: string;
}

export const authenticateJWT = async (req: NextRequest): Promise<AuthenticatedUser | NextResponse> => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Authentication token missing or invalid' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
    const decoded = jwt.verify(token, secret) as { id: number; email: string; roleId: number };
    
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json({ success: false, message: 'User is suspended or does not exist' }, { status: 401 });
    }

    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role ? (user.role as any).name : 'Customer'
    };
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Token is invalid or expired' }, { status: 401 });
  }
};

export const authorizeRoles = (user: AuthenticatedUser, ...allowedRoles: string[]): NextResponse | null => {
  if (!allowedRoles.includes(user.roleName)) {
    return NextResponse.json({ 
      success: false, 
      message: `Role '${user.roleName}' is unauthorized to access this resources. Required: [${allowedRoles.join(', ')}]` 
    }, { status: 403 });
  }
  return null;
};
