import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export type ResultsAccessState = "checking" | "allowed" | "denied";

export function useResultsAccess() {
  const [accessState, setAccessState] =
    useState<ResultsAccessState>("checking");

  useEffect(() => {
    let verificationId = 0;
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      const currentVerificationId = ++verificationId;
      setAccessState("checking");

      if (!currentUser) {
        setAccessState("denied");
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
        if (currentVerificationId !== verificationId) return;
        setAccessState(adminDoc.exists() ? "allowed" : "denied");
      } catch (error) {
        if (currentVerificationId !== verificationId) return;
        console.error("Failed to verify admin access", error);
        setAccessState("denied");
      }
    });

    return () => {
      verificationId += 1;
      unsubscribe();
    };
  }, []);

  return accessState;
}
