import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAppAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const users = await base44.entities.AppUser.filter({ username: username.toLowerCase().trim() });

    if (users.length === 0) {
      setError('User not found. Please check your username.');
      setLoading(false);
      return;
    }

    const user = users[0];

    if (user.password !== password) {
      setError('Incorrect password.');
      setLoading(false);
      return;
    }

    login(user);
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">KampungKaki</h1>
          <p className="text-muted-foreground text-sm mt-1">Kampung Kaki for Singapore</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Welcome back</CardTitle>
            <CardDescription>Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ahlian"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-2.5 rounded-lg">{error}</p>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-[11px] text-muted-foreground text-center mb-3">Demo Accounts (password: pass123)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { u: 'ahlian', label: 'Civilian', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { u: 'faizal', label: 'Responder', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { u: 'weiming', label: 'Operations', color: 'bg-green-50 text-green-700 border-green-200' },
                ].map((demo) => (
                  <button
                    key={demo.u}
                    type="button"
                    className={`text-[11px] font-medium py-2 px-2 rounded-lg border transition-colors hover:opacity-80 ${demo.color}`}
                    onClick={() => { setUsername(demo.u); setPassword('pass123'); }}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
