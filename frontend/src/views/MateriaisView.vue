<template>
  <MainLayout pageTitle="Apostilas e Materiais" pageDescription="Gerencie os arquivos de apoio para as aulas de Libras.">
    <div class="layout-split">
      
      <div class="glass-card side-form">
        <h3 class="form-title">
          <UploadCloud :size="20" class="text-brand" /> Upload de Material
        </h3>
        
        <div v-if="mensagemFeedback" :class="['feedback-toast', tipoFeedback]">
          <CheckCircle2 v-if="tipoFeedback === 'success'" :size="20" />
          <AlertCircle v-else :size="20" />
          <p>{{ mensagemFeedback }}</p>
        </div>
        
        <form @submit.prevent="fazerUpload" class="modern-form">
          <div class="form-group">
            <label>Título da Apostila</label>
            <input v-model="form.titulo" placeholder="Ex: Alfabeto em Libras" required />
          </div>

          <div class="form-group">
            <label>Descrição Curta</label>
            <textarea v-model="form.descricao" placeholder="O que contém este arquivo?" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Selecione o Arquivo (PDF)</label>
            <input type="file" @change="selecionarArquivo" class="file-input" accept=".pdf" required />
          </div>

          <button type="submit" class="btn-primary" :disabled="enviando">
            <component :is="enviando ? Loader2 : FilePlus" :size="18" :class="{ 'spin': enviando }" />
            {{ enviando ? 'Enviando arquivo...' : 'Fazer Upload agora' }}
          </button>
        </form>
      </div>

      <div class="materiais-list">
        
        <div class="alert-warning glass-card">
          <AlertTriangle :size="24" class="alert-icon" />
          <p><strong>Aviso:</strong> Para o download das apostilas, você deverá liberar o pop-up do seu navegador.</p>
        </div>

        <div v-for="m in materiais" :key="m._id" class="glass-card material-card">
          <div class="file-info">
            <div class="file-icon-box">
              <FileText :size="28" />
            </div>
            <div class="file-texts">
              <h4>{{ m.titulo }}</h4>
              <p>{{ m.descricao }}</p>
            </div>
          </div>
          <div class="file-actions">
            <button @click="baixarArquivo(m)" class="btn-download">
              <Download :size="16" /> Baixar
            </button>
            <a :href="obterUrlArquivo(m.caminho)" target="_blank" rel="noopener noreferrer" class="btn-view">
              <Eye :size="16" /> Ver PDF
            </a>
            <button @click="confirmarRemocao(m)" class="btn-del-red">
              <Trash2 :size="18" />
            </button>
          </div>
        </div>
        
        <div v-if="materiais.length === 0" class="glass-card empty-card">
          <Inbox :size="48" class="opacity-20" />
          <p>Nenhuma apostila cadastrada ainda.</p>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalExclusao" class="modal-overlay" @click.self="cancelarRemocao">
      <div class="glass-card modal-content delete-modal">
        <div class="delete-icon-wrapper">
          <AlertTriangle :size="40" />
        </div>
        <h3>Excluir Material?</h3>
        <p>Tem certeza que deseja apagar permanentemente o material <strong>{{ materialParaExcluir?.titulo }}</strong>?</p>
        <div class="modal-actions-row">
          <button @click="cancelarRemocao" class="btn-cancel flex-1">Cancelar</button>
          <button @click="executarRemocao" class="btn-primary btn-danger flex-1">Sim, Excluir</button>
        </div>
      </div>
    </div>

  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  UploadCloud, FileText, FilePlus, Loader2, Eye, Trash2, Inbox, AlertTriangle, CheckCircle2, AlertCircle, Download
} from 'lucide-vue-next';
import MainLayout from '../components/MainLayout.vue';
import api from '../services/api';

const materiais = ref([]);
const form = ref({ titulo: '', descricao: '' });
const arquivoSelecionado = ref(null);
const enviando = ref(false);

// Estado para o Modal de Exclusão
const mostrarModalExclusao = ref(false);
const materialParaExcluir = ref(null);

const mensagemFeedback = ref('');
const tipoFeedback = ref('');
const mostrarMensagem = (msg, tipo = 'success') => {
  mensagemFeedback.value = msg;
  tipoFeedback.value = tipo;
  setTimeout(() => { mensagemFeedback.value = ''; }, 4000);
};

const buscarMateriais = async () => {
  try {
    const res = await api.get('/materiais');
    materiais.value = res.data;
  } catch (err) {
    console.error("Erro ao carregar materiais:", err);
  }
};

const selecionarArquivo = (e) => {
  arquivoSelecionado.value = e.target.files[0];
};

