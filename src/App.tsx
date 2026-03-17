import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, Users, DollarSign, MessageSquare, Home, 
  CheckCircle, XCircle, Clock, Gift, Plus, Search, 
  TrendingUp, TrendingDown, RefreshCcw, Send, Settings,
  Download, Upload, X, Save, FileText, Lock, Mail, Key, Eye, EyeOff, UserPlus,
  Activity, ChevronRight, Menu, Trash2, Edit, Check, Smartphone, LogOut, AlertCircle, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Types
interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  pathology?: string;
  medication?: string;
  createdAt?: any;
  createdBy: string;
}

interface AutomationRule {
  id: string;
  type: 'pos_consulta' | 'lembrete_consulta' | 'patologia' | 'medicacao' | 'aniversario' | 'boas_vindas';
  conditionValue?: string;
  daysOffset: number;
  messageTemplate: string;
  createdBy: string;
}

interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  status: 'agendado' | 'confirmado' | 'compareceu' | 'faltou' | 'cancelado';
  type: string;
  createdBy: string;
}

interface Finance {
  id: string;
  date: string;
  description: string;
  type: 'receita' | 'despesa';
  amount: number;
  status: 'concluido' | 'pendente';
  patientId?: string;
  createdBy: string;
}

interface Message {
  id: string;
  patientId: string;
  text: string;
  date: string;
  status: 'pendente' | 'enviada';
  createdBy: string;
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null as any };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ops! Algo deu errado</h2>
            <p className="text-slate-500 text-sm mb-6">{this.state.error?.message || "Ocorreu um erro inesperado."}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados de Autenticação Estendida
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados da aplicação
  const [clinicName, setClinicName] = useState('TopClinic');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  
  const [modal, setModal] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [configSearchTerm, setConfigSearchTerm] = useState('');
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const fileInputRef = useRef<any>(null);

  // Local Persistence and Auth Simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('topclinic_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    
    // Load initial data
    const savedPatients = localStorage.getItem('topclinic_patients');
    if (savedPatients) setPatients(JSON.parse(savedPatients));
    
    const savedAppointments = localStorage.getItem('topclinic_appointments');
    if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
    
    const savedFinances = localStorage.getItem('topclinic_finances');
    if (savedFinances) setFinances(JSON.parse(savedFinances));
    
    const savedMessages = localStorage.getItem('topclinic_messages');
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    
    const savedRules = localStorage.getItem('topclinic_rules');
    if (savedRules) {
      setAutomationRules(JSON.parse(savedRules));
    } else {
      // Default Rules
      const defaultRules: AutomationRule[] = [
        {
          id: 'def-1',
          type: 'lembrete_consulta',
          daysOffset: -1,
          messageTemplate: 'Olá {nome}, confirmamos sua consulta para amanhã. Podemos contar com sua presença? 🏥',
          createdBy: 'local-user'
        },
        {
          id: 'def-2',
          type: 'pos_consulta',
          daysOffset: 1,
          messageTemplate: 'Olá {nome}, como você está se sentindo após a consulta de ontem? Qualquer dúvida, estamos à disposição! 😊',
          createdBy: 'local-user'
        },
        {
          id: 'def-3',
          type: 'aniversario',
          daysOffset: 0,
          messageTemplate: 'Parabéns {nome}! 🎂 Desejamos muita saúde, paz e felicidades no seu dia especial. Um grande abraço da equipe TopClinic!',
          createdBy: 'local-user'
        },
        {
          id: 'def-4',
          type: 'boas_vindas',
          daysOffset: 0,
          messageTemplate: 'Seja muito bem-vindo(a) à TopClinic, {nome}! 🌟 É um prazer ter você conosco. Estamos aqui para cuidar da sua saúde com excelência.',
          createdBy: 'local-user'
        }
      ];
      setAutomationRules(defaultRules);
    }

    setIsLoading(false);
    setIsAuthReady(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (isAuthReady) {
      localStorage.setItem('topclinic_patients', JSON.stringify(patients));
      localStorage.setItem('topclinic_appointments', JSON.stringify(appointments));
      localStorage.setItem('topclinic_finances', JSON.stringify(finances));
      localStorage.setItem('topclinic_messages', JSON.stringify(messages));
      localStorage.setItem('topclinic_rules', JSON.stringify(automationRules));
    }
  }, [patients, appointments, finances, messages, automationRules, isAuthReady]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Simple mock login
    const mockUser = { uid: 'local-user', email: loginForm.email, displayName: 'Admin' };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('topclinic_user', JSON.stringify(mockUser));
    showToast('Bem-vindo ao TopClinic!');
  };

  const handleGoogleLogin = async () => {
    const mockUser = { uid: 'local-user-google', email: 'google@user.com', displayName: 'Google User' };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('topclinic_user', JSON.stringify(mockUser));
    showToast('Bem-vindo ao TopClinic!');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      showToast('As senhas não coincidem.');
      return;
    }
    const mockUser = { uid: `local-user-${Date.now()}`, email: registerForm.email, displayName: registerForm.name };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('topclinic_user', JSON.stringify(mockUser));
    showToast('Conta criada com sucesso!');
    setIsRegistering(false);
  };

  const handleRecoverPassword = async (e) => {
    e.preventDefault();
    showToast(`Instruções simuladas enviadas para ${recoveryEmail}`);
    setIsRecoveringPassword(false);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('topclinic_user');
    showToast('Até logo!');
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
        const updatedApp = { ...app, status: newStatus };
        
        if (newStatus === 'faltou') {
          const newMessage: Message = {
            id: Date.now().toString(),
            patientId: app.patientId,
            text: `Olá ${getPatientName(app.patientId)}, notamos que você não pôde comparecer à consulta. Podemos reagendar?`,
            date: new Date().toISOString().split('T')[0],
            status: 'pendente',
            createdBy: user.uid
          };
          setMessages(m => [...m, newMessage]);
        }
        return updatedApp;
      }
      return app;
    }));
    showToast('Status atualizado!');
  };

  const handleDeletePatient = (id) => {
    if (window.confirm('Deseja realmente excluir este paciente?')) {
      setPatients(prev => prev.filter(p => p.id !== id));
      showToast('Paciente excluído');
    }
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
    const data = { clinicName, patients, appointments, finances, messages, automationRules };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_topclinic_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup exportado!');
  };

  const processAutomations = () => {
    let generatedCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newMessages: Message[] = [];

    for (const rule of automationRules) {
      if (rule.type === 'pos_consulta' || rule.type === 'lembrete_consulta') {
        for (const app of appointments) {
          if (rule.type === 'pos_consulta' && app.status !== 'compareceu') continue;
          if (rule.type === 'lembrete_consulta' && !['agendado', 'confirmado'].includes(app.status)) continue;

          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          
          const targetDate = new Date(appDate);
          targetDate.setDate(targetDate.getDate() + rule.daysOffset);

          if (today.getTime() === targetDate.getTime()) {
            const msgText = rule.messageTemplate.replace('{nome}', getPatientName(app.patientId));
            const exists = messages.some(m => m.patientId === app.patientId && m.text === msgText) || 
                           newMessages.some(m => m.patientId === app.patientId && m.text === msgText);
            
            if (!exists) {
              newMessages.push({
                id: `auto-${Date.now()}-${generatedCount}`,
                patientId: app.patientId,
                text: msgText,
                date: todayDate,
                status: 'pendente',
                createdBy: user.uid
              });
              generatedCount++;
            }
          }
        }
      } else if (rule.type === 'aniversario') {
        for (const p of patients) {
          if (!p.birthDate) continue;
          const birthDate = new Date(p.birthDate);
          if (today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate()) {
            const msgText = rule.messageTemplate.replace('{nome}', p.name);
            const exists = messages.some(m => m.patientId === p.id && m.text === msgText && m.date === todayDate) ||
                           newMessages.some(m => m.patientId === p.id && m.text === msgText);
            
            if (!exists) {
              newMessages.push({
                id: `auto-${Date.now()}-${generatedCount}`,
                patientId: p.id,
                text: msgText,
                date: todayDate,
                status: 'pendente',
                createdBy: user.uid
              });
              generatedCount++;
            }
          }
        }
      } else if (rule.type === 'boas_vindas') {
        for (const p of patients) {
          if (!p.createdAt) continue;
          const createdDate = new Date(p.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          
          if (today.getTime() === createdDate.getTime()) {
            const msgText = rule.messageTemplate.replace('{nome}', p.name);
            const exists = messages.some(m => m.patientId === p.id && m.text === msgText) ||
                           newMessages.some(m => m.patientId === p.id && m.text === msgText);
            
            if (!exists) {
              newMessages.push({
                id: `auto-${Date.now()}-${generatedCount}`,
                patientId: p.id,
                text: msgText,
                date: todayDate,
                status: 'pendente',
                createdBy: user.uid
              });
              generatedCount++;
            }
          }
        }
      } else if (rule.type === 'patologia' || rule.type === 'medicacao') {
        for (const p of patients) {
          let match = false;
          if (rule.type === 'patologia' && p.pathology?.toLowerCase().includes(rule.conditionValue?.toLowerCase() || '')) match = true;
          if (rule.type === 'medicacao' && p.medication?.toLowerCase().includes(rule.conditionValue?.toLowerCase() || '')) match = true;

          if (match && rule.conditionValue) {
            const msgText = rule.messageTemplate.replace('{nome}', p.name);
            const exists = messages.some(m => m.patientId === p.id && m.text === msgText) ||
                           newMessages.some(m => m.patientId === p.id && m.text === msgText);
            
            if (!exists) {
              newMessages.push({
                id: `auto-${Date.now()}-${generatedCount}`,
                patientId: p.id,
                text: msgText,
                date: todayDate,
                status: 'pendente',
                createdBy: user.uid
              });
              generatedCount++;
            }
          }
        }
      }
    }
    if (newMessages.length > 0) {
      setMessages(prev => [...prev, ...newMessages]);
    }
    showToast(`${generatedCount} nova(s) mensagem(ns) gerada(s)!`);
  };

  const handleFormSubmit = (e, type) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target);
    const data: any = Object.fromEntries(formData.entries());

    if (type === 'paciente') {
      if (editingPatient) {
        setPatients(prev => prev.map(p => p.id === editingPatient.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
        showToast('Paciente atualizado!');
        setEditingPatient(null);
      } else {
        const newPatient: Patient = {
          ...data,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          createdBy: user.uid
        };
        setPatients(prev => [...prev, newPatient]);
        showToast('Paciente cadastrado!');
      }
    } else if (type === 'agenda') {
      const newApp: Appointment = {
        ...data,
        id: Date.now().toString(),
        status: 'agendado',
        createdBy: user.uid
      };
      setAppointments(prev => [...prev, newApp]);
      showToast('Consulta agendada!');
    } else if (type === 'financeiro') {
      const newFinance: Finance = {
        ...data,
        id: Date.now().toString(),
        amount: parseFloat(data.amount),
        status: 'pendente',
        createdBy: user.uid
      };
      setFinances(prev => [...prev, newFinance]);
      showToast('Lançamento registrado!');
    } else if (type === 'mensagem') {
      const newMessage: Message = {
        patientId: data.patientId,
        text: messageDraft || data.text,
        date: data.date,
        id: Date.now().toString(),
        status: 'pendente',
        createdBy: user.uid
      };
      setMessages(prev => [...prev, newMessage]);
      showToast('Mensagem agendada!');
      setMessageDraft('');
    } else if (type === 'automacao') {
      const newRule: AutomationRule = {
        ...data,
        id: Date.now().toString(),
        daysOffset: parseInt(data.daysOffset),
        createdBy: user.uid
      };
      setAutomationRules(prev => [...prev, newRule]);
      showToast('Regra de automação criada!');
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

  const birthdayPatients = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    return patients.filter(p => {
      if (!p.birthDate) return false;
      const birthMonth = parseInt(p.birthDate.split('-')[1]);
      return birthMonth === currentMonth;
    });
  }, [patients]);

  if (isLoading) return <ErrorBoundary><div className="h-screen flex items-center justify-center bg-slate-50"><RefreshCcw className="animate-spin text-blue-600" /></div></ErrorBoundary>;

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
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

          <AnimatePresence mode="wait">
            {isRecoveringPassword ? (
              <motion.div
                key="recover"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold text-slate-800 text-center">Recuperar Senha</h2>
                <p className="text-sm text-slate-500 text-center">Insira seu e-mail para receber as instruções.</p>
                <form onSubmit={handleRecoverPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="seu@email.com"
                        value={recoveryEmail}
                        onChange={e => setRecoveryEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Enviar Instruções
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsRecoveringPassword(false)}
                    className="w-full text-slate-500 text-sm hover:text-slate-800 transition-colors"
                  >
                    Voltar ao Login
                  </button>
                </form>
              </motion.div>
            ) : isRegistering ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold text-slate-800 text-center">Criar Nova Conta</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Seu Nome"
                      value={registerForm.name}
                      onChange={e => setRegisterForm({...registerForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="seu@email.com"
                      value={registerForm.email}
                      onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="••••"
                        value={registerForm.password}
                        onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar</label>
                      <input 
                        type="password" 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="••••"
                        value={registerForm.confirmPassword}
                        onChange={e => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Criar Conta
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsRegistering(false)}
                    className="w-full text-slate-500 text-sm hover:text-slate-800 transition-colors"
                  >
                    Já tenho uma conta
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
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
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-700">Senha</label>
                      <button 
                        type="button" 
                        onClick={() => setIsRecoveringPassword(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
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

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">Ou continue com</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Entrar com Google</span>
                  </button>
                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsRegistering(true)}
                      className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      Não tem uma conta? <span className="font-bold">Cadastre-se</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">© 2026 TopClinic • Versão Local</p>
          </div>
        </motion.div>
      </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
            { id: 'mensagens', icon: MessageSquare, label: 'WhatsApp' },
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
                    <div className="text-4xl font-black text-indigo-600">{birthdayPatients.length}</div>
                    <p className="text-slate-500 text-sm max-w-xs">Pacientes que fazem aniversário este mês.</p>
                    <button onClick={() => setModal('aniversariantes')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Ver Lista</button>
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
                            <button 
                              onClick={() => {
                                const statusCycle: Appointment['status'][] = ['agendado', 'compareceu', 'faltou'];
                                const currentIndex = statusCycle.indexOf(app.status);
                                const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
                                handleStatusChange(app.id, nextStatus);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                                app.status === 'compareceu' ? 'bg-emerald-100 text-emerald-700' : 
                                app.status === 'faltou' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {app.status}
                            </button>
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
                  {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => {
                    const lastAppointment = appointments
                      .filter(a => a.patientId === p.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                    return (
                      <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800">{p.name}</h4>
                              <p className="text-xs text-slate-400">{p.birthDate.split('-').reverse().join('/')}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => { setEditingPatient(p); setModal('paciente'); }} className="text-slate-300 hover:text-blue-500 transition-colors">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDeletePatient(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center space-x-3 text-sm text-slate-500">
                            <Smartphone size={16} className="text-slate-300" />
                            <span>{p.phone}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-slate-500">
                            <Mail size={16} className="text-slate-300" />
                            <span className="truncate">{p.email}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Status da Consulta</p>
                            {lastAppointment ? (
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  lastAppointment.status === 'compareceu' ? 'bg-emerald-100 text-emerald-700' : 
                                  lastAppointment.status === 'faltou' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                }`}>{lastAppointment.status}</span>
                                <div className="flex space-x-1">
                                  <button onClick={() => handleStatusChange(lastAppointment.id, 'compareceu')} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded" title="Compareceu"><Check size={14} /></button>
                                  <button onClick={() => handleStatusChange(lastAppointment.id, 'faltou')} className="p-1 hover:bg-red-50 text-red-600 rounded" title="Faltou"><X size={14} /></button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300 italic">Sem agendamentos</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => { setSelectedPatientId(p.id); setModal('agenda'); }} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all">AGENDAR</button>
                          <button onClick={() => { setSelectedPatientId(p.id); setModal('mensagem'); }} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">MENSAGEM</button>
                        </div>
                      </div>
                    );
                  })}
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
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {f.description}
                            {f.patientId && (
                              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                Paciente: {getPatientName(f.patientId)}
                              </span>
                            )}
                          </td>
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
                  <h2 className="text-2xl font-bold text-slate-800">WhatsApp & Automações</h2>
                  <div className="flex space-x-3">
                    <button onClick={processAutomations} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                      <RefreshCcw size={20} />
                      <span>Gerar Automáticas</span>
                    </button>
                    <button onClick={() => setModal('mensagem')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                      <Plus size={20} />
                      <span>Nova Mensagem</span>
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><Settings size={24} /></div>
                    <div>
                      <h4 className="font-bold text-indigo-900">Regras de Automação</h4>
                      <p className="text-sm text-indigo-700">Você tem {automationRules.length} regra(s) ativa(s). Configure-as na aba de Configurações.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('configuracoes')} className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all shadow-sm">Ver Regras</button>
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
                          <button onClick={() => handleSendMessage(msg.id)} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center" title="Enviar WhatsApp">
                            <Smartphone size={20} />
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

                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Buscar Paciente</h3>
                    <div className="max-w-md relative">
                      <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por nome..." 
                        value={configSearchTerm}
                        onChange={e => setConfigSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    {configSearchTerm && (
                      <div className="mt-4 space-y-2 max-w-md">
                        {patients.filter(p => p.name.toLowerCase().includes(configSearchTerm.toLowerCase())).map(p => (
                          <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-800">{p.name}</div>
                              <div className="text-xs text-slate-500">{p.phone}</div>
                            </div>
                            <button onClick={() => { setSelectedPatientId(p.id); setModal('agenda'); }} className="text-indigo-600 text-sm font-bold hover:underline">Agendar</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <hr className="border-slate-50" />

                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Automações de WhatsApp</h3>
                      <button onClick={() => setModal('automacao')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center space-x-2">
                        <Plus size={16} />
                        <span>Nova Regra</span>
                      </button>
                    </div>
                    
                    {automationRules.length === 0 ? (
                      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center">
                        <p className="text-sm text-indigo-700">Nenhuma regra de automação configurada.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {automationRules.map(rule => (
                          <div key={rule.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                              <div className="font-bold text-slate-800 text-sm">
                                {rule.type === 'pos_consulta' && 'Pós-Consulta'}
                                {rule.type === 'lembrete_consulta' && 'Lembrete de Consulta'}
                                {rule.type === 'aniversario' && 'Aniversário'}
                                {rule.type === 'boas_vindas' && 'Boas-Vindas'}
                                {rule.type === 'patologia' && `Patologia: ${rule.conditionValue}`}
                                {rule.type === 'medicacao' && `Medicação: ${rule.conditionValue}`}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {rule.daysOffset > 0 ? `${rule.daysOffset} dia(s) depois` : rule.daysOffset < 0 ? `${Math.abs(rule.daysOffset)} dia(s) antes` : 'No mesmo dia'}
                              </div>
                              <div className="text-xs text-slate-400 mt-1 line-clamp-1">"{rule.messageTemplate}"</div>
                            </div>
                            <button onClick={() => {
                              if (window.confirm('Excluir regra?')) {
                                setAutomationRules(prev => prev.filter(r => r.id !== rule.id));
                                showToast('Regra excluída');
                              }
                            }} className="text-slate-300 hover:text-red-500 p-2">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                  {modal === 'paciente' && (editingPatient ? 'Editar Paciente' : 'Novo Paciente')}
                  {modal === 'agenda' && 'Nova Consulta'}
                  {modal === 'financeiro' && 'Lançamento Financeiro'}
                  {modal === 'mensagem' && 'Nova Mensagem'}
                  {modal === 'automacao' && 'Nova Regra de Automação'}
                  {modal === 'aniversariantes' && 'Aniversariantes do Mês'}
                </h3>
                <button onClick={() => { setModal(null); setEditingPatient(null); setMessageDraft(''); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="p-8">
                <form onSubmit={(e) => handleFormSubmit(e, modal)} className="space-y-4">
                  {modal === 'aniversariantes' && (
                    <div className="space-y-4">
                      {birthdayPatients.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">Nenhum aniversariante este mês.</p>
                      ) : (
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                          {birthdayPatients.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="text-xs text-slate-500">Dia {p.birthDate.split('-')[2]}</p>
                              </div>
                              <button 
                                onClick={() => { setSelectedPatientId(p.id); setModal('mensagem'); }}
                                className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all"
                              >
                                <MessageSquare size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => setModal(null)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">FECHAR</button>
                    </div>
                  )}

                  {modal === 'paciente' && (
                      <>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label><input name="name" defaultValue={editingPatient?.name} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label><input name="phone" defaultValue={editingPatient?.phone} required onChange={handlePhoneMask} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nascimento</label><input name="birthDate" defaultValue={editingPatient?.birthDate} type="date" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail</label><input name="email" defaultValue={editingPatient?.email} type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Patologia</label><input name="pathology" defaultValue={editingPatient?.pathology} placeholder="Ex: Diabetes" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                          <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Medicação</label><input name="medication" defaultValue={editingPatient?.medication} placeholder="Ex: Metformina" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                        </div>
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
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Paciente (Opcional)</label>
                          <select name="patientId" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecione um paciente...</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
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
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Modelos de Mensagem</label>
                          <select 
                            onChange={(e) => {
                              const selectedPatient = patients.find(p => p.id === (document.getElementsByName('patientId')[0] as HTMLSelectElement).value);
                              const name = selectedPatient ? selectedPatient.name : 'Paciente';
                              setMessageDraft(e.target.value.replace('{nome}', name));
                            }}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                          >
                            <option value="">Selecione um modelo...</option>
                            <option value="Seja muito bem-vindo(a) à TopClinic, {nome}! 🌟 É um prazer ter você conosco. Estamos aqui para cuidar da sua saúde com excelência.">Boas-Vindas</option>
                            <option value="Parabéns {nome}! 🎂 Desejamos muita saúde, paz e felicidades no seu dia especial. Um grande abraço da equipe TopClinic!">Aniversário</option>
                            <option value="Olá {nome}, como você está se sentindo após a consulta de ontem? Qualquer dúvida, estamos à disposição! 😊">Pós-Consulta</option>
                            <option value="Olá {nome}, confirmamos sua consulta para amanhã. Podemos contar com sua presença? 🏥">Lembrete de Consulta</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mensagem</label>
                          <textarea 
                            name="text" 
                            required 
                            rows={4} 
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                            placeholder="Escreva aqui..."
                          ></textarea>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data Programada</label><input name="date" type="date" required defaultValue={todayDate} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      </>
                    )}

                    {modal === 'automacao' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Regra</label>
                          <select name="type" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="lembrete_consulta">Lembrete Pré-Consulta</option>
                            <option value="pos_consulta">Acompanhamento Pós-Consulta</option>
                            <option value="aniversario">Aniversário</option>
                            <option value="boas_vindas">Boas-Vindas (Novo Paciente)</option>
                            <option value="patologia">Baseado em Patologia</option>
                            <option value="medicacao">Baseado em Medicação</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Condição (Se Patologia ou Medicação)</label>
                          <input name="conditionValue" placeholder="Ex: Diabetes, Metformina (deixe em branco para consultas)" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dias de Diferença</label>
                          <input name="daysOffset" type="number" required placeholder="Ex: -1 (1 dia antes), 7 (7 dias depois)" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                          <p className="text-[10px] text-slate-400 mt-1">Use números negativos para ANTES da consulta, positivos para DEPOIS. Para patologia/medicação, será a cada X dias.</p>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mensagem</label>
                          <textarea name="messageTemplate" required rows="4" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Olá {nome}, sua consulta é amanhã..."></textarea>
                          <p className="text-[10px] text-slate-400 mt-1">Você pode usar {'{nome}'} para o nome do paciente.</p>
                        </div>
                      </>
                    )}

                    <div className="pt-6 flex space-x-3">
                      <button type="button" onClick={() => { setModal(null); setEditingPatient(null); }} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">CANCELAR</button>
                      <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                        {editingPatient ? 'SALVAR ALTERAÇÕES' : 'SALVAR'}
                      </button>
                    </div>
                  </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      </ErrorBoundary>
    );
  }
