import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle2, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Checkout() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    let interval;
    if (pixData && pixData.paymentId) {
      // Check payment status every 5 seconds
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pixData]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API}/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(t('error'));
    }
  };

  const checkPaymentStatus = async () => {
    if (!pixData?.paymentId) return;
    
    setCheckingPayment(true);
    try {
      const response = await axios.get(
        `${API}/payments/status/${pixData.paymentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'approved') {
        toast.success('Pagamento aprovado! Redirecionando...');
        setTimeout(() => {
          navigate('/payment-success');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCreatePixPayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/payments/create-pix`,
        {
          courseId: courseId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPixData(response.data);
      toast.success('QR Code PIX gerado! Escaneie para pagar.');
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 py-12" data-testid="checkout-page">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12">Pagamento</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Section */}
          <div className="space-y-6">
            {/* Course Summary */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              
              <div className="flex gap-4 mb-4">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center text-lg font-bold text-violet-600">
                  <span>Total:</span>
                  <span>R$ {course.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* PIX Payment */}
            {!pixData ? (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode className="w-6 h-6 text-violet-600" />
                  <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700">
                      <p className="font-medium mb-1">✅ Pagamento Instantâneo</p>
                      <p>✅ Sem necessidade de conta</p>
                      <p>✅ Aprovação em segundos</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreatePixPayment}
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg"
                  data-testid="create-pix-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando PIX...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5 mr-2" />
                      Gerar QR Code PIX
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">QR Code PIX</h2>
                  {checkingPayment && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando...
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-emerald-800 font-medium">
                    ✓ Escaneie o QR Code abaixo ou copie o código PIX
                  </p>
                </div>

                {/* QR Code Image */}
                {pixData.qrCodeBase64 && (
                  <div className="flex justify-center mb-6 p-4 bg-white rounded-lg border-2 border-slate-200">
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                {/* PIX Code */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-slate-700">Código PIX Copia e Cola</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixData.qrCode || ''}
                      readOnly
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <Button
                      onClick={handleCopyPixCode}
                      variant="outline"
                      className="gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    ⏱️ Assim que o pagamento for aprovado, seu curso será liberado automaticamente!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* What you get */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold mb-4">O que você vai receber:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Acesso vitalício ao curso</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">20 aulas em vídeo de alta qualidade</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Acesso imediato após pagamento</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Suporte dedicado</span>
                </li>
              </ul>
            </div>

            {/* How PIX works */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold mb-4">Como pagar com PIX:</h3>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="font-bold text-violet-600">1.</span>
                  <span>Clique em "Gerar QR Code PIX"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-violet-600">2.</span>
                  <span>Abra o app do seu banco</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-violet-600">3.</span>
                  <span>Escaneie o QR Code ou copie o código</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-violet-600">4.</span>
                  <span>Confirme o pagamento</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-violet-600">5.</span>
                  <span>Aguarde alguns segundos pela aprovação</span>
                </li>
              </ol>
            </div>

            {/* Security */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold">Compra 100% Segura</h3>
              </div>
              <p className="text-sm text-slate-600">
                Pagamento processado pelo Mercado Pago. Sem necessidade de criar conta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
