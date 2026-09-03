import { Router } from 'express';
import {
  getStudentsForGoogleSheets,
  importStudentsFromGoogleSheets,
  getSyncStatus,
  validateGoogleSheetsSync,
} from '../controllers/syncController';

const router = Router();

// 1. Export MongoDB -> Google Sheets (Paginated & Full)
router.get('/google-sheets/students', getStudentsForGoogleSheets);

// 2. Import Google Sheets -> MongoDB
router.post('/google-sheets/import', importStudentsFromGoogleSheets);

// 3. Validate Google Sheet sync against MongoDB
router.post('/google-sheets/validate', validateGoogleSheetsSync);

// 4. Status
router.get('/status', getSyncStatus);

export default router;
