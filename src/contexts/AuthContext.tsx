"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "./LanguageContext";

interface AuthContextType {
  currentUser: (User & { displayName: string | null }) | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  hasJustLoggedIn: boolean;
  dismissLoginAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const login = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if this is a new user and create their subcollection
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create a new user document with initial data
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          uid: user.uid,
        });

        toast({
          title: t("welcomeSignupTitle"),
          description: t("welcomeSignupDescription"),
        });
      } else {
        toast({
          title: t("welcomeLoginTitle"),
          description: t("welcomeLoginDescription"),
        });
      }

      // Set flag for this instance only (not persisted)
      setHasJustLoggedIn(true);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: t("loginFailed"),
        description: t("loginFailedDescription"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setHasJustLoggedIn(false);
      toast({
        title: t("loggedOut"),
        description: t("loggedOutDescription"),
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: t("logoutFailed"),
        description: t("logoutFailedDescription"),
        variant: "destructive",
      });
    }
  };

  const dismissLoginAlert = () => {
    setHasJustLoggedIn(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch the cached displayName from backend instead of using Firebase's
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Override the displayName with the backend's cached version
          const userWithBackendData = {
            ...user,
            displayName: userData.displayName || user.displayName,
          };
          setCurrentUser(userWithBackendData as any);
        } else {
          setCurrentUser(user as any);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    loading,
    hasJustLoggedIn,
    dismissLoginAlert,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
