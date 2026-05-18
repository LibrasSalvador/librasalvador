const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');

// Verifica se Cloudinary está configurado
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

let upload;

if (cloudinaryConfigured) {
  console.log('Using Cloudinary storage');
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'materiais',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'ppt', 'pptx'],
      resource_type: 'auto',
    },
  });
  
  upload = multer({ storage });
} else {
  // Fallback: storage local
  const dir = './uploads/materiais/';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
  });
  
  upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
}

// POST: Upload de arquivo e dados
router.post('/', upload.single('arquivo'), async (req, res) => {
  try {
    const { titulo, descricao } = req.body;
    
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'NOT SET',
      api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'NOT SET'
    });
    
    const materialData = {
      titulo,
      descricao,
      nomeArquivo: req.file.originalname,
      caminho: req.file.path,
    };
    
    const novoMaterial = new Material(materialData);
    await novoMaterial.save();
    res.status(201).json(novoMaterial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar upload" });
  }
});

// GET: Listar todos os materiais
router.get('/', async (req, res) => {
  try {
    const materiais = await Material.find().sort({ dataUpload: -1 });
    res.json(materiais);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar materiais" });
  }
});

// GET: Download arquivo
router.get('/download/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: "Material não encontrado" });
    }
    
    // Se for URL (Cloudinary), redireciona
    if (material.caminho && material.caminho.startsWith('http')) {
      return res.redirect(material.caminho);
    }
    
    // Se for caminho local
    const possiblePaths = [
      path.join(__dirname, '../../uploads/materiais/', material.nomeArquivo),
      path.join(__dirname, '../uploads/materiais/', material.nomeArquivo),
      path.join(process.cwd(), 'uploads/materiais/', material.nomeArquivo)
    ];
    let caminho = possiblePaths.find(p => fs.existsSync(p));
    if (!caminho) {
      return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
    }
    res.download(caminho);
  } catch (err) {
    console.error('Erro download:', err);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// DELETE: Remover material e arquivo
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (material) {
      // Se for URL local, tenta excluir
      if (material.caminho && !material.caminho.startsWith('http')) {
        try {
          if (fs.existsSync(material.caminho)) {
            fs.unlinkSync(material.caminho);
          }
        } catch (e) {
          console.error('Erro ao excluir arquivo:', e);
        }
      }
      await Material.findByIdAndDelete(req.params.id);
    }
    res.json({ msg: "Removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover" });
  }
});

module.exports = router;