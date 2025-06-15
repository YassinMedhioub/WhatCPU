import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../lib/chatStore";
import { db } from "../../lib/firebase";
import { useAppStore } from "../../lib/store";
import upload from "../../lib/upload";
import { useUserStore } from "../../lib/userStore";
import "./chat.css";


const Modal = ({ imageUrl, onClose }) => {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Large" />
        <span className="close" onClick={onClose}>&times;</span> {/* Move close button here */}
      </div>
    </div>
  );
};

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { currentUser } = useUserStore();
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const toggleDetail = useAppStore(state => state.toggleDetail);
  const isDetailOpen = useAppStore(state => state.isDetailOpen);
  const centerRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      const chatDoc = doc(db, "chats", chatId);
      const unSub = onSnapshot(chatDoc, (res) => {
        setChat(res.data());
      });
      return () => {
        unSub();
      };
    }
  }, [chatId]);
  // Scroll to the last message whenever chat updates
  useEffect(() => {
    if (centerRef.current) {
      centerRef.current.scrollTo({
        top: centerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chat]);


  // Fetch chat data and handle message updates
  useEffect(() => {
    if (chatId) {
      const chatDoc = doc(db, "chats", chatId);
      const unSub = onSnapshot(chatDoc, (res) => {
        setChat(res.data());
      });
      return () => {
        unSub();
      };
    }
  }, [chatId]);


  const handleEmoji = e => {
    setText(prev => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = async (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const imgUrl = URL.createObjectURL(selectedFile);
      const tempMessageId = new Date().getTime();

      // Add new image to the state with initial progress
      setImages(prevImages => [
        ...prevImages,
        {
          file: selectedFile,
          url: imgUrl,
          createdAt: new Date(),
          tempMessageId,
          uploadProgress: 0 // Initialize upload progress
        }
      ]);

      try {
        const uploadedImgUrl = await upload(selectedFile, (progress) => {
          // Update progress for this specific image
          setImages(prevImages =>
            prevImages.map(img =>
              img.tempMessageId === tempMessageId
                ? { ...img, uploadProgress: progress }
                : img
            )
          );
        });

        // Send the image message with the temporary ID
        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion({
            senderId: currentUser.id,
            createdAt: new Date(),
            img: uploadedImgUrl,
            tempMessageId,
          })
        });
        const userIDs = [currentUser.id, user.id];
        await Promise.all(userIDs.map(async (id) => {
          const userChatsRef = doc(db, "userchats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

            userChatsData.chats[chatIndex].lastMessage = "An image was sent";
            userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
            userChatsData.chats[chatIndex].updateAt = Date.now();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        }));

        // Clear the images state after successful upload
        setImages(prevImages => prevImages.filter(image => image.tempMessageId !== tempMessageId));

      } catch (err) {
        console.error(err);
      }
    }
  };

  const isOnlySpaces = (str) => {
    return str.trim().length === 0;
  };

  const handleSend = async () => {
    if (text === "" || isOnlySpaces(text)) {
      setText("");
      return; // Prevent sending empty messages
    }

    try {
      setText("");
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
        })
      });

      // Update user chats...
      const userIDs = [currentUser.id, user.id];
      await Promise.all(userIDs.map(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {

          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
          userChatsData.chats[chatIndex].updateAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      }));


    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const getTimeAgoFromDate = (dateString) => {
    const now = new Date();
    const messageTime = new Date(dateString);
    const diffInSeconds = Math.floor((now - messageTime) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return minutes === 0 ? "Just now" : `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return messageTime.toLocaleDateString(undefined, options);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp.seconds * 1000);
    const diffInSeconds = Math.floor((now - messageTime) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return minutes === 0 ? "Just now" : `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return messageTime.toLocaleDateString(undefined, options);
    }
  };



  useEffect(() => {
    if (chatId) {
      const chatDoc = doc(db, "chats", chatId);
      const unSub = onSnapshot(chatDoc, (res) => {
        setChat(res.data());
      }, (error) => {
        console.error("Error fetching chat data: ", error);
      });

      return () => {
        unSub();
      };
    }
  }, [chatId]);

  const openModal = (url) => {
    setModalImage(url);
  };

  const closeModal = () => {
    setModalImage(null);
  };


  return (
    <div className='chat'>

      {modalImage && <Modal imageUrl={modalImage} onClose={closeModal} />}
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="avatar" />
          <div className="texts">
            <span>{user?.username || "CPU ChatPulse User"}</span>
            <p>{user?.bio || ((isReceiverBlocked || isCurrentUserBlocked) ? "No bio here!" : "No bio yet!")}</p>
          </div>
        </div>
        <div className="icons">
          <img src="phone.png" alt="phone" />
          <img src="video.png" alt="video" />
          <img src="info.png" alt="info" className="info" onClick={toggleDetail} /> {/* Toggle detail */}
        </div>
      </div>
      <div className="center" ref={centerRef} >




        {chat?.messages?.map((message, index) => (

          <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={message.createdAt}>
            <div className="texts">

              {message.img && <img src={message.img} alt="" onClick={() => openModal(message.img)} />}
              {message.text ? <p>{message.text}</p> : <></>}
              <h6 className={message.senderId === currentUser?.id ? "timeown" : "time"}>
                {getTimeAgo(message.createdAt)}
              </h6>
            </div>
          </div>
        ))}




        {images.map(image => (
          <div className="message own" key={image.tempMessageId}>
            <div className="texts">
              <img src={image.url} alt="" onClick={() => openModal(image.url)} />
              <h6>Sending: {Math.floor(image.uploadProgress)}%</h6>
            </div>
          </div>

        ))}
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor={(isCurrentUserBlocked || isReceiverBlocked) ? "" : "file"} className={(isCurrentUserBlocked || isReceiverBlocked) ? "disabled" : ""}>
            <img src="img.png" alt="img" className={isCurrentUserBlocked || isReceiverBlocked ? "disabled" : ""} />
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
          <img src="camera.png" alt="camera" className={isCurrentUserBlocked || isReceiverBlocked ? "disabled" : ""} />
          <img src="mic.png" alt="mic" className={isCurrentUserBlocked || isReceiverBlocked ? "disabled" : ""} />
        </div>
        <input
          type="text"
          placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You can't send messages!" : "Type something..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <button onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
        {open && <EmojiPicker onEmojiClick={handleEmoji} />}
      </div>
    </div>
  );
};

export default Chat;
