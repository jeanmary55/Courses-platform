import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Loader2, CheckCircle2, CreditCard, Tag, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Checkout() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
    fetchPublicKey();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API}/courses/${courseId}`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error(t('error'));
    }
  };

  const fetchPublicKey = async () => {
    try {
      const response = await axios.get(`${API}/mercadopago/public-key`);
      setPublicKey(response.data.publicKey);
      initMercadoPago(response.data.publicKey);
    } catch (error) {
      console.error('Error fetching public key:', error);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    try {
      const response = await axios.post(
        `${API}/coupons/validate`,
        { code: couponCode, courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCouponApplied(response.data);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error(error.response?.data?.detail || 'Cupom inválido');
      setCouponApplied(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
  };

  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/payments/create-preference`,
        {
          courseId: courseId,
          couponCode: couponApplied?.code || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Payment created:', response.data);
      setPreferenceId(response.data.preferenceId);
      
      if (response.data.couponApplied) {
        toast.success(`Pagamento criado com desconto de R$ ${response.data.discount?.toFixed(2)}!`);
      } else {
        toast.success('Pagamento criado! Clique no botão azul abaixo para pagar.');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao criar pagamento';
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!course || !publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const displayPrice = couponApplied ? couponApplied.finalPrice : course.price;
  const hasDiscount = couponApplied && couponApplied.discount > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 py-12" data-testid="checkout-page">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12">Finalizar Compra</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Section */}
          <div className="space-y-6">
            {/* Course Summary Card */}
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

              {/* Coupon Section */}
              {!preferenceId && (
                <div className="border-t border-slate-200 pt-4 mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cupom de Desconto
                  </label>
                  {!couponApplied ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Digite o código"
                          className="pl-10"
                          data-testid="coupon-input"
                        />
                      </div>
                      <Button
                        onClick={handleValidateCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        variant="outline"
                        data-testid="apply-coupon-btn"
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-emerald-800">{couponApplied.code}</span>
                        <span className="text-sm text-emerald-600">
                          (-R$ {couponApplied.discount?.toFixed(2)})
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-slate-400 hover:text-slate-600"
                        data-testid="remove-coupon-btn"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                {hasDiscount && (
                  <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
                    <span>Subtotal:</span>
                    <span className="line-through">R$ {course.price.toFixed(2)}</span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex justify-between items-center text-sm text-emerald-600 mb-2">
                    <span>Desconto:</span>
                    <span>- R$ {couponApplied.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold text-violet-600">
                  <span>Total:</span>
                  <span>R$ {displayPrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-semibold">Pagamento via Mercado Pago</h2>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    <p className="font-medium mb-2">✅ Todas as formas de pagamento:</p>
                    <ul className="space-y-1 text-xs">
                      <li>💳 Cartão de Crédito (parcelado)</li>
                      <li>💳 Cartão de Débito</li>
                      <li>📱 PIX (aprovação instantânea)</li>
                      <li>🧾 Boleto Bancário</li>
                    </ul>
                    <p className="mt-2 font-medium">✨ Sem necessidade de conta no Mercado Pago</p>
                  </div>
                </div>
              </div>

              {!preferenceId ? (
                <Button
                  onClick={handleCreatePayment}
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-lg"
                  data-testid="create-payment-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Continuar para Pagamento'
                  )}
                </Button>
              ) : (
                <div className="space-y-4" data-testid="mercadopago-wallet">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="font-medium">Pronto! Clique no botão azul abaixo para escolher a forma de pagamento.</p>
                    </div>
                  </div>
                  <Wallet 
                    initialization={{ preferenceId: preferenceId }}
                    customization={{
                      texts: {
                        valueProp: 'security_safety'
                      }
                    }}
                  />
                  <p className="text-sm text-slate-600 text-center">
                    Você será redirecionado para o Mercado Pago para concluir o pagamento de forma segura
                  </p>
                </div>
              )}
            </div>
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
                  <span className="text-slate-700">Acesso imediato após aprovação do pagamento</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Suporte dedicado</span>
                </li>
              </ul>
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <h3 className="text-lg font-semibold mb-4">Formas de Pagamento Aceitas:</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium">PIX</p>
                  <p className="text-xs text-slate-600">Aprovação imediata</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium">Cartão</p>
                  <p className="text-xs text-slate-600">Crédito ou Débito</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium">Boleto</p>
                  <p className="text-xs text-slate-600">Até 3 dias úteis</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium">Parcelado</p>
                  <p className="text-xs text-slate-600">Até 12x</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                * Sem necessidade de criar conta no Mercado Pago
              </p>
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
                Seus dados estão protegidos com criptografia SSL. Processamento via Mercado Pago sem necessidade de conta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
