import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CourseCard } from '../components/CourseCard';
import { BookOpen, Key, Copy, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const { token, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchMyCourses();
    fetchAccessCodes();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await axios.get(`${API}/my-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching my courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessCodes = async () => {
    try {
      const response = await axios.get(`${API}/my-access-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessCodes(response.data);
    } catch (error) {
      console.error('Error fetching access codes:', error);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t('codeCopied'));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12" data-testid="my-courses-page">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-8">{t('myCourses')}</h1>

          {courses.length === 0 ? (
            <div className="text-center py-20" data-testid="no-courses">
              <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-2xl font-semibold text-slate-600 mb-2">
                Você ainda não possui cursos
              </h2>
              <p className="text-slate-500 mb-6">
                Explore nosso catálogo e comece a aprender hoje!
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors"
                data-testid="explore-courses-button"
              >
                Explorar Cursos
              </button>
            </div>
          ) : (
            <>
              {/* Access Codes Section */}
              {accessCodes.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <Key className="w-6 h-6 text-violet-600" />
                    <h2 className="text-2xl font-semibold text-slate-900">{t('myAccessCodes')}</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4" data-testid="access-codes-list">
                    {accessCodes.map((item) => (
                      <div 
                        key={item.accessCode} 
                        className="bg-gradient-to-br from-violet-50 to-emerald-50 rounded-xl p-6 border border-violet-200"
                        data-testid={`access-code-${item.courseId}`}
                      >
                        <div className="flex items-start gap-4">
                          <img 
                            src={item.courseThumbnail} 
                            alt={item.courseTitle}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-2">{item.courseTitle}</h3>
                            <div className="bg-white rounded-lg p-3 mb-3 border border-slate-200">
                              <p className="text-xs text-slate-600 mb-1">{t('accessCode')}</p>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-lg font-mono font-bold text-violet-600">
                                  {item.accessCode}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyCode(item.accessCode)}
                                  data-testid={`copy-code-${item.courseId}`}
                                >
                                  {copiedCode === item.accessCode ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.status === 'pending' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.status === 'pending' ? 'Pendente' : 'Aprovado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses Grid */}
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Seus Cursos</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="my-courses-grid">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}