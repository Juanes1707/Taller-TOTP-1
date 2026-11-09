import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export const useLlaveDispatch = useDispatch.withTypes<AppDispatch>();
export const useLlaveSelector: TypedUseSelectorHook<RootState> = useSelector;
