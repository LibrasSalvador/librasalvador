<template>
  <StudentLayout pageTitle="Meu Painel" pageDescription="Acompanhe o seu progresso e acesse os seus conteúdos de Libras.">
    
    <div class="welcome-banner">
      <div class="banner-text">
        <h2>Olá, Aluno!</h2>
        <p>Continue a sua jornada de aprendizado. Os seus materiais e salas de aula já estão disponíveis abaixo.</p>
      </div>
      <div class="banner-icon-wrapper">
        <GraduationCap :size="120" />
      </div>
    </div>

    <div class="stats-grid">
      
      <div class="glass-card clickable" @click="router.push('/aluno/cursos')">
        <div class="card-header">
          <span class="tag">ESTUDOS</span>
          <h3>Cursos Matriculados</h3>
        </div>
        <div class="card-value">{{ totalCursos }}</div>
        <div class="card-footer">
          <span>Acessar salas de aula</span>
          <ArrowRight :size="18" class="arrow-icon" />
        </div>
      </div>

      <div class="glass-card clickable" @click="router.push('/aluno/materiais')">
        <div class="card-header">
          <span class="tag success">APOIO DIGITAL</span>
          <h3>Apostilas Disponíveis</h3>
        </div>
        <div class="card-value">{{ totalMateriais }}</div>
        <div class="card-footer">
          <span>Fazer download de PDFs</span>
          <ArrowRight :size="18" class="arrow-icon" />
        </div>
      </div>

      <div class="glass-card clickable">
        <div class="card-header">
          <span class="tag gold">CONQUISTAS</span>
          <h3>Certificados Emitidos</h3>
        </div>
        <div class="card-value">{{ certificados.length }}</div>
        <div class="card-footer">
          <span>Ver as minhas conquistas</span>
          <ArrowRight :size="18" class="arrow-icon" />
        </div>
      </div>

    </div>

    <!-- CERTIFICADOS DO ALUNO -->
    <div v-if="certificados.length > 0" class="mt-4">
      <div class="glass-card cert-card">
        <div class="cert-header">
          <Award :size="28" class="text-brand" />
          <h3>Meus Certificados ({{ certificados.length }})</h3>
        </div>
        
        <div class="certificados-grid">
          <div v-for="(cert, idx) in certificados" :key="idx" class="cert-item-aluno">
            <div class="cert-info">
              <Award :size="20" class="text-green-600" />
              <div>
                <strong>{{ cert.nome }}</strong>
                <span class="cert-data">Recebido em: {{ formatarData(cert.dataUpload) }}</span>
              </div>
            </div>
            <a :href="getCertificadoUrl(cert.arquivo)" download class="btn-cert">
              <Download :size="16" /> Baixar
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- SUPORTE / AJUDA -->
    <div class="help-section mt-4">
      <div class="glass-card">
        <div class="help-header" @click="mostrarAjuda = !mostrarAjuda">
          <h3 class="section-title">
            <HelpCircle :size="22" class="text-brand" /> Central de Suporte
          </h3>
          <button class="btn-toggle-help">
            <ChevronDown :size="20" :class="{ 'rotated': mostrarAjuda }" />
          </button>
        </div>
        <p class="section-desc">Aprenda a utilizar cada funcionalidade da sua área de estudos.</p>

        <div v-if="mostrarAjuda" class="help-topics">
          <div v-for="(topic, idx) in helpTopicsAluno" :key="idx" class="help-topic" @click="topic.open = !topic.open">
            <div class="help-topic-header">
              <component :is="topic.icon" :size="20" class="help-topic-icon" />
              <span class="help-topic-title">{{ topic.title }}</span>
              <ChevronDown :size="16" :class="['chevron', { rotated: topic.open }]" />
            </div>
            <div v-if="topic.open" class="help-topic-body">
              <p>{{ topic.description }}</p>
              <ul>
                <li v-for="(step, i) in topic.steps" :key="i">{{ step }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

  </StudentLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { GraduationCap, ArrowRight, HelpCircle, ChevronDown, LayoutDashboard, BookOpen, ShoppingBag, FileText, MessageSquare, Award, Download } from 'lucide-vue-next';
import StudentLayout from '../../components/StudentLayout.vue';
import api from '../../services/api';

const router = useRouter();
const totalCursos = ref(0);
const totalMateriais = ref(0);
const mostrarAjuda = ref(false);
const certificados = ref([]);
const usuarioId = localStorage.getItem('userId');

const getCertificadoUrl = (arquivo) => {
  // Se já for URL completa (Cloudinary/S3), retorna direto
  if (arquivo && (arquivo.startsWith('http') || arquivo.includes('cloudinary.com') || arquivo.includes('amazonaws.com'))) {
    return arquivo;
  }
  // Caso contrário, constrói a URL local
  const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'https://librasalvador.onrender.com';
  return `${baseUrl}/uploads/certificados/${arquivo}`;
};

const formatarData = (data) => {
  if (!data) return '';
  return new Date(data).toLocaleDateString('pt-BR');
};

onMounted(async () => {
  try {
    const userRes = await api.get(`/usuarios/${usuarioId}`);
    const user = userRes.data;
    // Handle both old (certificado) and new (certificados) fields
    if (user.certificados && user.certificados.length > 0) {
      certificados.value = user.certificados;
    } else if (user.certificado) {
      // Migrate old single certificate to new array format
      certificados.value = [{ nome: 'Certificado', arquivo: user.certificado, dataUpload: new Date() }];
    }
  } catch (err) {
    console.log('Erro ao carregar certificados');
  }
});

const helpTopicsAluno = reactive([
  {
    icon: LayoutDashboard,
    title: 'Meu Painel',
    description: 'Tela inicial com visão geral do seu progresso.',
    steps: [
      'Veja quantos cursos você está matriculado.',
      'Confira quantas apostilas estão disponíveis para download.',
      'Clique nos cards para acessar as páginas rapidamente.'
    ],
    open: false
  },
  {
    icon: BookOpen,
    title: 'Meus Cursos',
    description: 'Acesse as salas de aula dos cursos em que você está matriculado.',
    steps: [
      'Clique em um curso para entrar na sala de aula.',
      'Assista vídeos, leia materiais e marque aulas como concluídas.',
      'Use o fórum do curso para tirar dúvidas com o professor.'
    ],
    open: false
  },
  {
    icon: ShoppingBag,
    title: 'Catálogo de Cursos',
    description: 'Explore todos os cursos disponíveis e matricule-se.',
    steps: [
      'Navegue pelos cursos disponíveis.',
      'Clique em "Matricular" para se inscrever em um novo curso.',
      'Após a matrícula, o curso aparecerá em "Meus Cursos".'
    ],
    open: false
  },
  {
    icon: FileText,
    title: 'Materiais e PDFs',
    description: 'Faça download de apostilas e materiais de apoio.',
    steps: [
      'Veja a lista de materiais disponíveis.',
      'Clique no botão de download para baixar o PDF.',
      'Use os materiais para complementar seus estudos.'
    ],
    open: false
  },
  {
    icon: MessageSquare,
    title: 'Fórum',
    description: 'Espaço de comunicação dentro de cada curso.',
    steps: [
      'Acesse o fórum dentro da sala de aula do curso.',
      'Envie mensagens de texto ou anexe arquivos.',
      'Interaja com professores e colegas de turma.'
    ],
    open: false
  }
]);

const carregarDados = async () => {
  try {
    const resCursos = await api.get('/cursos');
    totalCursos.value = resCursos.data.length;
    
    const resMateriais = await api.get('/materiais');
    totalMateriais.value = resMateriais.data.length;
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard do aluno:", error);
  }
};

onMounted(carregarDados);
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, #004aad, #1e40af);
  border-radius: 24px;
  padding: 40px 50px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  box-shadow: 0 10px 25px rgba(0, 74, 173, 0.2);
  position: relative;
  overflow: hidden;
}

