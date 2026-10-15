import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import models, {
  User as NamedUser,
  MobileAuthUser as NamedMobileAuthUser,
  Notification as NamedNotification,
  Role as NamedRole,
} from '../models';

/**
 * Safely resolves database models across all module systems & bundlers (Webpack, Next.js, Turbopack, ESM, CJS).
 * Solves: "Cannot read properties of undefined (reading 'findByPk')" and "Cannot read properties of undefined (reading 'findAll')"
 */
export function getDbModels() {
  let User = NamedUser || (models as any)?.User;
  let MobileAuthUser = NamedMobileAuthUser || (models as any)?.MobileAuthUser;
  let Notification = NamedNotification || (models as any)?.Notification;
  let Role = NamedRole || (models as any)?.Role;

  if (!User || !MobileAuthUser || !Role || !Notification) {
    try {
      const dyn = require('../models');
      const resolved = dyn?.default || dyn;
      User = User || resolved?.User;
      MobileAuthUser = MobileAuthUser || resolved?.MobileAuthUser;
      Notification = Notification || resolved?.Notification;
      Role = Role || resolved?.Role;
    } catch (e) {
      // Fallback require error
    }
  }

  return { User, MobileAuthUser, Notification, Role };
}

/**
 * Initialize Firebase Admin if not already initialized
 */
export function initFirebaseAdmin(): boolean {
  if (getApps().length > 0) {
    return true;
  }

  let initialized = false;

  // Option 1: Try JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (
        (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
        (rawKey.startsWith("'") && rawKey.endsWith("'"))
      ) {
        rawKey = rawKey.slice(1, -1);
      }
      const serviceAccount = JSON.parse(rawKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: cert(serviceAccount),
      });
      initialized = true;
      console.log('[Firebase Admin] Initialized successfully using service account JSON');
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin] Service account JSON init failed, trying discrete variables...', err?.message || err);
    }
  }

  // Option 2: Try discrete environment variables
  if (!initialized && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      let formattedKey = process.env.FIREBASE_PRIVATE_KEY.trim();
      // Strip any outer wrapping quotes safely
      if (
        (formattedKey.startsWith('"') && formattedKey.endsWith('"')) ||
        (formattedKey.startsWith("'") && formattedKey.endsWith("'"))
      ) {
        formattedKey = formattedKey.slice(1, -1);
      }
      // Replace literal escaped newlines with actual newlines
      formattedKey = formattedKey.replace(/\\n/g, '\n').trim();

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedKey,
        }),
      });
      initialized = true;
      console.log('[Firebase Admin] Initialized successfully using discrete environment variables');
      return true;
    } catch (err: any) {
      console.warn('[Firebase Admin] Discrete variables init failed:', err?.message || err);
    }
  }

  if (!initialized) {
    console.warn('[Firebase Admin] Credentials not defined or invalid. Push notifications will be skipped.');
  }

  return initialized;
}

// Initial attempt at boot
initFirebaseAdmin();

/**
 * Send a push notification to a specific device via FCM Token
 */
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  userId?: number
) {
  if (!getApps().length) {
    const isReady = initFirebaseAdmin();
    if (!isReady || !getApps().length) {
      console.warn('[FCM Push] Firebase Admin is not initialized. Skipping notification.');
      return { success: false, error: 'Firebase not initialized' };
    }
  }

  if (!token || typeof token !== 'string' || !token.trim()) {
    return { success: false, error: 'No valid token provided' };
  }

  const cleanToken = token.trim();

  try {
    // FCM data values MUST be strings only
    const stringData: Record<string, string> = {
      title,
      body,
    };
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        stringData[k] = typeof v === 'string' ? v : String(v ?? '');
      }
    }

    const payload = {
      token: cleanToken,
      notification: {
        title,
        body,
      },
      data: stringData,
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high' as const,
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const response = await getMessaging().send(payload);
    console.log(`[FCM Push] Sent to device (${cleanToken.substring(0, 15)}...):`, { title, messageId: response });
    return { success: true, response };
  } catch (error: any) {
    const isUnregistered = 
      error.code === 'messaging/registration-token-not-registered' || 
      error.errorInfo?.code === 'messaging/registration-token-not-registered' ||
      error.message?.includes('NotRegistered') ||
      error.message?.includes('UNREGISTERED') ||
      error.message?.includes('invalid-registration-token');

    if (isUnregistered) {
      console.warn(`[FCM Push] Device token is no longer registered. Cleaning up stale token (${cleanToken.substring(0, 15)}...)...`);
      try {
        const { User, MobileAuthUser } = getDbModels();
        if (User) {
          if (userId) {
            await User.update({ fcmToken: null }, { where: { id: userId, fcmToken: cleanToken } });
          }
          await User.update({ fcmToken: null }, { where: { fcmToken: cleanToken } });
        }
        if (MobileAuthUser) {
          await MobileAuthUser.update({ pushToken: null as any }, { where: { pushToken: cleanToken } });
        }
      } catch (dbErr) {
        console.error('[FCM Push] Failed to cleanup stale token from DB:', dbErr);
      }
      return { success: false, error: 'Token not registered', isUnregistered: true };
    }

    console.error(`[FCM Push] Error sending to token (${cleanToken.substring(0, 15)}...):`, error.message || error);
    return { success: false, error: error.message || error };
  }
}

