import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const PIX_CODE = "00020126580014BR.GOV.BCB.PIX013606d029d1-4172-4dfe-adb9-fa0022650e925204000053039865802BR5917Jean Mary Jeanlus6009SAO PAULO62140510R4Eevv0mtO6304A256";

export default function Checkout() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourse();
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PIX_CODE);
    setCopied(true);
    toast.success(t('codeCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!receiptFile) {
      toast.error('Por favor, envie o comprovante de pagamento');
      return;
    }

    setLoading(true);
    try {
      const base64Receipt = await convertFileToBase64(receiptFile);
      
      const response = await axios.post(
        `${API}/payments/create`,
        {
          courseId: courseId,
          receiptData: base64Receipt
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(t('paymentSuccess'));
      
      // Redirect to success page with access code
      navigate('/payment-success', { 
        state: { 
          accessCode: response.data.accessCode,
          courseTitle: response.data.courseTitle
        } 
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 py-12" data-testid="checkout-page">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12">{t('checkout')}</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Section */}
          <div className="space-y-6">
            {/* Step 1: Payment */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-semibold">{t('step1')}</h2>
              </div>
              <p className="text-slate-600 mb-6">{t('step1Desc')}</p>

              {/* QR Code */}
              <div className="flex justify-center mb-6 p-4 bg-white rounded-lg border-2 border-slate-200" data-testid="qr-code">
                <QRCodeSVG value={PIX_CODE} size={200} />
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('pixPayment')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={PIX_CODE}
                    readOnly
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    data-testid="pix-code-input"
                  />
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="gap-2"
                    data-testid="copy-pix-button"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {t('copyCode')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2: Upload Receipt */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-xl font-semibold">{t('step2')}</h2>
              </div>
              <p className="text-slate-600 mb-6">{t('step2Desc')}</p>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-violet-400 transition-colors">
                  <input
                    type="file"
                    id="receipt"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="receipt-file-input"
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {receiptFile ? receiptFile.name : t('selectFile')}
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG até 10MB</p>
                  </label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !receiptFile}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
                  data-testid="confirm-payment-button"
                >
                  {loading ? t('processing') : t('confirmPayment')}
                </Button>
              </div>
            </div>
          </div>

          {/* Course Summary */}
          <div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 sticky top-24" data-testid="course-summary">
              <h2 className="text-xl font-semibold mb-6">{t('courseSummary')}</h2>
              
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>

              <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{course.description}</p>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Curso:</span>
                  <span className="font-medium">R$ {course.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-violet-600">
                  <span>{t('total')}:</span>
                  <span>R$ {course.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}