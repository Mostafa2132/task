import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./Slices/authSlice";
import { userReducer } from "./Slices/userAuthSlice";

export const store = configureStore({
  reducer: {
    authReducer,
    userReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
