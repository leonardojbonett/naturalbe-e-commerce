import { describe, expect, it } from "vitest";
import { validateCheckoutForm } from "./checkoutValidation";

describe("validateCheckoutForm", () => {
  it("acepta un formulario valido y normaliza los campos", () => {
    const result = validateCheckoutForm({
      fullName: "  Laura   Martinez ",
      phone: "+57 313 721 2923",
      city: "  Bogota ",
      address: " Cra 12 # 34-56 ",
      deliveryNote: " Entregar en porteria ",
      paymentMethod: "contraentrega"
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.fullName).toBe("Laura Martinez");
    expect(result.data.phone).toBe("573137212923");
    expect(result.data.city).toBe("Bogota");
  });

  it("rechaza telefono invalido", () => {
    const result = validateCheckoutForm({
      fullName: "Laura Martinez",
      phone: "123",
      city: "Bogota",
      address: "Cra 12 # 34-56",
      deliveryNote: "",
      paymentMethod: "transferencia"
    });

    expect(result.success).toBe(false);
  });
});
