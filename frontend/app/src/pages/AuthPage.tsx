import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signIn, signInWithGoogle, isAuthenticated } = useAuthStore();
  
  // Set initial mode based on route
  const [isSignup, setIsSignup] = useState(location.pathname === '/auth/signup');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError(null);
    setSuccessMsg(null);
    // Update URL without refreshing
    window.history.replaceState(null, '', !isSignup ? '/auth/signup' : '/auth/login');
  };

  const handleSubmit = async (e: React.FormEvent, mode: 'login' | 'signup') => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.studentId
      );

      if (signUpError) {
        setError(signUpError);
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Account created! Check your email to confirm, then log in.');
      // Auto-switch to login after a brief moment
      setTimeout(() => toggleMode(), 2000);
    } else {
      const { error: signInError } = await signIn(
        formData.email,
        formData.password
      );

      if (signInError) {
        setError(signInError);
        setIsLoading(false);
        return;
      }
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
      setIsLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen w-full relative flex overflow-hidden bg-background font-inter">
      
      {/* ──────────────── IMAGE PANEL ──────────────── */}
      <div 
        className={`absolute top-0 left-0 w-1/2 h-full bg-sage border-r-4 border-black z-10 transition-transform duration-[800ms] ease-[cubic-bezier(0.65,0,0.35,1)] overflow-hidden hidden lg:block shadow-[8px_0_0_rgba(0,0,0,1)] ${isSignup ? 'translate-x-full border-l-4 border-r-0 shadow-[-8px_0_0_rgba(0,0,0,1)]' : 'translate-x-0'}`}
      >
        {/* Abstract Neobrutalist Pattern Background (optional visual flair) */}
        <div className={`absolute inset-0 opacity-10 flex flex-wrap gap-8 p-8 transition-transform duration-[800ms] ${isSignup ? '-translate-x-1/2' : 'translate-x-0'}`}>
           <div className="w-32 h-32 border-8 border-black rounded-full" />
           <div className="w-24 h-24 bg-black rotate-45" />
           <div className="w-40 h-10 bg-black mt-20" />
           <div className="w-20 h-20 border-8 border-black ml-20" />
           <div className="w-32 h-32 bg-black rounded-full mt-32" />
        </div>
        
        <div className="absolute inset-0 p-16 flex flex-col justify-between z-20">
          <div>
            <Link to="/" className="inline-block bg-white border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              <ArrowLeft className="inline w-5 h-5 mr-2 -mt-1" />
              BACK HOME
            </Link>
          </div>

          <div className="relative flex-1 flex items-center">
            {/* Login View Text */}
            <div className={`absolute w-full max-w-lg transition-all duration-700 ${isSignup ? 'opacity-0 translate-x-10 invisible' : 'opacity-100 translate-x-0 visible'}`}>
              <h2 className="font-display font-black text-6xl text-black mb-6 leading-tight uppercase">
                Welcome<br/>Back<br/>Scholar.
              </h2>
              <p className="text-xl font-bold text-black/80 bg-white inline-block border-2 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                Ready to crush your exams? Sign in to access your notes, PYQs, and study materials.
              </p>
            </div>
            
            {/* Signup View Text */}
            <div className={`absolute w-full max-w-lg transition-all duration-700 ${!isSignup ? 'opacity-0 -translate-x-10 invisible' : 'opacity-100 translate-x-0 visible'}`}>
              <h2 className="font-display font-black text-6xl text-black mb-6 leading-tight uppercase">
                Join The<br/>EduHub<br/>Revolution.
              </h2>
              <p className="text-xl font-bold text-black/80 bg-white inline-block border-2 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                Create a free account to unlock premium study materials, organized perfectly by semester.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── FORM PANEL ──────────────── */}
      <div 
        className={`absolute top-0 left-0 lg:left-1/2 w-full lg:w-1/2 h-full bg-white z-5 transition-transform duration-[800ms] ease-[cubic-bezier(0.65,0,0.35,1)] flex items-center justify-center p-6 sm:p-12 overflow-y-auto overflow-x-hidden ${isSignup ? 'lg:-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="relative w-full max-w-md h-auto grid grid-cols-1 grid-rows-1 py-12">
          
          <Link to="/" className="lg:hidden absolute top-0 right-0 bg-white border-2 border-black p-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Login Form */}
          <div className={`col-start-1 row-start-1 w-full transition-all duration-500 bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] ${isSignup ? 'opacity-0 invisible translate-x-10 pointer-events-none' : 'opacity-100 visible translate-x-0'}`}>
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="EduHub Logo" className="h-12 w-auto" />
            </div>
            <h3 className="text-3xl font-black font-display text-center mb-2 uppercase">Login</h3>
            <p className="text-center font-bold text-gray-500 mb-6">Enter your details to sign in.</p>
            
            {error && !isSignup && <div className="mb-4 p-3 bg-red-100 border-2 border-black font-bold text-red-600 text-sm">{error}</div>}
            
            <form onSubmit={(e) => handleSubmit(e, 'login')} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-sand text-black border-4 border-black hover:bg-black hover:text-white font-black text-lg py-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all rounded-none uppercase mt-2" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <Button type="button" onClick={handleGoogleAuth} className="w-full bg-white text-black border-4 border-black hover:bg-gray-100 font-black text-lg py-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all rounded-none uppercase" disabled={isLoading}>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </Button>
              <div className="mt-4 p-3 bg-red-100 border-2 border-black border-dashed font-bold text-red-600 text-xs text-center uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                IMPORTANT: You must log in using your official @tcetmumbai.in ID. Private emails are strictly prohibited and will be rejected.
              </div>
            </div>

            <div className="mt-6 text-center font-bold">
              Don't have an account? <button onClick={toggleMode} className="text-blue-600 hover:underline cursor-pointer ml-1">Sign Up</button>
            </div>
          </div>

          {/* Signup Form */}
          <div className={`col-start-1 row-start-1 w-full transition-all duration-500 bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] ${!isSignup ? 'opacity-0 invisible -translate-x-10 pointer-events-none' : 'opacity-100 visible translate-x-0'}`}>
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="EduHub Logo" className="h-12 w-auto" />
            </div>
            <h3 className="text-3xl font-black font-display text-center mb-2 uppercase">Sign Up</h3>
            <p className="text-center font-bold text-gray-500 mb-6">Start your journey today.</p>
            
            {error && isSignup && <div className="mb-4 p-3 bg-red-100 border-2 border-black font-bold text-red-600 text-sm">{error}</div>}
            {successMsg && <div className="mb-4 p-3 bg-green-100 border-2 border-black font-bold text-green-700 text-sm">{successMsg}</div>}

            <form onSubmit={(e) => handleSubmit(e, 'signup')} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Student ID (TCET UID)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="e.g. 25-ITC61-29"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="pl-10 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow uppercase"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-8 border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Confirm</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-sand text-black border-4 border-black hover:bg-black hover:text-white font-black text-lg py-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all rounded-none uppercase mt-2" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6">
              <Button type="button" onClick={handleGoogleAuth} className="w-full bg-white text-black border-4 border-black hover:bg-gray-100 font-black text-lg py-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all rounded-none uppercase" disabled={isLoading}>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </Button>
              <div className="mt-4 p-3 bg-red-100 border-2 border-black border-dashed font-bold text-red-600 text-xs text-center uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                IMPORTANT: You must sign up using your official @tcetmumbai.in ID. Private emails are strictly prohibited and will be rejected.
              </div>
            </div>

            <div className="mt-6 text-center font-bold">
              Already have an account? <button onClick={toggleMode} className="text-blue-600 hover:underline cursor-pointer ml-1">Log In</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
