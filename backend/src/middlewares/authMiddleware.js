const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (req, res, next) => {
    // Tenta pegar o token do cabeçalho 'Authorization'
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: "Acesso negado. Token não fornecido." });
    }

    // O padrão Bearer envia "Bearer [token]", então precisamos separar a palavra do código
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: "Token malformado." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar nome real do usuário no banco de dados
        if (decoded.id) {
            User.findById(decoded.id).select('nome role').then(user => {
                if (user) {
                    req.user = {
                        id: decoded.id,
                        role: user.role,
                        nome: user.nome
                    };
                } else {
                    req.user = decoded;
                }
                next();
            }).catch(() => {
                req.user = decoded;
                next();
            });
        } else {
            req.user = decoded;
            next();
        }
    } catch (err) {
        res.status(401).json({ msg: "Token inválido ou expirado." });
    }
};