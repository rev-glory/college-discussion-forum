'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, User, LogOut, PenSquare, Home } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">College Forum</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {user && (
              <Link
                href="/create"
                className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
