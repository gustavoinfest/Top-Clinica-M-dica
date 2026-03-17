import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, Users, DollarSign, MessageSquare, Home, 
  CheckCircle, XCircle, Clock, Gift, Plus, Search, 
  TrendingUp, TrendingDown, RefreshCcw, Send, Settings,
  Download, Upload, X, Save, FileText, Lock, Mail, Key, Eye, EyeOff, UserPlus,
  Activity, ChevronRight, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Dados Fictícios (Mock Data Inicial) ---
const initialPatients = [
  { id: 1, name: 'Ana Silva', phone: '(11) 98765-4321', birthDate: '1985-03-10', email: 'ana@email.com' },
  { id: 2, name: 'Carlos Santos', phone: '(11) 91234-5678', birthDate: '1990-03-09', email: 'carlos@email.com' },
  { id: 3, name: 'Mariana Costa', phone: '(11) 97766-5544', birthDate: '1978-11-22', email: 'mariana@email.com' },
];

const initialAppointments = [
  { id: 1, patientId: 1, date: '2026-03-17', time: '09:00', status: 'agendado', type: 'Primeira Consulta' },
  { id: 2, patientId: 2, date: '2026-03-17', time: '10:30', status: 'compareceu', type: 'Retorno' },
  { id: 3, patientId: 3, date: '2026-03-17', time: '14:00', status: 'faltou', type: 'Primeira Consulta' },
];

const initialFinances = [
  { id: 1, date: '2026-03-01', description: 'Consulta Ana Silva', type: 'receita', amount: 350.00 },
  { id: 2, date: '2026-03-05', description: 'Aluguel da Sala', type: 'despesa', amount: 1500.00 },
];

