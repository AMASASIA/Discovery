import React, { useEffect, useState } from 'react';
import { auth, signInWithGoogle, logOut, onAuthStateChanged, User, testFirestoreConnection } from '../firebase';
import { LogIn, LogOut, User as UserIcon, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(err?.message || 'Googleログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logOut();
    } catch (err: any) {
      console.error('Sign out failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-white/90 border border-black/15 px-2.5 py-1.5 rounded-2xl shadow-sm">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-6 h-6 rounded-full border border-black/10 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
            {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
          </div>
        )}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-[11px] font-bold text-black leading-tight truncate max-w-[100px]">
            {user.displayName || 'ユーザー'}
          </span>
          <span className="text-[9px] text-emerald-600 font-mono flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            クラウド同期中
          </span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="p-1 rounded-lg text-black/50 hover:text-black hover:bg-black/5 transition-colors ml-1"
          title="ログアウト"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {error && (
        <span className="text-[10px] text-red-600 hidden md:inline truncate max-w-[120px]" title={error}>
          {error}
        </span>
      )}
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="px-3 py-1.5 rounded-2xl bg-white/90 hover:bg-white border border-black/15 text-black text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:border-black/30"
      >
        <LogIn className="w-3.5 h-3.5 text-black/70" />
        <span>Googleログイン</span>
      </button>
    </div>
  );
};
