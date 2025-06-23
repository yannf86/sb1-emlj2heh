export interface Hotel {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelFormData {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  description?: string;
}
