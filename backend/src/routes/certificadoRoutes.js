const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'diwo2ujms',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BUCKET_NAME = process.env.CLOUDINARY_BUCKET || 'librasalvador';

// Configuração do armazenamento Cloudinary para certificados
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'certificados',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
    transformation: [{ quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// POST: Adicionar novo certificado para um aluno
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
    
    // Salva a URL do Cloudinary
    const arquivoUrl = req.file.path; // Cloudinary retorna a URL em req.file.path
    
    // Adiciona novo certificado ao array
    const novoCertificado = {
      nome: nomeCertificado || `Certificado ${(aluno.certificados?.length || 0) + 1}`,
      arquivo: arquivoUrl,
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

// GET: Listar todos os certificados de um aluno
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

// DELETE: Remover um certificado específico
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
    
    const arquivo = aluno.certificados[certificadoIndex].arquivo;
    
    // Remove do Cloudinary se for URL do Cloudinary
    if (arquivo && arquivo.includes('cloudinary.com')) {
      try {
        // Extrai o public_id da URL
        const urlParts = arquivo.split('/upload/');
        if (urlParts[1]) {
          const publicId = urlParts[1].replace(/\.[^.]+$/, ''); // Remove extensão
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudErr) {
        console.error('Erro ao deletar do Cloudinary:', cloudErr);
      }
    }
    
    // Remove do array
    aluno.certificados.splice(certificadoIndex, 1);
    await aluno.save();
    
    res.json({ message: 'Certificado removido com sucesso', total: aluno.certificados.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover certificado' });
  }
});

module.exports = router;