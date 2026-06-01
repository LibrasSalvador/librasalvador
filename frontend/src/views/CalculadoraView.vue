<template>
  <MainLayout pageTitle="Calculadora de Orçamentos" pageDescription="Inteligência Financeira: Gere orçamentos protegendo a sua margem de lucro e impostos.">
    <div class="layout-split">
      
      <div class="glass-card side-form">
        <h3 class="form-title">
          <Calculator :size="20" class="text-blue-700" /> Parâmetros do Serviço
        </h3>
        
        <form @submit.prevent class="modern-form">
          <div class="form-group">
            <label>Nome do Cliente / Evento</label>
            <input v-model="form.nomeCliente" type="text" placeholder="Ex: Empresa ABC - Conferência" />
          </div>

          <div class="form-row">
            <div>
              <label>CNPJ do Cliente</label>
              <input v-model="form.cnpjCliente" type="text" placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label>Responsável Contato</label>
              <input v-model="form.responsavelContato" type="text" placeholder="Nome do responsável" />
            </div>
          </div>

          <div class="form-group">
            <label>Setor</label>
            <input v-model="form.setor" type="text" placeholder="Ex: Recursos Humanos" />
          </div>

          <div class="form-row">
            <div>
              <label>Duração (Horas)</label>
              <input v-model.number="form.tempoServico" type="number" min="1" required />
            </div>
            <div>
              <label>Valor da Hora (R$)</label>
              <input v-model.number="form.valorHora" type="number" step="0.01" required />
            </div>
          </div>

          <div class="form-group">
            <label>Custos Extras / Logística (R$)</label>
            <input v-model.number="form.logistica" type="number" step="0.01" placeholder="Ex: Transporte, Alimentação" />
          </div>

          <div class="form-row">
            <div>
              <label>Impostos (%)</label>
              <input v-model.number="form.imposto" type="number" step="0.1" placeholder="Ex: 6.0" />
            </div>
          </div>

          <div class="form-group">
            <label>Observações</label>
            <textarea v-model="form.observacoes" rows="2" placeholder="Informações adicionais..."></textarea>
          </div>

          <div class="form-group">
            <label>Prazo de Entrega/Execução</label>
            <input v-model="form.prazoEntrega" type="text" placeholder="Ex: 15 dias após aprovação" />
          </div>

          <div class="form-group">
            <label>Prazo de Pagamento</label>
            <input v-model="form.prazoPagamento" type="text" placeholder="Ex: À combinar" />
          </div>

          <div class="form-group">
            <label>Validade da Proposta (dias)</label>
            <input v-model="form.validadeProposta" type="number" min="1" placeholder="Ex: 10" />
          </div>

          <div class="form-group">
            <label>Política de Cancelamento</label>
            <input v-model="form.politicaCancelamento" type="text" placeholder="Ex: Cancelamento com 48h de antecedência" />
          </div>

          <div class="form-group">
            <label>Requisitos</label>
            <textarea v-model="form.requisitos" rows="2" placeholder="O que precisa do cliente (documentos, acesso, material)..."></textarea>
          </div>
        </form>
      </div>

      <div class="glass-card result-box">
        <h3 class="form-title">
          <FileText :size="20" class="text-blue-700" /> Resumo do Orçamento
        </h3>

        <div class="price-badge">
          <span class="badge-label">Valor Final Sugerido</span>
          <h1>R$ {{ valorFinal.toFixed(2) }}</h1>
        </div>

        <div class="details-list">
          <div class="detail-item">
            <div class="flex items-center gap-2">
              <PieChart :size="16" class="text-slate-400" />
              <span>Subtotal Bruto</span>
            </div>
            <strong>R$ {{ subtotalBruto.toFixed(2) }}</strong>
          </div>
          <div class="detail-item">
            <div class="flex items-center gap-2">
              <ShieldAlert :size="16" class="text-red-400" />
              <span>Encargos/Impostos ({{ form.imposto || 0 }}%)</span>
            </div>
            <strong class="text-negative">R$ {{ valorImposto.toFixed(2) }}</strong>
          </div>
          <div class="detail-item">
            <div class="flex items-center gap-2">
              <Clock :size="16" class="text-slate-400" />
              <span>{{ form.tempoServico }}h × R$ {{ form.valorHora }}/h</span>
            </div>
            <strong>R$ {{ (form.tempoServico * form.valorHora).toFixed(2) }}</strong>
          </div>
        </div>

        <div class="btn-group">
          <button @click="copyToClipboard" class="btn-secondary-full">
            <ClipboardCopy :size="18" /> Copiar Orçamento
          </button>
          <button @click="gerarPDF" class="btn-primary-full">
            <Download :size="18" /> Exportar PDF
          </button>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  Calculator, 
  FileText, 
  PieChart, 
  ShieldAlert, 
  TrendingUp, 
  ClipboardCopy,
  Clock,
  Download
} from 'lucide-vue-next';
import MainLayout from '../components/MainLayout.vue';
import jsPDF from 'jspdf';
import logoImg from '../assets/logo.png';

