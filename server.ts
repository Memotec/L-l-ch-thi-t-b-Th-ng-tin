import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const CLOUD_DB_FILE = path.join(DATA_DIR, 'cns_cloud_equipment_db.json');
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbySB2N2_ekkgKoxNzZjrRmdHaysDntLGXmsS7FH2mp04_WSyCpZh7ExWAWfunwjmnS7PA/exec';

// Ensure data directory exists for cloud storage
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CloudDbSchema {
  version: number;
  lastModified: string;
  updatedBy: string;
  gasUrl: string;
  equipments: any[];
  trash: any[];
}

let inMemoryCache: CloudDbSchema | null = null;

function getCloudDb(): CloudDbSchema | null {
  if (inMemoryCache) {
    if (!inMemoryCache.gasUrl) {
      inMemoryCache.gasUrl = DEFAULT_GAS_URL;
    }
    return inMemoryCache;
  }
  try {
    if (fs.existsSync(CLOUD_DB_FILE)) {
      const raw = fs.readFileSync(CLOUD_DB_FILE, 'utf-8');
      inMemoryCache = JSON.parse(raw);
      if (inMemoryCache && !inMemoryCache.gasUrl) {
        inMemoryCache.gasUrl = DEFAULT_GAS_URL;
      }
      return inMemoryCache;
    }
  } catch (err) {
    console.error('Failed to read cloud DB from file:', err);
  }
  return null;
}

function saveCloudDb(data: CloudDbSchema): boolean {
  inMemoryCache = data;
  try {
    fs.writeFileSync(CLOUD_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write cloud DB to file:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Cross-Device Cloud Sync Endpoints
  app.get('/api/cloud-sync/status', (req, res) => {
    const db = getCloudDb();
    res.json({
      success: true,
      initialized: !!db,
      count: db?.equipments?.length || 0,
      trashCount: db?.trash?.length || 0,
      lastModified: db?.lastModified || null,
      gasUrl: db?.gasUrl || DEFAULT_GAS_URL,
      updatedBy: db?.updatedBy || ''
    });
  });

  app.get('/api/cloud-sync/data', (req, res) => {
    const db = getCloudDb();
    if (db) {
      res.json({
        success: true,
        version: db.version,
        lastModified: db.lastModified,
        updatedBy: db.updatedBy,
        gasUrl: db.gasUrl || DEFAULT_GAS_URL,
        equipments: db.equipments,
        trash: db.trash || []
      });
    } else {
      res.json({
        success: true,
        initialized: false,
        equipments: [],
        trash: [],
        gasUrl: DEFAULT_GAS_URL,
        lastModified: null
      });
    }
  });

  app.post('/api/cloud-sync/save', (req, res) => {
    try {
      const { equipments, trash, gasUrl, updatedBy } = req.body;
      if (!Array.isArray(equipments)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu thiết bị không hợp lệ' });
      }

      const existingDb = getCloudDb();
      const targetGasUrl = (typeof gasUrl === 'string' && gasUrl.trim()) 
        ? gasUrl.trim() 
        : (existingDb?.gasUrl || DEFAULT_GAS_URL);

      const newDb: CloudDbSchema = {
        version: (existingDb?.version || 0) + 1,
        lastModified: new Date().toISOString(),
        updatedBy: updatedBy || 'Quản trị viên',
        gasUrl: targetGasUrl,
        equipments,
        trash: Array.isArray(trash) ? trash : (existingDb?.trash || [])
      };

      saveCloudDb(newDb);

      res.json({
        success: true,
        version: newDb.version,
        lastModified: newDb.lastModified,
        count: equipments.length,
        trashCount: newDb.trash.length,
        gasUrl: targetGasUrl,
        message: 'Đã lưu và đồng bộ thành công vào cơ sở dữ liệu Cloud'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi lưu dữ liệu Cloud' });
    }
  });

  // Endpoint to download the single unified JSON database file directly
  app.get('/api/cloud-sync/download-json', (req, res) => {
    try {
      const db = getCloudDb();
      if (!db || !db.equipments) {
        return res.status(404).json({ success: false, message: 'Cơ sở dữ liệu JSON chưa khởi tạo' });
      }
      const filename = `cns_unified_equipment_database_${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(db, null, 2));
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi xuất file JSON' });
    }
  });

  // Endpoint to restore database from an uploaded or provided JSON payload
  app.post('/api/cloud-sync/restore-json', (req, res) => {
    try {
      const { equipments, trash, updatedBy, fullData } = req.body;
      let targetEquipments = Array.isArray(equipments) ? equipments : [];
      let targetTrash = Array.isArray(trash) ? trash : [];

      if (fullData && typeof fullData === 'object') {
        if (Array.isArray(fullData.equipments)) targetEquipments = fullData.equipments;
        if (Array.isArray(fullData.trash)) targetTrash = fullData.trash;
      }

      if (!Array.isArray(targetEquipments) || targetEquipments.length === 0) {
        return res.status(400).json({ success: false, message: 'File JSON không chứa dữ liệu thiết bị hợp lệ' });
      }

      const existingDb = getCloudDb();
      const newDb: CloudDbSchema = {
        version: (existingDb?.version || 0) + 1,
        lastModified: new Date().toISOString(),
        updatedBy: updatedBy || 'Restore System',
        gasUrl: existingDb?.gasUrl || DEFAULT_GAS_URL,
        equipments: targetEquipments,
        trash: targetTrash
      };

      saveCloudDb(newDb);

      res.json({
        success: true,
        version: newDb.version,
        lastModified: newDb.lastModified,
        count: targetEquipments.length,
        trashCount: targetTrash.length,
        message: `Đã khôi phục (Restore) thành công ${targetEquipments.length} hồ sơ thiết bị từ file JSON!`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khôi phục dữ liệu từ file JSON' });
    }
  });

  // Dedicated endpoint to save / update Google Apps Script Web App URL
  app.post('/api/cloud-sync/gas-url', (req, res) => {
    try {
      const { url } = req.body;
      const finalUrl = (typeof url === 'string' && url.trim()) ? url.trim() : DEFAULT_GAS_URL;
      const existingDb = getCloudDb();
      if (existingDb) {
        existingDb.gasUrl = finalUrl;
        existingDb.lastModified = new Date().toISOString();
        saveCloudDb(existingDb);
      }
      res.json({
        success: true,
        gasUrl: finalUrl,
        message: 'Đã tự động ghi nhớ URL Google Apps Script thành công!'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi ghi nhớ URL' });
    }
  });

  // Google Apps Script Proxy to prevent CORS/redirect issues on mobile devices
  app.post('/api/cloud-sync/gas-proxy', async (req, res) => {
    try {
      const { url, payload } = req.body;
      if (!url || typeof url !== 'string' || !url.startsWith('https://script.google.com')) {
        return res.status(400).json({ success: false, message: 'URL Google Apps Script không hợp lệ' });
      }

      const fetchRes = await fetch(url, {
        method: payload ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });

      const responseData = await fetchRes.json();
      res.json(responseData);
    } catch (err: any) {
      res.status(500).json({ success: false, message: `Lỗi kết nối Google Apps Script: ${err.message}` });
    }
  });

  // Google Workspace / Docs configuration status endpoint
  app.get('/api/workspace/status', (req, res) => {
    res.json({
      status: 'active',
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file'
      ],
      brandName: 'Sổ Lý Lịch Thiết Bị',
      docsExportEnabled: true
    });
  });

  // Vite middleware in dev or static serving in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CNS Equipment Lifecycle Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
