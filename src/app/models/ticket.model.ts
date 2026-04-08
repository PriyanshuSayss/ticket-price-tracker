export interface Ticket {
  id: string;
  provider: string;
  mode: 'flight' | 'train' | 'bus' | 'mixed';
  source: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  class: string; // Added class selection
  status: 'on-time' | 'delayed' | 'completed' | 'cancelled'; // Added real-time status
  delay?: number; // Delay in minutes
  expectedArrival?: string; // Expected arrival time
  route: string; // Route information
  currentLocation?: string; // Current location for tracking
  recommendation?: string; // AI When-to-buy recommendation
  hackerSegments?: string[]; // Array of modes for mixed routes e.g. ['flight', 'bus']
}

export interface SearchCriteria {
  source: string;
  destination: string; // Will support 'Everywhere'
  date: string;
  mode: 'flight' | 'train' | 'bus' | 'mixed';
  class?: string; // Added class selection
  time?: string; // Added time preference
}

export interface TrackedRoute {
  id: string;
  criteria: SearchCriteria;
  lastPrice: number;
  priceHistory: { date: string; price: number }[];
  isTracking: boolean;
  currentStatus?: 'on-time' | 'delayed' | 'completed' | 'cancelled';
  lastUpdated: string;
  alertsActive?: boolean; // Mobile/Email alerts activated
  contactMethod?: string; // Contact string for mock
}

export interface ClassOption {
  id: string;
  name: string;
  mode: 'flight' | 'train' | 'bus' | 'mixed';
  priceMultiplier: number; // Multiplier for base price
}