const form = ref({
  nomeCliente: '',
  cnpjCliente: '',
  responsavelContato: '',
  setor: '',
  tempoServico: 2,
  valorHora: 150,
  logistica: 50,
  imposto: 6,
  observacoes: '',
  prazoEntrega: '',
  prazoPagamento: '',
  validadeProposta: 10,
  politicaCancelamento: '',
  requisitos: ''
});

const subtotalBruto = computed(() => {
  return (form.value.tempoServico * form.value.valorHora) + (form.value.logistica || 0);
});

const valorFinal = computed(() => {
  // Apenas soma os impostos ao subtotal
  const imposto = subtotalBruto.value * ((form.value.imposto || 0) / 100);
  return subtotalBruto.value + imposto;
});

const valorImposto = computed(() => subtotalBruto.value * ((form.value.imposto || 0) / 100));

const copyToClipboard = () => {
  const msg = `Orçamento - Serviços de Acessibilidade em Libras
--------------------------------------
${form.value.nomeCliente ? 'Cliente: ' + form.value.nomeCliente + '\n' : ''}Duração Estimada: ${form.value.tempoServico} horas
Valor da Hora: R$ ${form.value.valorHora}
Taxa de Logística: R$ ${(form.value.logistica || 0).toFixed(2)}
Encargos/Impostos (${form.value.imposto || 0}%): R$ ${valorImposto.value.toFixed(2)}
--------------------------------------
Valor Final Sugerido: R$ ${valorFinal.value.toFixed(2)}
--------------------------------------
${form.value.observacoes ? 'Obs: ' + form.value.observacoes + '\n' : ''}*Valores sujeitos a alteração.`;
  navigator.clipboard.writeText(msg);
  alert("Orçamento copiado para a área de transferência!");
};

