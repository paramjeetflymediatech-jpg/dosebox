import { 
  LogisticsProvider, 
  ShipmentPayload, 
  TrackingResponse, 
  CreateShipmentResponse 
} from './types';

export class EkartProvider implements LogisticsProvider {
  private apiUrl: string;
  private apiKey: string;
  private merchantCode: string;
  private isMockMode: boolean;

  constructor() {
    this.apiUrl = process.env.EKART_API_URL || 'https://api.ekartlogistics.com/v1';
    this.apiKey = process.env.EKART_API_KEY || '';
    this.merchantCode = process.env.EKART_MERCHANT_CODE || '';
    this.isMockMode = process.env.EKART_MOCK_MODE === 'true';
  }

  /**
   * Helper to fetch OAuth Token if Ekart requires it.
   */
  private async getAuthToken(): Promise<string> {
    if (this.isMockMode) return 'mock_token';
    
    // In a real scenario, you'd call the Ekart Auth endpoint here
    // Example: POST to /oauth/token
    return 'real_token';
  }

  async createShipment(payload: ShipmentPayload): Promise<CreateShipmentResponse> {
    if (this.isMockMode) {
      // Return a simulated successful response
      const randomAwb = 'EKT' + Math.floor(Math.random() * 1000000000);
      return {
        success: true,
        trackingId: randomAwb,
        shipmentId: 'SHIP_' + randomAwb,
        message: 'Mock Ekart Shipment created successfully'
      };
    }

    try {
      const token = await this.getAuthToken();
      
      // Standard Ekart shipment payload mapping
      const ekartPayload = {
        client_name: this.merchantCode,
        services: [
          {
            service_type: "FORWARD",
            source: {
              name: "DoseBox Fulfillment",
              address: "Sector 62, Noida, UP 201301",
              phone: "18001234567"
            },
            destination: {
              name: payload.deliveryAddress.name,
              address: `${payload.deliveryAddress.street}, ${payload.deliveryAddress.city}, ${payload.deliveryAddress.state} - ${payload.deliveryAddress.zipCode}`,
              phone: payload.deliveryAddress.phone
            },
            shipment: {
              client_reference_id: payload.orderId.toString(),
              weight: payload.weightInKg,
              payment_type: payload.paymentMethod === 'COD' ? 'COD' : 'PREPAID',
              collectable_amount: payload.paymentMethod === 'COD' ? payload.codAmount : 0,
              return_address: {
                name: "DoseBox Returns",
                address: "Sector 62, Noida, UP 201301"
              }
            }
          }
        ]
      };

      const response = await fetch(`${this.apiUrl}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'HTTP_X_MERCHANT_CODE': this.merchantCode
        },
        body: JSON.stringify(ekartPayload)
      });

      const data = await response.json();

      if (response.ok && data.response && data.response.length > 0 && data.response[0].status === 'SUCCESS') {
        return {
          success: true,
          trackingId: data.response[0].tracking_id, // e.g. Waybill / AWB
          shipmentId: data.response[0].shipment_id,
          message: 'Shipment created'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to create Ekart shipment'
        };
      }
    } catch (error: any) {
      console.error('Ekart createShipment Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async trackShipment(trackingId: string): Promise<TrackingResponse | null> {
    if (this.isMockMode) {
      // Simulate live tracking progression based on time
      return {
        trackingId,
        courier: 'Ekart Logistics',
        status: 'In Transit',
        estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        checkpoints: [
          {
            status: 'Picked Up',
            desc: 'Shipment picked up by Ekart facility',
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            location: 'Noida Hub'
          },
          {
            status: 'In Transit',
            desc: 'Shipment reached processing center',
            time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            location: 'Gurugram Facility'
          }
        ]
      };
    }

    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiUrl}/track/${trackingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'HTTP_X_MERCHANT_CODE': this.merchantCode
        }
      });

      if (!response.ok) return null;

      const data = await response.json();

      // Assuming standard Ekart tracking format
      const checkpoints = (data.tracking_details || []).map((detail: any) => ({
        status: detail.status, // We might need to map Ekart's statuses to ours
        desc: detail.status_desc || detail.status,
        time: detail.updated_at,
        location: detail.location
      }));

      return {
        trackingId,
        courier: 'Ekart Logistics',
        status: data.current_status || 'Unknown',
        estimatedDeliveryDate: data.expected_delivery_date,
        checkpoints
      };
    } catch (error) {
      console.error('Ekart trackShipment Error:', error);
      return null;
    }
  }

  async cancelShipment(trackingId: string): Promise<boolean> {
    if (this.isMockMode) return true;

    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiUrl}/shipments/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'HTTP_X_MERCHANT_CODE': this.merchantCode
        },
        body: JSON.stringify({ tracking_ids: [trackingId] })
      });
      return response.ok;
    } catch (error) {
      console.error('Ekart cancelShipment Error:', error);
      return false;
    }
  }
}