const fazerUpload = async () => {
  if (!arquivoSelecionado.value) return;
  enviando.value = true;
  const formData = new FormData();
  formData.append('titulo', form.value.titulo);
  formData.append('descricao', form.value.descricao);
  formData.append('arquivo', arquivoSelecionado.value);

  try {
    await api.post('/materiais', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    form.value = { titulo: '', descricao: '' };
    arquivoSelecionado.value = null;
    document.querySelector('.file-input').value = '';
    buscarMateriais();
    mostrarMensagem("Upload concluído com sucesso!");
  } catch (err) {
    mostrarMensagem("Erro ao enviar o arquivo.", "error");
  } finally {
    enviando.value = false;
  }
};

// ==========================================
// LÓGICA DO NOVO MODAL DE EXCLUSÃO
// ==========================================
const confirmarRemocao = (material) => {
  materialParaExcluir.value = material;
  mostrarModalExclusao.value = true;
};

const cancelarRemocao = () => {
  mostrarModalExclusao.value = false;
  materialParaExcluir.value = null;
};

const executarRemocao = async () => {
  if (!materialParaExcluir.value) return;
  try {
    await api.delete(`/materiais/${materialParaExcluir.value._id}`);
    buscarMateriais();
    mostrarMensagem("Material removido.");
  } catch (err) {
    mostrarMensagem("Erro ao remover.", "error");
  } finally {
    cancelarRemocao();
  }
};
// ==========================================

const obterUrlArquivo = (caminho) => {
  if (!caminho) return '#';
  const caminhoLimpo = caminho.replace(/\\/g, '/');
  const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'https://librasalvador.onrender.com';
  return `${baseUrl}/${caminhoLimpo}`;
};

const baixarArquivo = (material) => {
  const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'https://librasalvador.onrender.com';
  window.open(`${baseUrl}/api/materiais/download/${material._id}`, '_blank');
};

onMounted(buscarMateriais);
</script>

<style scoped>
.layout-split { display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start; }
.glass-card { background: white; padding: 30px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 74, 173, 0.05); }
.text-brand { color: #004aad; }

.feedback-toast { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; font-weight: 700; font-size: 0.9rem; animation: slideDown 0.3s ease-out; }
.feedback-toast.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.feedback-toast.error { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.form-title { margin-bottom: 25px; color: #1e293b; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.modern-form label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin: 15px 0 5px; text-transform: uppercase; }
.modern-form input, .modern-form textarea { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; font-size: 0.95rem; color: #1e293b; transition: 0.2s; box-sizing: border-box; font-family: inherit; }
.modern-form input:focus { outline: none; border-color: #004aad; box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.1); background: white; }

.file-input { padding: 10px !important; background: white !important; cursor: pointer; }

.btn-primary { width: 100%; background: #004aad; color: white; border: none; padding: 16px; border-radius: 14px; margin-top: 25px; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
.btn-primary:hover:not(:disabled) { background: #003a8c; transform: translateY(-2px); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.materiais-list { display: flex; flex-direction: column; gap: 20px; }

.alert-warning { display: flex; align-items: center; gap: 15px; background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px 24px; border-radius: 20px; margin-bottom: 5px; }
.alert-warning .alert-icon { color: #f59e0b; flex-shrink: 0; }
.alert-warning p { margin: 0; color: #92400e; font-size: 0.95rem; line-height: 1.5; font-weight: 500; }
.alert-warning strong { font-weight: 800; }

.material-card { display: flex; justify-content: space-between; align-items: center; transition: 0.2s; padding: 20px 25px; border: 1px solid #e2e8f0; }
.material-card:hover { border-color: #004aad; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0, 74, 173, 0.1); }

.file-icon-box { background: #eff6ff; color: #004aad; padding: 15px; border-radius: 18px; }
.file-texts h4 { color: #1e293b; margin-bottom: 4px; font-size: 1.1rem; font-weight: 700; }
.file-texts p { color: #64748b; font-size: 0.85rem; font-weight: 500; }

.btn-download { background: #004aad; color: white; font-weight: 800; font-size: 0.85rem; padding: 10px 18px; border-radius: 12px; display: flex; align-items: center; gap: 8px; border: none; cursor: pointer; transition: 0.2s; text-decoration: none; }
.btn-download:hover { background: #003380; }
.btn-view { text-decoration: none; color: #004aad; font-weight: 800; font-size: 0.85rem; background: #eff6ff; padding: 10px 18px; border-radius: 12px; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
.btn-view:hover { background: #dbeafe; }

.btn-del-red { border: none; background: transparent; color: #94a3b8; padding: 10px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
.btn-del-red:hover { color: #ef4444; background: #fef2f2; }

.empty-card { text-align: center; color: #94a3b8; font-weight: 600; padding: 50px; display: flex; flex-direction: column; align-items: center; gap: 15px; }

/* MODAL DE EXCLUSÃO */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); }
.modal-content { max-width: 400px; width: 90%; padding: 30px; }
.delete-modal { text-align: center; }
.delete-icon-wrapper { display: flex; justify-content: center; color: #ef4444; margin-bottom: 15px; }
.delete-modal h3 { font-size: 1.4rem; color: #1e293b; font-weight: 800; margin-bottom: 10px; }
.delete-modal p { color: #64748b; font-size: 0.95rem; margin-bottom: 25px; line-height: 1.5; }
.modal-actions-row { display: flex; gap: 15px; }
.flex-1 { flex: 1; }
.btn-cancel { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; text-align: center; }
.btn-cancel:hover { background: #e2e8f0; }
.btn-danger { background-color: #ef4444 !important; border: none; margin-top: 0; }
.btn-danger:hover { background-color: #dc2626 !important; }

@media (max-width: 992px) {
  .layout-split { grid-template-columns: 1fr; }
  .glass-card { padding: 20px; }
}
</style>