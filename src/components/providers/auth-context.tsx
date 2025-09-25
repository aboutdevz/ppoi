"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  image?: string;
  bio?: string;
  isAnonymous: boolean;
  stats: {
    imageCount: number;
    likeCount: number;
    followerCount: number;
    followingCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session?.user && !!user;

  // Sync user with Worker API when session is available
  useEffect(() => {
    const syncUser = async () => {
      if (session?.user?.email) {
        try {
          // Set the user token in API client
          if (session.user.id) {
            api.setUserToken(session.user.id);
          }

          // Sync user with Worker database
          const response = await fetch("/api/auth/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create_or_sync" }),
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            console.error("Failed to sync user");
          }
        } catch (error) {
          console.error("User sync error:", error);
        }
      } else if (status !== "loading") {
        // Clear user data if not authenticated
        setUser(null);
        api.setUserToken(null);
      }
      
      setIsLoading(status === "loading");
    };

    syncUser();
  }, [session, status]);

  const handleSignIn = async () => {
    try {
      await signIn("google");
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      setUser(null);
      api.setUserToken(null);
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out.");
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const response = await api.updateUserProfile(user.id, {
        name: updates.name,
        bio: updates.bio,
        image: updates.image,
      });

      if (response.success) {
        setUser(response.user);
        toast.success("Profile updated!");
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/auth/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_profile" }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for checking auth status in components
export function useRequireAuth() {
  const { isAuthenticated, isLoading, signIn } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isAuthenticated, isLoading, signIn]);

  return { isAuthenticated, isLoading };
}
