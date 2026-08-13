import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  MapPin,
  Bell,
} from "lucide-react";
import api from "../services/api";

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer and notifications popup on route change (Rule 24)
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadNotifications(res.data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "BUYER") return "/buyer-dashboard";
    if (user.role === "SELLER") return "/seller-dashboard";
    if (user.role === "STAFF") return "/staff-dashboard";
    if (user.role === "ADMIN") return "/admin-dashboard";
    return "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary-900"
          >
            <span className="bg-primary-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md">
              A
            </span>
            <span>
              Adama
              <span className="text-accent-600 font-semibold">Materials</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/products"
              className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors"
            >
              Catalog
            </Link>
            {user && (
              <Link
                to={getDashboardLink()}
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors flex items-center gap-1"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      if (!notificationsOpen && unreadNotifications > 0) {
                        markAllNotificationsAsRead();
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 flex flex-col"
                      >
                        <div className="p-3 border-b border-slate-100 font-semibold text-sm flex justify-between items-center bg-slate-50">
                          <span>Notifications</span>
                          {unreadNotifications > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n._id}
                                className={`p-3 text-xs transition-colors ${n.read ? "bg-white" : "bg-slate-50/70 font-medium"}`}
                              >
                                <div className="text-slate-800">{n.title}</div>
                                <div className="text-slate-500 mt-0.5">
                                  {n.message}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {user.role === "BUYER" && (
                  <Link
                    to="/cart"
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all relative"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-accent-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-800">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Hamburger Menu) - Rule 24 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-2xl z-50 flex flex-col p-6 border-l border-slate-200"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-lg text-primary-900">
                  Navigation
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-4 flex-1">
                <Link
                  to="/products"
                  className="text-base font-semibold text-slate-700 hover:text-primary-600 py-2 border-b border-slate-100"
                >
                  Browse Catalog
                </Link>
                {user ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="text-base font-semibold text-slate-700 hover:text-primary-600 py-2 border-b border-slate-100 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    {user.role === "BUYER" && (
                      <Link
                        to="/cart"
                        className="text-base font-semibold text-slate-700 hover:text-primary-600 py-2 border-b border-slate-100 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Cart
                        </span>
                        {cartCount > 0 && (
                          <span className="bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <div className="mt-auto p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          {user.role}
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-auto flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="w-full text-center py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="w-full text-center py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold shadow-md hover:bg-primary-700"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white mb-4">
              <span className="bg-primary-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
                A
              </span>
              <span>
                Adama
                <span className="text-accent-400 font-semibold">Materials</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Adama City's premium MERN stack managed platform for high-quality
              recyclable and reusable construction and industrial materials.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-semibold text-sm mb-2">
              Location & Coverage
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-accent-400 flex-shrink-0" />
              <span>Adama City, Oromia, Ethiopia</span>
            </div>
            <p className="text-xs text-slate-500 pl-6">
              Covering Bole, Kebele 01-14, and surrounding industrial zones.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              Marketplace Policies
            </h4>
            <ul className="text-sm flex flex-col gap-2">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Buyer Protection
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">
                  Seller Guidelines
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Adama Materials Marketplace.
          Developed in Ethiopia. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
