import { useLanguage } from '../contexts/LanguageContext';
import { coursesTranslations } from '../utils/translations';

export const useTranslatedCourses = (courses) => {
  const { language } = useLanguage();

  return courses.map(course => ({
    ...course,
    title: coursesTranslations[language]?.[course.id]?.title || course.title,
    description: coursesTranslations[language]?.[course.id]?.description || course.description
  }));
};
