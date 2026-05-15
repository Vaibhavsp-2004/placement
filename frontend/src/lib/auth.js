import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuth = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.setItem("pi_token", token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem("pi_token");
        set({ token: null, user: null });
      },
      setUser: (user) => set({ user }),
    }),
    { name: "pi_auth" }
  )
);
