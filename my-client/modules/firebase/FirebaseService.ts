import {getApp, getApps, initializeApp} from "firebase/app";
import {FirebaseOptions} from "@firebase/app";
import {collection, getFirestore} from "@firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig: FirebaseOptions = {
    databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_APP_ID,
    apiKey: process.env.NEXT_PUBLIC_API_KEY
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Realtime Database and get a reference to the service
export const database = getFirestore(app);

export const getCollection = (type: CollectionType) => {
    return collection(database, type);
}

export enum CollectionType {
    EXAMINATION = "examinations",
    HOMEWORK = "homeworks",
    ERROR = "errors",
    ANSWER = "answers"
}


