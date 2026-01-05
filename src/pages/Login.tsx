
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import nccdoLogo from '../../attached_assets/462853451_531127746179171_9134722409661138434_n_1762934895081.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem('userRole', email.includes('admin') ? 'administrator' : 'officer');
        localStorage.setItem('userName', email.split('@')[0]);
        toast({
          title: "Login successful",
          description: "Welcome to CoopWise!",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Login failed",
          description: "Please enter valid credentials",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background logo watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img 
          src={nccdoLogo} 
          alt="" 
          className="w-[800px] h-[800px] object-contain"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src={nccdoLogo} 
              alt="NCCDO - City Cooperative Development Office, City of Naga" 
              className="h-32 w-32 object-cover rounded-full drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CoopWise</h1>
          <p className="text-gray-600 mt-2">City Cooperative Development Office</p>
          <p className="text-sm text-gray-500">City of Naga</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your training management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@coopwise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Demo Credentials:</p>
              <p className="text-blue-600">admin@coopwise.com / officer@coopwise.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
