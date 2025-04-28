import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "", // no Web API key available yet
  authDomain: "hfh-golf-draft.firebaseapp.com",
  projectId: "hfh-golf-draft",
  storageBucket: "hfh-golf-draft.appspot.com",
  messagingSenderId: "88207474267",
  appId: "" // add appId here if available
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
