const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Retorna os dados do usuário autenticado
exports.getMe = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id || req.userId;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: "Utilizador não encontrado" });
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar dados do utilizador" });
    }
};

exports.register = async (req, res) => {
    const { nome, email, password, role, turma, modalidade, valorTotalCurso, valorPago, apostila, combo, statusPagamento } = req.body;
    
    if (req.user && req.user.role === 'admin_restrito' && (role === 'admin' || role === 'admin_restrito')) {
        return res.status(403).json({ msg: "Operação não permitida para o seu nível de acesso." });
    }

    try {
        let userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ msg: "Utilizador já existe" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nome,
            email,
            password: hashedPassword,
            role: role || 'aluno',
            turma: turma || '',
            modalidade: modalidade || '',
            valorTotalCurso: valorTotalCurso || 0,
            valorPago: valorPago || 0,
            apostila: apostila || '',
            combo: combo || false,
            statusPagamento: statusPagamento || '',
            primeiroAcesso: true
        });

        await newUser.save();
        res.status(201).json({ msg: "Utilizador criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Utilizador não encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Senha incorreta" });

        const token = jwt.sign(
            { id: user._id, nome: user.nome, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: { 
                id: user._id, 
                nome: user.nome, 
                role: user.role,
                primeiroAcesso: user.primeiroAcesso 
            },
            redirectUrl: user.role === 'professor' ? '/professor/cursos' : null
        });
    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor" });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { password } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Utilizador não encontrado." });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.primeiroAcesso = false;

        await user.save();
        res.json({ message: "Senha definitiva salva!" });
    } catch (err) {
        res.status(500).json({ error: "Erro ao atualizar." });
    }
};
