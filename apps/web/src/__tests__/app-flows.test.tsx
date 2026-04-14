import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { CheckoutPage } from "../pages/shopper/CheckoutPage";

vi.mock("../api/client", () => ({
  orderApi: {
    checkout: vi.fn()
  }
}));

const { orderApi } = await import("../api/client");

describe("frontend flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects guests away from protected routes", () => {
    render(
      <AuthContext.Provider
        value={{
          token: null,
          user: null,
          isAuthenticated: false,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn()
        }}
      >
        <MemoryRouter initialEntries={["/checkout"]}>
          <Routes>
            <Route element={<ProtectedRoute roles={["user"]} />}>
              <Route path="/checkout" element={<div>Checkout</div>} />
            </Route>
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("shows failed-checkout feedback", async () => {
    vi.mocked(orderApi.checkout).mockResolvedValue({
      id: 55,
      userId: 7,
      userEmail: "shopper@example.com",
      total: 42,
      status: "payment_failed",
      paymentMode: "failure",
      failureReason: "Simulated payment failure",
      createdAt: new Date().toISOString(),
      items: []
    });

    render(
      <AuthContext.Provider
        value={{
          token: "token",
          user: {
            id: 7,
            email: "shopper@example.com",
            role: "user"
          },
          isAuthenticated: true,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn()
        }}
      >
        <CartContext.Provider
          value={{
            items: [
              {
                productId: 1,
                quantity: 1,
                product: {
                  id: 1,
                  name: "Observability Mug",
                  slug: "observability-mug",
                  description: "Mug",
                  category: "Home",
                  imageUrl: "image",
                  price: 18.95,
                  inventory: 10
                }
              }
            ],
            addItem: vi.fn(),
            updateQuantity: vi.fn(),
            removeItem: vi.fn(),
            clearCart: vi.fn(),
            totalItems: 1,
            totalPrice: 18.95
          }}
        >
          <MemoryRouter>
            <CheckoutPage />
          </MemoryRouter>
        </CartContext.Provider>
      </AuthContext.Provider>
    );

    await userEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/Checkout failed intentionally/i)).toBeInTheDocument();
  });
});

