import { doc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../../lib/chatStore"; // Import useChatStore
import { auth, db } from "../../../lib/firebase";
import { useAppStore } from "../../../lib/store";
import upload from "../../../lib/upload";
import { useUserStore } from "../../../lib/userStore";
import "./userInfo.css";

const UserInfo = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: ""
  });
  const { currentUser } = useUserStore();
  const { resetChat } = useChatStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [showBioModal, setShowBioModal] = useState(false);
  const toggleDetail = useAppStore(state => state.toggleDetail);

  const dropdownRef = useRef(null);

  const handleAvatarClick = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleFileAndUpload = async (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setAvatar({
        file: selectedFile,
        url: URL.createObjectURL(selectedFile)
      });

      if (!currentUser || !currentUser.id) {
        console.error("User is not authenticated or UID is missing.");
        return;
      }

      try {
        setShowDropdown(false);
        const imgUrl = await upload(selectedFile, setUploadProgress);
        await setDoc(
          doc(db, "users", currentUser.id),
          {
            avatar: imgUrl,
          },
          { merge: true }
        );
        setAvatar((prev) => ({ ...prev, url: imgUrl }));
        setUploadProgress(-1);
        console.log("Avatar updated successfully!");

      } catch (error) {
        console.error("Error updating avatar:", error);
      }
    }
  };

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleBioSubmit = async () => {
    if (!currentUser || !currentUser.id) {
      console.error("User is not authenticated or UID is missing.");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", currentUser.id),
        {
          bio: bio,
        },
        { merge: true }
      );
      console.log("Bio updated successfully!");
      setShowBioModal(false); // Close modal after submission

      // Close dropdown after submitting bio
      setShowDropdown(false);
    } catch (error) {
      console.error("Error updating bio:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logout Handler - reset chatId before signing out
  const handleLogout = async () => {
    toggleDetail();
    resetChat(); // Reset chat when logging out
    await auth.signOut(); // Sign out from Firebase authentication
  };

  return (
    <div className="userInfo">
      <div className="user">
        {uploadProgress > 0 && uploadProgress <= 100 && (
          <div className="progress-circle" style={{ '--progress': `${uploadProgress}%` }}>
            <div className="progress" />
          </div>
        )}
        <img
          src={avatar.url || currentUser.avatar || "./avatar.png"}
          alt="avatar"
          onClick={handleAvatarClick}
          className="avatar"
        />
        <div className="user-info-text">
          <h3>{currentUser.username ? currentUser.username : "WhatCpu User"}</h3>
        </div>
      </div>


      {
        showDropdown && (
          <div className="dropdown" ref={dropdownRef}>
            <ul>
              <li>
                <label htmlFor="file">
                  <img src="" alt="" /> Change Avatar
                </label>
                <input
                  type="file"
                  id="file"
                  style={{ display: "none" }}
                  onChange={handleFileAndUpload}
                />
              </li>
              <li onClick={() => setShowBioModal(true)}>Change Bio</li>
            </ul>
          </div>
        )
      }

      {/* Modal for Bio Editing */}
      {
        showBioModal && (
          <div className="bio-modal">
            <div className="modal-content">
              <h2>Edit Bio</h2>
              <textarea
                value={bio}
                onChange={handleBioChange}
                placeholder="Write your bio..."
                rows="5"
              />
              <center>
                <button onClick={handleBioSubmit}>Save</button>
                <button onClick={() => setShowBioModal(false)}>Cancel</button>
              </center>
            </div>
          </div>
        )
      }


      <div className="icons">
        <button className="logout" onClick={handleLogout}> Logout </button>
      </div>

    </div >
  );
};

export default UserInfo;
