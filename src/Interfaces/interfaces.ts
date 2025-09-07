export interface Zone {
  id: string;
  name: string;
  category: string;
  occupied: number;
  free: number;
  reserved: number;
  availableForVisitors: number;
  availableForSubscribers: number;
  rateNormal: number;
  rateSpecial: number;
  open: boolean;
  specialActive?: boolean;
  totalSlots?: number;
}

export interface Employee {
  id: string;
  name: string;
  username: string;
  role: "employee" | "admin";
}





export interface Gate {
  id: string;
  name: string;
  description: string;
  status?: "open" | "closed"; 
}


export interface Ticket {
  id: string;
  type: "visitor" | "subscriber" | string; // extend with more types if needed
  checkinAt: string;  // ISO date string
  checkoutAt: string | null; 
  gateId: string;
  zoneId: string;
}


export interface AuthState {
  token: string | null;
  admin: any | null;
  isLoading: boolean;
  error: string | null;
}

export interface TicketSegment {
  rateMode: "normal" | "special" | string;
  hours: number;
  rate: number;
  amount: number;
  note?: string;
}



export interface TicketCheckoutResponse {
  ticketId: string;
  vehiclePlate?: string;
  subscriptionId?: string | null;
  durationHours: number;
  totalAmount?: number;
  segments: TicketSegment[];
  calculatedAt?: string;
  checkoutAt?: string;
  breakdown?: {
    from: string;
    to: string;
    hours: number;
    rate: number;
    rateMode: string;
    amount: number;
  }[];
}
