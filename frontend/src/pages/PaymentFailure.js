import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentFailure() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-violet-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-slate-100 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Pagamento Não Aprovado
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Não foi possível processar seu pagamento
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-red-900 mb-3">Possíveis motivos:</h3>
            <ul className="space-y-2 text-sm text-red-800">
              <li>• Saldo insuficiente</li>
              <li>• Dados do cartão incorretos</li>
              <li>• Pagamento cancelado</li>
              <li>• Limite excedido</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.history.back()}
              className="bg-violet-600 hover:bg-violet-700 gap-2"
              size="lg"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>

          <p className="text-sm text-slate-500 mt-6">
            Se o problema persistir, entre em contato: <br/>
            <a href="tel:+5511970561970" className="text-violet-600 hover:underline">11 97056-1970</a> | 
            <a href="mailto:jeanmaryjeanlus29@gmail.com" className="text-violet-600 hover:underline ml-2">jeanmaryjeanlus29@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}