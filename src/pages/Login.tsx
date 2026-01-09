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
    
    // Simulate authentication delay
    setTimeout(() => {
      const lowerEmail = email.toLowerCase();
      
      if (password) { 
        
        let role = '';
        let name = '';
        let userId = '';

        // --- ROLE ASSIGNMENT LOGIC ---
        if (lowerEmail.includes('admin') || lowerEmail.includes('xavier')) {
          role = 'administrator';
          name = 'XAVIER ANGELO JAMES OSEA. LAGATIC';
          userId = '11111111-1111-1111-1111-111111111111';
        } 
        else if (lowerEmail.includes('training')) {
          role = 'training_head';
          name = 'VINCE CARLO P. SAN JOAQUIN';
          userId = '22222222-2222-2222-2222-222222222222';
        }
        else if (lowerEmail.includes('compliance')) {
          role = 'compliance_head';
          name = 'RONALD ALLAN N. POLAGÑE';
          userId = '33333333-3333-3333-3333-333333333333';
        }
        else {
          role = 'officer';
          name = email.split('@')[0];
          userId = 'officer-id';
        }
        
        // Save to LocalStorage
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', name);
        localStorage.setItem('userId', userId);

        toast({
          title: "Login Successful",
          description: `Welcome, ${name}`,
        });
        
        // --- THE FIX IS HERE ---
        // Instead of navigate(), we use window.location.href to FORCE a page reload.
        // This ensures the Dashboard sees the new localStorage values immediately.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img src={nccdoLogo} alt="" className="w-[800px] h-[800px] object-contain" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src={nccdoLogo} alt="NCCDO" className="h-32 w-32 object-cover rounded-full drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CoopWise</h1>
          <p className="text-gray-600 mt-2">City Cooperative Development Office</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">System Login</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
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
                    placeholder="e.g. training@coopwise.com" 
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
                    placeholder="Enter password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700 mb-2">Available Accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium">Admin:</span> admin@coopwise.com</div>
                <div><span className="font-medium">Training:</span> training@coopwise.com</div>
                <div className="col-span-2"><span className="font-medium">Compliance:</span> compliance@coopwise.com</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;