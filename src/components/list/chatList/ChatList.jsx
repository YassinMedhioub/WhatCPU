import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useChatStore } from "../../../lib/chatStore";
import { db } from "../../../lib/firebase";
import { useUserStore } from "../../../lib/userStore";
import AddUser from "./addUser/AddUser";
import "./chatList.css";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();  // Added chatId here

  // Function to refresh the chat list
  const refreshUsers = async () => {
    const docRef = doc(db, "userchats", currentUser.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const items = docSnap.data().chats;
      const promises = items.map(async (item) => {
        const userDocRef = doc(db, "users", item.receiverId);
        const userDocSnap = await getDoc(userDocRef);
        const user = userDocSnap.data();
        return { ...item, user };
      });
      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
    }
  };

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const items = res.data().chats;
      const promises = items.map(async (item) => {
        const userDocRef = doc(db, "users", item.receiverId);
        const userDocSnap = await getDoc(userDocRef);
        const user = userDocSnap.data();

        return { ...item, user };
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
    });

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );
    userChats[chatIndex].isSeen = true;
    const userChatsRef = doc(db, "userchats", currentUser.id);
    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);  // Sets chatId and user
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="search.png" alt="search" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "plus.png"}
          alt="plus"
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      <div className="chatItems">
        {filteredChats.map((chat) => (
          <div
            className="item"
            key={chat.chatId}
            onClick={() => handleSelect(chat)}  // Selecting a chat
            style={{
              backgroundColor: chat?.isSeen
                ? "transparent"
                : "rgba(216, 214, 250, 0.5)",
            }}
          >
            <img
              src={
                chat.user.blocked.includes(currentUser.id)
                  ? "./avatar.png"
                  : chat.user.avatar || "./avatar.png"
              }
              alt="avatar"
            />
            <div className="texts">
              <span>
                {chat.user.blocked.includes(currentUser.id)
                  ? "WhatCPU user"
                  : chat.user.username}
              </span>
              <p>{chat.lastMessage || "Say hi to your new friend."}</p>
            </div>
          </div>
        ))}
      </div>

      {addMode && <AddUser setAddMode={setAddMode} refreshUsers={refreshUsers} />}
    </div>
  );
};

export default ChatList;
