import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslatedCourses } from '../hooks/useTranslatedCourses';
import { Button } from '../components/ui/button';
import { Book, Clock, Play, FileText, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const translatedCourse = useTranslatedCourses(course ? [course] : [])[0];
  const isPurchased = user?.purchasedCourses?.includes(courseId);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API}/courses/${courseId}`);
      setCourse(response.data);
      if (response.data.lessons && response.data.lessons.length > 0) {
        setSelectedLesson(response.data.lessons[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated()) {
      toast.error(t('loginRequired'));
      navigate('/login', { state: { returnTo: `/course/${courseId}` } });
      return;
    }
    navigate(`/checkout/${courseId}`);
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

  if (!translatedCourse) return null;

  const lessonsCount = translatedCourse.lessons?.length || 0;

  return (
    <div className="min-h-screen bg-white" data-testid="course-detail-page">
      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player */}
            <div className="rounded-xl overflow-hidden shadow-2xl bg-black" data-testid="video-player">
              <div className="aspect-video">
                {isPurchased && selectedLesson ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={selectedLesson?.videoUrl}
                    title={selectedLesson?.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <div className="text-center text-white p-8">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-4">Compre este curso para acessar todas as aulas</p>
                      <Button 
                        onClick={handleBuyNow} 
                        className="bg-violet-600 hover:bg-violet-700"
                        data-testid="buy-to-watch-button"
                      >
                        {t('buyNow')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Lesson Info (when purchased) */}
            {isPurchased && selectedLesson && (
              <div className="bg-violet-50 rounded-xl p-6 border border-violet-200" data-testid="current-lesson-info">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedLesson.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedLesson.duration}
                      </span>
                    </div>
                  </div>
                  {selectedLesson.pdfUrl && (
                    <a
                      href={selectedLesson.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      data-testid="download-pdf-button"
                    >
                      <Download className="w-4 h-4" />
                      <span>Material PDF</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Course Info */}
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{translatedCourse.title}</h1>
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                  <Book className="w-5 h-5" />
                  <span>{lessonsCount} {t('lessons')}</span>
                </div>
                <span className="px-3 py-1 bg-violet-50 text-violet-600 text-sm font-medium rounded-full">
                  {translatedCourse.category}
                </span>
                {isPurchased && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Você possui este curso
                  </span>
                )}
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">{t('aboutCourse')}</h2>
                <p className="text-slate-600 text-lg leading-relaxed">{translatedCourse.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Price Card */}
              {!isPurchased && (
                <div className="bg-white rounded-xl border-2 border-violet-200 p-6 mb-6 shadow-lg" data-testid="price-card">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-violet-600 mb-2">
                      R$ {translatedCourse.price?.toFixed(2)}
                    </div>
                    <p className="text-slate-600 text-sm">Acesso vitalício</p>
                  </div>
                  <Button 
                    onClick={handleBuyNow} 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-lg py-6"
                    data-testid="buy-now-button"
                  >
                    {t('buyNow')}
                  </Button>
                </div>
              )}

              {/* Lesson List */}
              <div className="bg-slate-50 rounded-xl p-6 max-h-[600px] overflow-y-auto" data-testid="lesson-list">
                <h3 className="text-xl font-semibold mb-4">{t('courseContent')}</h3>
                {lessonsCount === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Conteúdo em breve...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {translatedCourse.lessons.map((lesson, index) => (
                      <button
                        key={lesson.id}
                        onClick={() => isPurchased && setSelectedLesson(lesson)}
                        disabled={!isPurchased}
                        className={`w-full text-left p-4 rounded-lg transition-all ${
                          selectedLesson?.id === lesson.id
                            ? 'bg-violet-600 text-white shadow-md'
                            : isPurchased
                            ? 'bg-white hover:bg-violet-50 text-slate-900'
                            : 'bg-white text-slate-400 cursor-not-allowed'
                        }`}
                        data-testid={`lesson-${lesson.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${
                            selectedLesson?.id === lesson.id ? 'text-white' : 'text-violet-600'
                          }`}>
                            <Play className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{lesson.title}</div>
                            <div className="flex items-center gap-3 mt-1 text-xs opacity-75">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration}
                              </span>
                              {lesson.pdfUrl && (
                                <span className={`flex items-center gap-1 ${
                                  selectedLesson?.id === lesson.id ? 'text-white' : 'text-emerald-600'
                                }`}>
                                  <FileText className="w-3 h-3" />
                                  PDF
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}