const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const User = require('../models/User');

// Configura o Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'diwo2ujms',
  api_key: process.env.CLOUDINARY_API_KEY || '153556382382953',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'v5lr2Kc1Q-nqScOQXEwXLLrkwDk',
});

// Storage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'certificados',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

console.log('=== CertificadoRoutes: usando Cloudinary ===');

// POST: Adicionar certificado
router.post('/:alunoId', upload.single('certificado'), async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { nomeCertificado } = req.body;
    const aluno = await User.findById(alunoId);
    
    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const novoCertificado = {
      nome: nomeCertificado || `Certificado ${(aluno.certificados?.length || 0) + 1}`,
      arquivo: req.file.path, // URL do Cloudinary
      dataUpload: new Date()
    };
    
    if (!aluno.certificados) {
      aluno.certificados = [];
    }
    aluno.certificados.push(novoCertificado);
    await aluno.save();
    
    res.json({ 
      message: 'Certificado adicionado com sucesso',
      certificado: novoCertificado,
      total: aluno.certificados.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer upload do certificado' });
  }
});

// GET: Listar certificados
router.get('/:alunoId', async (req, res) => {
  try {
    const { alunoId } = req.params;
    const aluno = await User.findById(alunoId);
    
    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    res.json({ 
      certificados: aluno.certificados || [],
      total: aluno.certificados?.length || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar certificados' });
  }
});

// DELETE: Remover certificado
router.delete('/:alunoId/:certificadoIndex', async (req, res) => {
  try {
    const { alunoId, certificadoIndex } = req.params;
    const aluno = await User.findById(alunoId);
    
    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    
    if (!aluno.certificados || !aluno.certificados[certificadoIndex]) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }
    
    aluno.certificados.splice(certificadoIndex, 1);
    await aluno.save();
    
    res.json({ message: 'Certificado removido com sucesso', total: aluno.certificados.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover certificado' });
  }
});

module.exports = router;