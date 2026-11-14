const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET = process.env.S3_BUCKET_NAME;

/**
 * Sube un buffer de imagen a S3 y devuelve la URL pública del objeto.
 * @param {Buffer} buffer contenido del archivo
 * @param {string} originalName nombre original (para sacar la extensión)
 * @param {string} mimetype tipo MIME
 */
async function uploadProfileImage(buffer, originalName, mimetype) {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
  const key = `profile-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  await s3
    .putObject({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
    .promise();

  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Elimina un objeto de S3 a partir de su URL pública.
 */
async function deleteProfileImageByUrl(url) {
  if (!url) return;
  try {
    const key = url.split(`${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
    if (!key) return;
    await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
  } catch (err) {
    console.error('No se pudo eliminar imagen anterior de S3:', err.message);
  }
}

module.exports = { uploadProfileImage, deleteProfileImageByUrl };
