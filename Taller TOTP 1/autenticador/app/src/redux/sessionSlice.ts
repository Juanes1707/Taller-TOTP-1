import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { closeSession } from "./actions";

interface SessionState {
  accessToken: string | null;
  user: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = { accessToken: null, user: null, loading: false, error: null };

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ accessToken: string; user: string }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) { state.loading = action.payload; },
    setAccessToken(state, action: PayloadAction<string | null>) { state.accessToken = action.payload; },
    setError(state, action: PayloadAction<string | null>) { state.error = action.payload; }
  },
  extraReducers: (builder) => { builder.addCase(closeSession, () => initialState); }
});

export const { setSession, setLoading, setAccessToken, setError } = sessionSlice.actions;
export default sessionSlice.reducer;
