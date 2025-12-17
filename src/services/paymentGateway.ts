/**
 * Payment Gateway Service
 * 
 * This service provides a unified interface for payment processing.
 * Currently supports placeholder implementations for:
 * - Stripe (Credit Card)
 * - PayMe (HK)
 * - FPS (Faster Payment System - HK)
 * - Alipay HK
 * - WeChat Pay HK
 * 
 * To integrate a real payment gateway:
 * 1. Install the SDK (e.g., npm install @stripe/stripe-js)
 * 2. Replace the placeholder methods with actual API calls
 * 3. Add environment variables for API keys
 */

export type PaymentMethod = 'stripe' | 'payme' | 'fps' | 'alipay' | 'wechat'

export interface PaymentRequest {
  amount: number // in HKD cents (e.g., 12500 = HK$125)
  currency: 'HKD'
  description: string
  metadata: {
    barId: string
    barName: string
    personCount: number
    userId: string
    userEmail: string
  }
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  error?: string
  paymentMethod: PaymentMethod
  receiptUrl?: string
}

export interface PaymentIntent {
  id: string
  clientSecret: string
  amount: number
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
}

// Payment method display info
export const PAYMENT_METHODS: Record<PaymentMethod, { name: string; nameEn: string; icon: string }> = {
  stripe: { name: '信用卡', nameEn: 'Credit Card', icon: '💳' },
  payme: { name: 'PayMe', nameEn: 'PayMe', icon: '🔴' },
  fps: { name: '轉數快', nameEn: 'FPS', icon: '⚡' },
  alipay: { name: '支付寶HK', nameEn: 'Alipay HK', icon: '🔵' },
  wechat: { name: '微信支付HK', nameEn: 'WeChat Pay HK', icon: '🟢' },
}

class PaymentGatewayService {
  private _initialized = false

  /**
   * Initialize the payment gateway with API credentials
   * Call this once when the app starts
   */
  initialize(config: { stripePublicKey?: string; paymeApiKey?: string }) {
    // TODO: Initialize payment SDKs
    // Example for Stripe:
    // import { loadStripe } from '@stripe/stripe-js'
    // this.stripe = await loadStripe(config.stripePublicKey)
    
    this._initialized = true
    console.log('[PaymentGateway] Initialized with config:', Object.keys(config))
  }

  get isInitialized(): boolean {
    return this._initialized
  }

  /**
   * Create a payment intent (for Stripe-like flow)
   * This should be called from your backend in production
   */
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentIntent> {
    // TODO: Replace with actual API call to your backend
    // Your backend should create the payment intent with Stripe/other provider
    
    console.log('[PaymentGateway] Creating payment intent:', request)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return mock payment intent
    return {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientSecret: `secret_${Date.now()}`,
      amount: request.amount,
      status: 'pending'
    }
  }

  /**
   * Process payment with Stripe (Credit Card)
   */
  async processStripePayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[PaymentGateway] Processing Stripe payment:', request)
    
    // TODO: Implement actual Stripe payment
    // 1. Create PaymentIntent on backend
    // 2. Use Stripe Elements to collect card details
    // 3. Confirm payment with stripe.confirmCardPayment()
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      transactionId: `txn_stripe_${Date.now()}`,
      paymentMethod: 'stripe',
      receiptUrl: 'https://receipt.stripe.com/example'
    }
  }

  /**
   * Process payment with PayMe
   */
  async processPayMePayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[PaymentGateway] Processing PayMe payment:', request)
    
    // TODO: Implement PayMe integration
    // PayMe uses deep linking or QR code for payment
    // 1. Generate PayMe payment link/QR
    // 2. User completes payment in PayMe app
    // 3. Receive webhook callback for confirmation
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      transactionId: `txn_payme_${Date.now()}`,
      paymentMethod: 'payme'
    }
  }

  /**
   * Process payment with FPS (Faster Payment System)
   */
  async processFPSPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[PaymentGateway] Processing FPS payment:', request)
    
    // TODO: Implement FPS integration
    // FPS typically uses QR code or FPS ID
    // 1. Generate FPS QR code with payment details
    // 2. User scans and pays via banking app
    // 3. Verify payment via bank API or manual confirmation
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      transactionId: `txn_fps_${Date.now()}`,
      paymentMethod: 'fps'
    }
  }

  /**
   * Process payment with Alipay HK
   */
  async processAlipayPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[PaymentGateway] Processing Alipay HK payment:', request)
    
    // TODO: Implement Alipay HK integration
    // 1. Create order via Alipay API
    // 2. Redirect user to Alipay or show QR code
    // 3. Handle callback after payment
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      transactionId: `txn_alipay_${Date.now()}`,
      paymentMethod: 'alipay'
    }
  }

  /**
   * Process payment with WeChat Pay HK
   */
  async processWeChatPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[PaymentGateway] Processing WeChat Pay HK payment:', request)
    
    // TODO: Implement WeChat Pay HK integration
    // 1. Create unified order via WeChat API
    // 2. Generate QR code or trigger in-app payment
    // 3. Handle payment notification callback
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      transactionId: `txn_wechat_${Date.now()}`,
      paymentMethod: 'wechat'
    }
  }

  /**
   * Main payment processing method
   * Routes to the appropriate payment processor based on method
   */
  async processPayment(method: PaymentMethod, request: PaymentRequest): Promise<PaymentResult> {
    switch (method) {
      case 'stripe':
        return this.processStripePayment(request)
      case 'payme':
        return this.processPayMePayment(request)
      case 'fps':
        return this.processFPSPayment(request)
      case 'alipay':
        return this.processAlipayPayment(request)
      case 'wechat':
        return this.processWeChatPayment(request)
      default:
        return {
          success: false,
          error: 'Unsupported payment method',
          paymentMethod: method
        }
    }
  }

  /**
   * Verify a payment status
   * Use this to check if a payment was successful
   */
  async verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }> {
    console.log('[PaymentGateway] Verifying payment:', transactionId)
    
    // TODO: Implement actual verification with payment provider
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      verified: true,
      status: 'completed'
    }
  }

  /**
   * Request a refund
   */
  async refundPayment(transactionId: string, amount?: number): Promise<{ success: boolean; refundId?: string }> {
    console.log('[PaymentGateway] Refunding payment:', transactionId, amount)
    
    // TODO: Implement actual refund with payment provider
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      refundId: `refund_${Date.now()}`
    }
  }
}

// Export singleton instance
export const paymentGateway = new PaymentGatewayService()

// Export types for use in components
export type { PaymentGatewayService }
