import {
  collection,
  doc,
  query,
  where,
  limit,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const reqCol = collection(db, 'friendRequests');
export const friendsCol = (uid) => collection(db, 'users', uid, 'friends');

export async function findUserByEmail(email) {
  const q = query(collection(db, 'users'), where('emailLower', '==', email.trim().toLowerCase()), limit(1));
  const s = await getDocs(q);
  return s.empty ? null : s.docs[0].data();
}

export const getUser = async (uid) => {
  const s = await getDoc(doc(db, 'users', uid));
  return s.exists() ? s.data() : null;
};

const card = (p) => ({ uid: p.uid, displayName: p.displayName || '', email: p.email || '', photoURL: p.photoURL || '' });

export async function sendRequest(me, target) {
  await setDoc(doc(reqCol, `${me.uid}_${target.uid}`), {
    from: me.uid,
    to: target.uid,
    fromName: me.displayName || '',
    fromEmail: me.email || '',
    fromPhoto: me.photoURL || '',
    toName: target.displayName || '',
    toEmail: target.email || '',
    toPhoto: target.photoURL || '',
    createdAt: serverTimestamp(),
  });
}

/** Chấp nhận lời mời `req` gửi tới mình. `alsoOutgoing`: lời mời ngược chiều (nếu có) cũng xoá luôn. */
export async function acceptRequest(me, req, alsoOutgoing = false) {
  const batch = writeBatch(db);
  batch.set(doc(friendsCol(me.uid), req.from), {
    ...card({ uid: req.from, displayName: req.fromName, email: req.fromEmail, photoURL: req.fromPhoto }),
    since: serverTimestamp(),
  });
  batch.set(doc(friendsCol(req.from), me.uid), { ...card(me), since: serverTimestamp() });
  batch.delete(doc(reqCol, `${req.from}_${me.uid}`));
  if (alsoOutgoing) batch.delete(doc(reqCol, `${me.uid}_${req.from}`));
  await batch.commit();
}

export const deleteRequest = (from, to) => writeBatch(db).delete(doc(reqCol, `${from}_${to}`)).commit();

export async function removeFriend(myUid, friendUid) {
  const batch = writeBatch(db);
  batch.delete(doc(friendsCol(myUid), friendUid));
  batch.delete(doc(friendsCol(friendUid), myUid));
  await batch.commit();
}

export const watchIncoming = (uid, cb) =>
  onSnapshot(query(reqCol, where('to', '==', uid)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
export const watchOutgoing = (uid, cb) =>
  onSnapshot(query(reqCol, where('from', '==', uid)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
export const watchFriends = (uid, cb) => onSnapshot(friendsCol(uid), (s) => cb(s.docs.map((d) => d.data())));
