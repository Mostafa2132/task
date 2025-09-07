// src/store/userSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface UserState {
  user: User | null;
  userToken: string | null;
  isSignedIn: boolean;
}

// ✅ تحميل البيانات من localStorage
const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("userToken");

const initialState: UserState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  userToken: storedToken || null,
  isSignedIn: !!storedToken,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; userToken: string }>
    ) => {
      state.user = action.payload.user;
      state.userToken = action.payload.userToken;
      state.isSignedIn = true;

      // ✅ تخزين في localStorage
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("userToken", action.payload.userToken);

      toast.success("🎉 Logged in successfully!");
    },
    logout: (state) => {
      state.user = null;
      state.userToken = null;
      state.isSignedIn = false;

      // ✅ حذف من localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("userToken");

      toast.success("👋 Logged out successfully!");
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isSignedIn = true;

      // ✅ تحديث localStorage
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
});

export const { loginSuccess, logout, setUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
