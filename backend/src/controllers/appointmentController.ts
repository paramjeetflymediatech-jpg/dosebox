import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Appointment, Doctor, User, Notification } from '../models';

export class AppointmentController {
  
  /**
   * Get list of doctors and availability
   */
  public static async getDoctors(req: Request, res: Response) {
    try {
      const doctors = await Doctor.findAll({ order: [['rating', 'DESC']] });
      return res.status(200).json({ success: true, data: doctors });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Book a consultation appointment
   */
  public static async bookAppointment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { doctorId, dateTime, type, notes } = req.body;

      if (!doctorId || !dateTime) {
        return res.status(400).json({ success: false, message: 'Doctor ID and appointment slot date/time are required' });
      }

      // Verify doctor exists
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }

      const appointment = await Appointment.create({
        userId,
        doctorId,
        dateTime: new Date(dateTime),
        type: type || 'Video',
        status: 'Scheduled',
        notes
      });

      // Notify User
      await Notification.create({
        userId,
        title: 'Appointment Scheduled',
        message: `Your ${type || 'Video'} consultation with ${doctor.name} is confirmed for ${new Date(dateTime).toLocaleString()}.`
      });

      return res.status(201).json({
        success: true,
        message: 'Doctor consultation slot booked successfully.',
        data: appointment
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get logged-in customer's consultation history
   */
  public static async getCustomerAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const appointments = await Appointment.findAll({
        where: { userId },
        include: [{ model: Doctor, as: 'doctor' }],
        order: [['dateTime', 'DESC']]
      });

      return res.status(200).json({ success: true, data: appointments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all appointments (Admin & Pharmacist)
   */
  public static async getAllAppointments(req: AuthenticatedRequest, res: Response) {
    try {
      const appointments = await Appointment.findAll({
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
          { model: Doctor, as: 'doctor' }
        ],
        order: [['dateTime', 'DESC']]
      });

      return res.status(200).json({ success: true, data: appointments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update appointment details/status and consultation notes (Admin & Pharmacist)
   */
  public static async updateAppointment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body; // 'Scheduled' | 'Completed' | 'Cancelled'

      const appointment = await Appointment.findByPk(id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      await appointment.update({
        status: status ?? appointment.status,
        notes: notes ?? appointment.notes
      });

      // Notify customer
      await Notification.create({
        userId: appointment.userId,
        title: `Appointment Update`,
        message: `Your consultation status was updated to ${status || appointment.status}.`
      });

      return res.status(200).json({
        success: true,
        message: 'Appointment consultation notes and status updated.',
        data: appointment
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default AppointmentController;
