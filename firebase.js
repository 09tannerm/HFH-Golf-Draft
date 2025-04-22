
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBT9qWHu61xNh7sIArzXTjdgSxxPp0ofME",
  authDomain: "hfh-golf-draft.firebaseapp.com",
  projectId: "hfh-golf-draft",
  storageBucket: "hfh-golf-draft.appspot.com",
  messagingSenderId: "88207474267",
  appId: "1:88207474267:web:4c09c1f7438141c70c497e",
  databaseURL: "https://hfh-golf-draft-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
