import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import type { AuthState } from "../../Interfaces/interfaces";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";

const initialState: AuthState = {
  token: localStorage.getItem("token") || null,
  admin: null,
  isLoading: false,
  error: null,
};

// Thunk: login
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.post(
        "http://localhost:3000/api/v1/auth/login",
        credentials
      );
      console.log(res);
      toast.success("Login successful!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
      return res.data; // { token, admin }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.admin = null;
      toast.info("Logged out successfully");
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.admin = action.payload.admin;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
