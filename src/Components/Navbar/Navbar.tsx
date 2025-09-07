// src/components/Navbar/Navbar.tsx
import { Link } from "react-router-dom";
import { navlinks } from "../../../Data/Data";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

import { toast } from "react-toastify";
import { loginSuccess, logout } from "../../Store/Slices/userAuthSlice";
import { useFormik } from "formik";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import type { RootState } from "../../Store/Store";

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const { userToken } = useAppSelector((store: RootState) => store.userReducer);
  // 🔹 دالة تسجيل الدخول
  const userLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/v1/auth/login", {
        username: values.username,
        password: values.password,
      });

      console.log("✅ Login Response:", res.data);

      dispatch(
        loginSuccess({ user: res.data.user, userToken: res.data.token })
      );

      toast.success("🎉 Logged in successfully!");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("❌ Login Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Formik Setup
  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: userLogin,
  });

  return (
    <>
      {/* ========== HEADER ========== */}
      <header className="flex flex-wrap lg:justify-start lg:flex-nowrap z-50 w-full py-7">
        <nav className="relative max-w-7xl w-full flex flex-wrap lg:grid lg:grid-cols-12 basis-full items-center px-4 md:px-6 lg:px-8 mx-auto">
          <div className="lg:col-span-3 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="ms-2 text-xl font-bold text-black dark:text-white">
                ParkEasy
              </span>
            </Link>
          </div>

          {!userToken ? (
            <>
              <div className="flex items-center gap-x-2 ms-auto py-1 lg:ps-6 lg:order-3 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-hidden transition disabled:opacity-50"
                >
                  Sign in
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-x-2 ms-auto py-1 lg:ps-6 lg:order-3 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-hidden transition disabled:opacity-50"
                >
                  Logout
                </button>
              </div>
            </>
          )}

          {/* Collapse */}
          <div
            id="hs-pro-hcail"
            className="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow lg:block lg:w-auto lg:basis-auto lg:order-2 lg:col-span-6"
          >
            <div className="flex flex-col gap-y-4 mt-5 lg:flex-row lg:justify-center lg:items-center lg:gap-x-7 lg:mt-0">
              {navlinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.url}
                  className="relative inline-block font-semibold text-gray-800 dark:text-white transition duration-300 ease-out group focus:outline-none"
                >
                  <span className="relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {link.title}
                  </span>
                  <span className="absolute left-0 bottom-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* 🔹 Login Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Close Btn */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🔑 Sign In
              </h2>

              {/* ✅ Formik Form */}
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    required
                    className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    required
                    className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Submit Btn */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
