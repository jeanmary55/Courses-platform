import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const { accessCode, courseTitle } = location.state || {};

  if (!accessCode) {
    navigate('/');
    return null;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    toast.success(t('codeCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

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
            {t('paymentSuccess')}
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            {t('accessCodeGenerated')}
          </p>

          {/* Course Info */}
          <div className="mb-8 p-4 bg-violet-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Curso adquirido:</p>
            <p className="text-lg font-semibold text-violet-600">{courseTitle}</p>
          </div>

          {/* Access Code Display */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('accessCode')}
            </label>
            <div className="bg-slate-50 border-2 border-violet-200 rounded-xl p-6 mb-4">
              <div className="text-3xl md:text-4xl font-bold text-violet-600 tracking-wider font-mono mb-4" data-testid="access-code-display">
                {accessCode}
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="gap-2"
                data-testid="copy-access-code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {t('copyCode')}
              </Button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ {t('saveAccessCode')}</p>
              <p>{t('accessCodeDesc')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/my-courses')}
              className="bg-violet-600 hover:bg-violet-700"
              size="lg"
              data-testid="go-to-my-courses"
            >
              {t('goToMyCourses')}
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              {t('home')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
