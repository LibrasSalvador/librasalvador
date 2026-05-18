const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Material = require('../models/Material');

//.Storage local simples
const dir = './uploads/materiais/';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

console.log('=== MaterialRoutes: usando storage local ===');

// POST: Upload
router.post('/', upload.single('arquivo'), async (req, res) => {
  try {
    const { titulo, descricao } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const materialData = {
      titulo,
      descricao,
      nomeArquivo: req.file.originalname,
      caminho: path.join(dir, req.file.filename),
    };
    
    const novoMaterial = new Material(materialData);
    await novoMaterial.save();
    res.status(201).json(novoMaterial);
  } catch (err) {
    console.error('Erro upload:', err);
    res.status(500).json({ error: "Erro ao processar upload" });
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
    
    const fullPath = material.caminho;
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }
    res.download(fullPath);
  } catch (err) {
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (material) {
      try {
        if (fs.existsSync(material.caminho)) {
          fs.unlinkSync(material.caminho);
        }
      } catch (e) {}
      await Material.findByIdAndDelete(req.params.id);
    }
    res.json({ msg: "Removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover" });
  }
});

module.exports = router;