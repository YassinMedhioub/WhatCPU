import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";




const upload = async (file, setUploadProgress) => {
    const storage = getStorage();
    const storageRef = ref(storage, `images/${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        // Set the initial progress to 0 when the upload starts
        setUploadProgress(0);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress); // Update progress state
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                reject("Something went wrong!" + error.code);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                    // Set progress to -1 after successful upload
                });
            }
        );
        setUploadProgress(-1);
    });
};

export default upload;
