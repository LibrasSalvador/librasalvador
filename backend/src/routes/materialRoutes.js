const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Material = require('../models/Material');

// Configura o Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'diwo2ujms',
  api_key: process.env.CLOUDINARY_API_KEY || '153556382382953',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'v5lr2Kc1Q-nqScOQXEwXLLrkwDk',
});

console.log('=== Cloudinary config ===');
console.log('cloud_name:', process.env.CLOUDINARY_CLOUD_NAME || 'diwo2ujms');
console.log('api_key:', process.env.CLOUDINARY_API_KEY);
console.log('api_secret defined:', !!process.env.CLOUDINARY_API_SECRET);

// Storage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'materiais',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage });

console.log('=== MaterialRoutes: usando Cloudinary ===');

// POST: Upload
router.post('/', upload.single('arquivo'), async (req, res) => {
  try {
    console.log('=== Upload chamado ===');
    console.log('req.file:', req.file);
    
    const { titulo, descricao } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const materialData = {
      titulo,
      descricao,
      nomeArquivo: req.file.originalname,
      caminho: req.file.path, // URL do Cloudinary
    };
    
    console.log('Salvando:', materialData);
    
    const novoMaterial = new Material(materialData);
    await novoMaterial.save();
    res.status(201).json(novoMaterial);
  } catch (err) {
    console.error('Erro upload:', err);
    res.status(500).json({ error: "Erro ao processar upload: " + err.message });
  }
});

// GET: Listar
router.get('/', async (req, res) => {
  try {
    const materiais = await Material.find().sort({ dataUpload: -1 });
    res.json(materiais);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar materiais" });
  }
});

// GET: Download
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: "Material não encontrado" });
    }
    
    // Se for URL Cloudinary, redireciona
    if (material.caminho && material.caminho.startsWith('http')) {
      return res.redirect(material.caminho);
    }
    
    // Senão, tenta caminho local
    if (fs.existsSync(material.caminho)) {
      return res.download(material.caminho);
    }
    
    res.status(404).json({ error: "Arquivo não encontrado" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (material) {
      await Material.findByIdAndDelete(req.params.id);
    }
    res.json({ msg: "Removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover" });
  }
});

module.exports = router;