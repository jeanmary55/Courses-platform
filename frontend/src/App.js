import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { Toaster } from './components/ui/sonner';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentPending from './pages/PaymentPending';
import PaymentFailure from './pages/PaymentFailure';
import MyCourses from './pages/MyCourses';
import AdminPanel from './pages/AdminPanel';
import '@/App.css';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <div className="App">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/checkout/:courseId" element={<Checkout />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-pending" element={<PaymentPending />} />
              <Route path="/payment-failure" element={<PaymentFailure />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
            <Toaster position="top-center" richColors />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;