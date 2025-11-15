import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Customer,
  Product,
  Collection,
  Review,
  Cart,
  CartItem,
  Order,
  Address,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../types/index';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `JWT ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await axios.post('/auth/jwt/refresh/', {
                refresh: refreshToken,
              });
              localStorage.setItem('access_token', response.data.access);
              error.config.headers.Authorization = `JWT ${response.data.access}`;
              return this.api.request(error.config);
            } catch (refreshError) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/jwt/create/', credentials);
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/auth/users/', credentials);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/users/me/');
    return response.data;
  }

  // Products
  async getProducts(params?: {
    page?: number;
    search?: string;
    collection_id?: number;
    ordering?: string;
  }): Promise<{ results: Product[]; count: number }> {
    const response: AxiosResponse<{ results: Product[]; count: number }> = await this.api.get('/store/products/', { params });
    return response.data;
  }

  async getAllProducts(): Promise<Product[]> {
    const response: AxiosResponse<{ results: Product[]; count: number } | Product[]> = await this.api.get('/store/products/', { 
      params: { page_size: 1000 } // Get all products
    });
    return (response.data as { results: Product[] }).results || (response.data as Product[]);
  }

  async getProduct(id: number): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.get(`/store/products/${id}/`);
    return response.data;
  }

  async getProductReviews(productId: number): Promise<Review[]> {
    const response: AxiosResponse<Review[]> = await this.api.get(`/store/products/${productId}/reviews/`);
    return response.data;
  }

  async addProductReview(productId: number, review: { name: string; description?: string }): Promise<Review> {
    const response: AxiosResponse<Review> = await this.api.post(`/store/products/${productId}/reviews/`, review);
    return response.data;
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    const response: AxiosResponse<Collection[]> = await this.api.get('/store/collections/');
    return response.data;
  }

  async getCollection(id: number): Promise<Collection> {
    const response: AxiosResponse<Collection> = await this.api.get(`/store/collections/${id}/`);
    return response.data;
  }

  // Cart
  async createCart(): Promise<Cart> {
    const response: AxiosResponse<Cart> = await this.api.post('/store/carts/');
    return response.data;
  }

  async getCart(cartId: string): Promise<Cart> {
    const response: AxiosResponse<Cart> = await this.api.get(`/store/carts/${cartId}/`);
    return response.data;
  }

  async addToCart(productId: number, quantity: number): Promise<CartItem> {
    // First get or create cart
    let cartId = localStorage.getItem('cart_id');
    if (!cartId) {
      const cart = await this.createCart();
      cartId = cart.id;
      localStorage.setItem('cart_id', cartId);
    }
    
    const response: AxiosResponse<CartItem> = await this.api.post(`/store/carts/${cartId}/items/`, {
      product_id: productId,
      quantity,
    });
    return response.data;
  }

  async updateCartItem(cartId: string, itemId: number, quantity: number): Promise<CartItem> {
    const response: AxiosResponse<CartItem> = await this.api.patch(`/store/carts/${cartId}/items/${itemId}/`, {
      quantity,
    });
    return response.data;
  }

  async removeFromCart(cartId: string, itemId: number): Promise<void> {
    await this.api.delete(`/store/carts/${cartId}/items/${itemId}/`);
  }

  async deleteCart(cartId: string): Promise<void> {
    await this.api.delete(`/store/carts/${cartId}/`);
  }

  // Orders
  async createOrder(cartId: string): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.post('/store/orders/', {
      cart_id: cartId,
    });
    return response.data;
  }

  async getOrders(): Promise<Order[]> {
    const response: AxiosResponse<Order[]> = await this.api.get('/store/orders/');
    return response.data;
  }

  async getOrder(id: number): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.get(`/store/orders/${id}/`);
    return response.data;
  }

  // Customer
  async getCurrentCustomer(): Promise<Customer> {
    const response: AxiosResponse<Customer> = await this.api.get('/store/customers/me/');
    return response.data;
  }

  async updateCurrentCustomer(customer: Partial<Customer>): Promise<Customer> {
    const response: AxiosResponse<Customer> = await this.api.put('/store/customers/me/', customer);
    return response.data;
  }

  async changePassword(password: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.put('/store/customers/change_password/', {
      password,
    });
    return response.data;
  }

  // Admin only
  async getCustomers(): Promise<Customer[]> {
    const response: AxiosResponse<Customer[]> = await this.api.get('/store/customers/');
    return response.data;
  }

  async updateOrderStatus(orderId: number, status: 'P' | 'C' | 'F'): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.patch(`/store/orders/${orderId}/`, {
      payment_status: status,
    });
    return response.data;
  }

  // Admin CRUD operations for Products
  async createProduct(productData: any): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.post('/store/products/', productData);
    return response.data;
  }

  async updateProduct(productId: number, productData: any): Promise<Product> {
    const response: AxiosResponse<Product> = await this.api.put(`/store/products/${productId}/`, productData);
    return response.data;
  }

  async deleteProduct(productId: number): Promise<void> {
    await this.api.delete(`/store/products/${productId}/`);
  }

  // Admin CRUD operations for Collections
  async createCollection(collectionData: any): Promise<Collection> {
    const response: AxiosResponse<Collection> = await this.api.post('/store/collections/', collectionData);
    return response.data;
  }

  async updateCollection(collectionId: number, collectionData: any): Promise<Collection> {
    const response: AxiosResponse<Collection> = await this.api.put(`/store/collections/${collectionId}/`, collectionData);
    return response.data;
  }

  async deleteCollection(collectionId: number): Promise<void> {
    await this.api.delete(`/store/collections/${collectionId}/`);
  }

  // Admin CRUD operations for Orders
  async updateOrder(orderId: number, orderData: any): Promise<Order> {
    const response: AxiosResponse<Order> = await this.api.patch(`/store/orders/${orderId}/`, orderData);
    return response.data;
  }

  async deleteOrder(orderId: number): Promise<void> {
    await this.api.delete(`/store/orders/${orderId}/`);
  }

  // Admin CRUD operations for Customers
  async updateCustomer(customerId: number, customerData: any): Promise<Customer> {
    const response: AxiosResponse<Customer> = await this.api.put(`/store/customers/${customerId}/`, customerData);
    return response.data;
  }

  // Admin CRUD operations for Reviews
  async getAllReviews(): Promise<Review[]> {
    const response: AxiosResponse<Review[]> = await this.api.get('/store/reviews/');
    return response.data;
  }



  async updateReview(reviewId: number, reviewData: any): Promise<Review> {
    const response: AxiosResponse<Review> = await this.api.put(`/store/reviews/${reviewId}/`, reviewData);
    return response.data;
  }

  async deleteReview(reviewId: number): Promise<void> {
    await this.api.delete(`/store/reviews/${reviewId}/`);
  }

  // Admin CRUD operations for Address
  async getAddresses(): Promise<Address[]> {
    const response: AxiosResponse<Address[]> = await this.api.get('/store/addresses/');
    return response.data;
  }

  async getAddress(id: number): Promise<Address> {
    const response: AxiosResponse<Address> = await this.api.get(`/store/addresses/${id}/`);
    return response.data;
  }

  async createAddress(addressData: { 
    street: string; 
    city: string; 
    post_code: string;
    house_number: number;
    apartment_number?: number | null;
  }): Promise<Address> {
    const response: AxiosResponse<Address> = await this.api.post('/store/addresses/', addressData);
    return response.data;
  }

  async updateAddress(addressId: number, addressData: { 
    street: string; 
    city: string; 
    post_code: string;
    house_number: number;
    apartment_number?: number | null;
  }): Promise<Address> {
    const response: AxiosResponse<Address> = await this.api.put(`/store/addresses/${addressId}/`, addressData);
    return response.data;
  }

  async deleteAddress(addressId: number): Promise<void> {
    await this.api.delete(`/store/addresses/${addressId}/`);
  }

  // Payment / Stripe
  async createCheckoutSession(data: {
    orderId: number;
    addressId: number;
  }): Promise<{ url: string; sessionId: string }> {
    const response: AxiosResponse<{ url: string; sessionId: string }> = await this.api.post('/store/create-checkout-session/', data);
    return response.data;
  }

  // Cancel order
  async cancelOrder(orderId: number): Promise<void> {
    await this.api.post('/store/cancel-order/', { orderId });
  }

  // Guest checkout methods
  async createGuestOrder(data: {
    cart_id: string;
    guest_email: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_phone: string;
    street: string;
    house_number: number;
    apartment_number?: number | null;
    city: string;
    post_code: string;
  }): Promise<{
    id: number;
    total_price: number;
    guest_email: string;
    guest_first_name: string;
    guest_last_name: string;
  }> {
    const response = await this.api.post('/store/guest-order/', data);
    return response.data;
  }

  async createGuestCheckoutSession(data: {
    orderId: number;
  }): Promise<{ url: string; sessionId: string }> {
    const response = await this.api.post('/store/guest-checkout-session/', data);
    return response.data;
  }

  async verifyGuestPayment(sessionId: string, orderId: number): Promise<any> {
    const response = await this.api.get(`/store/guest-payment-success/?session_id=${sessionId}&order_id=${orderId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 