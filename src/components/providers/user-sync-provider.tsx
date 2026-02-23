"use client";

import { useMutation, useConvexAuth, useQuery } from "convex/react";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const syncUser = useMutation(api.users.syncUser as any);

    // Also track online status
    const setOffline = useMutation(api.users.setOffline as any);

    useEffect(() => {
        if (isAuthenticated && user) {
            syncUser({
                clerkId: user.id,
                name: user.fullName || user.username || user.emailAddresses[0].emailAddress.split('@')[0],
                email: user.emailAddresses[0].emailAddress,
                avatar: user.imageUrl,
            });
        }
    }, [isAuthenticated, user, syncUser]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setOffline();
            } else if (isAuthenticated && user) {
                syncUser({
                    clerkId: user.id,
                    name: user.fullName || user.username || user.emailAddresses[0].emailAddress.split('@')[0],
                    email: user.emailAddresses[0].emailAddress,
                    avatar: user.imageUrl,
                });
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isAuthenticated, user, syncUser, setOffline]);

    return <>{children}</>;
}
