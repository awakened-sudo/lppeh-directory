// src/types/index.ts
export interface Firm {
    id: string;
    name: string;
    address: string;
    phone: string;
    fax?: string;
    email: string;
    type: string;
    state: string;
    city: string;
  }
  
  export interface FirmResponse {
    firms: Firm[];
    total: number;
    timestamp: string;
    city: string;
  }
  
  export interface ErrorResponse {
    error: string;
    message: string;
    timestamp: string;
  }