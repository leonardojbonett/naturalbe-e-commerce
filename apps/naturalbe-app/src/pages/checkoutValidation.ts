import { z } from "zod";

const phoneDigits = /^\d{10,12}$/;

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizePhone = (value: string) => value.replace(/\D+/g, "");

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .transform(normalizeText)
    .pipe(z.string().min(3, "Nombre invalido").max(80, "Nombre demasiado largo")),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(phoneDigits, "Telefono invalido"))
    .refine(
      (value) => value.startsWith("3") || value.startsWith("57"),
      "Telefono invalido para Colombia"
    ),
  city: z
    .string()
    .transform(normalizeText)
    .pipe(z.string().min(2, "Ciudad invalida").max(60, "Ciudad demasiado larga")),
  address: z
    .string()
    .transform(normalizeText)
    .pipe(z.string().min(6, "Direccion invalida").max(140, "Direccion demasiado larga")),
  deliveryNote: z
    .string()
    .transform(normalizeText)
    .pipe(z.string().max(240, "La nota supera el maximo permitido")),
  paymentMethod: z.enum(["contraentrega", "transferencia"])
});

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormData = z.output<typeof checkoutFormSchema>;

export function validateCheckoutForm(form: CheckoutFormInput) {
  return checkoutFormSchema.safeParse(form);
}