const initialMessages = [
  { id: 1, patientId: 2, text: 'Olá Carlos, como você está se sentindo após a consulta de hoje?', date: '2026-03-17', status: 'enviada' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados da aplicação
  const [clinicName, setClinicName] = useState('TopClinic');
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [finances, setFinances] = useState(initialFinances);
  const [messages, setMessages] = useState(initialMessages);
  const [autoDays, setAutoDays] = useState(1);
  const [advancedRules, setAdvancedRules] = useState([]);
  
  const [modal, setModal] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  // --- Persistência com LocalStorage ---
  useEffect(() => {
    const savedData = localStorage.getItem('topclinic_data');
    const savedAuth = localStorage.getItem('topclinic_auth');
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setPatients(data.patients || initialPatients);
        setAppointments(data.appointments || initialAppointments);
        setFinances(data.finances || initialFinances);
        setMessages(data.messages || initialMessages);
        setClinicName(data.clinicName || 'TopClinic');
        setAutoDays(data.autoDays || 1);
        setAdvancedRules(data.advancedRules || []);
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage", e);
      }
    }
    
    if (savedAuth) {
      try {
        setUser(JSON.parse(savedAuth));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Erro ao carregar auth do localStorage", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const data = { patients, appointments, finances, messages, clinicName, autoDays, advancedRules };
      localStorage.setItem('topclinic_data', JSON.stringify(data));
    }
  }, [patients, appointments, finances, messages, clinicName, autoDays, advancedRules, isLoading]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Login simples para demonstração
    if (loginForm.email && loginForm.password) {
      const userData = { email: loginForm.email, name: 'Administrador' };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('topclinic_auth', JSON.stringify(userData));
      showToast('Bem-vindo ao TopClinic!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('topclinic_auth');
  };

  // --- Funções Auxiliares ---
  const getPatientName = (id) => patients.find(p => p.id === id)?.name || 'Desconhecido';
  const getPatientPhone = (id) => patients.find(p => p.id === id)?.phone || '';

  const handlePhoneMask = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    if (v.length > 9) v = `${v.slice(0, 10)}-${v.slice(10)}`;
    e.target.value = v;
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === appointmentId) {
        if (newStatus === 'faltou') {
          const newMessage = {
            id: Date.now(),
            patientId: app.patientId,
            text: `Olá ${getPatientName(app.patientId)}, notamos que você não pôde comparecer à consulta. Podemos reagendar?`,
            date: new Date().toISOString().split('T')[0],
            status: 'pendente'
          };
          setMessages(m => [newMessage, ...m]);
        }
        return { ...app, status: newStatus };
      }
      return app;
    }));
    showToast('Status atualizado!');
  };

  const handleSendMessage = (messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      const phone = getPatientPhone(msg.patientId).replace(/\D/g, '');
      const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg.text)}`, '_blank');
      
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'enviada' } : m));
      showToast('WhatsApp aberto!');
    }
  };

  const handleBackup = () => {
    const data = { clinicName, patients, appointments, finances, messages, autoDays, advancedRules };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_topclinic_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup exportado!');
  };

  const handleFormSubmit = (e, type) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newId = Date.now();

    if (type === 'paciente') {
      setPatients(prev => [...prev, {
        id: newId,
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        birthDate: formData.get('birthDate') as string
      }]);
      showToast('Paciente cadastrado!');
    } else if (type === 'agenda') {
      setAppointments(prev => [...prev, {
        id: newId,
        patientId: Number(formData.get('patientId')),
        date: formData.get('date') as string,
        time: formData.get('time') as string,
        status: 'agendado',
        type: formData.get('type') as string
      }]);
      showToast('Consulta agendada!');
    } else if (type === 'financeiro') {
      setFinances(prev => [...prev, {
        id: newId,
        date: formData.get('date') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as string,
        amount: parseFloat(formData.get('amount') as string)
      }]);
      showToast('Lançamento registrado!');
    } else if (type === 'mensagem') {
      setMessages(prev => [{
        id: newId,
        patientId: Number(formData.get('patientId')),
        text: formData.get('text') as string,
        date: formData.get('date') as string,
        status: 'pendente'
      }, ...prev]);
      showToast('Mensagem agendada!');
    }
    setModal(null);
  };

  // --- Cálculos ---
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayDate);
  
  const financialSummary = useMemo(() => {
    const receitas = finances.filter(f => f.type === 'receita').reduce((acc, curr) => acc + curr.amount, 0);
    const despesas = finances.filter(f => f.type === 'despesa').reduce((acc, curr) => acc + curr.amount, 0);
    return { receitas, despesas, saldo: receitas - despesas };
  }, [finances]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><RefreshCcw className="animate-spin text-blue-600" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">TopClinic</h1>
            <p className="text-slate-500 text-sm">Gestão Médica Inteligente</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="admin@topclinic.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center space-x-2">
              <Lock size={18} />
              <span>Acessar Sistema</span>
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">© 2026 TopClinic • Versão Local</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
            <Activity className="text-white" size={20} />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">{clinicName}</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'agenda', icon: Calendar, label: 'Agenda' },
            { id: 'pacientes', icon: Users, label: 'Pacientes' },
            { id: 'financeiro', icon: DollarSign, label: 'Financeiro' },
            { id: 'mensagens', icon: MessageSquare, label: 'CRM / WhatsApp' },
            { id: 'configuracoes', icon: Settings, label: 'Configurações' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">AD</div>
              <div className="text-xs">
                <p className="font-bold text-slate-700">Admin</p>
                <p className="text-slate-400">Online</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <XCircle size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Olá, Administrador</h2>
                    <p className="text-slate-500">Aqui está o resumo da sua clínica hoje.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Data de Hoje</p>
                    <p className="text-lg font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Consultas Hoje', value: todayAppointments.length, icon: Calendar, color: 'blue' },
                    { label: 'Total Pacientes', value: patients.length, icon: Users, color: 'indigo' },
                    { label: 'Receita Mensal', value: `R$ ${financialSummary.receitas.toFixed(2)}`, icon: TrendingUp, color: 'emerald' },
                    { label: 'Saldo Líquido', value: `R$ ${financialSummary.saldo.toFixed(2)}`, icon: DollarSign, color: 'slate' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-${stat.color === 'blue' ? 'blue-50' : stat.color === 'indigo' ? 'indigo-50' : stat.color === 'emerald' ? 'emerald-50' : 'slate-50'} text-${stat.color === 'blue' ? 'blue-600' : stat.color === 'indigo' ? 'indigo-600' : stat.color === 'emerald' ? 'emerald-600' : 'slate-600'}`}>
                        <stat.icon size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center"><Clock size={18} className="mr-2 text-blue-500" /> Próximas Consultas</h3>
                      <button onClick={() => setActiveTab('agenda')} className="text-sm text-blue-600 font-medium hover:underline">Ver Agenda</button>
                    </div>
                    <div className="p-6">
                      {todayAppointments.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-400 text-sm">Nenhuma consulta para hoje.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {todayAppointments.map(app => (
                            <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-sm">{app.time.split(':')[0]}</div>
                                <div>
                                  <p className="font-bold text-slate-800">{getPatientName(app.patientId)}</p>
                                  <p className="text-xs text-slate-500">{app.time} • {app.type}</p>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                app.status === 'compareceu' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>{app.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                      <Gift size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Aniversariantes do Mês</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Mantenha o relacionamento com seus pacientes enviando uma mensagem especial.</p>
                    <button onClick={() => setActiveTab('mensagens')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Ver Lista</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">Agenda de Consultas</h2>
                  <button onClick={() => setModal('agenda')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Plus size={20} />
                    <span>Nova Consulta</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4 font-bold">Paciente</th>
                        <th className="px-6 py-4 font-bold">Data / Hora</th>
                        <th className="px-6 py-4 font-bold">Tipo</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {appointments.sort((a,b) => b.id - a.id).map(app => (
                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{getPatientName(app.patientId)}</p>
                            <p className="text-xs text-slate-400">{getPatientPhone(app.patientId)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-700">{app.date.split('-').reverse().join('/')}</p>
                            <p className="text-xs text-slate-400">{app.time}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{app.type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              app.status === 'compareceu' ? 'bg-emerald-100 text-emerald-700' : 
                              app.status === 'faltou' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>{app.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              {app.status === 'agendado' && (
                                <>
                                  <button onClick={() => handleStatusChange(app.id, 'compareceu')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle size={18} /></button>
                                  <button onClick={() => handleStatusChange(app.id, 'faltou')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><XCircle size={18} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'pacientes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">Pacientes Cadastrados</h2>
                  <div className="flex space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
                    </div>
                    <button onClick={() => setModal('paciente')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                      <Plus size={20} />
                      <span>Novo Paciente</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{p.name}</h4>
                          <p className="text-xs text-slate-400">{p.birthDate.split('-').reverse().join('/')}</p>
                        </div>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-3 text-sm text-slate-500">
                          <Clock size={16} className="text-slate-300" />
                          <span>{p.phone}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-slate-500">
                          <Mail size={16} className="text-slate-300" />
                          <span className="truncate">{p.email}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => { setSelectedPatientId(p.id); setModal('agenda'); }} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">AGENDAR</button>
                        <button onClick={() => { setSelectedPatientId(p.id); setModal('mensagem'); }} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">MENSAGEM</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'financeiro' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h2>
                  <button onClick={() => setModal('financeiro')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                    <Plus size={20} />
                    <span>Lançamento</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Receitas</p>
                    <p className="text-3xl font-bold text-slate-800">R$ {financialSummary.receitas.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown size={24} /></div>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Despesas</p>
                    <p className="text-3xl font-bold text-slate-800">R$ {financialSummary.despesas.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-800 p-8 rounded-2xl shadow-xl shadow-slate-200 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/10 text-white rounded-xl"><DollarSign size={24} /></div>
                    </div>
                    <p className="text-sm text-white/60 font-medium">Saldo Líquido</p>
                    <p className="text-3xl font-bold">R$ {financialSummary.saldo.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4 font-bold">Data</th>
                        <th className="px-6 py-4 font-bold">Descrição</th>
                        <th className="px-6 py-4 font-bold">Tipo</th>
                        <th className="px-6 py-4 font-bold text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {finances.sort((a,b) => b.id - a.id).map(f => (
                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{f.date.split('-').reverse().join('/')}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{f.description}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              f.type === 'receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>{f.type}</span>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${f.type === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {f.type === 'receita' ? '+' : '-'} R$ {f.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'mensagens' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-800">CRM & Comunicação</h2>
                  <button onClick={() => setModal('mensagem')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <Plus size={20} />
                    <span>Nova Mensagem</span>
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><RefreshCcw size={24} /></div>
                    <div>
                      <h4 className="font-bold text-indigo-900">Automação de Retorno</h4>
                      <p className="text-sm text-indigo-700">O sistema agenda mensagens automaticamente {autoDays} dia(s) após a consulta.</p>
                    </div>
                  </div>
                  <button onClick={() => setModal('config_auto')} className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all shadow-sm">Configurar</button>
                </div>

                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-bold text-slate-800">{getPatientName(msg.patientId)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{msg.date.split('-').reverse().join('/')}</span>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">"{msg.text}"</p>
                      </div>
                      <div className="ml-8 flex flex-col items-end space-y-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          msg.status === 'enviada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{msg.status}</span>
                        {msg.status !== 'enviada' && (
                          <button onClick={() => handleSendMessage(msg.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all flex items-center space-x-2">
                            <Send size={14} />
                            <span>Enviar WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'configuracoes' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
                
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Identidade Visual</h3>
                    <div className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Clínica</label>
                        <input 
                          type="text" 
                          value={clinicName} 
                          onChange={e => setClinicName(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </section>

                  <hr className="border-slate-50" />

                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Dados e Segurança</h3>
                    <div className="flex space-x-4">
                      <button onClick={handleBackup} className="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-all">
                        <Download size={20} />
                        <span>Exportar Backup</span>
                      </button>
                      <button onClick={() => fileInputRef.current.click()} className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all">
                        <Upload size={20} />
                        <span>Importar Dados</span>
                      </button>
                      <input type="file" ref={fileInputRef} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            try {
                              const data = JSON.parse(ev.target?.result as string);
                              setPatients(data.patients || []);
                              setAppointments(data.appointments || []);
                              setFinances(data.finances || []);
                              setMessages(data.messages || []);
                              setClinicName(data.clinicName || 'TopClinic');
                              showToast('Dados importados!');
                            } catch (err) {
                              showToast('Erro ao importar arquivo.');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }} className="hidden" />
                    </div>
                  </section>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Toast Notificação */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 right-8 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 z-50 border border-slate-700"
            >
              <CheckCircle size={20} className="text-emerald-400" />
              <span className="font-medium">{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                  {modal === 'paciente' && 'Novo Paciente'}
                  {modal === 'agenda' && 'Nova Consulta'}
                  {modal === 'financeiro' && 'Lançamento Financeiro'}
                  {modal === 'mensagem' && 'Nova Mensagem'}
                  {modal === 'config_auto' && 'Configurar Automação'}
                </h3>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="p-8">
                {modal === 'config_auto' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Dias para Envio Automático</label>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="number" 
                          value={autoDays} 
                          onChange={e => setAutoDays(e.target.value)}
                          className="w-20 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <span className="text-sm text-slate-500">dia(s) após a consulta.</span>
                      </div>
                    </div>
                    <button onClick={() => { showToast('Configuração salva!'); setModal(null); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Salvar Configurações</button>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleFormSubmit(e, modal)} className="space-y-4">
                    {modal === 'paciente' && (
                      <>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label><input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label><input name="phone" required onChange={handlePhoneMask} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nascimento</label><input name="birthDate" type="date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail</label><input name="email" type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </>
                    )}

                    {modal === 'agenda' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Paciente</label>
                          <select name="patientId" required defaultValue={selectedPatientId} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione...</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data</label><input name="date" type="date" required defaultValue={todayDate} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hora</label><input name="time" type="time" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label><input name="type" required defaultValue="Consulta" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </>
                    )}

                    {modal === 'financeiro' && (
                      <>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label><input name="description" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo</label>
                            <select name="type" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="receita">Receita</option>
                              <option value="despesa">Despesa</option>
                            </select>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor</label><input name="amount" type="number" step="0.01" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data</label><input name="date" type="date" required defaultValue={todayDate} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </>
                    )}

                    {modal === 'mensagem' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Paciente</label>
                          <select name="patientId" required defaultValue={selectedPatientId} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione...</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mensagem</label><textarea name="text" required rows="4" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Escreva aqui..."></textarea></div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data Programada</label><input name="date" type="date" required defaultValue={todayDate} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </>
                    )}

                    <div className="pt-6 flex space-x-3">
                      <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">CANCELAR</button>
                      <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">SALVAR</button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
