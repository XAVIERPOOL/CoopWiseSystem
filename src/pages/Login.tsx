import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import nccdoLogo from '../../attached_assets/462853451_531127746179171_9134722409661138434_n_1762934895081.jpg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      const lowerUsername = username.toLowerCase();

      if (password) {
        let role = '';
        let name = '';
        let userId = '';

        // --- ROLE ASSIGNMENT LOGIC ---
        if (lowerUsername.includes('admin') || lowerUsername.includes('xavier')) {
          role = 'administrator';
          name = 'XAVIER ANGELO JAMES OSEA. LAGATIC';
          userId = '11111111-1111-1111-1111-111111111111';
        }
        else if (lowerUsername.includes('training')) {
          role = 'training_head';
          name = 'VINCE CARLO P. SAN JOAQUIN';
          userId = '22222222-2222-2222-2222-222222222222';
        }
        else if (lowerUsername.includes('compliance')) {
          role = 'compliance_head';
          name = 'RONALD ALLAN N. POLAGÑE';
          userId = '33333333-3333-3333-3333-333333333333';
        }
        else {
          role = 'officer';
          name = username;
          userId = '44444444-4444-4444-4444-444444444444'; // Officer UUID fallback
        }

        // Save to LocalStorage
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', name);
        localStorage.setItem('userId', userId);

        toast({
          title: "Login Successful",
          description: `Welcome, ${name}`,
        });

        // Force page reload to ensure Dashboard sees new localStorage values immediately
        window.location.href = '/dashboard';

      } else {
        toast({
          title: "Login failed",
          description: "Please enter your password",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">

      {/* Abstract Animated Background behind the card */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[100px]" />
      </div>

      {/* Main Container Container */}
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[600px] relative z-10 border border-white/40 backdrop-blur-xl">

        {/* Left Side: Premium Glassmorphic Blue Area */}
        <div className="w-full md:w-[45%] relative flex flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#3730a3] to-[#3b82f6]">
          {/* Glass / Light Orbs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-400/30 rounded-full blur-3xl mix-blend-overlay animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[80%] bg-indigo-500/30 rounded-full blur-3xl mix-blend-overlay"></div>
          </div>

          {/* Slanted edge effect intersecting nicely */}
          <div
            className="absolute top-0 right-0 bottom-0 w-24 bg-white hidden md:block z-20"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          ></div>

          {/* Logo container with subtle float */}
          <div className="relative z-30 flex flex-col items-center drop-shadow-2xl">
            <div className="p-1 rounded-full bg-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              <img
                src={nccdoLogo}
                alt="City Cooperative Development Office"
                className="w-full max-w-[280px] rounded-full ring-4 ring-white/20 transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Modern Form Area */}
        <div className="w-full md:w-[55%] flex flex-col justify-center px-8 py-12 md:px-16 relative z-10 bg-white">

          <div className="mb-12">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-400 font-medium">
              Securely access your cooperative management tools
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Animated Username Input Group */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#3b82f6] text-gray-400">
                <User className="h-[18px] w-[18px]" />
              </div>
              <Input
                id="username"
                type="text"
                placeholder=" "
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="peer block w-full pl-12 pr-4 h-14 bg-gray-50/50 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] transition-all pt-4 pb-2 text-sm shadow-sm"
                required
              />
              <Label
                htmlFor="username"
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-5 z-10 origin-[0] left-12 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-0.1rem] peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#3b82f6]"
              >
                Username or CDA Reg No.
              </Label>
            </div>

            {/* Animated Password Input Group */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#3b82f6] text-gray-400">
                <Lock className="h-[18px] w-[18px]" />
              </div>
              <Input
                id="password"
                type="password"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer block w-full pl-12 pr-4 h-14 bg-gray-50/50 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#3b82f6] transition-all pt-4 pb-2 text-sm shadow-sm"
                required
              />
              <Label
                htmlFor="password"
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-5 z-10 origin-[0] left-12 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-[-0.1rem] peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#3b82f6]"
              >
                Password
              </Label>
            </div>

            <Button
              type="submit"
              className="relative overflow-hidden w-full h-14 bg-gradient-to-r from-[#1e3a8a] to-[#3a5bbd] text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(59,130,246,0.5)] transition-all duration-300 hover:shadow-[0_15px_25px_-10px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 text-sm tracking-[0.1em] mt-8 group"
              disabled={isLoading}
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
              <span className="relative">{isLoading ? 'AUTHENTICATING...' : 'LOG IN'}</span>
            </Button>
          </form>

          {/* Demo Accounts List */}
          <div className="mt-14 w-full">
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-100 absolute w-full"></div>
              <span className="bg-white px-4 text-[10px] font-bold text-gray-300 tracking-[0.2em] relative uppercase">Demo Accounts</span>
            </div>

            <div className="flex justify-center gap-6 text-xs font-medium">
              <div className="flex flex-col items-center">
                <span className="text-gray-400 mb-1 text-[10px] uppercase">Admin</span>
                <span className="bg-gray-100/80 text-gray-600 px-3 py-1 rounded-md shadow-sm border border-gray-200/50">admin</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400 mb-1 text-[10px] uppercase">Training</span>
                <span className="bg-gray-100/80 text-gray-600 px-3 py-1 rounded-md shadow-sm border border-gray-200/50">training</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400 mb-1 text-[10px] uppercase">Compliance</span>
                <span className="bg-gray-100/80 text-gray-600 px-3 py-1 rounded-md shadow-sm border border-gray-200/50">compliance</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;