const gerarPDF = () => {
  try {
    const doc = new jsPDF();
    
    // ==========================
    // DADOS DA EMPRESA (Fixos)
    // ==========================
    const dadosEmpresa = {
      nome: 'LIBRAS SALVADOR LTDA',
      cnpj: '34.989.801/0001-43',
      endereco: 'Rua Alceu Amoroso Lima, 786, Edf. Tancredo Neves Trade Center, Sala 312, Caminho das Árvores, Salvador/BA',
      cep: '41.820-770',
      contato: '(71) 98836-1371',
      email: 'contato@librasalvador.com'
    };
    
    let y = 15;
    
    // ==========================
    // CABEÇALHO COM LOGO
    // ==========================
    // Fundo azul do cabeçalho
    doc.setFillColor(0, 74, 173);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Adicionar logo
    try {
      doc.addImage(logoImg, 'PNG', 15, 5, 35, 25);
      doc.text('ORÇAMENTO', 55, 18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(245, 245, 245);
      doc.text('Serviços de Tradução e Interpretação em Libras', 55, 26);
    } catch (e) {
      // Se a logo não carregar, mostra texto
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ORÇAMENTO', 14, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(245, 245, 245);
      doc.text('Serviços de Tradução e Interpretação em Libras', 14, 26);
      doc.text('LIBRAS SALVADOR', 170, 18, { align: 'center' });
      doc.text('CNPJ: 34.989.801/0001-43', 170, 24, { align: 'center' });
    }
    
    y = 42;
    
    // ==========================
    // 1. IDENTIFICAÇÃO
    // ==========================
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. IDENTIFICAÇÃO', 16, y);
    y += 10;
    
    // Dados do Prestador
    doc.setTextColor(0, 74, 173);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PRESTADOR (Contratado):', 14, y);
    y += 7;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(dadosEmpresa.nome, 14, y);
    y += 5;
    doc.text('CNPJ: ' + dadosEmpresa.cnpj, 14, y);
    y += 5;
    doc.text(dadosEmpresa.endereco, 14, y);
    y += 5;
    doc.text('CEP: ' + dadosEmpresa.cep, 14, y);
    y += 5;
    doc.text('Contato: ' + dadosEmpresa.contato + ' | E-mail: ' + dadosEmpresa.email, 14, y);
    y += 10;
    
    // Dados do Cliente
    doc.setTextColor(0, 74, 173);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE:', 14, y);
    y += 7;
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    var clienteNome = form.value.nomeCliente ? form.value.nomeCliente : '(não informado)';
    doc.text('Cliente: ' + clienteNome, 14, y);
    y += 5;
    if (form.value.cnpjCliente) {
      doc.text('CNPJ: ' + form.value.cnpjCliente, 14, y);
      y += 5;
    }
    if (form.value.responsavelContato) {
      doc.text('Responsável pelo contato: ' + form.value.responsavelContato, 14, y);
      y += 5;
    }
    if (form.value.setor) {
      doc.text('Setor: ' + form.value.setor, 14, y);
      y += 5;
    }
    y += 5;
    
    // ==========================
    // 2. DESCRIÇÃO DETALHADA DOS SERVIÇOS
    // ==========================
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('2. DESCRIÇÃO DETALHADA DOS SERVIÇOS', 16, y);
    y += 10;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    var descServico = form.value.observacoes ? form.value.observacoes : 'Serviço de interpretação em Libras para eventos, palestras, seminários e workshops.';
    var descLines = doc.splitTextToSize(descServico, 180);
    for (var i = 0; i < descLines.length; i++) {
      doc.text(descLines[i], 14, y);
      y += 5;
    }
    y += 3;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('O preço da hora/interpretação leva em conta a lista de referência da FEBRAPILS para esse tipo de atividade.', 14, y);
    y += 5;
    doc.text('Para atividades com até uma hora de duração, será necessária a atuação de um intérprete de Libras.', 14, y);
    y += 10;
    
    // ==========================
    // 3. DETALHAMENTO
    // ==========================
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. DETALHAMENTO', 16, y);
    y += 10;
    
    var subtotalHoras = form.value.tempoServico * form.value.valorHora;
    var logistica = form.value.logistica ? form.value.logistica : 0;
    var subtotalBruto = subtotalHoras + logistica;
    var taxaImposto = (form.value.imposto ? form.value.imposto : 0) / 100;
    var valorImposto = subtotalBruto * taxaImposto;
    
    var items = [
      ['Duração do Orçamento', form.value.tempoServico + ' hora(s)'],
      ['Valor da Hora', 'R$ ' + Number(form.value.valorHora).toFixed(2)],
      ['Subtotal (Horas × Valor)', 'R$ ' + subtotalHoras.toFixed(2)],
      ['Custos de Logística', 'R$ ' + logistica.toFixed(2)],
      ['Subtotal Bruto', 'R$ ' + subtotalBruto.toFixed(2)]
    ];
    
    doc.setFontSize(10);
    for (var j = 0; j < items.length; j++) {
      doc.setFont('helvetica', 'normal');
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 160, 7, 'F');
      doc.setTextColor(60, 60, 60);
      doc.text(items[j][0], 16, y);
      doc.text(items[j][1], 170, y, { align: 'right' });
      y += 8;
    }
    
    y += 3;
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 4, 160, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('VALOR TOTAL', 16, y);
    doc.text('R$ ' + valorFinal.value.toFixed(2), 170, y, { align: 'right' });
    y += 12;
    
    // ==========================
    // IMPOSTO
    // ==========================
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(0, 74, 173);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ENCARGOS', 16, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Encargos/Impostos (' + (form.value.imposto ? form.value.imposto : 0) + '%)', 16, y);
    doc.text('R$ ' + valorImposto.toFixed(2), 170, y, { align: 'right' });
    y += 7;
    
    y += 8;
    
    // ==========================
    // 4. CONDIÇÕES FINANCEIRAS
    // ==========================
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. CONDIÇÕES FINANCEIRAS', 16, y);
    y += 10;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (form.value.prazoPagamento) {
      doc.text('Prazo de pagamento: ' + form.value.prazoPagamento, 14, y);
    } else {
      doc.text('Prazo de pagamento: _________________________________', 14, y);
    }
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS PARA PAGAMENTO:', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Libras Salvador LTDA', 14, y);
    y += 6;
    doc.text('Pix: 71 98836-1371 (Celular)', 14, y);
    y += 6;
    doc.text('Transferência bancária:', 14, y);
    y += 6;
    doc.text('Banco Itaú (341) Ag: 1395 | CC: 99765-1', 14, y);
    y += 10;
    
    // ==========================
    // 5. PRAZOS E VALIDADE
    // ==========================
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('5. PRAZOS E VALIDADE', 16, y);
    y += 10;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    var prazoTexto = form.value.prazoEntrega ? form.value.prazoEntrega : '________________________________';
    doc.text('Prazo de Entrega/Execucao: ' + prazoTexto, 14, y);
    y += 6;
    var validade = form.value.validadeProposta;
    if (validade && validade > 0) {
      doc.text('Validade da Proposta: Este orcamento e valido por ' + validade + ' dias.', 14, y);
    } else {
      doc.text('Validade da Proposta: _________________________________', 14, y);
    }
    y += 10;
    
    // ==========================
    // FORCAR NOVA PAGINA
    // ==========================
    doc.addPage();
    y = 20;
    
    // ==========================
    // 6. TERMOS E CONDICOES
    // ==========================
    doc.setFillColor(0, 74, 173);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('6. CONDICOES', 16, y);
    y += 10;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    var condicoes = [
      '- Nossos interpretes estarao disponiveis para atuar no evento a partir do horario solicitado pelo cliente. E importante ressaltar que, caso o evento atrase, as horas de disponibilidade dos interpretes ainda serao cobradas integralmente, de acordo com a programacao original acordada.',
      '- Caso haja um atraso maior de 10 minutos a cada hora trabalhada sera cobrada uma hora excedente no valor final do servico.',
      '- Proposta ja inclui os valores referentes aos tributos sobre emissao da nota (19%).'
    ];
    
    for (var c = 0; c < condicoes.length; c++) {
      var texto = condicoes[c];
      // Quebrar texto longo em linhas
      var linhas = doc.splitTextToSize(texto, 178);
      for (var l = 0; l < linhas.length; l++) {
        doc.text(linhas[l], 14, y);
        y += 5;
      }
      y += 3;
    }
    
    y += 5;
    
    // Politica de Cancelamento (opcional)
    if (form.value.politicaCancelamento) {
      doc.setFont('helvetica', 'bold');
      doc.text('Politica de Cancelamento:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      var cancelLinhas = doc.splitTextToSize(form.value.politicaCancelamento, 178);
      for (var cl = 0; cl < cancelLinhas.length; cl++) {
        doc.text(cancelLinhas[cl], 14, y);
        y += 5;
      }
      y += 8;
    } else {
      y += 5;
    }
    
    // ==========================
    // DIFERENCIAL
    // ==========================
    doc.setFillColor(240, 253, 244);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('POR QUE CONTRATAR A LIBRAS SALVADOR?', 16, y);
    y += 8;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    var diferenciais = [
      'A Libras Salvador e uma empresa especializada em traducao e',
      'interpretacao em Libras e foi criada pela uniao de duas paixoes:',
      'a Libras e a historia da cidade de Salvador!',
      'Temos o compromisso com a qualidade e etica no atendimento',
      'ao público Surdo, por meio da acessibilidade linguística.',
      'Possuimos uma equipe de interpretes qualificados para',
      'atendimento em varios estados do Brasil!',
      'Somos mais de 300 avaliacoes 5 estrelas no Google.',
      'Tambem emitimos a Nota Fiscal como Traducao e',
      'Interpretação, diferentemente do que ocorre no mercado.'
    ];
    for (var d = 0; d < diferenciais.length; d++) {
      doc.text('• ' + diferenciais[d], 16, y);
      y += 5;
    }
    
    y += 3;
    doc.setFont('helvetica', 'italic');
    doc.text('Ficamos no aguardo de retorno da proposta e agradecemos', 14, y);
    y += 5;
    doc.text('pela oportunidade de apresenta-la!', 14, y);
    
    // ==========================
    // QUEBRA DE PÁGINA SE NECESSÁRIO
    // ==========================
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // ==========================
    // RODAPÉ
    // ==========================
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Gerado em: ' + new Date().toLocaleDateString('pt-BR'), 14, 285);
    doc.text('Libras Salvador - www.librasalvador.com', 196, 285, { align: 'right' });
    
    // ==========================
    // SALVAR
    // ==========================
    var nomeArquivo = form.value.nomeCliente ? 'Orcamento_' + form.value.nomeCliente.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf' : 'Orcamento_LibrasSalvador_' + new Date().toISOString().split('T')[0] + '.pdf';
    doc.save(nomeArquivo);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};
