import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useChatStore } from "../../../../lib/chatStore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";
import "./addUser.css";

const AddUser = ({ setAddMode, refreshUsers }) => {
    const [users, setUsers] = useState([]);
    const { currentUser, setCurrentUser } = useUserStore();
    const [loadingUserId, setLoadingUserId] = useState(null);
    const { toggleBlockForUser } = useChatStore();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (currentUser?.id) {
                try {
                    const currentUserDocRef = doc(db, "users", currentUser.id);
                    const currentUserDocSnap = await getDoc(currentUserDocRef);
                    if (currentUserDocSnap.exists()) {
                        setCurrentUser(currentUserDocSnap.data());
                    }
                } catch (err) {
                    console.log("Error fetching current user data: ", err);
                }
            }
        };

        fetchCurrentUser();
    }, [currentUser?.id, setCurrentUser]);
    const handleAddOrSelect = async (userToAdd) => {
        if (!userToAdd || currentUser.friends?.includes(userToAdd.id)) {
            console.log("This user is already a friend.");
            return;
        }

        setLoadingUserId(userToAdd.id);
        const userChatsRef = collection(db, "userchats");
        const currentUserChatRef = doc(userChatsRef, currentUser.id);

        try {
            const newChatRef = doc(collection(db, "chats"));
            await setDoc(newChatRef, {
                createdAt: serverTimestamp(),
                messages: [],
            });

            const currentUserChatSnap = await getDoc(currentUserChatRef);
            if (!currentUserChatSnap.exists()) {
                await setDoc(currentUserChatRef, { chats: [] });
            }

            const addedUserChatRef = doc(userChatsRef, userToAdd.id);
            const addedUserChatSnap = await getDoc(addedUserChatRef);
            if (!addedUserChatSnap.exists()) {
                await setDoc(addedUserChatRef, { chats: [] });
            }

            await updateDoc(addedUserChatRef, {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                }),
            });

            await updateDoc(currentUserChatRef, {
                chats: arrayUnion({
                    chatId: newChatRef.id,
                    lastMessage: "",
                    receiverId: userToAdd.id,
                    updatedAt: Date.now(),
                }),
            });

            const currentUserRef = doc(db, "users", currentUser.id);
            await updateDoc(currentUserRef, {
                friends: arrayUnion(userToAdd.id)
            });

            setUsers((prevUsers) =>
                prevUsers.map(user =>
                    user.id === userToAdd.id ? { ...user, alreadyFriends: true, added: true } : user
                )
            );

            console.log("User added to friends list and chat created with ID:", newChatRef.id);
        } catch (err) {
            console.log("Error adding user or creating chat:", err);
        } finally {
            setLoadingUserId(null);
        }
    };

    const handleBlock = async (userToBlock) => {
        if (!userToBlock || !currentUser) return;

        const isBlocked = currentUser.blocked?.includes(userToBlock.id);

        // Update the local state immediately
        const updatedBlockedList = isBlocked
            ? currentUser.blocked.filter(id => id !== userToBlock.id)
            : [...currentUser.blocked, userToBlock.id];

        setCurrentUser({ ...currentUser, blocked: updatedBlockedList });

        const userDocRef = doc(db, "users", currentUser.id);
        setLoadingUserId(userToBlock.id);

        try {
            await updateDoc(userDocRef, {
                blocked: isBlocked
                    ? arrayRemove(userToBlock.id)
                    : arrayUnion(userToBlock.id)
            });
            toggleBlockForUser(userToBlock.id);
            refreshUsers(); // Refresh users to get updated state
        } catch (err) {
            console.error("Failed to update block status:", err);
        } finally {
            setLoadingUserId(null);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username").toLowerCase(); // Convert input to lowercase

        try {
            refreshUsers();
            const userRef = collection(db, "users");
            const querySnapshot = await getDocs(userRef); // Fetch all users

            const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter users based on lowercase username
            const filteredUsers = userList.filter(user =>
                user.username.toLowerCase().includes(username) && user.id !== currentUser.id // Exclude current user
            );

            const updatedUsers = filteredUsers.map(user => ({
                ...user,
                alreadyFriends: currentUser.friends?.includes(user.id),
                isBlocked: currentUser.blocked?.includes(user.id) // Track block status
            }));

            setUsers(updatedUsers);
        } catch (err) {
            console.error("Error during user search:", err);
        }
    };

    // ... (rest of your component code remains the same)

    return (
        <div className="addUserModal">
            <div className="modalOverlay" onClick={() => setAddMode(false)} />
            <div className="addUser">
                <button className="close-btn" onClick={() => setAddMode(false)}>X</button>
                <form onSubmit={handleSearch}>
                    <input type="text" placeholder="Username" name="username" />
                    <center><button type="submit">Search</button></center>
                </form>
                {users.length > 0 && (
                    <div className="userListContainer">
                        <div className="userList">
                            {users.map(user => (user.id !== currentUser.id &&
                                <div className="user" key={user.id}>
                                    <div className="detail">
                                        <img src={user.avatar || "./avatar.png"} alt="avatar" />
                                        <span>{user.username}</span>
                                    </div>
                                    {currentUser.blocked?.includes(user.id) ? (
                                        <button onClick={() => handleBlock(user)}>
                                            {loadingUserId === user.id ? 'Processing...' : 'Unblock User'}
                                        </button>
                                    ) : (
                                        user.blocked?.includes(currentUser.id) ? (
                                            <button>You are blocked</button>
                                        ) : (
                                            <>
                                                {user.alreadyFriends ? (
                                                    user.added ? (<>
                                                        <button>User Added</button>
                                                        <button onClick={() => handleBlock(user)}>Block User</button></>
                                                    ) : (<>
                                                        <button>Already Friends</button>
                                                        <button onClick={() => handleBlock(user)}>Block User</button></>

                                                    )
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAddOrSelect(user)}
                                                            disabled={loadingUserId === user.id}
                                                        >
                                                            {loadingUserId === user.id ? 'Processing...' : 'Add User'}
                                                        </button>
                                                        <button onClick={() => handleBlock(user)}>Block User</button>
                                                    </>
                                                )}

                                            </>
                                        )
                                    )}

                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default AddUser;
