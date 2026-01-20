import DodoPayments from "dodopayments";

// Lazy initialization to avoid build-time errors
let _dodoClient: DodoPayments | null = null;

const getDodoClient = () => {
  if (!_dodoClient) {
    _dodoClient = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY || 'dummy-key-for-build',
    });
  }
  return _dodoClient;
};

// Export a getter instead of direct client
export const dodoClient = new Proxy({} as DodoPayments, {
  get(target, prop) {
    const client = getDodoClient();
    return Reflect.get(client, prop);
  }
});

// Type definitions for Dodo Payments
export interface DodoPaymentLink {
  payment_link: boolean;
  billing: {
    city: string;
    country: string;
    state: string;
    street: string;
    zipcode: string;
  };
  customer: {
    email: string;
    name: string;
  };
  product_cart: Array<{
    product_id: string;
    quantity: number;
  }>;
}

export interface DodoWebhookPayload {
  event_type: string;
  data: {
    payment_id: string;
    subscription_id?: string;
    customer: {
      email: string;
      name: string;
      customer_id: string;
    };
    product: {
      product_id: string;
      product_name: string;
      price: number;
      currency: string;
    };
    subscription?: {
      subscription_id: string;
      status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
      current_period_start: string;
      current_period_end: string;
      cancel_at_period_end: boolean;
      canceled_at?: string;
      recurring_interval: "month" | "year";
    };
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Create a payment link for a product
 */
export async function createPaymentLink(params: {
  productId: string;
  customer: {
    email: string;
    name: string;
  };
  redirectUrl?: string;
}): Promise<{ payment_id: string; payment_link: string }> {
  try {
    const payment = await dodoClient.payments.create({
      payment_link: true,
      billing: {
        city: "N/A",
        country: "US",
        state: "N/A",
        street: "N/A",
        zipcode: "00000",
      },
      customer: {
        email: params.customer.email,
        name: params.customer.name,
      },
      product_cart: [
        {
          product_id: params.productId,
          quantity: 1,
        },
      ],
    });

    return payment as { payment_id: string; payment_link: string };
  } catch (error) {
    console.error("Failed to create payment link:", error);
    throw new Error("Failed to create payment link");
  }
}

/**
 * Create a static checkout URL for a product
 */
export function createStaticCheckoutUrl(
  productId: string,
  redirectUrl?: string
): string {
  const baseUrl = `https://checkout.dodopayments.com/buy/${productId}`;
  const params = new URLSearchParams({
    quantity: "1",
  });

  if (redirectUrl) {
    params.append("redirect_url", redirectUrl);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Retrieve subscription details from Dodo Payments
 */
export async function getSubscriptionFromDodo(
  subscriptionId: string
): Promise<unknown> {
  try {
    // Note: This is a placeholder. Check Dodo Payments API docs for actual endpoint
    const response = await dodoClient.subscriptions?.retrieve(subscriptionId);
    return response;
  } catch (error) {
    console.error("Failed to retrieve subscription:", error);
    throw new Error("Failed to retrieve subscription");
  }
}