/**
 * Send push notification to all registered devices of a specific user
 */
export async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (!userId) return { success: false, sentCount: 0, reason: 'Invalid userId' };

  try {
    const { User, MobileAuthUser } = getDbModels();

    if (!User) {
      console.error(`[Push] User model unavailable. Cannot send push to user #${userId}`);
      return { success: false, error: 'User model unavailable' };
    }

    const tokens = new Set<string>();

    // 1. Fetch user's primary fcmToken
    const user = await User.findByPk(userId, { attributes: ['id', 'fcmToken'] });
    if (user?.fcmToken && typeof user.fcmToken === 'string' && user.fcmToken.trim()) {
      tokens.add(user.fcmToken.trim());
    }

    // 2. Fetch all mobile devices for this user
    if (MobileAuthUser) {
      const mobileDevices = await MobileAuthUser.findAll({
        where: { userId },
        attributes: ['pushToken'],
      });

      for (const dev of mobileDevices) {
        if (dev.pushToken && typeof dev.pushToken === 'string' && dev.pushToken.trim()) {
          tokens.add(dev.pushToken.trim());
        }
      }
    }

    if (tokens.size === 0) {
      console.log(`[Push] User #${userId} has no registered FCM tokens.`);
      return { success: false, sentCount: 0, reason: 'No tokens found' };
    }

    console.log(`[Push] Dispatching notification to User #${userId} across ${tokens.size} active device(s)...`);

    const results = [];
    for (const token of tokens) {
      const res = await sendPushNotification(token, title, body, data, userId);
      results.push(res);
    }

    const sentCount = results.filter(r => r.success).length;
    return { success: sentCount > 0, sentCount, total: tokens.size };
  } catch (err: any) {
    console.error(`[Push] Failed to send push to user #${userId}:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Send notification and push to all Admins, SuperAdmins, and Pharmacists
 */
export async function sendPushToAdmins(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    const { User, MobileAuthUser, Notification, Role } = getDbModels();

    if (!User) {
      console.error('[Push] User model unavailable. Cannot send push to admins');
      return { success: false, error: 'User model unavailable' };
    }

    // 1. Identify staff roles (SuperAdmin: 1, Admin: 4, Pharmacist: 5)
    let staffRoleIds = [1, 4, 5];
    if (Role) {
      try {
        const roles = await Role.findAll({
          where: { name: ['SuperAdmin', 'Admin', 'Pharmacist', 'Leadership'] },
          attributes: ['id'],
        });
        const dynamicIds = roles.map((r: any) => r.id);
        if (dynamicIds.length > 0) {
          staffRoleIds = Array.from(new Set([...staffRoleIds, ...dynamicIds]));
        }
      } catch (e) {
        // Use fallback staffRoleIds
      }
    }

    // 2. Query staff user records
    const adminUsers = await User.findAll({
      where: { roleId: staffRoleIds },
      attributes: ['id', 'name', 'email', 'fcmToken'],
    });

    const adminUserIds = adminUsers.map((u: any) => u.id);

    // 3. Create in-app Notification for each staff user
    if (Notification) {
      for (const admin of adminUsers) {
        try {
          await Notification.create({
            userId: admin.id,
            title,
            message: body,
            read: false,
          });
        } catch (dbErr) {
          console.warn(`[Push] Could not create in-app notification for admin #${admin.id}:`, dbErr);
        }
      }
    }

    // 4. Collect all distinct FCM tokens for staff
    const tokens = new Set<string>();
    for (const admin of adminUsers) {
      if (admin.fcmToken && typeof admin.fcmToken === 'string' && admin.fcmToken.trim()) {
        tokens.add(admin.fcmToken.trim());
      }
    }

    // Also collect tokens from MobileAuthUser where user is staff
    if (MobileAuthUser && adminUserIds.length > 0) {
      const mobileStaff = await MobileAuthUser.findAll({
        where: { userId: adminUserIds },
        attributes: ['userId', 'pushToken'],
      });
      for (const dev of mobileStaff) {
        if (dev.pushToken && typeof dev.pushToken === 'string' && dev.pushToken.trim()) {
          tokens.add(dev.pushToken.trim());
        }
      }
    }

    console.log(`[Push] Dispatched in-app notification to ${adminUsers.length} staff member(s). Sending FCM to ${tokens.size} device(s)...`);

    const results = [];
    for (const token of tokens) {
      const res = await sendPushNotification(token, title, body, data);
      results.push(res);
    }

    const sentCount = results.filter(r => r.success).length;
    return { success: sentCount > 0, sentCount, total: tokens.size };
  } catch (err: any) {
    console.error('[Push] Failed to send push to admins:', err?.message || err);
    return { success: false, error: err?.message || err };
  }
}
