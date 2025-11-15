export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  date_joined?: string;
}

export interface Customer {
  id: number;
  user_id: number;
  phone: string;
  birth_date?: string;
  membership: 'B' | 'S' | 'G';
  first_name?: string;
  last_name?: string;
  orders_count?: number;
}

export interface Address {
  id: number;
  street: string;
  city: string;
  house_number: number;
  apartment_number?: number;
  post_code: string;
  customer: number;
}

export interface Collection {
  id: number;
  title: string;
  description?: string;
  products_count: number;
  featured_product?: Product;
}

export interface ProductImage {
  id: number;
  image: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  unit_price: number;
  inventory: number;
  price_with_tax: number;
  collection: string;
  images: ProductImage[];
  last_update: string;
}

export interface Review {
  id: number;
  product: number;
  product_title?: string;
  date: string;
  name: string;
  description?: string;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    title: string;
    unit_price: number;
    inventory: number;
  };
  quantity: number;
  total_price: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total_price: number;
}

export interface OrderItem {
  id: number;
  product: {
    id: number;
    title: string;
    unit_price: number;
  };
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customer: number;
  placed_at: string;
  payment_status: 'P' | 'C' | 'F';
  total_price: number;
  items: OrderItem[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
} 