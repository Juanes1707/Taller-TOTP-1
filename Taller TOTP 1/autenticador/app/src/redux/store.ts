import { configureStore } from "@reduxjs/toolkit";
import sessionReducer from "./sessionSlice";
import mfaReducer from "./mfaSlice";

export const store = configureStore({
  reducer: { session: sessionReducer, mfa: mfaReducer }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
