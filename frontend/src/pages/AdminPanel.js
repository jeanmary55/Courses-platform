import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, DollarSign, ShoppingCart, Clock, Search, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin-login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const headers = {
        Authorization: `Bearer ${adminToken}`
      };

      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/payments`, { headers })
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPayments(paymentsRes.data);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
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
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
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
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-violet-600 border-b-2 border-violet-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pagamentos ({payments.length})
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.pendingPayments || 0}</h3>
              <p className="text-sm text-slate-600">Pagamentos Pendentes</p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar aluno por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Nome</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Senha (Hash)</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Cursos</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
                            {user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'N/A'}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
                            {user.purchasedCourses?.length || 0} cursos
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
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
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar pagamento por email ou curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                        <td className="px-6 py-4 text-sm text-slate-600">{payment.course?.title}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          R$ {payment.amount?.toFixed(2)}
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
      </div>
    </div>
  );
}
