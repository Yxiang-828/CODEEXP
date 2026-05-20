import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/lib/authContext.jsx';
import {
  LogOut, Shield, Radio, Users, ChevronDown, MapPin,
  Phone, Home, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const roleConfig = {
  civilian: { label: 'Civilian', color: 'bg-blue-500', textColor: 'text-blue-600', icon: Users },
  responder: { label: 'Responder', color: 'bg-amber-500', textColor: 'text-amber-600', icon: Radio },
  operations: { label: 'Operations', color: 'bg-green-600', textColor: 'text-green-600', icon: Shield },
};

// Responder has a minimal sub-header handled within ResponderHome
// Operations has a full-panel layout handled within OperationsHome
// No page-level nav links needed for either
const navItems = {};

export default function AppLayout() {
  const { currentUser, logout, switchRole } = useAppAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activeRole = currentUser?.active_role || 'civilian';
  const config = roleConfig[activeRole];
  const items = navItems[activeRole] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = (role) => {
    switchRole(role);
    navigate('/');
  };

  const availableRoles = [currentUser?.primary_role];
  if (currentUser?.secondary_role && currentUser.secondary_role !== 'none') {
    availableRoles.push(currentUser.secondary_role);
  }

  // Nav bar color per role
  const headerBg = activeRole === 'civilian'
    ? 'bg-slate-800'
    : activeRole === 'responder'
    ? 'bg-amber-700'
    : 'bg-green-800';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className={`sticky top-0 z-50 ${headerBg} shadow-md`}>
        <div className="w-full px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-white hidden sm:block">KampungKaki</span>
          </Link>

          {/* Desktop Nav (non-civilian roles) */}
          {items.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-white/80 hover:text-white hover:bg-white/10 ${isActive ? 'bg-white/20 text-white' : ''}`}
                    >
                      <Icon className="w-4 h-4 mr-1.5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
                  <span className="text-sm font-bold text-white">
                    {currentUser?.display_name?.charAt(0)}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {currentUser?.display_name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* User info block */}
              <div className="px-3 py-3 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-600">
                      {currentUser?.display_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{currentUser?.display_name}</p>
                    <p className="text-xs text-gray-500">@{currentUser?.username}</p>
                  </div>
                </div>
                {/* Role pill */}
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge className={`${config.color} text-white text-[10px] uppercase tracking-wider`}>
                    {config.label}
                  </Badge>
                  <span className="text-[10px] text-gray-400">Primary role</span>
                </div>
                {/* Contact & address */}
                {currentUser?.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
                {currentUser?.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <Home className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{currentUser.address}</span>
                  </div>
                )}
              </div>

              {/* Role switching */}
              {availableRoles.length > 1 ? (
                <>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-gray-400 pt-2">Switch Role</DropdownMenuLabel>
                  {availableRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleSwitchRole(role)}
                      className={activeRole === role ? 'bg-accent font-semibold' : ''}
                    >
                      {React.createElement(roleConfig[role].icon, { className: 'w-4 h-4 mr-2' })}
                      {roleConfig[role].label}
                      {activeRole === role && <span className="ml-auto text-[10px] text-gray-400">Active</span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              ) : activeRole !== 'civilian' && (
                <>
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-gray-400 pt-2">Mode</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleSwitchRole('civilian')}>
                    <Users className="w-4 h-4 mr-2 text-blue-500" />
                    Switch to Civilian Mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {activeRole === 'operations' && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}