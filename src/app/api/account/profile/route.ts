export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateJWT } from '../../../../middleware/auth';
import { User } from '../../../../models';
import bcrypt from 'bcryptjs';

let columnsChecked = false;
async function ensureColumns() {
  if (columnsChecked) return;
  try {
    const qi = User.sequelize?.getQueryInterface();
    if (qi) {
      const table = await qi.describeTable('users');
      if (!table.dlNo) {
        await qi.addColumn('users', 'dlNo', { type: (User.sequelize?.Sequelize as any).STRING, allowNull: true });
      }
      if (!table.gstin) {
        await qi.addColumn('users', 'gstin', { type: (User.sequelize?.Sequelize as any).STRING, allowNull: true });
      }
      columnsChecked = true;
    }
  } catch (err) {
    columnsChecked = true;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    await ensureColumns();
    const user = await User.findByPk(userAuth.id, {
      attributes: ['id', 'name', 'email', 'phone', 'avatar', 'doseboxTokens', 'tokenRefundCount', 'age', 'gender', 'bloodGroup', 'height', 'weight', 'address', 'dlNo', 'gstin']
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch profile', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;

    const body = await req.json();
    const { name, phone, currentPassword, newPassword, age, gender, bloodGroup, height, weight, address, avatar, dlNo, gstin } = body;

    await ensureColumns();
    const user = await User.findByPk(userAuth.id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const updates: any = {};

    // 1. Full Name validation
    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName || trimmedName.length < 2) {
        return NextResponse.json({ success: false, message: 'Full Name must be at least 2 characters long' }, { status: 400 });
      }
      if (trimmedName.length > 70) {
        return NextResponse.json({ success: false, message: 'Full Name cannot exceed 70 characters' }, { status: 400 });
      }
      if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
        return NextResponse.json({ success: false, message: 'Full Name can only contain letters, spaces, dots, and hyphens' }, { status: 400 });
      }
      updates.name = trimmedName;
    }

    // 2. Phone Number validation
    if (phone !== undefined) {
      if (phone === '' || phone === null) {
        updates.phone = null;
      } else {
        const cleanedPhone = String(phone).replace(/[\s\-+]/g, '').replace(/^91/, '');
        if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
          return NextResponse.json({ success: false, message: 'Phone Number must be a valid 10-digit Indian mobile number' }, { status: 400 });
        }
        updates.phone = cleanedPhone;
      }
    }

    // 3. Avatar
    if (avatar !== undefined) updates.avatar = avatar;

    // 4. Age validation
    if (age !== undefined) {
      if (age === '' || age === null) {
        updates.age = null;
      } else {
        const ageNum = Number(age);
        if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
          return NextResponse.json({ success: false, message: 'Age must be a valid integer between 1 and 120' }, { status: 400 });
        }
        updates.age = ageNum;
      }
    }

    // 5. Gender validation
    if (gender !== undefined) {
      if (gender === '' || gender === null) {
        updates.gender = null;
      } else {
        const validGenders = ['Male', 'Female', 'Other'];
        if (!validGenders.includes(gender)) {
          return NextResponse.json({ success: false, message: 'Gender must be Male, Female, or Other' }, { status: 400 });
        }
        updates.gender = gender;
      }
    }

    // 6. Blood Group validation
    if (bloodGroup !== undefined) {
      if (bloodGroup === '' || bloodGroup === null) {
        updates.bloodGroup = null;
      } else {
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        if (!validBloodGroups.includes(bloodGroup)) {
          return NextResponse.json({ success: false, message: 'Please select a valid blood group' }, { status: 400 });
        }
        updates.bloodGroup = bloodGroup;
      }
    }

    // 7. Height validation
    if (height !== undefined) {
      if (height === '' || height === null) {
        updates.height = null;
      } else {
        const trimmedHeight = String(height).trim();
        if (trimmedHeight.length > 25) {
          return NextResponse.json({ success: false, message: 'Height cannot exceed 25 characters' }, { status: 400 });
        }
        updates.height = trimmedHeight;
      }
    }

    // 8. Weight validation
    if (weight !== undefined) {
      if (weight === '' || weight === null) {
        updates.weight = null;
      } else {
        const weightNum = parseFloat(String(weight));
        if (isNaN(weightNum) || weightNum < 1 || weightNum > 300) {
          return NextResponse.json({ success: false, message: 'Weight must be a valid number between 1 and 300 kg' }, { status: 400 });
        }
        updates.weight = String(weightNum);
      }
    }

    // 9. Home Address validation
    if (address !== undefined) {
      if (address === '' || address === null) {
        updates.address = null;
      } else {
        const trimmedAddress = String(address).trim();
        if (trimmedAddress.length < 5 || trimmedAddress.length > 500) {
          return NextResponse.json({ success: false, message: 'Address must be between 5 and 500 characters' }, { status: 400 });
        }
        updates.address = trimmedAddress;
      }
    }

    // 10. Drug License No. validation
    if (dlNo !== undefined) {
      if (dlNo === '' || dlNo === null) {
        updates.dlNo = null;
      } else {
        const trimmedDl = String(dlNo).trim();
        if (trimmedDl.length < 4 || trimmedDl.length > 50) {
          return NextResponse.json({ success: false, message: 'Drug License Number must be between 4 and 50 characters' }, { status: 400 });
        }
        if (!/^[a-zA-Z0-9\s/.-]+$/.test(trimmedDl)) {
          return NextResponse.json({ success: false, message: 'Drug License Number contains invalid characters' }, { status: 400 });
        }
        updates.dlNo = trimmedDl;
      }
    }

    // 11. GSTIN validation
    if (gstin !== undefined) {
      if (gstin === '' || gstin === null) {
        updates.gstin = null;
      } else {
        const trimmedGstin = String(gstin).trim().toUpperCase();
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(trimmedGstin)) {
          return NextResponse.json({ success: false, message: 'Invalid GSTIN format. Must be 15 characters (e.g. 07AAAAA0000A1Z5)' }, { status: 400 });
        }
        updates.gstin = trimmedGstin;
      }
    }

    // 12. Password change validation
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, message: 'Current password is required to set a new password' }, { status: 400 });
      }
      if (!newPassword) {
        return NextResponse.json({ success: false, message: 'Please enter your new password' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, message: 'New password must be at least 6 characters long' }, { status: 400 });
      }
      if (currentPassword === newPassword) {
        return NextResponse.json({ success: false, message: 'New password must be different from current password' }, { status: 400 });
      }
      if (!user.password) {
        return NextResponse.json({ success: false, message: 'Account uses Google Login, cannot change password' }, { status: 400 });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 401 });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    await user.update(updates);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        doseboxTokens: user.doseboxTokens,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        height: user.height,
        weight: user.weight,
        address: user.address,
        dlNo: user.dlNo,
        gstin: user.gstin,
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update profile', error: error.message }, { status: 500 });
  }
}
