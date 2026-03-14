import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Book, Clock } from 'lucide-react';
import { Button } from './ui/button';

export const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div 
      className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:border-violet-200 transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/course/${course.id}`)}
      data-testid={`course-card-${course.id}`}
    >
      <div className="aspect-video overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <div className="mb-3">
          <span className="inline-block px-3 py-1 bg-violet-50 text-violet-600 text-xs font-medium rounded-full">
            {course.category}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Book className="w-4 h-4" />
            <span>{course.lessons.length} {t('lessons')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-violet-600">
            R$ {course.price.toFixed(2)}
          </div>
          <Button 
            size="sm" 
            className="bg-violet-600 hover:bg-violet-700 rounded-full px-6"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/course/${course.id}`);
            }}
            data-testid={`buy-now-${course.id}`}
          >
            {t('buyNow')}
          </Button>
        </div>
      </div>
    </div>
  );
};