import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslatedCourses } from '../hooks/useTranslatedCourses';
import { CourseCard } from '../components/CourseCard';
import { FAQ } from '../components/FAQ';
import { Button } from '../components/ui/button';
import { BookOpen, Clock, Users, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [category, setCategory] = useState('all');
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const translatedCourses = useTranslatedCourses(courses);

  useEffect(() => {
    fetchCourses();
  }, [category]);

  const fetchCourses = async () => {
    try {
      const url = category === 'all' ? `${API}/courses` : `${API}/courses?category=${category}`;
      const response = await axios.get(url);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-violet-50 via-white to-emerald-50" data-testid="hero-section">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              {t('heroTitle')}
              <span className="block text-violet-600 mt-2">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed text-slate-600 mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 rounded-full px-8 gap-2"
                onClick={() => document.getElementById('courses').scrollIntoView({ behavior: 'smooth' })}
                data-testid="start-learning-button"
              >
                {t('startLearning')}
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-full px-8"
                onClick={() => window.open('https://jeanmaryshalomboot.streamlit.app', '_blank')}
                data-testid="more-info-button"
              >
                {t('moreInfo')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-16">{t('whyChooseUs')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 bg-white rounded-xl border border-slate-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('feature1Title')}</h3>
              <p className="text-slate-600">{t('feature1Desc')}</p>
            </div>
            <div className="text-center p-8 bg-white rounded-xl border border-slate-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('feature2Title')}</h3>
              <p className="text-slate-600">{t('feature2Desc')}</p>
            </div>
            <div className="text-center p-8 bg-white rounded-xl border border-slate-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('feature3Title')}</h3>
              <p className="text-slate-600">{t('feature3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-8">{t('allCourses')}</h2>
          
          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-12" data-testid="category-filter">
            <Button
              variant={category === 'all' ? 'default' : 'outline'}
              className={category === 'all' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              onClick={() => setCategory('all')}
              data-testid="filter-all"
            >
              {t('allCourses')}
            </Button>
            <Button
              variant={category === 'Tecnologia' ? 'default' : 'outline'}
              className={category === 'Tecnologia' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              onClick={() => setCategory('Tecnologia')}
              data-testid="filter-technology"
            >
              {t('technology')}
            </Button>
            <Button
              variant={category === 'Idiomas' ? 'default' : 'outline'}
              className={category === 'Idiomas' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              onClick={() => setCategory('Idiomas')}
              data-testid="filter-languages"
            >
              {t('languages')}
            </Button>
          </div>

          {/* Course Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="courses-grid">
            {translatedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white" data-testid="footer">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Shalom Learning</h3>
              <p className="text-slate-400">{t('heroSubtitle')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('contact')}</h4>
              <div className="space-y-2 text-slate-400">
                <p>{t('phone')}: <a href="tel:+5511970561970" className="hover:text-white">11 97056-1970</a></p>
                <p>{t('email')}: <a href="mailto:jeanmaryjeanlus29@gmail.com" className="hover:text-white">jeanmaryjeanlus29@gmail.com</a></p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>© 2024 Shalom Learning. {t('allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}