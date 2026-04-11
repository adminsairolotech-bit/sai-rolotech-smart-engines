import { createContext, useContext, useState, type ReactNode } from "react";

type AdminMode = "editor" | "visitor";

interface AdminModeContextValue {
  mode: AdminMode;
  setMode: (mode: AdminMode) => void;
  isEditor: boolean;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AdminMode>("editor");
  return (
    <AdminModeContext.Provider value={{ mode, setMode, isEditor: mode === "editor" }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) throw new Error("useAdminMode must be used inside AdminModeProvider");
  return ctx;
}
