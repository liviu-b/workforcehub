import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Toast } from '../components/UI';
import { Mail, Lock, User, Chrome, ArrowRight, LogIn } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: '', type: '' }), 5000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              // We set the app_id to the user's ID effectively creating their own tenant
              // This will be handled in App.jsx logic, but good to store in metadata if needed later
            },
          },
        });
        if (error) throw error;
        showToast('Cont creat! Verifică emailul pentru confirmare.', 'success');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // App.jsx will handle the redirect via onAuthStateChange
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({message:'', type:''})} />
      
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">WorkforceHub</h1>
          <p className="text-slate-500 mt-2">Gestionează-ți echipa și proiectele eficient.</p>
        </div>

        <Card className="shadow-xl shadow-slate-200/60 border-slate-100">
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <Input
                icon={User}
                placeholder="Nume complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            
            <Input
              icon={Mail}
              type="email"
              placeholder="Adresă de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              icon={Lock}
              type="password"
              placeholder="Parolă"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button 
              type="submit" 
              className="w-full justify-center mt-2" 
              size="lg" 
              loading={loading}
              icon={ArrowRight}
            >
              {isSignUp ? 'Creează cont' : 'Autentificare'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">sau continuă cu</span></div>
          </div>

          <Button 
            variant="outline" 
            className="w-full justify-center" 
            onClick={handleGoogleLogin}
            icon={Chrome}
          >
            Google
          </Button>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">
              {isSignUp ? 'Ai deja cont?' : 'Nu ai cont încă?'}
            </span>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
            >
              {isSignUp ? 'Intră în cont' : 'Creează unul acum'}
            </button>
          </div>
        </Card>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          Power by ACL-Smart Software
        </p>
      </div>
    </div>
  );
}