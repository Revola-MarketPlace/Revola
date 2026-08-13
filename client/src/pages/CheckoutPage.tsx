import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import {
  MapPin,
  CreditCard,
  ShoppingBag,
  Landmark,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import api from "../services/api";

const CheckoutPage: React.FC = () => {
  const { items, subtotal, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Address form fields
  const [streetAddress, setStreetAddress] = useState("");
  const [subCity, setSubCity] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<
    "TELEBIRR" | "BANK_TRANSFER"
  >("BANK_TRANSFER");

  // Dynamic delivery fee calculation states
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<any>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch live estimated delivery fee based on day, distance (address), and quantity
  useEffect(() => {
    let currentAddress: any = null;
    if (selectedAddressId) {
      const addr = addresses.find((a) => a._id === selectedAddressId);
      if (addr) currentAddress = addr;
    } else if (streetAddress || subCity) {
      currentAddress = { streetAddress, subCity, city: "Adama" };
    }

    api
      .post("/orders/estimate-delivery-fee", {
        address: currentAddress,
        totalQuantity,
        date: new Date(),
      })
      .then((res) => {
        if (res.data.success) {
          setEstimatedFee(res.data.deliveryFee);
          setFeeBreakdown(res.data.breakdown);
        }
      })
      .catch((err) => console.error(err));
  }, [selectedAddressId, streetAddress, subCity, addresses, totalQuantity]);

  // Bank transfer success state
  const [bankTransferSuccess, setBankTransferSuccess] = useState<null | {
    orderId: string;
    orderTotal: number;
    trackingNumber: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }>(null);
  const [botDeepLink, setBotDeepLink] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0 && !bankTransferSuccess) {
      showToast("Your cart is empty.", "warning");
      navigate("/products");
      return;
    }

    // Fetch user's saved addresses
    setLoading(true);
    api
      .get("/auth/me/addresses")
      .then((res) => {
        if (res.data.success) {
          setAddresses(res.data.addresses || []);
          if (res.data.addresses.length > 0) {
            const def =
              res.data.addresses.find((a: any) => a.isDefault) ||
              res.data.addresses[0];
            setSelectedAddressId(def._id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [items, navigate, showToast, bankTransferSuccess]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedAddressId && (!streetAddress || !subCity || !phoneNumber)) {
        showToast(
          "Please select a saved address or fill in all address details.",
          "warning",
        );
        return;
      }
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleGenerateBotLink = async (orderId: string) => {
    setGeneratingLink(true);
    try {
      const res = await api.get(`/payments/generate-bot-link/${orderId}`);
      if (res.data.success) {
        setBotDeepLink(res.data.deepLink);
        window.open(res.data.deepLink, "_blank");
      }
    } catch (err: any) {
      showToast("Could not generate Telegram link. Please try again.", "error");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    let finalAddress: any = null;

    try {
      if (selectedAddressId) {
        const addr = addresses.find((a) => a._id === selectedAddressId);
        if (addr) {
          finalAddress = {
            streetAddress: addr.streetAddress,
            subCity: addr.subCity,
            city: addr.city,
            phoneNumber: addr.phoneNumber,
          };
        }
      } else {
        finalAddress = {
          streetAddress,
          subCity,
          city: "Adama",
          phoneNumber,
        };

        if (saveAddress) {
          await api.post("/auth/me/addresses", {
            title: "Saved Address",
            streetAddress,
            subCity,
            city: "Adama",
            phoneNumber,
            isDefault: addresses.length === 0,
          });
        }
      }

      const response = await api.post("/orders/checkout", {
        deliveryAddress: finalAddress,
        paymentMethod,
      });

      if (response.data.success) {
        const orderId = response.data.order._id;
        await clearCart();

        if (paymentMethod === "BANK_TRANSFER" || paymentMethod === "TELEBIRR") {
          // Show the transfer instructions panel — fetch bot link details
          setGeneratingLink(true);
          try {
            const linkRes = await api.get(
              `/payments/generate-bot-link/${orderId}`,
            );
            if (linkRes.data.success) {
              setBotDeepLink(linkRes.data.deepLink);
              setBankTransferSuccess({
                orderId,
                orderTotal:
                  linkRes.data.orderTotal || response.data.order.total,
                trackingNumber:
                  linkRes.data.trackingNumber ||
                  response.data.order.trackingNumber,
                bankName: linkRes.data.bankDetails.bankName,
                accountNumber: linkRes.data.bankDetails.accountNumber,
                accountName: linkRes.data.bankDetails.accountName,
              });
              // Immediately redirect user to the Telegram bot
              showToast(
                "Redirecting to Telegram bot to verify payment...",
                "success",
              );
              setTimeout(() => {
                window.location.href = linkRes.data.deepLink;
              }, 1200);
            }
          } catch {
            // fallback: still show instructions without deep link
            setBankTransferSuccess({
              orderId,
              orderTotal: response.data.order.total,
              trackingNumber: response.data.order.trackingNumber,
              bankName: "Commercial Bank of Ethiopia (CBE)",
              accountNumber: "1000123456789",
              accountName: "Adama Materials Marketplace PLC",
            });
          } finally {
            setGeneratingLink(false);
          }
        } else {
          showToast("Order created successfully!", "success");
          if (response.data.paymentUrl) {
            window.location.href = response.data.paymentUrl;
          } else {
            navigate(`/buyer-dashboard?order=${orderId}`);
          }
        }
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Checkout failed. Try again.";
      showToast(msg, "error");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ── Bank Transfer Success Panel ──────────────────────────────────────────
  if (bankTransferSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex-1 flex flex-col items-center">
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-7 text-white text-center">
            <div className="text-4xl mb-2">✅</div>
            <h1 className="text-2xl font-extrabold">Order Placed!</h1>
            <p className="text-emerald-100 text-sm mt-1">
              Now complete your payment via bank transfer
            </p>
          </div>

          {/* Order Info */}
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Tracking Number
              </p>
              <p className="text-lg font-extrabold text-slate-900 font-mono">
                {bankTransferSuccess.trackingNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Amount Due
              </p>
              <p className="text-2xl font-extrabold text-emerald-700">
                {bankTransferSuccess.orderTotal?.toLocaleString()} ETB
              </p>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Bank Transfer Instructions */}
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🏦</span> Transfer To This Account
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Bank Name
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {bankTransferSuccess.bankName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Account Number
                  </span>
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-widest">
                    {bankTransferSuccess.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Account Name
                  </span>
                  <span className="text-sm font-bold text-slate-800 text-right max-w-[55%]">
                    {bankTransferSuccess.accountName}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-400 font-medium">
                    Amount to Transfer
                  </span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {bankTransferSuccess.orderTotal?.toLocaleString()} ETB
                  </span>
                </div>
              </div>
            </div>

            {/* Telegram Bot CTA */}
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Submit Receipt via Telegram Bot
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    After transferring, open our Telegram bot to submit your
                    reference number. Your admin will verify it and you'll
                    receive your <strong>Order ID</strong> instantly.
                  </p>
                </div>
              </div>
              <ol className="text-xs text-slate-600 space-y-1.5 mb-4 list-decimal list-inside">
                <li>
                  Transfer{" "}
                  <strong>
                    {bankTransferSuccess.orderTotal?.toLocaleString()} ETB
                  </strong>{" "}
                  to the account above
                </li>
                <li>Tap the button below to open our Telegram bot</li>
                <li>The bot will ask for your transfer reference number</li>
                <li>
                  Admin verifies and you receive your Order ID via the bot
                </li>
                <li>Show that Order ID when your delivery arrives</li>
              </ol>
              {botDeepLink ? (
                <a
                  href={botDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#0088cc] hover:bg-[#0077bb] text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
                  </svg>
                  Open Telegram Bot &amp; Submit Receipt
                </a>
              ) : (
                <button
                  onClick={() =>
                    handleGenerateBotLink(bankTransferSuccess.orderId)
                  }
                  disabled={generatingLink}
                  className="flex items-center justify-center gap-3 w-full bg-[#0088cc] hover:bg-[#0077bb] text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md transition-all disabled:opacity-60"
                >
                  {generatingLink
                    ? "Generating link..."
                    : "🤖 Open Telegram Bot & Submit Receipt"}
                </button>
              )}
            </div>

            {/* Go to dashboard */}
            <div className="text-center">
              <button
                onClick={() =>
                  navigate(
                    `/buyer-dashboard?order=${bankTransferSuccess.orderId}`,
                  )
                }
                className="text-sm text-slate-400 hover:text-slate-600 underline"
              >
                View order in my dashboard instead →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-4 max-w-lg mx-auto w-full mb-10">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${step >= 1 ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-500"}`}
          >
            1
          </span>
          <span
            className={`text-sm font-semibold ${step >= 1 ? "text-primary-900" : "text-slate-400"}`}
          >
            Address
          </span>
        </div>
        <div className="h-0.5 bg-slate-200 flex-1"></div>
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${step >= 2 ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-500"}`}
          >
            2
          </span>
          <span
            className={`text-sm font-semibold ${step >= 2 ? "text-primary-900" : "text-slate-400"}`}
          >
            Payment
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left wizard panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
          {step === 1 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Select Delivery Address
              </h2>

              {/* Saved Addresses List */}
              {addresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Your Saved Addresses
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((a) => (
                      <label
                        key={a._id}
                        className={`p-4 border-2 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${selectedAddressId === a._id ? "border-primary-500 bg-primary-50/20" : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === a._id}
                          onChange={() => {
                            setSelectedAddressId(a._id);
                            // Clear new address fields
                            setStreetAddress("");
                            setSubCity("");
                            setPhoneNumber("");
                          }}
                          className="mt-1 border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-slate-800">
                            {a.title}{" "}
                            {a.isDefault && (
                              <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium ml-1.5">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500">
                            {a.streetAddress}, {a.subCity}
                          </div>
                          <div className="text-slate-400">
                            Phone: {a.phoneNumber}
                          </div>
                        </div>
                      </label>
                    ))}
                    <label
                      className={`p-4 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all border-dashed ${!selectedAddressId ? "border-primary-500 bg-primary-50/20" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={!selectedAddressId}
                        onChange={() => setSelectedAddressId("")}
                        className="sr-only"
                      />
                      <span className="text-xs font-bold text-primary-600">
                        + Add New Address
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Add New Address Form */}
              {!selectedAddressId && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    New Delivery Address (Adama City)
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sub-City / Kebele
                      </label>
                      <input
                        type="text"
                        value={subCity}
                        onChange={(e) => setSubCity(e.target.value)}
                        placeholder="e.g. Kebele 02, Bole Subcity"
                        className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+251911223344"
                        className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address Details
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. House 402, Block 12, near CBE Bank"
                      className="w-full py-2 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Save this address for future purchases</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleNextStep}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Choose Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === "TELEBIRR" ? "border-primary-500 bg-primary-50/20" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "TELEBIRR"}
                    onChange={() => setPaymentMethod("TELEBIRR")}
                    className="border-slate-300 text-primary-600 focus:ring-primary-500 w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-800">
                      Telebirr Mobile Payment
                    </div>
                    <div className="text-xs text-slate-400">
                      Pay securely using your Ethio Telecom Telebirr account.
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${paymentMethod === "BANK_TRANSFER" ? "border-primary-500 bg-primary-50/20" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    className="border-slate-300 text-primary-600 focus:ring-primary-500 w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1 flex gap-2.5 items-center">
                    <Landmark className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        Manual Bank Transfer
                      </div>
                      <div className="text-xs text-slate-400">
                        Transfer funds manually and submit reference. Requires
                        staff verification.
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handlePrevStep}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {placingOrder ? "Processing..." : "Place Order & Pay"}
                  {!placingOrder && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right order summary */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            Your Order
          </h3>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.product._id} className="py-3 flex gap-3 text-xs">
                <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                  <img
                    src={item.product.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 line-clamp-1">
                    {item.product.name}
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {item.quantity} x {item.product.price} ETB
                  </div>
                </div>
                <div className="font-bold text-slate-800 self-center">
                  {(item.quantity * item.product.price).toLocaleString()} ETB
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Items Subtotal</span>
              <span className="font-bold text-slate-700">
                {subtotal.toLocaleString()} ETB
              </span>
            </div>

            <div className="space-y-1 bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">
                  Calculated Delivery Fee
                </span>
                <span className="font-extrabold text-primary-900 text-sm">
                  {estimatedFee !== null
                    ? `${estimatedFee.toLocaleString()} ETB`
                    : "100 ETB"}
                </span>
              </div>

              {feeBreakdown && (
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5 border-t border-slate-200/60">
                  <div className="flex justify-between">
                    <span>Distance & Zone:</span>
                    <span className="font-semibold text-slate-700">
                      {feeBreakdown.locationZone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Day Factor:</span>
                    <span className="font-semibold text-slate-700">
                      {feeBreakdown.dayLabel} ({feeBreakdown.dayName})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity ({feeBreakdown.totalQuantity} items):</span>
                    <span className="font-semibold text-slate-700">
                      {feeBreakdown.quantitySurcharge > 0
                        ? `+${feeBreakdown.quantitySurcharge} ETB bulk fee`
                        : "Base Qty Included"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-extrabold text-slate-950">
              <span>Total Amount Due</span>
              <span className="text-primary-900 text-base">
                {(
                  subtotal + (estimatedFee !== null ? estimatedFee : 100)
                ).toLocaleString()}{" "}
                ETB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
