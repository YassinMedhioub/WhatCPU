import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { create } from 'zustand';
import { db } from "./firebase";

export const useUserStore = create((set) => ({
    currentUser: null,          // Holds the currently logged-in user
    blockedUsers: [],           // List of users that the current user has blocked
    isLoading: true,            // Loading state while fetching user data

    // Function to set the current user
    setCurrentUser: (user) => set({ currentUser: user }),

    // Function to fetch user information by UID
    fetchUserInfo: async (uid) => {
        if (!uid) {
            return set({ currentUser: null, isLoading: false });
        }
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({ currentUser: docSnap.data(), isLoading: false });
            } else {
                set({ currentUser: null, isLoading: false });
            }
        } catch (err) {
            console.log(err);
            set({ currentUser: null, isLoading: false });
        }
    },

    // Function to set up a real-time listener for blocked users
    listenToBlockedUsers: (uid) => {
        if (!uid) return;

        const userDocRef = doc(db, "users", uid);

        // Set up a real-time listener for changes to the user's blocked list
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const blocked = docSnap.data().blocked || [];
                set({ blockedUsers: blocked }); // Update blockedUsers state
            }
        });

        return unsubscribe; // Return the unsubscribe function to clean up the listener
    }
}));
