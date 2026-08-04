"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type AuthView = "login" | "register";

interface UIContextType {
    isAuthModalOpen: boolean;
    openAuthModal: (view?: AuthView) => void;
    closeAuthModal: () => void;
    authView: AuthView;
    setAuthView: (view: AuthView) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState<AuthView>("login");

    const openAuthModal = (view: AuthView = "login") => {
        setAuthView(view);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    return (
        <UIContext.Provider
            value={{
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
                authView,
                setAuthView,
            }}
        >
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
};
