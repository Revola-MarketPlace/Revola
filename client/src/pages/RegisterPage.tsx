import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User, UserPlus, ShieldAlert } from "lucide-react";

const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "BUYER",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: any) => {
    const newUser = await registerAuth(
      data.name,
      data.email,
      data.password,
      data.role,
    );
    if (newUser) {
      if (newUser.role === "SELLER") {
        navigate("/seller-dashboard", { replace: true });
      } else {
        navigate("/buyer-dashboard", { replace: true });
      }
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
            Create an account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Account Role Toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === "BUYER" ? "border-primary-500 bg-primary-50/50 text-primary-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    value="BUYER"
                    {...register("role")}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold">Buyer</span>
                  <span className="text-[10px] text-center mt-1">
                    Browse and purchase materials
                  </span>
                </label>
                <label
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === "SELLER" ? "border-primary-500 bg-primary-50/50 text-primary-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    value="SELLER"
                    {...register("role")}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold">Seller</span>
                  <span className="text-[10px] text-center mt-1">
                    List and sell usable waste
                  </span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  className={`pl-10 block w-full rounded-xl border border-slate-200 bg-white py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all ${errors.name ? "border-rose-500 focus:ring-rose-500" : ""}`}
                  placeholder="Abebe Kebede"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                  {errors.email.message}
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
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {selectedRole === "SELLER" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-amber-600" />
              <p>
                <strong>Seller Notice:</strong> To maintain platform quality,
                newly registered seller accounts must be approved by a platform
                administrator before listing public items.
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-200/60 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
              {!isSubmitting && <UserPlus className="w-4 h-4 ml-2 mt-0.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
