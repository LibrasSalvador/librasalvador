const aws = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const crypto = require('crypto');

// Configuração do S3
const s3Client = new aws.S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'librasalvador';

// Gera nome único para o arquivo
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomSuffix}-${nameWithoutExt}${ext}`;
};

const upload = multer({
  storage: multerS3({
    s3Client: s3Client,
    bucket: BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname, originalName: file.originalname });
    },
    key: (req, file, cb) => {
      const folder = file.fieldname === 'certificado' ? 'certificados' : 'materiais';
      const filename = generateFileName(file.originalname);
      cb(null, `${folder}/${filename}`);
    },
    contentType: (req, file, cb) => {
      cb(null, file.mimetype);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

module.exports = upload;