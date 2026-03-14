import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Clock, Home } from 'lucide-react';

export default function PaymentPending() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-violet-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-100 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Pagamento Pendente
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Estamos aguardando a confirmação do seu pagamento
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-amber-900 mb-3">O que fazer agora?</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• Se pagou via PIX, aguarde alguns minutos</li>
              <li>• Se pagou com cartão, a aprovação pode levar até 48h</li>
              <li>• Você receberá um email quando o pagamento for aprovado</li>
              <li>• O curso será liberado automaticamente após aprovação</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/my-courses')}
              className="bg-violet-600 hover:bg-violet-700"
              size="lg"
            >
              Ver Meus Cursos
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}