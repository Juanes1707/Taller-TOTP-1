import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { closeSession } from "./actions";

interface MfaState {
  elevatedToken: string | null;
  stepUpToken: string | null;
  lastCode: { stepUpToken: string; code: string; at: number } | null;
}

const initialState: MfaState = { elevatedToken: null, stepUpToken: null, lastCode: null };

const mfaSlice = createSlice({
  name: "mfa",
  initialState,
  reducers: {
    setStepUp(state, action: PayloadAction<string>) { state.stepUpToken = action.payload; },
    setElevated(state, action: PayloadAction<{ token: string; stepUpToken: string; code: string }>) {
      state.elevatedToken = action.payload.token;
      state.lastCode = { stepUpToken: action.payload.stepUpToken, code: action.payload.code, at: Date.now() };
    },
    clearElevated(state) { state.elevatedToken = null; }
  },
  extraReducers: (builder) => { builder.addCase(closeSession, () => initialState); }
});

export const { setStepUp, setElevated, clearElevated } = mfaSlice.actions;
export default mfaSlice.reducer;
