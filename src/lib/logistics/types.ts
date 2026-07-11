export interface AddressPayload {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ShipmentPayload {
  orderId: string | number;
  weightInKg: number;
  paymentMethod: 'Prepaid' | 'COD';
  codAmount?: number;
  deliveryAddress: AddressPayload;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface TrackingCheckpoint {
  status: string; // Internal normalized status
  desc: string;   // Courier raw status description
  time: string;   // ISO String
  location?: string;
}

export interface TrackingResponse {
  trackingId: string;
  courier: string;
  status: string; // 'In Transit', 'Out for Delivery', 'Delivered', 'RTO', 'Exception'
  estimatedDeliveryDate?: string;
  checkpoints: TrackingCheckpoint[];
}

export interface CreateShipmentResponse {
  success: boolean;
  trackingId?: string;
  shipmentId?: string;
  labelUrl?: string;
  message?: string;
}

export interface LogisticsProvider {
  createShipment(payload: ShipmentPayload): Promise<CreateShipmentResponse>;
  trackShipment(trackingId: string): Promise<TrackingResponse | null>;
  cancelShipment(trackingId: string): Promise<boolean>;
}
