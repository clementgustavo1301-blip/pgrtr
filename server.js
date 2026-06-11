/* =============================================
   PGRTR Generator — Express Server (Enhanced)
   ============================================= */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');
const { generatePGRTR } = require('./generate-docx');
const { TABELA_27_ESOCIAL, CATEGORIAS_EXAMES, RISCOS_EXAMES_MAP, getExamesRecomendados } = require('./esocial-tabela27');

const app = express();
const PORT = 3000;

// Data directory for saved companies
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// Generate DOCX endpoint
// =============================================
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

// =============================================
// Busca CNPJ via BrasilAPI (proxy to avoid CORS)
// =============================================
app.get('/api/cnpj/:cnpj', async (req, res) => {
  try {
    const cnpj = req.params.cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) {
      return res.status(400).json({ error: 'CNPJ inválido' });
    }
    
    console.log(`[CNPJ] Buscando CNPJ: ${cnpj}`);
    
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CNPJ] Erro da API: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: 'CNPJ não encontrado na base da Receita Federal' });
    }
    
    const data = await response.json();
    
    // Map BrasilAPI response to our format
    const result = {
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || '',
      cnpj: formatCNPJ(cnpj),
      endereco: buildAddress(data),
      cep: formatCEP(data.cep || ''),
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      uf: data.uf || '',
      telefone: formatPhone(data.ddd_telefone_1 || ''),
      email: data.email || '',
      cnae: data.cnae_fiscal ? `(${formatCNAE(String(data.cnae_fiscal))})` : '',
      atividadeEconomica: data.cnae_fiscal_descricao || ''
    };
    
    console.log(`[CNPJ] Encontrado: ${result.razaoSocial}`);
    res.json(result);
    
  } catch (error) {
    console.error('[CNPJ] Erro:', error.message);
    res.status(500).json({ error: 'Erro ao buscar CNPJ: ' + error.message });
  }
});

