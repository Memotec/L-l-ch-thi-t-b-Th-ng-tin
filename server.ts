import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const CLOUD_DB_FILE = path.join(DATA_DIR, 'cns_cloud_equipment_db.json');

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
  if (inMemoryCache) return inMemoryCache;
  try {
    if (fs.existsSync(CLOUD_DB_FILE)) {
      const raw = fs.readFileSync(CLOUD_DB_FILE, 'utf-8');
      inMemoryCache = JSON.parse(raw);
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
      gasUrl: db?.gasUrl || '',
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
        gasUrl: db.gasUrl,
        equipments: db.equipments,
        trash: db.trash || []
      });
    } else {
      res.json({
        success: true,
        initialized: false,
        equipments: [],
        trash: [],
        gasUrl: '',
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
      const newDb: CloudDbSchema = {
        version: (existingDb?.version || 0) + 1,
        lastModified: new Date().toISOString(),
        updatedBy: updatedBy || 'Quản trị viên',
        gasUrl: gasUrl !== undefined ? gasUrl : (existingDb?.gasUrl || ''),
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
        message: 'Đã lưu và đồng bộ thành công vào cơ sở dữ liệu Cloud'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi lưu dữ liệu Cloud' });
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
