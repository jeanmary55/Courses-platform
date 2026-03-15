import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Globe, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const languages = [
  { code: 'pt', label: '🇧🇷 PT', name: 'Português' },
  { code: 'en', label: '🇺🇸 EN', name: 'English' },
  { code: 'fr', label: '🇫🇷 FR', name: 'Français' },
  { code: 'es', label: '🇪🇸 ES', name: 'Español' },
  { code: 'ht', label: '🇭🇹 HT', name: 'Kreyòl' },
];

export const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100" data-testid="main-header">
      <div className="container mx-auto px-6 md:px-12 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <h1 className="text-2xl font-bold tracking-tighter text-violet-600">Shalom Learning</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-700 hover:text-violet-600 transition-colors" data-testid="nav-home">
              {t('home')}
            </Link>
            {isAuthenticated() && (
              <Link to="/my-courses" className="text-slate-700 hover:text-violet-600 transition-colors" data-testid="nav-my-courses">
                {t('myCourses')}
              </Link>
            )}
            <a 
              href="https://jeanmaryshalomboot.streamlit.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-700 hover:text-violet-600 transition-colors"
              data-testid="nav-about"
            >
              {t('about')}
            </a>
            <Link to="/admin-login" className="text-slate-700 hover:text-violet-600 transition-colors" data-testid="nav-admin">
              Admin
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="language-switcher">
                  <Globe className="w-4 h-4" />
                  {languages.find(l => l.code === language)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => changeLanguage(lang.code)}
                    className={language === lang.code ? 'bg-violet-50' : ''}
                    data-testid={`lang-option-${lang.code}`}
                  >
                    {lang.label} {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated() ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" data-testid="user-menu">
                    <User className="w-4 h-4" />
                    {user?.firstName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/login')} data-testid="login-button">
                  {t('login')}
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')} className="bg-violet-600 hover:bg-violet-700" data-testid="signup-button">
                  {t('signup')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};