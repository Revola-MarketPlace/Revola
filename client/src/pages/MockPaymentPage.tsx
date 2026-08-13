import React, { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

const MockPaymentPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const amount = searchParams.get("amount") || "0";
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "FAILED">("IDLE");

  // Determine provider from the transaction prefix
  const getProvider = () => {
    if (transactionId?.startsWith("TX-TELEBIRR-")) return "telebirr";
    if (transactionId?.startsWith("TX-CHAPA-")) return "chapa";
    return "mock";
  };

  const handleSimulatePayment = async (success: boolean) => {
    setProcessing(true);
    const provider = getProvider();

    try {
      if (success) {
        // Send a post request directly to our backend webhook endpoint to verify the transaction
        const response = await api.post(`/payments/webhook/${provider}`, {
          tx_ref: transactionId,
          outTradeNo: transactionId,
          status: "success",
        });

        if (response.data.success || response.data.status === "PAID") {
          setStatus("SUCCESS");
          showToast("Mock Payment Processed Successfully!", "success");
        } else {
          setStatus("FAILED");
          showToast("Payment verification returned failure status.", "error");
        }
      } else {
        await api.post(`/payments/webhook/${provider}`, {
          tx_ref: transactionId,
          status: "failed",
        });
        setStatus("FAILED");
        showToast("Mock Payment Cancelled / Failed.", "info");
      }
    } catch (error) {
      console.error(error);
      showToast("Error communicating with mock payment gateway.", "error");
      setStatus("FAILED");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-900 text-white min-h-[80vh]">
      <div className="max-w-md w-full space-y-6 bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Development badge */}
        <div className="absolute top-0 right-0 left-0 bg-amber-500 text-slate-950 text-center font-black py-1.5 uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 z-10 shadow-sm">
          <ShieldAlert className="w-4 h-4" />
          DEVELOPMENT ONLY MOCK GATEWAY
        </div>

        {status === "IDLE" && (
          <div className="space-y-6 pt-6">
            <div className="text-center">
              <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Ethio-Escrow Portal
              </span>
              <h2 className="text-2xl font-black text-white mt-3">
                Simulate Payment Gateway
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                This screen mimics a hosted Chapa/Telebirr payment redirection.
              </p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-300 font-bold">
                  {transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provider:</span>
                <span className="uppercase text-slate-300 font-bold">
                  {getProvider()}
                </span>
              </div>
              <div className="border-t border-slate-850 pt-2 flex justify-between text-sm">
                <span className="text-slate-400">Amount Due:</span>
                <span className="text-accent-400 font-black">
                  {Number(amount).toLocaleString()} ETB
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                disabled={processing}
                onClick={() => handleSimulatePayment(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                {processing ? "Processing..." : "Simulate SUCCESSFUL Payment"}
              </button>
              <button
                disabled={processing}
                onClick={() => handleSimulatePayment(false)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-rose-950/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4.5 h-4.5" />
                Simulate FAILED / CANCELLED Payment
              </button>
            </div>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="text-center space-y-6 pt-6">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Payment Confirmed!
              </h2>
              <p className="text-xs text-slate-400">
                The simulated webhook updated the order status to CONFIRMED.
              </p>
            </div>
            <button
              onClick={() => navigate("/buyer-dashboard")}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-primary-950/20"
            >
              Go to Buyer Dashboard
            </button>
          </div>
        )}

        {status === "FAILED" && (
          <div className="text-center space-y-6 pt-6">
            <div className="inline-flex p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
              <XCircle className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                Payment Declined
              </h2>
              <p className="text-xs text-slate-400">
                The transaction was reported as cancelled or failed.
              </p>
            </div>
            <button
              onClick={() => navigate("/buyer-dashboard")}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-3.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              Go to Buyer Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockPaymentPage;
