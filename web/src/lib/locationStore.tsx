"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LocationState {
  enabled: boolean;
  address: string;
  latitude: number | null;
  longitude: number | null;
  source: "gps" | "manual" | "search" | "";
  updatedAt: string | null;
}

type LocationAction =
  | { type: "SET_LOCATION"; payload: Omit<LocationState, "enabled" | "updatedAt"> }
  | { type: "SET_ENABLED"; payload: boolean }
  | { type: "CLEAR_LOCATION" }
  | { type: "RESTORE"; payload: LocationState };

interface LocationContextType {
  locationState: LocationState;
  setLocation: (data: Omit<LocationState, "enabled" | "updatedAt">) => void;
  setEnabled: (enabled: boolean) => void;
  clearLocation: () => void;
  saveToLocalStorage: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_KEY = "userLocation";

const DEFAULT_STATE: LocationState = {
  enabled: false,
  address: "",
  latitude: null,
  longitude: null,
  source: "",
  updatedAt: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function locationReducer(state: LocationState, action: LocationAction): LocationState {
  switch (action.type) {
    case "SET_LOCATION":
      return {
        ...state,
        ...action.payload,
        updatedAt: new Date().toISOString(),
      };
    case "SET_ENABLED":
      return { ...state, enabled: action.payload };
    case "CLEAR_LOCATION":
      return { ...DEFAULT_STATE };
    case "RESTORE":
      return { ...action.payload };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationState, dispatch] = useReducer(locationReducer, DEFAULT_STATE);

  // Restore from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: LocationState = JSON.parse(raw);
        dispatch({ type: "RESTORE", payload: parsed });
      }
    } catch {
      // ignore malformed data
    }
  }, []);

  const setLocation = useCallback(
    (data: Omit<LocationState, "enabled" | "updatedAt">) => {
      dispatch({ type: "SET_LOCATION", payload: data });
    },
    []
  );

  const setEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_ENABLED", payload: enabled });
  }, []);

  const clearLocation = useCallback(() => {
    dispatch({ type: "CLEAR_LOCATION" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  const saveToLocalStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify(locationState));
    }
  }, [locationState]);

  return (
    <LocationContext.Provider
      value={{ locationState, setLocation, setEnabled, clearLocation, saveToLocalStorage }}
    >
      {children}
    </LocationContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
