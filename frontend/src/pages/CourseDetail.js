import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Book, Clock, Play } from 'lucide-react';
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

  const isPurchased = user?.purchasedCourses?.includes(courseId);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API}/courses/${courseId}`);
      setCourse(response.data);
      setSelectedLesson(response.data.lessons[0]);
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

  if (!course) return null;

  return (
    <div className="min-h-screen bg-white" data-testid="course-detail-page">
      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player */}
            <div className="rounded-xl overflow-hidden shadow-2xl bg-black" data-testid="video-player">
              <div className="aspect-video">
                {isPurchased ? (
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

            {/* Course Info */}
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{course.title}</h1>
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                  <Book className="w-5 h-5" />
                  <span>{course.lessons.length} {t('lessons')}</span>
                </div>
                <span className="px-3 py-1 bg-violet-50 text-violet-600 text-sm font-medium rounded-full">
                  {course.category}
                </span>
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">{t('aboutCourse')}</h2>
                <p className="text-slate-600 text-lg leading-relaxed">{course.description}</p>
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
                      R$ {course.price.toFixed(2)}
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
                <div className="space-y-2">
                  {course.lessons.map((lesson, index) => (
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
                          <div className="flex items-center gap-2 mt-1 text-xs opacity-75">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.duration}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}