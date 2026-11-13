export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import models from '../../../../models';
import fs from 'fs';
import path from 'path';

const { User, Role, MobileAuthUser } = models;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshjwtkeyforauth';

function cleanString(val?: string | null): string {
  if (!val) return '';
  let s = String(val).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function getAdminEnvCredentials() {
  const fileEnv: Record<string, string> = {};
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          fileEnv[key] = val;
        }
      }
    }
  } catch (e) {
    // ignore read error, fallback to process.env
  }

  const rawEmail =
    fileEnv.ADMIN_EMAIL ||
    fileEnv.ADMIN_USERNAME ||
    fileEnv.ADMIN_USER ||
    fileEnv.ADMIN_ID ||
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_USERNAME ||
    process.env.ADMIN_USER ||
    process.env.ADMIN_ID ||
    'admin@dosebox.com';

  const rawPass =
    fileEnv.ADMIN_PASSWORD ||
    fileEnv.ADMIN_PASS ||
    fileEnv.PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASS ||
    process.env.PASSWORD ||
    'admin@123';

  return {
    email: cleanString(rawEmail),
    username: cleanString(fileEnv.ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin'),
    password: cleanString(rawPass),
  };
}

async function syncAdminUser(targetEmail: string, newPlainPass: string) {
  try {
    // Ensure Admin role exists
    await Role.findOrCreate({ where: { id: 1 }, defaults: { name: 'Admin' } });

    // Look for existing admin user by email or by roleId = 1
    let admin = await User.findOne({
      where: { email: targetEmail },
      include: [{ model: Role, as: 'role' }]
    });

    if (!admin) {
      admin = await User.findOne({
        where: { roleId: 1 },
        include: [{ model: Role, as: 'role' }]
      });
    }

    const hashedPassword = await bcrypt.hash(newPlainPass, 10);

    if (admin) {
      admin.email = targetEmail;
      admin.password = hashedPassword;
      admin.roleId = 1;
      admin.status = 'active';
      await admin.save();
      console.log(`[Auth] Automatically updated admin user in DB for: ${targetEmail}`);
      return admin;
    } else {
      const created = await User.create({
        name: 'System Admin',
        email: targetEmail,
        password: hashedPassword,
        roleId: 1,
        status: 'active'
      });
      console.log(`[Auth] Created new admin user in DB for: ${targetEmail}`);
      return await User.findByPk(created.id, { include: [{ model: Role, as: 'role' }] });
    }
  } catch (err: any) {
    console.warn('[Auth] Error syncing admin user to DB:', err?.message || err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const inputEmail = cleanString(email);
    const inputPass = cleanString(password);

    const adminCreds = getAdminEnvCredentials();

    const isAdminAttempt =
      Boolean(adminCreds.password) &&
      (inputEmail.toLowerCase() === adminCreds.email.toLowerCase() ||
        inputEmail.toLowerCase() === adminCreds.username.toLowerCase() ||
        inputEmail.toLowerCase() === 'admin' ||
        inputEmail.toLowerCase() === 'admin@dosebox.com' ||
        inputEmail.toLowerCase() === 'admin@mrmed.com');

    let user: any = null;

    if (isAdminAttempt) {
      // STRICT CHECK: Admin password must match .env ADMIN_PASSWORD!
      if (inputPass !== adminCreds.password) {
        console.warn(`[Auth] Admin login failed: Password mismatch for ${inputEmail}`);
        return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
      }

      // Automatically sync/update the database hash
      user = await syncAdminUser(adminCreds.email, adminCreds.password);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Failed to synchronize admin user' }, { status: 500 });
      }
      console.log(`[Auth] Admin login successful for ${user.email} (synced to database)`);
    } else {
      user = await User.findOne({
        where: { email: inputEmail },
        include: [{ model: Role, as: 'role' }]
      });

      if (!user || !user.password) {
        return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
      }

      if (user.status?.trim().toLowerCase() !== 'active') {
        return NextResponse.json({ success: false, message: 'Account is suspended' }, { status: 403 });
      }

      const isMatch = await bcrypt.compare(inputPass, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
      }
    }

    const roleName = user.role ? (user.role as any).name : 'Customer';

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

    // Track user FCM Token directly on User model
    if (body.push_token && typeof body.push_token === 'string' && body.push_token.trim()) {
      user.fcmToken = body.push_token.trim();
      await user.save().catch(e => console.error('Error saving user fcmToken:', e));
    }

    // Track mobile auth device
    if (body.device_id || body.device_platform || body.push_token) {
      console.log('Mobile login detected!', { device_id: body.device_id, device_platform: body.device_platform });
      try {
        const userType: 'customer' | 'admin' = (user.roleId === 1 || user.roleId === 4 || user.roleId === 5) ? 'admin' : 'customer';
        const existingDevice = await MobileAuthUser.findOne({
          where: { userId: user.id, deviceId: body.device_id || 'unknown' }
        });

        const deviceData = {
          refreshToken,
          refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          pushToken: body.push_token ? body.push_token.trim() : undefined,
          pushTokenPlatform: body.device_platform || undefined,
          pushTokenUpdatedAt: body.push_token ? new Date() : undefined,
          deviceName: body.device_name || undefined,
          devicePlatform: body.device_platform || undefined,
          osVersion: body.os_version || undefined,
          appVersion: body.app_version || undefined,
          userType,
          lastLogin: new Date()
        };

        if (existingDevice) {
          console.log('Updating existing mobile device record...');
          await existingDevice.update(deviceData);
        } else {
          console.log('Creating new mobile device record...');
          await MobileAuthUser.create({
            userId: user.id,
            deviceId: body.device_id || 'unknown',
            ...deviceData
          });
        }
        console.log('Mobile auth tracked successfully!');
      } catch (err) {
        console.error('Error tracking mobile auth user:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        doseboxTokens: user.doseboxTokens,
        role: roleName
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
