import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, ArrowRight } from "lucide-react";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // Helper: map role to its dashboard path
  const dashboardFor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin-dashboard";
      case "STAFF":
        return "/staff-dashboard";
      case "SELLER":
        return "/seller-dashboard";
      default:
        return "/buyer-dashboard";
    }
  };

  const onSubmit = async (data: any) => {
    const loggedInUser = await login(data.email, data.password);
    if (loggedInUser) {
      // Navigate directly to role dashboard — avoids race condition where
      // React state hasn't propagated yet when navigating back to 'from'.
      navigate(dashboardFor(loggedInUser.role), { replace: true });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center">
          <span className="inline-flex items-center justify-center bg-primary-600 text-white w-12 h-12 rounded-xl shadow-md text-2xl font-bold mb-4">
            A
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Or{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email", {
                    required: "Email address is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={`pl-10 block w-full rounded-xl border border-slate-200 bg-white py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all ${errors.email ? "border-rose-500 focus:ring-rose-500" : ""}`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`pl-10 block w-full rounded-xl border border-slate-200 bg-white py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all ${errors.password ? "border-rose-500 focus:ring-rose-500" : ""}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {errors.password.message as string}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-200/60 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
              {!isSubmitting && (
                <ArrowRight className="w-4 h-4 ml-2 mt-0.5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </form>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-6 text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">DEVELOPMENT DEMO LOGINS:</p>
          <p>
            • Admin:{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              admin@marketplace.com
            </code>{" "}
            /{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              AdminPass123
            </code>
          </p>
          <p>
            • Staff (Logistics):{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              staff.logistics@marketplace.com
            </code>{" "}
            /{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              StaffPass123
            </code>
          </p>
          <p>
            • Seller:{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              seller1@marketplace.com
            </code>{" "}
            /{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              SellerPass123
            </code>
          </p>
          <p>
            • Buyer:{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              buyer1@marketplace.com
            </code>{" "}
            /{" "}
            <code className="bg-slate-200 px-1 py-0.5 rounded">
              BuyerPass123
            </code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
