import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

async function ensureProfile(user, nameOverride) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const displayName = nameOverride || user.displayName || user.email?.split('@')[0] || 'Bạn';
  const base = {
    uid: user.uid,
    displayName,
    email: user.email || '',
    emailLower: (user.email || '').toLowerCase(),
    photoURL: user.photoURL || '',
  };
  if (!snap.exists()) {
    await setDoc(ref, { ...base, wordCount: 0, masteredCount: 0, lastActiveDate: null, createdAt: serverTimestamp() });
  } else {
    const d = snap.data();
    const changed = Object.keys(base).some((k) => k !== 'displayName' && d[k] !== base[k]) || (nameOverride && d.displayName !== nameOverride) || !d.displayName;
    if (changed) await updateDoc(ref, nameOverride || !d.displayName ? base : { ...base, displayName: d.displayName });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = đang tải
  const [profile, setProfile] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (u) {
          try {
            await ensureProfile(u);
          } catch (e) {
            console.error('ensureProfile', e);
          }
        }
        setUser(u);
      }),
    [],
  );

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    return onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.exists() ? s.data() : null));
  }, [user]);

  const value = {
    user,
    profile,
    loading: user === undefined,
    loginGoogle: () => signInWithPopup(auth, googleProvider),
    loginEmail: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    signupEmail: async (name, email, pw) => {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(cred.user, { displayName: name });
      await ensureProfile(cred.user, name);
      return cred;
    },
    updateName: async (name) => {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name });
    },
    logout: () => signOut(auth),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
