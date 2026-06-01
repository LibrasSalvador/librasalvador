import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import AdminForunsView from '../views/AdminForunsView.vue';

const routes = [
  { 
    path: '/', 
    redirect: '/aluno/login' 
  },
  { 
    path: '/aluno/login', 
    name: 'Login', 
    component: LoginView 
  },
  
  // ==========================================
  // ROTAS PÚBLICAS / SEGURANÇA
  // ==========================================
  {
    path: '/solicitar-senha',
    name: 'SolicitarSenha',
    component: () => import('../views/SolicitarSenhaView.vue')
  },
  {
    path: '/aluno/reset-password',
    name: 'ResetPasswordPrimeiroAcesso',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { requiresAuth: true }
  },

  // ==========================================
  // ROTAS DO ALUNO
  // ==========================================
  {
    path: '/aluno/dashboard',
    name: 'StudentDashboard',
    component: () => import('../views/aluno/StudentDashboard.vue'), 
    meta: { requiresAuth: true, role: 'aluno' }
  },
  {
    path: '/aluno/cursos',
    name: 'StudentCursos',
    component: () => import('../views/aluno/StudentCurso.vue'),
    meta: { requiresAuth: true, role: 'aluno' }
  },
  {
    path: '/aluno/loja',
    name: 'LojaCursos',
    component: () => import('../views/aluno/LojaCursos.vue'),
    meta: { requiresAuth: true, role: 'aluno' }
  },
  {
    path: '/aluno/materiais',
    name: 'StudentMateriais',
    component: () => import('../views/aluno/StudentMaterias.vue'),
    meta: { requiresAuth: true, role: 'aluno' }
  },
  {
    path: '/aluno/curso/:id',
    name: 'SalaAula',
    component: () => import('../views/aluno/SalaAulaView.vue'),
    meta: { requiresAuth: true, role: 'aluno' }
  },
  {
    path: '/aluno/forum',
    name: 'AlunoForum',
    component: () => import('../views/aluno/ForumView.vue'),
    meta: { requiresAuth: true, role: 'aluno' }
  },

  // ==========================================
  // ROTAS DO ADMINISTRADOR
  // ==========================================
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/profissionais',
    name: 'Profissionais',
    component: () => import('../views/ProfissionaisView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/professor/cursos',
    name: 'ProfessorCursos',
    component: () => import('../views/CursosView.vue'),
    meta: { requiresAuth: true, role: 'professor' }
  },
  {
    path: '/admin/cursos',
    name: 'AdminCursos',
    component: () => import('../views/CursosView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/forum',
    name: 'AdminForum',
    component: AdminForunsView,
    meta: { requiresAuth: true, role: ['admin', 'admin_restrito', 'professor'] }
  },
  {
    path: '/admin/usuarios',
    name: 'AdminUsuarios',
    component: () => import('../views/UsuariosView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/liberar-acesso',
    name: 'LiberarAcesso',
    component: () => import('../views/LiberarCursoView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/b2b',
    name: 'ClientesB2B',
    component: () => import('../views/ClientesB2BView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/servicos',
    name: 'Servicos',
    component: () => import('../views/ServicosView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/financeiro',
    name: 'AdminFinanceiro',
    component: () => import('../views/GerenciamentoFinanceiroView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/empresas',
    name: 'GerenciarEmpresas',
    component: () => import('../views/GerenciarEmpresasView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/calculadora',
    name: 'Calculadora',
    component: () => import('../views/CalculadoraView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/materiais',
    name: 'AdminMateriais',
    component: () => import('../views/MateriaisView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/estoque',
    name: 'EstoqueMateriais',
    component: () => import('../views/EstoqueView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  // NOVA ROTA DE LOGS DE AUDITORIA
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import('../views/AdminLogs.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  // NOVA ROTA DE SOLICITAÇÕES DE SENHA
  {
    path: '/admin/solicitacoes-senha',
    name: 'SolicitacoesSenha',
    component: () => import('../views/SolicitacoesSenhaView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// ==========================================
// MIDDLEWARE DE SEGURANÇA
// ==========================================
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // Verificar se a rota requer autenticação
  if (to.meta.requiresAuth && !token) {
    return next('/aluno/login');
  } 
  
  // Verificar permissões de role (admin/aluno/professor)
  if (to.meta.role) {
    // Se role for array, verificar se userRole está no array
    if (Array.isArray(to.meta.role)) {
      if (!to.meta.role.includes(userRole)) {
        return next('/aluno/login');
      }
    }
    else if (to.meta.role === 'admin') {
      // Admin: permitir 'admin' e 'admin_restrito'
      if (userRole !== 'admin' && userRole !== 'admin_restrito') {
        return next('/aluno/dashboard');
      }
      
      // Admin restrito: bloquear acesso a financeiro e empresas
      if ((to.path === '/admin/financeiro' || to.path === '/admin/empresas' || to.path === '/admin/logs') && userRole === 'admin_restrito') {
        return next('/admin/dashboard'); 
      }
    }
    // Professor: só pode acessar /professor/cursos
    else if (to.meta.role === 'professor') {
      if (userRole !== 'professor') {
        return next('/aluno/login');
      }
    }
    else if (to.meta.role === 'aluno' && userRole !== 'aluno') {
      return next('/admin/dashboard');
    }
  }

  next();
});

export default router;