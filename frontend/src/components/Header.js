import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Globe, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const languages = [
  { code: 'pt', label: 'PT', name: 'Portugues' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Francais' },
  { code: 'es', label: 'ES', name: 'Espanol' },
  { code: 'ht', label: 'HT', name: 'Kreyol' },
];

export const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100" data-testid="main-header">
      <div className="container mx-auto px-4 md:px-12 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-violet-600">Shalom Learning</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-700 hover:text-violet-600 transition-colors" data-testid="nav-home">
              {t('home')}
            </Link>
            {isAuthenticated() && (
              <Link to="/my-courses" className="text-slate-700 hover:text-violet-600 transition-colors" data-testid="nav-my-courses">
                {t('myCourses')}
              </Link>
            )}
            <Link 
              to="/about" 
              className="text-slate-700 hover:text-violet-600 transition-colors"
              data-testid="nav-about"
            >
              {t('about')}
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 md:gap-2 px-2 md:px-3" data-testid="language-switcher">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
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

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-2">
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

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-700 hover:text-violet-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-100 pt-4" data-testid="mobile-menu">
            <nav className="flex flex-col gap-3">
              <button
                onClick={() => handleNavigation('/')}
                className="text-left text-slate-700 hover:text-violet-600 py-2 px-3 rounded-lg hover:bg-violet-50 transition-colors"
                data-testid="mobile-nav-home"
              >
                {t('home')}
              </button>
              {isAuthenticated() && (
                <button
                  onClick={() => handleNavigation('/my-courses')}
                  className="text-left text-slate-700 hover:text-violet-600 py-2 px-3 rounded-lg hover:bg-violet-50 transition-colors"
                  data-testid="mobile-nav-my-courses"
                >
                  {t('myCourses')}
                </button>
              )}
              <button
                onClick={() => handleNavigation('/about')}
                className="text-left text-slate-700 hover:text-violet-600 py-2 px-3 rounded-lg hover:bg-violet-50 transition-colors"
                data-testid="mobile-nav-about"
              >
                {t('about')}
              </button>
              
              <div className="border-t border-slate-100 pt-3 mt-2">
                {isAuthenticated() ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-slate-600">
                      <User className="w-4 h-4" />
                      <span>{user?.firstName} {user?.lastName}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-left text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
                      data-testid="mobile-logout-button"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-center" 
                      onClick={() => handleNavigation('/login')}
                      data-testid="mobile-login-button"
                    >
                      {t('login')}
                    </Button>
                    <Button 
                      className="w-full justify-center bg-violet-600 hover:bg-violet-700" 
                      onClick={() => handleNavigation('/signup')}
                      data-testid="mobile-signup-button"
                    >
                      {t('signup')}
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