.banner-text h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 10px; }
.banner-text p { font-size: 1.05rem; opacity: 0.9; max-width: 500px; line-height: 1.5; }

.banner-icon-wrapper {
  opacity: 0.15;
  transform: rotate(15deg);
  position: absolute;
  right: 20px;
  top: 10px;
  user-select: none;
}

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }

.glass-card {
  background: white; 
  padding: 35px 30px; 
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease; 
  position: relative;
  display: flex;
  flex-direction: column;
}

.glass-card.clickable:hover { 
  transform: translateY(-6px); 
  box-shadow: 0 20px 40px rgba(0, 74, 173, 0.12);
  border-color: #bfdbfe; 
  cursor: pointer; 
}

.tag { font-size: 0.75rem; font-weight: 800; color: #64748b; letter-spacing: 1px; margin-bottom: 12px; display: inline-block; background: #f1f5f9; padding: 4px 10px; border-radius: 8px; }
.tag.success { color: #059669; background: #ecfdf5; }
.tag.gold { color: #d97706; background: #fffbeb; }

.card-header h3 { font-size: 1.1rem; color: #1e293b; font-weight: 700; margin: 0; }
.card-value { font-size: 3.5rem; font-weight: 900; color: #0f172a; margin: 15px 0; letter-spacing: -2px; }

.card-footer { 
  font-size: 0.9rem; 
  color: #004aad; 
  font-weight: 700; 
  border-top: 1px solid #f1f5f9; 
  padding-top: 20px; 
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.glass-card.clickable:hover .arrow-icon {
  transform: translateX(6px);
}

@media (max-width: 768px) {
  .welcome-banner { flex-direction: column; text-align: center; padding: 30px 20px; }
  .banner-icon-wrapper { display: none; }
}

/* ESTILOS DA CENTRAL DE SUPORTE */
.help-section { margin-top: 30px; }
.section-title { font-size: 1.2rem; color: #1e293b; font-weight: 800; display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.text-brand { color: #004aad; }
.section-desc { font-size: 0.9rem; color: #64748b; margin-bottom: 10px; }
.help-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.btn-toggle-help { background: transparent; border: none; cursor: pointer; color: #64748b; padding: 8px; border-radius: 8px; transition: 0.2s; }
.btn-toggle-help:hover { background: #f1f5f9; }
.chevron, .btn-toggle-help svg { transition: transform 0.3s ease; }
.rotated { transform: rotate(180deg); }

.help-topics { margin-top: 15px; display: flex; flex-direction: column; gap: 8px; }
.help-topic { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 0; overflow: hidden; cursor: pointer; transition: 0.2s; }
.help-topic:hover { border-color: #bfdbfe; }
.help-topic-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; }
.help-topic-icon { color: #004aad; flex-shrink: 0; }
.help-topic-title { flex: 1; font-weight: 700; font-size: 0.95rem; color: #1e293b; }
.help-topic-body { padding: 0 20px 16px; border-top: 1px solid #e2e8f0; margin-top: 0; }
.help-topic-body p { font-size: 0.9rem; color: #475569; margin: 12px 0 8px; line-height: 1.5; }
.help-topic-body ul { margin: 0; padding-left: 18px; }
.help-topic-body li { font-size: 0.85rem; color: #64748b; margin-bottom: 4px; line-height: 1.5; }
/* =========================================
   RESPONSIVIDADE MOBILE PARA AS TELAS
   ========================================= */
@media (max-width: 992px) {
  /* Transforma a grelha de 2 colunas numa grelha de 1 coluna */
  .layout-split { 
    grid-template-columns: 1fr; 
    gap: 20px; 
  }
  
  /* Empilha os campos de formulário que estavam lado a lado */
  .form-row { 
    flex-direction: column; 
    gap: 15px; 
  }
  
  /* Ajusta o padding dos cartões para ecrãs pequenos */
  .glass-card { 
    padding: 20px; 
  }

  /* Ajusta cabeçalhos internos */
  .header-row, .servico-header, .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  /* Faz com que os botões de ação ocupem a largura toda se necessário */
  .item-actions-wrapper, .item-actions {
    align-items: flex-start;
    margin-top: 15px;
    width: 100%;
  }
}

/* Certificado */
.cert-card { border-left: 4px solid #22c55e; }
.cert-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
.cert-header h3 { margin: 0; color: #1e293b; font-size: 1.2rem; }
.cert-desc { color: #64748b; margin-bottom: 15px; }
.btn-cert { display: inline-flex; align-items: center; gap: 8px; background: #22c55e; color: white; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.2s; font-size: 0.9rem; }
.btn-cert:hover { background: #16a34a; transform: translateY(-2px); }

.certificados-grid { display: flex; flex-direction: column; gap: 12px; }
.cert-item-aluno { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
.cert-item-aluno .cert-info { display: flex; align-items: center; gap: 12px; }
.cert-item-aluno .cert-info > div { display: flex; flex-direction: column; }
.cert-item-aluno .cert-data { font-size: 0.8rem; color: #64748b; }

/* Admin: Lista certificados */
.certificados-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
.cert-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac; }
.cert-info { display: flex; align-items: center; gap: 8px; }
.cert-nome { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
.cert-data { font-size: 0.75rem; color: #64748b; margin-left: 8px; }
</style>
