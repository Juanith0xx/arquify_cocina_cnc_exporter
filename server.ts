import express from 'express';
import cors from 'cors';
import JSZip from 'jszip';
import { generatePartDxf } from './src/utils/kitchenCncDxf.js';
import type { CncMachinedPart } from './src/utils/kitchenCncMachining.js';
import { validateCncPart } from './src/utils/cncValidation.js';
import { buildCncPlanPreview } from './src/services/cncPlanPreview.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cnc-exporter', timestamp: new Date().toISOString() });
});

app.post('/api/cnc/export-dxf', (req, res) => {
  try {
    const { part } = req.body ?? {};
    const validationError = validateCncPart(part);

    if (validationError) {
      return res.status(422).json({
        success: false,
        error: validationError
      });
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
    const { parts } = req.body ?? {};

    if (!Array.isArray(parts) || parts.length === 0 || parts.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere entre 1 y 200 piezas'
      });
    }

    for (const [index, part] of parts.entries()) {
      const error = validateCncPart(part);

      if (error) {
        return res.status(422).json({
          success: false,
          partIndex: index,
          error
        });
      }
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


/**
 * Previsualización estructurada.
 * No genera DXF ni archivos para maquinaria.
 */
app.post('/api/cnc/plan-preview', (req, res) => {
  try {
    const preview = buildCncPlanPreview(req.body);
    return res.status(200).json({
      success: true,
      ...preview
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Solicitud inválida';

    return res.status(422).json({
      success: false,
      readiness: 'NOT_MACHINE_READY',
      error: message
    });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Microservicio CNC Exporter corriendo en puerto ${PORT}`);
});
