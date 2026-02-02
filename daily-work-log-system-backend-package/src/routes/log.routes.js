const express = require('express');
const { body } = require('express-validator');
const logController = require('../controllers/log.controller');
const {
  verifyToken,
  isManager,
  isTeamLeader,
  isManagerOrTeamLeader
} = require('../middleware/auth.middleware');
const { uploadFields } = require('../middleware/upload.middleware');

const router = express.Router();

// 🛡 כל הנתיבים דורשים אימות
router.use(verifyToken);

/* -----------------------------------------------
   📥 שליפות
------------------------------------------------ */
// 🔎 שליפת רשימת כל ראשי הצוות (לסינון)
router.get('/team-leaders', isManagerOrTeamLeader, logController.getTeamLeaders);


// 🔎 שליפת כל הדוחות עם פילטרים
router.get('/', isManagerOrTeamLeader, logController.getAllLogs);

// 🔎 שליפת דוחות לפי ראש צוות מחובר
router.get('/my-logs', isTeamLeader, logController.getMyLogs);

// 🔎 שליפת רשימת כל ראשי הצוות (לסינון)
router.get('/team-leaders', isManagerOrTeamLeader, logController.getTeamLeaders);

// 🔎 שליפת דוח לפי מזהה
router.get('/:id', logController.getLogById);


/* -----------------------------------------------
   ✍️ יצירה ועדכון
------------------------------------------------ */

// ✏️ יצירת דוח חדש
router.post(
  '/',
  uploadFields,
  isTeamLeader,
  [
    body('date').isISO8601().withMessage('נדרש תאריך חוקי'),
    body('project').isString().notEmpty().withMessage('יש להזין פרויקט'),
    body('employees').isString().withMessage('יש להזין עובדים כמחרוזת JSON'),
    body('startTime').isISO8601().withMessage('שעת התחלה לא חוקית'),
    body('endTime').isISO8601().withMessage('שעת סיום לא חוקית'),
    body('workDescription').notEmpty().withMessage('יש להזין תיאור עבודה')
  ],
  logController.createLog
);

// ✏️ עדכון דוח
router.put(
  '/:id',
  uploadFields,
  isTeamLeader,
  [
    body('date').optional().isISO8601().withMessage('תאריך חוקי נדרש'),
    body('project').optional().isString().withMessage('פרויקט חייב להיות מחרוזת'),
    body('employees').optional().isString().withMessage('עובדים צריכים להיות מחרוזת JSON'),
    body('startTime').optional().isISO8601().withMessage('שעת התחלה לא חוקית'),
    body('endTime').optional().isISO8601().withMessage('שעת סיום לא חוקית'),
    body('workDescription').optional().notEmpty().withMessage('תיאור העבודה לא יכול להיות ריק')
  ],
  logController.updateLog
);


/* -----------------------------------------------
   📤 פעולות על דוח קיים
------------------------------------------------ */

// 🚀 שליחת דוח
router.patch('/:id/submit', isTeamLeader, logController.submitLog);

// ✅ אישור דוח
router.patch('/:id/approve', isManager, logController.approveLog);

// 🗑️ מחיקת דוח
router.delete('/:id', isManagerOrTeamLeader, logController.deleteLog);

// 📄 ייצוא PDF
router.get('/:id/export-pdf', isManagerOrTeamLeader, logController.exportLogToPdf);


module.exports = router;