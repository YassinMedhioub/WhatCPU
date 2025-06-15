import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { useChatStore } from "./lib/chatStore";
import { auth } from "./lib/firebase";
import { useAppStore } from "./lib/store"; // Import the new store
import { useUserStore } from "./lib/userStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const showDetail = useAppStore(state => state.showDetail);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading... </div>;

  return (
    <div className='container'>
      {currentUser ? (
        <>
          <List />
          {chatId ? <Chat /> : null}
          {showDetail && <Detail />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
