require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http'); // ADICIONADO: Necessário para o Socket.io
const { Server } = require('socket.io'); // ADICIONADO: Socket.io
const connectDB = require('./config/db');

// IMPORTAÇÕES DE ROTAS
const authRoutes = require('./routes/auth');
const cursoRoutes = require('./routes/cursoRoutes');
const userRoutes = require('./routes/userRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const materialRoutes = require('./routes/materialRoutes');
const certificadoRoutes = require('./routes/certificadoRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes'); 
const instrutorRoutes = require('./routes/instrutorRoutes');
const clienteB2bRoutes = require('./routes/clienteB2bRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apostilaRoutes = require('./routes/apostilaRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const servicoConfirmadoRoutes = require('./routes/servicoConfirmadoRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const empresaSolicitanteRoutes = require('./routes/empresaSolicitanteRoutes');
const forumRoutes = require('./routes/forumRoutes');
const auditMiddleware = require('./middlewares/auditMiddleware');

const app = express();
const server = http.createServer(app); // ADICIONADO: Criando o servidor HTTP para o Socket.io

// ==========================================
// 1. CONFIGURAÇÃO DE CORS E SOCKET.IO
// ==========================================
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : [
    "https://librasalvador.vercel.app",
    "https://librasalvador.onrender.com",
    "http://localhost:5173",
    "http://localhost:5000"
  ];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true
}));

// INICIALIZAÇÃO DO SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Tornar o "io" acessível em todas as rotas através do objeto "req"
app.set('io', io);

// Log de conexão do Socket
io.on('connection', (socket) => {
  console.log('🔌 Novo admin conectado para notificações:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Admin desconectado');
  });
});

app.options('(.*)', cors());

// ==========================================
// 2. MIDDLEWARES DE PARSING
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de auditoria para rastrear ações de admin_restrito
app.use(auditMiddleware);

// ==========================================
// 3. CONEXÃO COM BANCO (ASSÍNCRONA)
// ==========================================
connectDB().catch(err => console.error("Erro na conexão inicial do Mongo:", err));

// ==========================================
// 4. SERVIR ARQUIVOS ESTÁTICOS
// ==========================================
// Detectar o diretório base para uploads (funciona em desenvolvimento e produção)
const uploadsDir = path.join(__dirname, '../uploads');
const rootDir = process.cwd();
app.use('/uploads/materiais', express.static(path.join(__dirname, '../uploads/materiais')));
app.use('/uploads/certificados', express.static(path.join(__dirname, '../uploads/certificados')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Fallback para produção (Render)
if (process.env.RENDER) {
  app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
}

// ==========================================
// 5. REGISTRO DE ROTAS DA API
// ==========================================
app.use('/api/empresas-solicitantes', empresaSolicitanteRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/materiais', materialRoutes);
app.use('/api/certificados', certificadoRoutes);
app.use('/api/profissionais', profissionalRoutes); 
app.use('/api/instrutores', instrutorRoutes);
app.use('/api/b2b', clienteB2bRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/apostilas', apostilaRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/servicos', servicoConfirmadoRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/solicitacoes-senha', require('./routes/solicitacaoSenhaRoutes'));

// Rota de Stats
app.get('/api/stats', async (req, res) => {
  try {
    const User = require('./models/User');
    const Curso = require('./models/Curso');
    const Financeiro = require('./models/Financeiro');
    const ClienteB2B = require('./models/ClienteB2B');
    const ServicoConfirmado = require('./models/ServicoConfirmado');
    const Venda = require('./models/Venda');

    const [totalAlunos, totalCursos, transacoes, totalB2B, servicosConfirmados, vendas, alunosPagos] = await Promise.all([
      User.countDocuments({ role: 'aluno' }).catch(() => 0),
      Curso.countDocuments().catch(() => 0),
      Financeiro.find({ tipo: 'Entrada' }).catch(() => []),
      ClienteB2B.countDocuments().catch(() => 0),
      ServicoConfirmado.find().catch(() => []),
      Venda.find({ statusPagamento: 'Confirmado' }).catch(() => []),
      User.aggregate([
        { $match: { role: 'aluno', statusPagamento: 'Pago', valorTotalCurso: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$valorTotalCurso' } } }
      ]).catch(() => [])
    ]);

    // Soma do fluxo de caixa financeiro
    const somaFinanceiro = transacoes.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    
    // Soma do caixa empresa dos serviços confirmados (apenas pagos)
    const servicosPagos = servicosConfirmados.filter(s => s.statusPagamento === 'Pago');
    const somaServicos = servicosPagos.reduce((acc, curr) => acc + (curr.caixaEmpresa || curr.valorTotal || 0), 0);
    
    // Soma das vendas de cursos confirmados
    const somaVendas = vendas.reduce((acc, curr) => acc + (curr.valorFinal || 0), 0);
    
    // Soma dos valores pagos pelos alunos
    const somaAlunos = alunosPagos[0]?.total || 0;
    
    // Total geral = Financeiro + Serviços + Vendas + Alunos
    const totalGeral = somaFinanceiro + somaServicos + somaVendas + somaAlunos;

    // Último serviço cadastrado
    const ultimoServico = servicosConfirmados.sort((a, b) => new Date(b.data) - new Date(a.data))[0] || null;

    res.json({
      alunos: totalAlunos,
      cursos: totalCursos,
      clientesB2B: totalB2B,
      vendas: totalGeral.toFixed(2),
      ultimoServico: ultimoServico,
      valorServicos: somaServicos.toFixed(2),
      valorAlunos: somaAlunos.toFixed(2)
    });
  } catch (error) {
    console.error("Erro ao carregar stats:", error);
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
});

app.get('/', (req, res) => res.send('API Libras Salvador rodando... 🚀'));

app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.originalUrl} não encontrada no servidor.` });
});

// ==========================================
// 6. INICIALIZAÇÃO (USANDO SERVER AO INVÉS DE APP)
// ==========================================
module.exports = app;

const PORT = process.env.PORT || 3000;
// IMPORTANTE: server.listen e não app.listen para o socket funcionar
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});