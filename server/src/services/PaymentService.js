const axios = require("axios");
const crypto = require("crypto");

// ─────────────────────────────────────────────────────────────────────────────
// Base class
// ─────────────────────────────────────────────────────────────────────────────
class PaymentProvider {
  async initializePayment(order, callbackUrl) {
    throw new Error("initializePayment not implemented");
  }
  async verifyPayment(transactionId) {
    throw new Error("verifyPayment not implemented");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEVELOPMENT ONLY — Mock Payment Provider
//    ⚠️  This provider MUST NEVER be used in production.
// ─────────────────────────────────────────────────────────────────────────────
class MockProvider extends PaymentProvider {
  _guardProduction() {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "MockProvider is disabled in production. Configure real payment keys.",
      );
    }
  }

  async initializePayment(order, callbackUrl) {
    this._guardProduction();
    const txRef = `TX-MOCK-${Date.now()}-${order._id}`;
    const paymentUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/mock-payment/${txRef}?amount=${order.total}`;
    return { success: true, transactionId: txRef, paymentUrl };
  }

  async verifyPayment(transactionId) {
    this._guardProduction();
    if (transactionId.startsWith("TX-MOCK-")) {
      return { status: "PAID", transactionId, amount: 0 };
    }
    return { status: "FAILED", transactionId };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Chapa Provider (Ethiopian Payment Gateway)
//    Docs: https://developer.chapa.co/
// ─────────────────────────────────────────────────────────────────────────────
class ChapaProvider extends PaymentProvider {
  constructor() {
    super();
    this.secretKey = process.env.CHAPA_SECRET_KEY;
    this.baseUrl = "https://api.chapa.co/v1";
  }

  async initializePayment(order, callbackUrl) {
    if (!this.secretKey) throw new Error("CHAPA_SECRET_KEY is missing.");

    const txRef = `TX-CHAPA-${Date.now()}-${order._id}`;
    const payload = {
      amount: order.total,
      currency: "ETB",
      email: order.buyer?.email || "buyer@marketplace.com",
      first_name: (order.buyer?.name || "Buyer").split(" ")[0],
      last_name: (order.buyer?.name || "Marketplace").split(" ")[1] || "User",
      tx_ref: txRef,
      callback_url: callbackUrl,
      customization: {
        title: "Adama Materials Marketplace",
        description: `Payment for Order ${order.trackingNumber}`,
      },
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );
      if (response.data?.status === "success") {
        return {
          success: true,
          transactionId: txRef,
          paymentUrl: response.data.data.checkout_url,
        };
      }
      throw new Error(response.data?.message || "Chapa initialization failed.");
    } catch (error) {
      console.error("Chapa init error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
          "Chapa Payment Gateway Initialization Failed.",
      );
    }
  }

  async verifyPayment(transactionId) {
    if (!this.secretKey) throw new Error("CHAPA_SECRET_KEY is missing.");
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
          timeout: 10000,
        },
      );
      if (response.data?.status === "success") {
        const d = response.data.data;
        if (d.status === "success") {
          return {
            status: "PAID",
            transactionId: d.tx_ref,
            amount: parseFloat(d.amount),
          };
        }
      }
      return { status: "FAILED", transactionId };
    } catch (error) {
      console.error(
        "Chapa verify error:",
        error.response?.data || error.message,
      );
      return { status: "FAILED", transactionId };
    }
  }

  /**
   * Verify that a webhook payload came from Chapa using HMAC-SHA256.
   * @param {string} rawBody - The raw request body string (before JSON.parse)
   * @param {string} signatureHeader - Value of the x-chapa-signature header
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    const secret = process.env.CHAPA_WEBHOOK_SECRET;
    if (!secret || !signatureHeader) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "hex"),
      Buffer.from(expected, "hex"),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Telebirr Provider
//    ⚠️  PRODUCTION TODO: Telebirr H5 API requires RSA-encrypted payload signing
//    per Ethio Telecom specifications. This skeleton handles bank-transfer-style
//    manual verification until real API credentials are available.
//    Reference: Ethio Telecom developer documentation (internal/NDA).
// ─────────────────────────────────────────────────────────────────────────────
class TelebirrProvider extends PaymentProvider {
  constructor() {
    super();
    this.apiKey = process.env.TELEBIRR_API_KEY;
    this.secret = process.env.TELEBIRR_SECRET;
  }

  async initializePayment(order, callbackUrl) {
    // TODO: Implement Ethio Telecom H5 encrypted payload and API call.
    // Until production keys and RSA signing are configured, we cannot
    // redirect users to a real Telebirr checkout page.
    const txRef = `TX-TELEBIRR-${Date.now()}-${order._id}`;
    // In dev this falls through to MockProvider via getProvider(). In production
    // real API integration is required — throw rather than silently fail:
    if (
      process.env.NODE_ENV === "production" &&
      (!this.apiKey || !this.secret)
    ) {
      throw new Error(
        "Telebirr API credentials (TELEBIRR_API_KEY, TELEBIRR_SECRET) are required in production.",
      );
    }
    const paymentUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/mock-payment/${txRef}?amount=${order.total}`;
    return { success: true, transactionId: txRef, paymentUrl };
  }