// =============================================
// Importar PGRTR existente (.docx)
// =============================================
app.post('/api/import-docx', async (req, res) => {
  try {
    const { fileBase64 } = req.body;
    
    if (!fileBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Decode base64 to buffer
    const buffer = Buffer.from(fileBase64, 'base64');
    
    console.log(`[IMPORT] Extraindo texto do DOCX (${(buffer.length / 1024).toFixed(1)} KB)...`);
    
    // Extract text with mammoth
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log(`[IMPORT] Texto extraído: ${text.length} caracteres`);
    
    // Parse the text to extract structured data
    let parsedData;
    if (process.env.GEMINI_API_KEY) {
      console.log('[IMPORT] API Key detectada. Iniciando parsing via Gemini...');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Extraia os dados deste PGRTR e retorne APENAS um JSON válido seguindo exatamente essa estrutura:
{
  "empresa": { "razaoSocial": "", "nomeFantasia": "", "cnpj": "", "endereco": "", "cep": "", "bairro": "", "cidade": "", "uf": "", "telefone": "", "email": "", "representanteLegal": "", "cnae": "", "atividade": "", "grauRisco": "" },
  "funcionarios": [ { "setor": "", "funcao": "", "nFuncionarios": "" } ],
  "ambientes": [ { "setor": "", "descricao": "", "funcoes": "" } ],
  "ghes": [ { "id": "01", "setor": "", "funcao": "", "descricao": "", "riscos": [ { "agente": "", "fator": "", "fonte": "", "trajetoria": "", "exposicaoAtividade": "", "exposicaoNorma": "", "avaliacao": "Qualitativa", "medidasControle": "", "metodologia": "", "resultado": "", "classificacaoRisco": "" } ] } ],
  "exames": [ { "gheFuncoes": "", "riscos": "", "exame": "", "codigoEsocial": "", "admissional": true, "semestral": false, "anual": true, "mudancaRisco": true, "retornoTrabalho": true } ],
  "epis": [ { "funcao": "", "avental": false, "boneArabe": false, "botaCouro": false, "botaImpermeavel": false, "cintoSeguranca": false, "kitPulverizacao": false, "luvaMalhaAco": false, "luvaQuimica": false, "luvaVaqueta": false, "luvaImpermeavel": false, "luvaTricotada": false, "manguito": false, "mascaraFiltro": false, "protetorAuricular": false, "capacete": false, "respiradorPFF2": false, "oculos": false, "vestimentaRF": false } ]
}
Texto do documento:
${text.substring(0, 30000)} // Limite de caracteres para não estourar tokens`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { temperature: 0.1 }
        });

        let aiText = response.text || '';
        // If the SDK uses response.text()
        if (typeof response.text === 'function') {
          aiText = response.text();
        }

        if (aiText.startsWith('\`\`\`json')) {
          aiText = aiText.replace(/^\`\`\`json/g, '').replace(/\`\`\`$/g, '').trim();
        } else if (aiText.startsWith('\`\`\`')) {
          aiText = aiText.replace(/^\`\`\`/g, '').replace(/\`\`\`$/g, '').trim();
        }
        
        parsedData = JSON.parse(aiText);
        console.log('[IMPORT] Sucesso no parsing com Gemini!');
      } catch (aiErr) {
        console.error('[IMPORT] Erro com Gemini, usando fallback regex:', aiErr.message);
        parsedData = parseDocxText(text);
      }
    } else {
      console.log('[IMPORT] Sem API Key. Usando Regex parser...');
      parsedData = parseDocxText(text);
    }
    
    console.log(`[IMPORT] Dados extraídos:`, {
      empresa: parsedData.empresa?.razaoSocial || 'N/A',
      funcionarios: parsedData.funcionarios?.length || 0,
      ghes: parsedData.ghes?.length || 0
    });
    
    res.json(parsedData);
    
  } catch (error) {
    console.error('[IMPORT] Erro:', error);
    res.status(500).json({ error: 'Erro ao importar documento: ' + error.message });
  }
});

// AI Suggestions Endpoint
app.post('/api/ai/suggest-risks', async (req, res) => {
  try {
    const { cnae, atividade } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Você é um especialista em Segurança do Trabalho Rural.
A empresa tem a atividade: "${atividade}" (CNAE: ${cnae}).
Me sugira 2 a 3 Grupos Homogêneos de Exposição (GHEs) comuns para essa atividade rural.
Retorne um JSON válido contendo a estrutura:
{
  "ghes": [
    {
      "setor": "Nome do setor (ex: Campo)",
      "funcoes": "Funções do GHE (ex: Tratorista, Pulverizador)",
      "riscos": "Lista de riscos separados por vírgula (ex: Ruído, Poeira, Radiação não ionizante)",
      "exames": "Lista de exames separados por vírgula (ex: Avaliação Clínica, Audiometria)"
    }
  ]
}
Responda APENAS com o JSON. Nenhuma palavra a mais, nada de crases ou marcação markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    let aiText = response.text();
    // Clean up markdown block if present
    if (aiText.startsWith('```json')) {
      aiText = aiText.replace(/^\`\`\`json/g, '').replace(/\`\`\`$/g, '').trim();
    }
    
    const data = JSON.parse(aiText);
    res.json(data);

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// =============================================
// Saved Companies CRUD
// =============================================
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');

function loadCompanies() {
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      return JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    }
  } catch (e) { console.error('Error loading companies:', e); }
  return [];
}

function saveCompanies(companies) {
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf8');
}

app.get('/api/companies', (req, res) => {
  res.json(loadCompanies());
});

app.post('/api/companies', (req, res) => {
  try {
    const company = req.body;
    const companies = loadCompanies();
    
    // Check if company already exists (by CNPJ)
    const cnpjClean = (company.empresa?.cnpj || '').replace(/\D/g, '');
    const existingIdx = companies.findIndex(c => 
      (c.empresa?.cnpj || '').replace(/\D/g, '') === cnpjClean && cnpjClean.length > 0
    );
    
    if (existingIdx >= 0) {
      companies[existingIdx] = { ...company, savedAt: new Date().toISOString() };
    } else {
      company.savedAt = new Date().toISOString();
      companies.push(company);
    }
    
    saveCompanies(companies);
    console.log(`[COMPANY] Empresa salva: ${company.empresa?.razaoSocial || 'N/A'}`);
    res.json({ success: true, count: companies.length });
    
  } catch (error) {
    console.error('[COMPANY] Erro:', error);
    res.status(500).json({ error: 'Erro ao salvar empresa' });
  }
});

app.delete('/api/companies/:index', (req, res) => {
  try {
    const companies = loadCompanies();
    const index = parseInt(req.params.index);
    
    if (index >= 0 && index < companies.length) {
      const removed = companies.splice(index, 1);
      saveCompanies(companies);
      console.log(`[COMPANY] Empresa removida: ${removed[0]?.empresa?.razaoSocial || 'N/A'}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Empresa não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover empresa' });
  }
});

// =============================================
// Helper Functions
// =============================================
function formatCNPJ(cnpj) {
  const c = cnpj.replace(/\D/g, '');
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatCEP(cep) {
  const c = String(cep).replace(/\D/g, '');
  return c.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function formatPhone(phone) {
  if (!phone) return '';
  const p = phone.replace(/\D/g, '');
  if (p.length === 11) return p.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (p.length === 10) return p.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return phone;
}

function formatCNAE(cnae) {
  const c = cnae.replace(/\D/g, '');
  if (c.length === 7) return `${c.substr(0,4)}-${c[4]}/${c.substr(5)}`;
  return cnae;
}

function buildAddress(data) {
  const parts = [];
  if (data.descricao_tipo_de_logradouro) parts.push(data.descricao_tipo_de_logradouro);
  if (data.logradouro) parts.push(data.logradouro);
  if (data.numero) parts.push(`nº ${data.numero}`);
  if (data.complemento) parts.push(data.complemento);
  return parts.join(', ') || '';
}

// =============================================
// DOCX Text Parser (regex-based extraction)
// =============================================
function parseDocxText(text) {
  const data = {
    empresa: {},
    funcionarios: [],
    ambientes: [],
    ghes: [],
    epis: [],
    epiMatrix: {},
    treinamentos: [],
    documentos: [],
    procedimentos: {},
    exames: [],
    cats: [],
    acoes: [],
    encerramento: {}
  };

  try {
    // === EMPRESA ===
    data.empresa.razaoSocial = extractField(text, /Raz[aã]o\s*Social[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.nomeFantasia = extractField(text, /Nome\s*Fantasia[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.cnpj = extractField(text, /CNPJ[:\s]*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\s\/]?\d{4}[\s-]?\d{2})/i);
    data.empresa.endereco = extractField(text, /Endere[çc]o[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.cep = extractField(text, /CEP[:\s]*([\d\.\-]+)/i);
    data.empresa.bairro = extractField(text, /Bairro[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.cidade = extractField(text, /Cidade[:\s]*(.+?)(?:\n|$)/i) || 
                          extractField(text, /Munic[ií]pio[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.uf = extractField(text, /\bUF[:\s]*([A-Z]{2})\b/i);
    data.empresa.telefone = extractField(text, /Telefone[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.email = extractField(text, /E-?mail[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.cnae = extractField(text, /CNAE[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.atividadeEconomica = extractField(text, /Atividade[:\s]*(.+?)(?:\n|$)/i) ||
                                     extractField(text, /Atividade\s*Econ[oô]mica[:\s]*(.+?)(?:\n|$)/i);
    data.empresa.grauRisco = extractField(text, /Grau\s*de\s*Risco[:\s]*(\d)/i);
    data.empresa.representanteLegal = extractField(text, /Representante\s*Legal[:\s]*(.+?)(?:\n|$)/i);

    // === FUNCIONÁRIOS ===
    // Look for table-like patterns: Setor | Função | Nº
    const funcSection = extractSection(text, /QUADRO DE FUNCION[AÁ]RIOS/i, /DESCRI[ÇC][AÃ]O DOS AMBIENTES|INVENT[AÁ]RIO/i);
    if (funcSection) {
      const funcLines = funcSection.split('\n').filter(l => l.trim() && !l.match(/QUADRO|Setor|Função|ID|Nº/i));
      funcLines.forEach(line => {
        const parts = line.split(/\t+|\s{2,}/);
        if (parts.length >= 2) {
          const cleaned = parts.filter(p => p.trim());
          if (cleaned.length >= 2) {
            data.funcionarios.push({
              setor: cleaned.length >= 3 ? cleaned[cleaned.length - 3] || cleaned[0] : cleaned[0],
              funcao: cleaned.length >= 3 ? cleaned[cleaned.length - 2] : cleaned[1],
              numFuncionarios: cleaned[cleaned.length - 1]?.match(/\d+/) ? cleaned[cleaned.length - 1].trim() : ''
            });
          }
        }
      });
    }

    // === GHEs ===
    const gheRegex = /GHE\s*(\d+)\s*[-–]\s*(.+?)(?:\n|$)/gi;
    let gheMatch;
    while ((gheMatch = gheRegex.exec(text)) !== null) {
      const gheName = gheMatch[2].trim();
      
      // Find the section for this GHE
      const gheStartIdx = gheMatch.index;
      const nextGheMatch = text.indexOf('GHE', gheStartIdx + gheMatch[0].length);
      const gheEndIdx = nextGheMatch > 0 ? nextGheMatch : gheStartIdx + 3000;
      const gheSection = text.substring(gheStartIdx, gheEndIdx);
      
      const ghe = {
        nome: gheName,
        setor: extractField(gheSection, /Setor[:\s]*(.+?)(?:\n|$)/i) || '',
        funcao: extractField(gheSection, /Fun[çc][aã]o[:\s]*(.+?)(?:\n|$)/i) || gheName,
        descricaoAtividades: extractField(gheSection, /Descri[çc][aã]o\s*das?\s*Atividades?[:\s]*(.+?)(?:\n|$)/i) || '',
        riscos: [],
        recomendacoes: extractField(gheSection, /Recomenda[çc][aã]o[:\s]*(.+?)(?:\n|$)/i) || ''
      };
      
      // Extract risks from GHE section
      const riskAgents = ['Mecânico', 'Físico', 'Químico', 'Biológico', 'Ergonômico'];
      riskAgents.forEach(agente => {
        const agenteRegex = new RegExp(`${agente}\\s+(.+?)\\s+(.+?)\\n`, 'gi');
        let riskMatch;
        const agentSection = gheSection;
        while ((riskMatch = agenteRegex.exec(agentSection)) !== null) {
          if (riskMatch[1] && riskMatch[1].trim().length > 3) {
            ghe.riscos.push({
              agente: agente,
              fator: riskMatch[1].trim().substring(0, 60),
              fonteGeradora: riskMatch[2] ? riskMatch[2].trim().substring(0, 80) : '',
              frequencia: 'Habitual',
              tecnicaUsada: 'Critério Qualitativo',
              medidasControle: '',
              eficaz: 'S',
              probabilidade: '2',
              severidade: '2'
            });
          }
        }
      });
      
      // If no risks were extracted, add a default one
      if (ghe.riscos.length === 0) {
        ghe.riscos.push({
          agente: '', fator: '', fonteGeradora: '', frequencia: '',
          tecnicaUsada: '', medidasControle: '', eficaz: '', probabilidade: '', severidade: ''
        });
      }
      
      data.ghes.push(ghe);
    }

    // === TREINAMENTOS ===
    const treinSection = extractSection(text, /TREINAMENTOS\s*APLIC[AÁ]VEIS/i, /DOCUMENTOS\s*OBRIGAT[OÓ]RIOS|PROCEDIMENTOS/i);
    if (treinSection) {
      const treinLines = treinSection.split('\n').filter(l => l.trim() && !l.match(/TREINAMENTOS|Descrição|Funções/i));
      treinLines.forEach(line => {
        const parts = line.split(/\t+|\s{2,}/);
        if (parts.length >= 1 && parts[0].trim().length > 5) {
          data.treinamentos.push({
            descricao: parts[0].trim(),
            funcoes: parts.slice(1).join(', ').trim() || 'Todas as funções'
          });
        }
      });
    }

    // Clean up empty/undefined values
    Object.keys(data.empresa).forEach(key => {
      if (!data.empresa[key]) data.empresa[key] = '';
    });

  } catch (parseError) {
    console.error('[IMPORT] Erro no parser:', parseError.message);
  }

  return data;
}

function extractField(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractSection(text, startRegex, endRegex) {
  const startMatch = text.match(startRegex);
  if (!startMatch) return null;
  
  const startIdx = startMatch.index;
  const remaining = text.substring(startIdx);
  const endMatch = remaining.match(endRegex);
  const endIdx = endMatch ? endMatch.index : Math.min(remaining.length, 3000);
  
  return remaining.substring(0, endIdx);
}

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║                                                  ║');
  console.log('  ║   🛡️  Gerador PGRTR — Servidor Ativo (v2.0)      ║');
  console.log('  ║                                                  ║');
  console.log(`  ║   🌐 http://localhost:${PORT}                        ║`);
  console.log('  ║                                                  ║');
  console.log('  ║   ✨ Novidades: Busca CNPJ, Importar DOCX,      ║');
  console.log('  ║   📋 Templates, Banco de Empresas                ║');
  console.log('  ║                                                  ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
});
