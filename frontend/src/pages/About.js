import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Code, Database, Globe, Briefcase, GraduationCap } from 'lucide-react';

export default function About() {
  const { t } = useLanguage();

  const skills = [
    { name: 'Python', level: 90 },
    { name: 'SQL', level: 85 },
    { name: 'JavaScript', level: 85 },
    { name: 'React', level: 80 },
    { name: 'HTML/CSS', level: 90 },
    { name: 'Microsoft Office', level: 95 },
  ];

  const languagesSpoken = [
    { name: 'Francais', flag: 'FR' },
    { name: 'Kreyol Ayisyen', flag: 'HT' },
    { name: 'English', flag: 'EN' },
    { name: 'Portugues', flag: 'PT' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 py-12" data-testid="about-page">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{t('aboutTitle')}</h1>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-6xl font-bold shadow-lg">
                JM
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{t('aboutName')}</h2>
              <p className="text-xl text-violet-600 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                <Code className="w-5 h-5" />
                {t('aboutRole')}
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                <Briefcase className="w-5 h-5 text-amber-500" />
                <span className="text-slate-600 font-medium">Mastercard - Back Office</span>
              </div>

              {/* Languages */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {languagesSpoken.map((lang) => (
                  <span 
                    key={lang.name}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                  >
                    {lang.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-8 h-8 text-violet-600" />
            <h3 className="text-2xl font-bold text-slate-900">Biografia</h3>
          </div>
          
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>{t('aboutBio')}</p>
            <p>{t('aboutLanguages')}</p>
            <p>{t('aboutWork')}</p>
            <p className="font-medium text-violet-600">{t('aboutGoals')}</p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8 text-emerald-600" />
            <h3 className="text-2xl font-bold text-slate-900">{t('skills')}</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-slate-700">{skill.name}</span>
                  <span className="text-slate-500">{skill.level}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Languages Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold text-slate-900">{t('languagesSpoken')}</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {languagesSpoken.map((lang) => (
              <div 
                key={lang.name}
                className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl text-center border border-slate-200"
              >
                <div className="text-3xl mb-2">
                  {lang.flag === 'FR' && '🇫🇷'}
                  {lang.flag === 'HT' && '🇭🇹'}
                  {lang.flag === 'EN' && '🇺🇸'}
                  {lang.flag === 'PT' && '🇧🇷'}
                </div>
                <span className="font-medium text-slate-700">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