  async verifyPayment(transactionId) {
    // TODO: In production, call Telebirr verification endpoint and validate the signed response.
    // Until implemented, always return PENDING_VERIFICATION (manual staff review required).
    console.warn(
      "Telebirr real-API verification not implemented. Defaulting to PENDING_VERIFICATION.",
    );
    return { status: "PENDING_VERIFICATION", transactionId };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bank Transfer Provider — Always requires manual staff verification
// ─────────────────────────────────────────────────────────────────────────────
class BankTransferProvider extends PaymentProvider {
  async initializePayment(order, callbackUrl) {
    const txRef = `TX-BANK-${Date.now()}-${order._id}`;
    return { success: true, transactionId: txRef, paymentUrl: "" };
  }

  async verifyPayment(transactionId) {
    return { status: "PENDING_VERIFICATION", transactionId };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentService — selects the correct provider per environment
// ─────────────────────────────────────────────────────────────────────────────
class PaymentService {
  constructor() {
    this.mock = new MockProvider();
    this.chapa = new ChapaProvider();
    this.telebirr = new TelebirrProvider();
    this.bankTransfer = new BankTransferProvider();
  }

  /**
   * Get configurable marketplace commission rate.
   * Reads MARKETPLACE_COMMISSION_RATE env var; defaults to 0.10 (10%).
   */
  static getCommissionRate() {
    const rate = parseFloat(process.env.MARKETPLACE_COMMISSION_RATE);
    return isNaN(rate) || rate <= 0 || rate >= 1 ? 0.1 : rate;
  }

  getProvider(method) {
    if (method === "BANK_TRANSFER") return this.bankTransfer;

    // In development, route online payment methods through mock if real keys not set
    if (process.env.NODE_ENV !== "production") {
      return this.mock;
    }

    // Production: use real providers
    if (method === "CHAPA") return this.chapa;
    if (method === "TELEBIRR") return this.telebirr;

    // Fallback — should never reach here in production
    throw new Error(`Unknown payment method: ${method}`);
  }

  async initialize(order, method, callbackUrl) {
    return this.getProvider(method).initializePayment(order, callbackUrl);
  }

  async verify(transactionId, method) {
    return this.getProvider(method).verifyPayment(transactionId);
  }

  /**
   * Verify Chapa webhook signature.
   * @param {string} rawBody - Raw request body string
   * @param {string} signatureHeader - x-chapa-signature header value
   */
  verifyChapaWebhook(rawBody, signatureHeader) {
    return this.chapa.verifyWebhookSignature(rawBody, signatureHeader);
  }
}

module.exports = new PaymentService();
