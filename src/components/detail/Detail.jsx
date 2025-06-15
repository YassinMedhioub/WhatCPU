import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useChatStore } from "../../lib/chatStore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";

const Detail = () => {
  const [isPhotosVisible, setIsPhotosVisible] = useState(false);
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, toggleBlockForUser } = useChatStore();
  const { currentUser } = useUserStore();
  const [images, setImages] = useState([]); // State to hold images

  const togglePhotosVisibility = () => {
    setIsPhotosVisible(prev => !prev);
  };

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    // Determine the new blocked status
    const isBlocked = !isReceiverBlocked; // Inverse the current block status
    console.log("Attempting to", isBlocked ? "block" : "unblock", user.id);

    // Update local state immediately
    changeBlock();

    try {
      await updateDoc(userDocRef, {
        blocked: isBlocked ? arrayUnion(user.id) : arrayRemove(user.id)
      });

      console.log("Block status updated.");

      // Toggle the block status in the chat store
      toggleBlockForUser(user.id);

    } catch (err) {
      console.error("Failed to update block status:", err);
    }
  };

  // Fetch chat messages and extract images in real-time
  useEffect(() => {
    if (!chatId) return;

    const chatDocRef = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const chatData = docSnapshot.data();
        const chatImages = chatData.messages
          .filter(msg => msg.img) // Only get messages with images
          .map(msg => msg.img);

        setImages(chatImages); // Set images in state
      }
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, [chatId]);

  return (
    <div className='detail'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="avatar" />
        <h2>{user?.username || "CPU ChatPulse User"}</h2>
        <p>{isReceiverBlocked || isCurrentUserBlocked ? "No bio here!" : user?.bio || "No bio yet!"}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowDown.png" alt="arrowUp" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & Help</span>
            <img src="./arrowDown.png" alt="arrowUp" />
          </div>
        </div>
        <div className="option">
          <div className="title" onClick={togglePhotosVisibility}>
            <span>Shared Photos</span>
            <img src={isPhotosVisible ? "./arrowUp.png" : "./arrowDown.png"} alt="arrow" />
          </div>
          {isPhotosVisible && (
            <div className="photos">
              {images.map((image, index) => (
                <div className="photoItem" key={index}>
                  <div className="photoDetail">
                    <img src={image} alt={`Shared Image ${index + 1}`} />
                    <span>{`Image ${index + 1}`}</span>
                  </div>
                  <img src="./download.png" alt="Download" className="icon" onClick={() => handleDownload(image)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowDown.png" alt="arrowUp" />
          </div>
        </div>

        {isReceiverBlocked ? (
          <button onClick={handleBlock}>Unblock User</button>
        ) : isCurrentUserBlocked ? (
          <button> You Are blocked </button>
        ) : (
          <button onClick={handleBlock}>Block User</button>
        )}

      </div>
    </div>
  );
};

export default Detail;