</script>

<style scoped>
.layout-split { display: grid; grid-template-columns: 400px 1fr; gap: 30px; align-items: start; }
.glass-card { background: white; padding: 30px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(30, 64, 175, 0.05); }
.form-title { margin-bottom: 25px; color: #1e293b; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.text-blue-700 { color: #004aad; }

.modern-form label { display: block; font-size: 0.72rem; font-weight: 700; color: #64748b; margin: 15px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.modern-form input, .modern-form textarea { width: 100%; padding: 13px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; font-size: 0.95rem; color: #1e293b; font-weight: 500; box-sizing: border-box; font-family: inherit; }
.modern-form input:focus, .modern-form textarea:focus { outline: none; border-color: #004aad; box-shadow: 0 0 0 3px rgba(0,74,173,0.1); background: white; }
.modern-form textarea { resize: vertical; line-height: 1.5; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { display: flex; flex-direction: column; }

.price-badge { background: linear-gradient(135deg, #004aad, #1e40af); color: white; padding: 30px; border-radius: 20px; margin-bottom: 30px; text-align: center; }
.badge-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; opacity: 0.8; }
.price-badge h1 { font-size: 3rem; margin: 10px 0 0 0; font-weight: 900; }

.details-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px; }
.detail-item { display: flex; justify-content: space-between; align-items: center; padding: 13px 14px; background: #f8fafc; border-radius: 12px; font-size: 0.9rem; color: #475569; }
.detail-item.highlight { background: #ecfdf5; border: 1px solid #a7f3d0; }
.text-negative { color: #dc2626; }
.text-positive { color: #059669; }

.flex { display: flex; }
.items-center { align-items: center; }
.gap-2 { gap: 8px; }
.text-slate-400 { color: #94a3b8; }
.text-red-400 { color: #f87171; }
.text-green-500 { color: #22c55e; }

.btn-group { display: flex; gap: 12px; }

.btn-secondary-full {
  flex: 1;
  background: white;
  color: #374151;
  border: 1px solid #e2e8f0;
  padding: 14px 18px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}
.btn-secondary-full:hover { background: #f8fafc; border-color: #004aad; color: #004aad; }

.btn-primary-full {
  flex: 1;
  background: #004aad;
  color: white;
  border: none;
  padding: 14px 18px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}
.btn-primary-full:hover { background: #003a8c; transform: translateY(-2px); }

@media (max-width: 992px) {
  .layout-split { grid-template-columns: 1fr; gap: 20px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
