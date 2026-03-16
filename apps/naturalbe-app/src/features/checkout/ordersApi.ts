import { http } from "../../core/api/http";
import { appEnv } from "../../core/config/env";
import type { CheckoutFormData } from "../../pages/checkoutValidation";

export type CreateOrderItemInput = {
  id: string;
  quantity: number;
};

export type CreateOrderInput = {
  customer: CheckoutFormData;
  items: CreateOrderItemInput[];
};

export type CreateOrderResponse = {
  orderId: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "COP";
  whatsappMessage: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  return await http<CreateOrderResponse>(appEnv.orderApiPath, {
    method: "POST",
    body: input
  });
}
