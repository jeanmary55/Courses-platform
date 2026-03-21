import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, DollarSign, ShoppingCart, Clock, Search, LogOut, BookOpen, Plus, Trash2, Eye, EyeOff, Edit, Gift, X, Tag, Percent, MessageCircle, Send, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lessons, setLessons] = useState([]);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showGrantAccess, setShowGrantAccess] = useState(false);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    videoUrl: '',
    pdfUrl: '',
    duration: '15:00',
    order: 1
  });
  const [courseForm, setCourseForm] = useState({
    title: '',
    category: 'Tecnologia',
    description: '',
    price: 197.00,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    published: true
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: '',
    expiresAt: '',
    specificUserId: '',
    specificCourseId: '',
    minPurchaseAmount: '',
    active: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin-login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'lessons' && selectedCourse) {
      fetchLessons();
    }
  }, [activeTab, selectedCourse]);

  const getHeaders = () => {
    const adminToken = localStorage.getItem('adminToken');
    return { Authorization: `Bearer ${adminToken}` };
  };

  const fetchData = async () => {
    try {
      const headers = getHeaders();

      const [statsRes, usersRes, paymentsRes, coursesRes, couponsRes, questionsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/payments`, { headers }),
        axios.get(`${API}/admin/courses`, { headers }),
        axios.get(`${API}/admin/coupons`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/questions`, { headers }).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPayments(paymentsRes.data);
      setCourses(coursesRes.data);
      setCoupons(couponsRes.data);
      setQuestions(questionsRes.data);
      
      if (coursesRes.data.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    if (!selectedCourse) return;
    try {
      const response = await axios.get(`${API}/admin/lessons/${selectedCourse}`, {
        headers: getHeaders()
      });
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/lessons/add`, {
        courseId: selectedCourse,
        ...lessonForm
      }, { headers: getHeaders() });
      
      setShowAddLesson(false);
      setLessonForm({ title: '', videoUrl: '', pdfUrl: '', duration: '15:00', order: lessons.length + 1 });
      fetchLessons();
      alert('Aula adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('Erro ao adicionar aula');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta aula?')) return;
    
    try {
      await axios.delete(`${API}/admin/lessons/${lessonId}`, { headers: getHeaders() });
      fetchLessons();
      alert('Aula deletada com sucesso!');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Erro ao deletar aula');
    }
  };

  // Course Management Functions
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/courses`, courseForm, { headers: getHeaders() });
      setShowAddCourse(false);
      setCourseForm({
        title: '',
        category: 'Tecnologia',
        description: '',
        price: 197.00,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        published: true
      });
      fetchData();
      alert('Curso criado com sucesso!');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Erro ao criar curso');
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/courses/${editingCourse.id}`, courseForm, { headers: getHeaders() });
      setShowEditCourse(false);
      setEditingCourse(null);
      fetchData();
      alert('Curso atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Erro ao atualizar curso');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Tem certeza que deseja deletar este curso? Todas as aulas também serão deletadas.')) return;
    
    try {
      await axios.delete(`${API}/admin/courses/${courseId}`, { headers: getHeaders() });
      fetchData();
      alert('Curso deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Erro ao deletar curso');
    }
  };

  const handleTogglePublish = async (courseId) => {
    try {
      const response = await axios.put(`${API}/admin/courses/${courseId}/publish`, {}, { headers: getHeaders() });
      fetchData();
      alert(response.data.message);
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Erro ao alterar status de publicação');
    }
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      category: course.category,
      description: course.description,
      price: course.price,
      thumbnail: course.thumbnail,
      published: course.published
    });
    setShowEditCourse(true);
  };

  // User Management Functions
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) return;
    
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers: getHeaders() });
      fetchData();
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao deletar usuário');
    }
  };

  const handleGrantAccess = async (courseId) => {
    try {
      await axios.post(`${API}/admin/users/grant-access`, {
        userId: selectedUser.id,
        courseId: courseId
      }, { headers: getHeaders() });
      setShowGrantAccess(false);
      setSelectedUser(null);
      fetchData();
      alert('Acesso gratuito concedido com sucesso!');
    } catch (error) {
      console.error('Error granting access:', error);
      alert(error.response?.data?.detail || 'Erro ao conceder acesso');
    }
  };

  const handleRevokeAccess = async (userId, courseId) => {
    if (!window.confirm('Tem certeza que deseja revogar o acesso deste usuário ao curso?')) return;
    
    try {
      await axios.post(`${API}/admin/users/revoke-access`, {
        userId: userId,
        courseId: courseId
      }, { headers: getHeaders() });
      fetchData();
      alert('Acesso revogado com sucesso!');
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Erro ao revogar acesso');
    }
  };

  // Coupon Management Functions
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const data = {
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
        expiresAt: couponForm.expiresAt || null,
        specificUserId: couponForm.specificUserId || null,
        specificCourseId: couponForm.specificCourseId || null,
        minPurchaseAmount: couponForm.minPurchaseAmount ? parseFloat(couponForm.minPurchaseAmount) : null,
        active: couponForm.active
      };
      
      await axios.post(`${API}/admin/coupons`, data, { headers: getHeaders() });
      setShowAddCoupon(false);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        maxUses: '',
        expiresAt: '',
        specificUserId: '',
        specificCourseId: '',
        minPurchaseAmount: '',
        active: true
      });
      fetchData();
      alert('Cupom criado com sucesso!');
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(error.response?.data?.detail || 'Erro ao criar cupom');
    }
  };

  const handleToggleCouponActive = async (couponId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/coupons/${couponId}`, { active: !currentStatus }, { headers: getHeaders() });
      fetchData();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      alert('Erro ao atualizar cupom');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Tem certeza que deseja deletar este cupom?')) return;
    
    try {
      await axios.delete(`${API}/admin/coupons/${couponId}`, { headers: getHeaders() });
      fetchData();
      alert('Cupom deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Erro ao deletar cupom');
    }
  };

  // Questions Management Functions
  const handleAnswerQuestion = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !selectedQuestion) return;
    
    try {
      await axios.put(`${API}/admin/questions/${selectedQuestion.id}/answer`, {
        answer: answerText
      }, { headers: getHeaders() });
      setShowAnswerModal(false);
      setSelectedQuestion(null);
      setAnswerText('');
      fetchData();
      alert('Resposta enviada com sucesso!');
    } catch (error) {
      console.error('Error answering question:', error);
      alert('Erro ao enviar resposta');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta pergunta?')) return;
    
    try {
      await axios.delete(`${API}/admin/questions/${questionId}`, { headers: getHeaders() });
      fetchData();
      alert('Pergunta deletada com sucesso!');
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Erro ao deletar pergunta');
    }
  };

  const handleSendEmailQuestion = async (question) => {
    const message = window.prompt('Digite a mensagem para enviar por email:');
    if (!message) return;
    
    try {
      await axios.post(`${API}/admin/questions/send-email`, {
        questionId: question.id,
        message: message
      }, { headers: getHeaders() });
      alert(`Email enviado para ${question.userEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erro ao enviar email (integração precisa ser configurada)');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    navigate('/admin-login');
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(payment =>
    payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuestions = questions.filter(q =>
    q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingQuestions = questions.filter(q => !q.answer);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-testid="admin-panel">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Painel Administrativo</h1>
            <p className="text-slate-600">Gerenciamento do Shalom Learning</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            data-testid="tab-dashboard"
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            data-testid="tab-courses"
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'courses'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cursos ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            data-testid="tab-users"
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alunos ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            data-testid="tab-payments"
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pagamentos ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            data-testid="tab-lessons"
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'lessons'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gerenciar Aulas
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            data-testid="tab-coupons"
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'coupons'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cupons ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            data-testid="tab-questions"
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'questions'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Duvidas {pendingQuestions.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingQuestions.length}</span>
            )}
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="dashboard-stats">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</h3>
              <p className="text-sm text-slate-600">Total de Alunos</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
              <p className="text-sm text-slate-600">Receita Total</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.approvedPayments || 0}</h3>
              <p className="text-sm text-slate-600">Vendas Aprovadas</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{courses.length}</h3>
              <p className="text-sm text-slate-600">Total de Cursos</p>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div data-testid="courses-tab">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-courses"
                />
              </div>
              <Button
                onClick={() => setShowAddCourse(true)}
                className="bg-violet-600 hover:bg-violet-700 gap-2"
                data-testid="add-course-btn"
              >
                <Plus className="w-4 h-4" />
                Novo Curso
              </Button>
            </div>

            {/* Add Course Modal */}
            {showAddCourse && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Novo Curso</h3>
                      <button onClick={() => setShowAddCourse(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <form onSubmit={handleAddCourse} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Título</label>
                        <Input
                          type="text"
                          value={courseForm.title}
                          onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                          placeholder="Ex: React para Iniciantes"
                          required
                          data-testid="course-title-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                        <select
                          value={courseForm.category}
                          onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                          data-testid="course-category-select"
                        >
                          <option value="Tecnologia">Tecnologia</option>
                          <option value="Idiomas">Idiomas</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                        <textarea
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                          placeholder="Descrição do curso..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg min-h-[100px]"
                          required
                          data-testid="course-description-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Preço (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={courseForm.price}
                          onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value)})}
                          required
                          data-testid="course-price-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">URL da Imagem</label>
                        <Input
                          type="url"
                          value={courseForm.thumbnail}
                          onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})}
                          placeholder="https://..."
                          data-testid="course-thumbnail-input"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="published"
                          checked={courseForm.published}
                          onChange={(e) => setCourseForm({...courseForm, published: e.target.checked})}
                          className="w-4 h-4"
                          data-testid="course-published-checkbox"
                        />
                        <label htmlFor="published" className="text-sm text-slate-700">Publicar imediatamente</label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-course-btn">
                          Criar Curso
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddCourse(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Course Modal */}
            {showEditCourse && editingCourse && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Editar Curso</h3>
                      <button onClick={() => { setShowEditCourse(false); setEditingCourse(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <form onSubmit={handleUpdateCourse} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Título</label>
                        <Input
                          type="text"
                          value={courseForm.title}
                          onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                        <select
                          value={courseForm.category}
                          onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                        >
                          <option value="Tecnologia">Tecnologia</option>
                          <option value="Idiomas">Idiomas</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                        <textarea
                          value={courseForm.description}
                          onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg min-h-[100px]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Preço (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={courseForm.price}
                          onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">URL da Imagem</label>
                        <Input
                          type="url"
                          value={courseForm.thumbnail}
                          onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="edit-published"
                          checked={courseForm.published}
                          onChange={(e) => setCourseForm({...courseForm, published: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <label htmlFor="edit-published" className="text-sm text-slate-700">Publicado</label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                          Salvar Alterações
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setShowEditCourse(false); setEditingCourse(null); }}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Courses List */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Curso</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Categoria</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Preço</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Aulas</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50" data-testid={`course-row-${course.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <div className="font-medium text-slate-900">{course.title}</div>
                              <div className="text-sm text-slate-500 truncate max-w-[200px]">{course.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            course.category === 'Tecnologia' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {course.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          R$ {course.price?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {course.lessonsCount || 0} aulas
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            course.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {course.published ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditCourse(course)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Editar"
                              data-testid={`edit-course-${course.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish(course.id)}
                              className={`p-2 rounded-lg ${course.published ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              title={course.published ? 'Despublicar' : 'Publicar'}
                              data-testid={`toggle-publish-${course.id}`}
                            >
                              {course.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Deletar"
                              data-testid={`delete-course-${course.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div data-testid="users-tab">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar aluno por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-users"
                />
              </div>
            </div>

            {/* Grant Access Modal */}
            {showGrantAccess && selectedUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Liberar Acesso Gratuito</h3>
                      <button onClick={() => { setShowGrantAccess(false); setSelectedUser(null); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="text-slate-600 mb-4">
                      Selecione um curso para liberar acesso gratuito para <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>:
                    </p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {courses.filter(c => !selectedUser.purchasedCourses?.includes(c.id)).map(course => (
                        <button
                          key={course.id}
                          onClick={() => handleGrantAccess(course.id)}
                          className="w-full p-4 text-left border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-4"
                          data-testid={`grant-access-${course.id}`}
                        >
                          <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <div className="font-medium text-slate-900">{course.title}</div>
                            <div className="text-sm text-slate-500">R$ {course.price?.toFixed(2)}</div>
                          </div>
                        </button>
                      ))}
                      {courses.filter(c => !selectedUser.purchasedCourses?.includes(c.id)).length === 0 && (
                        <p className="text-slate-500 text-center py-4">Este usuário já possui acesso a todos os cursos.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Nome</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Cursos</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Cadastro</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50" data-testid={`user-row-${user.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.purchasedCourses?.length > 0 ? (
                              user.purchasedCourses.map(courseId => {
                                const course = courses.find(c => c.id === courseId);
                                return (
                                  <span key={courseId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                                    {course?.title || courseId}
                                    <button
                                      onClick={() => handleRevokeAccess(user.id, courseId)}
                                      className="hover:text-red-600"
                                      title="Revogar acesso"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-400 text-sm">Nenhum curso</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSelectedUser(user); setShowGrantAccess(true); }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Liberar acesso gratuito"
                              data-testid={`grant-access-btn-${user.id}`}
                            >
                              <Gift className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Deletar usuário"
                              data-testid={`delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div data-testid="payments-tab">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar pagamento por email ou curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-payments"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Aluno</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Curso</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Valor</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {payment.user?.firstName} {payment.user?.lastName}
                          </div>
                          <div className="text-sm text-slate-500">{payment.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{payment.course?.title || 'Curso removido'}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {payment.amount === 0 ? (
                            <span className="text-emerald-600">Gratuito</span>
                          ) : payment.amount != null ? (
                            `R$ ${payment.amount.toFixed(2)}`
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            payment.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : payment.status === 'pending' || payment.status === 'in_process'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status === 'approved' ? 'Aprovado' : 
                             payment.status === 'pending' ? 'Pendente' : 
                             payment.status === 'in_process' ? 'Processando' : 'Rejeitado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div data-testid="lessons-tab">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg min-w-[200px]"
                data-testid="select-course-lessons"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <Button
                onClick={() => { setShowAddLesson(true); setLessonForm({...lessonForm, order: lessons.length + 1}); }}
                className="bg-violet-600 hover:bg-violet-700 gap-2"
                data-testid="add-lesson-btn"
              >
                <Plus className="w-4 h-4" />
                Adicionar Aula
              </Button>
            </div>

            {/* Add Lesson Form */}
            {showAddLesson && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Nova Aula</h3>
                <form onSubmit={handleAddLesson} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Título da Aula</label>
                    <Input
                      type="text"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                      placeholder="Ex: Aula 1: Introdução ao Python"
                      required
                      data-testid="lesson-title-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL do YouTube</label>
                    <Input
                      type="url"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                      data-testid="lesson-video-input"
                    />
                    <p className="text-xs text-slate-500 mt-1">Cole o link do vídeo do YouTube</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL do PDF (Opcional)</label>
                    <Input
                      type="url"
                      value={lessonForm.pdfUrl}
                      onChange={(e) => setLessonForm({...lessonForm, pdfUrl: e.target.value})}
                      placeholder="https://drive.google.com/... ou link do PDF"
                      data-testid="lesson-pdf-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Ordem</label>
                      <Input
                        type="number"
                        value={lessonForm.order}
                        onChange={(e) => setLessonForm({...lessonForm, order: parseInt(e.target.value)})}
                        min="1"
                        required
                        data-testid="lesson-order-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Duração</label>
                      <Input
                        type="text"
                        value={lessonForm.duration}
                        onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                        placeholder="15:00"
                        required
                        data-testid="lesson-duration-input"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-lesson-btn">
                      Salvar Aula
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddLesson(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Lessons List */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Aulas ({lessons.length})
                </h3>
                {lessons.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Nenhuma aula adicionada ainda. Clique em "Adicionar Aula" para começar.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50" data-testid={`lesson-row-${lesson.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">#{lesson.order}</span>
                            <div>
                              <h4 className="font-medium text-slate-900">{lesson.title}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-slate-500">Duração: {lesson.duration}</span>
                                {lesson.pdfUrl && (
                                  <span className="text-sm text-emerald-600">PDF disponível</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            Ver Vídeo
                          </a>
                          {lesson.pdfUrl && (
                            <a
                              href={lesson.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 text-sm text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              Ver PDF
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                            data-testid={`delete-lesson-${lesson.id}`}
                          >
                            Deletar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div data-testid="coupons-tab">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar cupom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-coupons"
                />
              </div>
              <Button
                onClick={() => setShowAddCoupon(true)}
                className="bg-violet-600 hover:bg-violet-700 gap-2"
                data-testid="add-coupon-btn"
              >
                <Plus className="w-4 h-4" />
                Novo Cupom
              </Button>
            </div>

            {/* Add Coupon Modal */}
            {showAddCoupon && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Novo Cupom de Desconto</h3>
                      <button onClick={() => setShowAddCoupon(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <form onSubmit={handleAddCoupon} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Código do Cupom</label>
                        <Input
                          type="text"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                          placeholder="Ex: PROMO10, NATAL2024"
                          required
                          data-testid="coupon-code-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Desconto</label>
                          <select
                            value={couponForm.discountType}
                            onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                            data-testid="coupon-type-select"
                          >
                            <option value="percentage">Percentual (%)</option>
                            <option value="fixed">Valor Fixo (R$)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Valor {couponForm.discountType === 'percentage' ? '(%)' : '(R$)'}
                          </label>
                          <Input
                            type="number"
                            step={couponForm.discountType === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={couponForm.discountType === 'percentage' ? '100' : undefined}
                            value={couponForm.discountValue}
                            onChange={(e) => setCouponForm({...couponForm, discountValue: e.target.value})}
                            required
                            data-testid="coupon-value-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Máximo de Usos</label>
                          <Input
                            type="number"
                            min="1"
                            value={couponForm.maxUses}
                            onChange={(e) => setCouponForm({...couponForm, maxUses: e.target.value})}
                            placeholder="Ilimitado"
                            data-testid="coupon-maxuses-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Data de Expiração</label>
                          <Input
                            type="datetime-local"
                            value={couponForm.expiresAt}
                            onChange={(e) => setCouponForm({...couponForm, expiresAt: e.target.value})}
                            data-testid="coupon-expires-input"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Usuário Específico (opcional)</label>
                        <select
                          value={couponForm.specificUserId}
                          onChange={(e) => setCouponForm({...couponForm, specificUserId: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                        >
                          <option value="">Todos os usuários</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Curso Específico (opcional)</label>
                        <select
                          value={couponForm.specificCourseId}
                          onChange={(e) => setCouponForm({...couponForm, specificCourseId: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                        >
                          <option value="">Todos os cursos</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Valor Mínimo de Compra (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={couponForm.minPurchaseAmount}
                          onChange={(e) => setCouponForm({...couponForm, minPurchaseAmount: e.target.value})}
                          placeholder="Sem mínimo"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="coupon-active"
                          checked={couponForm.active}
                          onChange={(e) => setCouponForm({...couponForm, active: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <label htmlFor="coupon-active" className="text-sm text-slate-700">Cupom ativo</label>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-coupon-btn">
                          Criar Cupom
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddCoupon(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Código</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Desconto</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Usos</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Validade</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Restrições</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.filter(c => c.code?.toLowerCase().includes(searchTerm.toLowerCase())).map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-slate-50" data-testid={`coupon-row-${coupon.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-violet-600" />
                            <span className="font-mono font-bold text-violet-600">{coupon.code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                            {coupon.discountType === 'percentage' ? (
                              <><Percent className="w-3 h-3" /> {coupon.discountValue}%</>
                            ) : (
                              <>R$ {coupon.discountValue?.toFixed(2)}</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {coupon.currentUses || 0} / {coupon.maxUses || '∞'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('pt-BR') : 'Sem limite'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-500 space-y-1">
                            {coupon.specificUserId && <div>Usuário específico</div>}
                            {coupon.specificCourseId && <div>Curso específico</div>}
                            {coupon.minPurchaseAmount && <div>Mín: R$ {coupon.minPurchaseAmount}</div>}
                            {!coupon.specificUserId && !coupon.specificCourseId && !coupon.minPurchaseAmount && <div>Sem restrições</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            coupon.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {coupon.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleCouponActive(coupon.id, coupon.active)}
                              className={`p-2 rounded-lg ${coupon.active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              title={coupon.active ? 'Desativar' : 'Ativar'}
                              data-testid={`toggle-coupon-${coupon.id}`}
                            >
                              {coupon.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Deletar"
                              data-testid={`delete-coupon-${coupon.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                          Nenhum cupom criado ainda. Clique em "Novo Cupom" para criar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div data-testid="questions-tab">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar pergunta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-questions"
                />
              </div>
            </div>

            {/* Answer Modal */}
            {showAnswerModal && selectedQuestion && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Responder Pergunta</h3>
                      <button onClick={() => { setShowAnswerModal(false); setSelectedQuestion(null); setAnswerText(''); }} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500 mb-1">Pergunta de {selectedQuestion.userName}:</p>
                      <p className="text-slate-800">{selectedQuestion.question}</p>
                      <p className="text-xs text-slate-400 mt-2">Curso: {selectedQuestion.courseTitle}</p>
                    </div>
                    <form onSubmit={handleAnswerQuestion} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sua Resposta</label>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Escreva sua resposta..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg min-h-[120px]"
                          required
                          data-testid="answer-textarea"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="submit-answer-btn">
                          <Send className="w-4 h-4" />
                          Enviar Resposta
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setShowAnswerModal(false); setSelectedQuestion(null); setAnswerText(''); }}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-12 text-center text-slate-500">
                  Nenhuma pergunta ainda.
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div key={question.id} className={`bg-white rounded-xl shadow-lg border ${question.answer ? 'border-slate-100' : 'border-amber-200'} p-6`} data-testid={`admin-question-${question.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-slate-900">{question.userName}</span>
                          <span className="text-slate-400">-</span>
                          <span className="text-sm text-slate-500">{question.userEmail}</span>
                          <span className="text-slate-400">-</span>
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded">{question.courseTitle}</span>
                        </div>
                        <p className="text-slate-800 mb-2">{question.question}</p>
                        <p className="text-xs text-slate-400">{new Date(question.createdAt).toLocaleString('pt-BR')}</p>
                        
                        {question.answer && (
                          <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <p className="text-sm font-medium text-emerald-700 mb-1">Resposta:</p>
                            <p className="text-slate-700">{question.answer}</p>
                            <p className="text-xs text-slate-400 mt-2">Respondido em {new Date(question.answeredAt).toLocaleString('pt-BR')}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {!question.answer && (
                          <Button
                            onClick={() => { setSelectedQuestion(question); setShowAnswerModal(true); }}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                            data-testid={`answer-question-${question.id}`}
                          >
                            <Send className="w-3 h-3" />
                            Responder
                          </Button>
                        )}
                        <Button
                          onClick={() => handleSendEmailQuestion(question)}
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          data-testid={`email-question-${question.id}`}
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </Button>
                        <Button
                          onClick={() => handleDeleteQuestion(question.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 gap-1"
                          data-testid={`delete-question-${question.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
