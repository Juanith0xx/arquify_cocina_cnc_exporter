import express from 'express';
import cors from 'cors';
import JSZip from 'jszip';
import { generatePartDxf } from './src/utils/kitchenCncDxf.js';
import type { CncMachinedPart } from './src/utils/kitchenCncMachining.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cnc-exporter', timestamp: new Date().toISOString() });
});

app.post('/api/cnc/export-dxf', (req, res) => {
  try {
    const { part } = req.body;
    if (!part) {
      return res.status(400).json({ error: 'Objeto part es requerido' });
    }
    const dxfString = generatePartDxf(part);
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', `attachment; filename="corte_cnc_${part.partCode || 'pieza'}.dxf"`);
    return res.send(dxfString);
  } catch (err: any) {
    console.error('Error generando DXF:', err);
    return res.status(500).json({ error: err.message || 'Error interno en generador CNC' });
  }
});

app.post('/api/cnc/export-dxf-zip', async (req, res) => {
  try {
    const { parts } = req.body;
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Array de piezas (parts) es requerido' });
    }
    const zip = new JSZip();
    parts.forEach((part: CncMachinedPart, index: number) => {
      const dxfContent = generatePartDxf(part);
      const filename = `${part.moduleTag || 'MOD'}_${part.partCode || index}_${part.partName || 'pieza'}.dxf`
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      zip.file(filename, dxfContent);
    });

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="planos_cnc_cocina_${Date.now()}.zip"`);
    return res.send(buffer);
  } catch (err: any) {
    console.error('Error generando ZIP DXF:', err);
    return res.status(500).json({ error: err.message || 'Error interno en generador ZIP CNC' });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Microservicio CNC Exporter corriendo en puerto ${PORT}`);
});
