/* =============================================
   PGRTR Generator — Express Server
   ============================================= */

const express = require('express');
const path = require('path');
const { generatePGRTR } = require('./generate-docx');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate DOCX endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const data = req.body;
    
    if (!data || !data.empresa) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    console.log(`[PGRTR] Gerando relatório para: ${data.empresa.razaoSocial || 'N/A'}`);
    
    const buffer = await generatePGRTR(data);
    
    const razao = (data.empresa.razaoSocial || 'PGRTR')
      .replace(/[^a-zA-Z0-9\s\-áéíóúãõâêîôûàèìòùçÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ]/g, '')
      .trim()
      .substring(0, 50);
    
    const filename = `PGRTR_${razao}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    console.log(`[PGRTR] Relatório gerado com sucesso (${(buffer.length / 1024).toFixed(1)} KB)`);
    
  } catch (error) {
    console.error('[PGRTR] Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar o relatório: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║                                              ║');
  console.log('  ║   🛡️  Gerador PGRTR — Servidor Ativo         ║');
  console.log('  ║                                              ║');
  console.log(`  ║   🌐 http://localhost:${PORT}                    ║`);
  console.log('  ║                                              ║');
  console.log('  ║   Abra o link acima no navegador para        ║');
  console.log('  ║   começar a preencher o relatório.           ║');
  console.log('  ║                                              ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
