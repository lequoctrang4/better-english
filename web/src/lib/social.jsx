import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { watchFriends, watchIncoming, watchOutgoing } from './friends';

const Ctx = createContext(null);
export const useSocial = () => useContext(Ctx);

export function SocialProvider({ children }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  useEffect(() => {
    if (!user) return;
    const u1 = watchFriends(user.uid, setFriends);
    const u2 = watchIncoming(user.uid, setIncoming);
    const u3 = watchOutgoing(user.uid, setOutgoing);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const value = useMemo(() => ({ friends, incoming, outgoing }), [friends, incoming, outgoing]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
