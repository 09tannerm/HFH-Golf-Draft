import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBT9qWHu61xNh7sIArzXTdjgSxxPo0ofME",
  authDomain: "hfh-golf-draft.firebaseapp.com",
  projectId: "hfh-golf-draft",
  storageBucket: "hfh-golf-draft.appspot.com",
  messagingSenderId: "88207474267",
  appId: "1:88207474267:web:4c90c1f7438141c70c497e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
