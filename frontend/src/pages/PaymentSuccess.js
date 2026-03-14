import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/my-courses');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-violet-50 flex items-center justify-center px-6" data-testid="payment-success-page">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-100 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Pagamento Aprovado!
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Seu curso foi liberado e já está disponível em "Meus Cursos"
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-emerald-800">
              ✅ Acesso vitalício garantido<br/>
              ✅ Todas as 20 aulas já disponíveis<br/>
              ✅ Comece a estudar agora mesmo!
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/my-courses')}
              className="bg-violet-600 hover:bg-violet-700 gap-2"
              size="lg"
              data-testid="go-to-my-courses"
            >
              Acessar Meu Curso
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              Voltar ao Início
            </Button>
          </div>

          <p className="text-sm text-slate-500 mt-6">
            Você será redirecionado automaticamente em 5 segundos...
          </p>
        </div>
      </div>
    </div>
  );
}