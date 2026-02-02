// utils/gcs.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// יוצרים client של Google Cloud Storage
const storage = new Storage();

// שם ה-bucket מגיע מה-ENV
const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * העלאת קובץ מ-buffer ל-GCS
 * @param {Buffer} buffer - תוכן הקובץ
 * @param {string} destination - הנתיב בתוך ה-bucket
 * @param {string} contentType - סוג התוכן (mime type)
 * @returns {Promise<string>} public URL
 */
async function uploadBufferToGCS(buffer, destination, contentType) {
  const file = bucket.file(destination);

  await file.save(buffer, {
    resumable: false,
    contentType: contentType || 'application/octet-stream',
    public: true, // חשוב: שיהיה נגיש מבחוץ
  });

  // כתובת ציבורית לקובץ
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${encodeURI(destination)}`;
  return publicUrl;
}

/**
 * מחיקת קובץ מה-bucket לפי הנתיב שלו
 * @param {string} destination - הנתיב בתוך ה-bucket (אותו ששמנו בדאטהבייס)
 */
async function deleteFromGCS(destination) {
  const file = bucket.file(destination);
  await file.delete({ ignoreNotFound: true });
}

module.exports = {
  uploadBufferToGCS,
  deleteFromGCS,
};
