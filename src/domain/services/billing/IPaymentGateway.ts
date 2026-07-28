export interface PaymentIntent {
  id: string;
  amountBrl: number;
  currency: 'BRL';
  status: 'pending' | 'succeeded' | 'failed';
  pixCode?: string;
  qrCodeUrl?: string;
}

export interface IPaymentGateway {
  createPixPayment(amount: number, description: string): Promise<PaymentIntent>;
  verifyPaymentStatus(paymentId: string): Promise<boolean>;
}
