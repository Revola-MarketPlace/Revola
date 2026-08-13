const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, restrictTo, hasPermission } = require("../middleware/auth");

const router = express.Router();

// ── Public webhook (originates from payment gateways, no JWT) ─────────────
router.post("/webhook/:provider", paymentController.handleWebhook);

// ── Public bot routes (authenticated by one-time token, not JWT) ──────────
// Called by the Telegram bot on behalf of the buyer
router.post("/bot-link-validate", paymentController.botLinkValidate);
router.post("/bot-submit-receipt", paymentController.botSubmitReceipt);

// ── JWT-protected routes ──────────────────────────────────────────────────
router.use(protect);

// Buyer: generate a secure Telegram deep link after checkout
router.get(
  "/generate-bot-link/:orderId",
  restrictTo("BUYER"),
  paymentController.generateBotLink,
);

// Buyer: legacy website-based bank transfer reference submission
router.post(
  "/submit-reference",
  restrictTo("BUYER"),
  paymentController.submitBankTransferDetails,
);

// Staff/Admin: verify manual bank transfer
router.post(
  "/verify-manual",
  restrictTo("ADMIN", "STAFF"),
  hasPermission("VERIFY_PAYMENTS"),
  paymentController.verifyPaymentManual,
);

// Staff/Admin: list all pending manual bank transfers
router.get(
  "/pending",
  restrictTo("ADMIN", "STAFF"),
  hasPermission("VERIFY_PAYMENTS"),
  paymentController.getPendingManualPayments,
);

// Frontend callback after online payment gateway redirect
router.get("/verify-online", paymentController.verifyOnlinePayment);

module.exports = router;
