/* =============================================
   PGRTR Generator — Express Server (Enhanced)
   ============================================= */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

// Polyfill necessário para pdf-parse no Node 21+
if (typeof DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const { generatePGRTR } = require('./generate-docx');
// const { TABELA_27_ESOCIAL, CATEGORIAS_EXAMES, RISCOS_EXAMES_MAP, getExamesRecomendados } = require('./esocial-tabela27');

const app = express();
const PORT = 3000;

// Data directory for saved companies (Use /tmp on Vercel/Production)
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, 'data');
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (err) {
  console.warn('[WARNING] Cannot create DATA_DIR. Running in read-only environment:', err.message);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// =============================================
// Generate DOCX endpoint
// =============================================

app.post('/api/generate', async (req, res) => {
  try {
    const data = req.body;
    
    if (!data || !data.empresa) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    console.log(`[PGRTR] Gerando relatório programático para: ${data.empresa.razaoSocial || 'N/A'}`);
    
    // Gerar o buffer final usando a biblioteca docx
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
    console.log(`[PGRTR] Relatório gerado com sucesso via gerador programático (${(buffer.length / 1024).toFixed(1)} KB)`);
    
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
// Importar PGRTR existente (.docx ou .pdf)
// =============================================
app.post('/api/import-file', async (req, res) => {
  try {
    const { fileBase64, fileType } = req.body;
    
    if (!fileBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const buffer = Buffer.from(fileBase64, 'base64');
    let text = '';
    
    if (fileType === 'pdf') {
      console.log(`[IMPORT] PDF detectado (${(buffer.length / 1024).toFixed(1)} KB). Extraindo texto fallback...`);
      try { const pdfData = await pdfParse(buffer); text = pdfData.text; }
      catch (e) { console.error('[IMPORT] pdf-parse falhou:', e.message); }
    } else {
      console.log(`[IMPORT] DOCX detectado (${(buffer.length / 1024).toFixed(1)} KB). Extraindo texto...`);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }
    
    console.log(`[IMPORT] Texto fallback: ${text.length} caracteres`);
    
    let parsedData;
    if (process.env.GEMINI_API_KEY) {
      console.log('[IMPORT] Gemini ativado. Enviando para IA...');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `Você é um engenheiro de segurança do trabalho especialista em PGRTR.

O documento em anexo (ou texto abaixo) é um PGRTR criado em OUTRO MODELO/PADRÃO. Sua missão:
1. LER e INTERPRETAR 100% do conteúdo do documento
2. MAPEAR absolutamente todas as informações para a estrutura JSON abaixo
3. NÃO PERDER nenhuma informação — cada setor, função, risco, EPI, exame, treinamento
4. Campo não encontrado = deixe vazio "" ou valor padrão
5. Retorne APENAS JSON puro, sem markdown, sem backticks, sem explicações

REGRAS DE MAPEAMENTO:
- "empresa": Dados cadastrais. Busque razão social, CNPJ, endereço, CNAE, grau de risco, representante legal.
- "funcionarios": CADA função/cargo do documento => uma entrada com setor e quantidade.
- "ambientes": CADA setor/área de trabalho descrita (Campo, Packing House, Escritório, Oficina etc).
- "ghes": Grupos Homogêneos de Exposição. CADA grupo de trabalhadores com riscos similares:
  - nome, setor, funcao (funções separadas por vírgula), descricaoAtividades
  - riscos: array com TODOS os riscos (agente: Físico/Químico/Biológico/Ergonômico/Mecânico, fator, fonteGeradora, trajetoria, exposicaoAtividade, exposicaoNorma, medidasControle, metodologia, resultado, classificacaoRisco, probabilidade 1-5, severidade 1-5)
  - recomendacoes
- "exames": Exames médicos. gheFuncoes, riscos, exame, codigoEsocial, admissional/semestral/anual/mudancaRisco/retornoTrabalho (true/false)
- "epis": Para CADA função, quais EPIs usa. Campos booleanos: avental, boneArabe, botaCouro, botaImpermeavel, cintoSeguranca, kitPulverizacao, luvaMalhaAco, luvaQuimica, luvaVaqueta, luvaImpermeavel, luvaTricotada, manguito, mascaraFiltro, protetorAuricular, capacete, respiradorPFF2, oculos, vestimentaRF
- "treinamentos": Lista de treinamentos (descricao, funcoes)
- "documentos": Documentos complementares (descricao, norma)
- "procedimentos": Textos de procedimentos (animais, agrotoxicos, climaticas, penoso, eletrico, transito, residuos, acidentes)
- "cats": CATs registradas (data, numeroCat, tipoCat, tipoAcidente, parteAtingida, cid)
- "acoes": Plano de ação (acao, responsavel, prazo, g 1-5, u 1-5, t 1-5)
- "encerramento": Responsável técnico (responsavelTecnico, registroProfissional)

JSON COMPLETO:
{
  "empresa": { "razaoSocial": "", "nomeFantasia": "", "cnpj": "", "endereco": "", "cep": "", "bairro": "", "cidade": "", "uf": "", "telefone": "", "email": "", "representanteLegal": "", "cargoRepresentante": "", "cnae": "", "atividadeEconomica": "", "grauRisco": "", "dataEmissao": "" },
  "funcionarios": [ { "setor": "", "funcao": "", "nFuncionarios": "" } ],
  "ambientes": [ { "setor": "", "descricao": "", "funcoes": "" } ],
  "ghes": [ { "nome": "", "setor": "", "funcao": "", "descricaoAtividades": "", "riscos": [ { "agente": "", "fator": "", "fonteGeradora": "", "trajetoria": "", "exposicaoAtividade": "", "exposicaoNorma": "", "medidasControle": "", "metodologia": "Qualitativa", "resultado": "", "classificacaoRisco": "", "probabilidade": "", "severidade": "" } ], "recomendacoes": "" } ],
  "exames": [ { "gheFuncoes": "", "riscos": "", "exame": "", "codigoEsocial": "", "admissional": true, "semestral": false, "anual": true, "mudancaRisco": true, "retornoTrabalho": true } ],
  "epis": [ { "funcao": "", "avental": false, "boneArabe": false, "botaCouro": false, "botaImpermeavel": false, "cintoSeguranca": false, "kitPulverizacao": false, "luvaMalhaAco": false, "luvaQuimica": false, "luvaVaqueta": false, "luvaImpermeavel": false, "luvaTricotada": false, "manguito": false, "mascaraFiltro": false, "protetorAuricular": false, "capacete": false, "respiradorPFF2": false, "oculos": false, "vestimentaRF": false } ],
  "treinamentos": [ { "descricao": "", "funcoes": "" } ],
  "documentos": [ { "descricao": "", "norma": "" } ],
  "procedimentos": { "animais": "", "agrotoxicos": "", "climaticas": "", "penoso": "", "eletrico": "", "transito": "", "residuos": "", "acidentes": "" },
  "cats": [ { "data": "", "numeroCat": "", "tipoCat": "", "tipoAcidente": "", "parteAtingida": "", "cid": "" } ],
  "acoes": [ { "acao": "", "responsavel": "", "prazo": "", "g": "", "u": "", "t": "" } ],
  "encerramento": { "responsavelTecnico": "", "registroProfissional": "" }
}

${fileType !== 'pdf' && text.length > 0 ? 'Texto do documento:\n' + text.substring(0, 50000) : 'Leia o arquivo PDF em anexo com perfeição e extraia absolutamente TUDO.'}`;

        const contents = [];
        if (fileType === 'pdf') {
          console.log('[IMPORT] Enviando PDF inteiro para Gemini via inlineData...');
          contents.push({ inlineData: { data: fileBase64, mimeType: 'application/pdf' } });
        }
        contents.push(prompt);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: { temperature: 0.1 }
        });

        let aiText = response.text || '';
        if (typeof response.text === 'function') { aiText = response.text(); }
        aiText = aiText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
        
        parsedData = JSON.parse(aiText);
        console.log('[IMPORT] Gemini retornou JSON válido!');
      } catch (aiErr) {
        console.error('[IMPORT] Erro Gemini, usando fallback:', aiErr.message);
        parsedData = parseDocxText(text);
      }
    } else {
      console.log('[IMPORT] Sem API Key. Usando Regex parser...');
      parsedData = parseDocxText(text);
    }
    
    // Sanitização robusta dos dados
    parsedData = sanitizeImportedData(parsedData);
    
    console.log(`[IMPORT] Resultado final:`, {
      empresa: parsedData.empresa?.razaoSocial || 'N/A',
      funcionarios: parsedData.funcionarios?.length || 0,
      ambientes: parsedData.ambientes?.length || 0,
      ghes: parsedData.ghes?.length || 0,
      riscosTotais: (parsedData.ghes || []).reduce((s, g) => s + (g.riscos?.length || 0), 0),
      exames: parsedData.exames?.length || 0,
      epis: parsedData.epis?.length || 0,
      treinamentos: parsedData.treinamentos?.length || 0,
      acoes: parsedData.acoes?.length || 0
    });
    
    res.json(parsedData);
    
  } catch (error) {
    console.error('[IMPORT] Erro:', error);
    res.status(500).json({ error: 'Erro ao importar documento: ' + error.message });
  }
});

// =============================================
// API Config & Sanitization (Frontend direct processing)
// =============================================
app.get('/api/config', (req, res) => {
  res.json({ apiKey: process.env.GEMINI_API_KEY || '' });
});

app.post('/api/sanitize-import', (req, res) => {
  try {
    const sanitizedData = sanitizeImportedData(req.body);
    res.json(sanitizedData);
  } catch (error) {
    console.error('[SANITIZE] Erro:', error);
    res.status(500).json({ error: 'Erro ao sanitizar dados importados: ' + error.message });
  }
});

// Helpers
function _arr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
function _s(v) { return v == null ? '' : String(v).trim(); }

// Normaliza o agente de risco para os valores exatos do dropdown
const VALID_AGENTS = ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Mecânico'];
function normalizeAgente(val) {
  if (!val) return '';
  const v = String(val).trim();
  // Match direto
  const found = VALID_AGENTS.find(a => a.toLowerCase() === v.toLowerCase());
  if (found) return found;
  // Match parcial (ex: "Mecânico/Acidentes" => "Mecânico", "Físico - Ruído" => "Físico")
  const partial = VALID_AGENTS.find(a => v.toLowerCase().includes(a.toLowerCase()));
  if (partial) return partial;
  // Aliases comuns
  const aliases = {
    'acidente': 'Mecânico', 'acidentes': 'Mecânico', 'mecanico': 'Mecânico',
    'fisico': 'Físico', 'quimico': 'Químico', 'biologico': 'Biológico',
    'ergonomico': 'Ergonômico', 'de acidente': 'Mecânico'
  };
  const lower = v.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  return aliases[lower] || v;
}

// Normaliza o fator de risco para os valores exatos do dropdown
const VALID_FACTORS = {
  'Físico': ['Calor', 'Radiação Não Ionizante (Solar)', 'Vibração de Corpo Inteiro', 'Ruído', 'Umidade'],
  'Químico': ['Defensivos agrícolas', 'Produtos de limpeza', 'Poeiras orgânicas', 'Fertilizantes'],
  'Biológico': ['Bactérias e parasitas', 'Microorganismos (contato com animais)', 'Fungos', 'Vírus'],
  'Ergonômico': ['Esforço físico', 'Movimentos repetitivos', 'Postura inadequada', 'Trabalho em pé prolongado'],
  'Mecânico': ['Queda de mesmo nível', 'Queda de nível (acima de 2m)', 'Ataque de animal', 'Cortes e lesões', 'Incêndio / explosão', 'Prensamento', 'Atropelamento']
};
function normalizeFator(agente, val) {
  if (!val || !agente) return val || '';
  const v = String(val).trim();
  const factors = VALID_FACTORS[agente];
  if (!factors) return v;
  // Match exato
  const exact = factors.find(f => f.toLowerCase() === v.toLowerCase());
  if (exact) return exact;
  // Match parcial (conteúdo)
  const partial = factors.find(f => v.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(v.toLowerCase()));
  if (partial) return partial;
  return v;
}

// Normaliza probabilidade/severidade para string "1"-"5"
function normalizeNumber(val) {
  if (!val) return '';
  const n = String(val).trim().replace(/[^0-9]/g, '');
  if (n && parseInt(n) >= 1 && parseInt(n) <= 5) return String(parseInt(n));
  return '';
}

// Normaliza eficaz para "S" ou "N"
function normalizeEficaz(val) {
  if (!val) return '';
  const v = String(val).trim().toLowerCase();
  if (v === 's' || v === 'sim' || v === 'yes' || v === 'eficaz' || v === 'true') return 'S';
  if (v === 'n' || v === 'não' || v === 'nao' || v === 'no' || v === 'ineficaz' || v === 'false') return 'N';
  return '';
}

// Normaliza frequência para "Habitual", "Intermitente" ou "Eventual"
function normalizeFrequencia(val) {
  if (!val) return 'Habitual';
  const v = String(val).trim().toLowerCase();
  if (v.includes('habitual') || v.includes('continu') || v.includes('diári') || v.includes('permanente')) return 'Habitual';
  if (v.includes('intermitente') || v.includes('periód') || v.includes('regular')) return 'Intermitente';
  if (v.includes('eventual') || v.includes('esporád') || v.includes('raro') || v.includes('ocasion')) return 'Eventual';
  return 'Habitual';
}

// Sanitizar e normalizar dados importados pela IA
function sanitizeImportedData(raw) {
  const d = { ...raw };
  
  // Empresa
  d.empresa = d.empresa || {};
  ['razaoSocial','nomeFantasia','cnpj','endereco','cep','bairro','cidade','uf','telefone','email','representanteLegal','cargoRepresentante','cnae','atividadeEconomica','grauRisco','dataEmissao'].forEach(f => d.empresa[f] = _s(d.empresa[f]));
  // Normalize field name aliases the AI might use
  if (!d.empresa.atividadeEconomica && d.empresa.atividade) d.empresa.atividadeEconomica = _s(d.empresa.atividade);
  if (!d.empresa.razaoSocial && d.empresa.razao_social) d.empresa.razaoSocial = _s(d.empresa.razao_social);
  if (!d.empresa.razaoSocial && d.empresa.nome) d.empresa.razaoSocial = _s(d.empresa.nome);
  if (!d.empresa.nomeFantasia && d.empresa.nome_fantasia) d.empresa.nomeFantasia = _s(d.empresa.nome_fantasia);
  if (!d.empresa.nomeFantasia && d.empresa.fantasia) d.empresa.nomeFantasia = _s(d.empresa.fantasia);
  if (!d.empresa.representanteLegal && d.empresa.representante) d.empresa.representanteLegal = _s(d.empresa.representante);
  if (!d.empresa.cargoRepresentante && d.empresa.cargo) d.empresa.cargoRepresentante = _s(d.empresa.cargo);
  // Normalize grauRisco to just the number
  if (d.empresa.grauRisco) {
    const grMatch = d.empresa.grauRisco.match(/[1-4]/);
    if (grMatch) d.empresa.grauRisco = grMatch[0];
  }
  
  // Funcionários
  d.funcionarios = _arr(d.funcionarios).map(f => ({
    setor: _s(f.setor), funcao: _s(f.funcao),
    nFuncionarios: _s(f.nFuncionarios || f.numFuncionarios || f.quantidade || '')
  })).filter(f => f.funcao || f.setor);
  
  // Ambientes
  d.ambientes = _arr(d.ambientes).map(a => ({
    setor: _s(a.setor || a.nome), descricao: _s(a.descricao || a.ambiente),
    funcoes: _s(a.funcoes || '')
  })).filter(a => a.setor || a.descricao);
  
  // GHEs
  d.ghes = _arr(d.ghes).map((g, i) => ({
    nome: _s(g.nome || g.nomeGhe || `GHE ${String(i+1).padStart(2,'0')}`),
    setor: _s(g.setor), funcao: _s(g.funcao || g.funcoes),
    descricaoAtividades: _s(g.descricaoAtividades || g.descricao || g.atividades),
    riscos: _arr(g.riscos).map(r => {
      const agente = normalizeAgente(r.agente || r.tipo);
      return {
        agente: agente,
        fator: normalizeFator(agente, r.fator || r.fatorRisco || r.nome),
        fonteGeradora: _s(r.fonteGeradora || r.fonte),
        frequencia: normalizeFrequencia(r.frequencia),
        trajetoria: _s(r.trajetoria),
        atividade: _s(r.exposicaoAtividade || r.atividade),
        norma: _s(r.exposicaoNorma || r.norma),
        nivelAcao: _s(r.nivelAcao),
        resultado: _s(r.resultado),
        tecnicaUsada: _s(r.tecnicaUsada || r.metodologia || 'Qualitativa'),
        medidasControle: _s(r.medidasControle || r.medidas),
        eficaz: normalizeEficaz(r.eficaz || r.eficacia),
        probabilidade: normalizeNumber(r.probabilidade),
        severidade: normalizeNumber(r.severidade || r.gravidade),
        classificacaoRisco: _s(r.classificacaoRisco || r.classificacao)
      };
    }),
    recomendacoes: _s(g.recomendacoes || g.recomendacao)
  })).filter(g => g.setor || g.funcao || g.nome);
  d.ghes.forEach(g => { if (!g.riscos.length) g.riscos = [{ agente:'',fator:'',fonteGeradora:'',frequencia:'Habitual',trajetoria:'',atividade:'',norma:'',nivelAcao:'',resultado:'',tecnicaUsada:'Qualitativa',medidasControle:'',eficaz:'',probabilidade:'',severidade:'',classificacaoRisco:'' }]; });
  
  // Exames
  d.exames = _arr(d.exames).map(e => ({
    gheFuncoes: _s(e.gheFuncoes || e.funcao || e.funcoes || e.ghe),
    riscos: _s(e.riscos || e.risco), exame: _s(e.exame || e.nomeExame || e.exames),
    codigoEsocial: _s(e.codigoEsocial || e.codigo),
    admissional: e.admissional !== undefined ? !!e.admissional : true,
    semestral: e.semestral !== undefined ? !!e.semestral : false,
    anual: e.anual !== undefined ? !!e.anual : true,
    mudancaRisco: e.mudancaRisco !== undefined ? !!e.mudancaRisco : true,
    retornoTrabalho: e.retornoTrabalho !== undefined ? !!e.retornoTrabalho : true
  })).filter(e => e.exame || e.gheFuncoes);
  
  // EPIs
  const epiKeys = ['avental','boneArabe','botaCouro','botaImpermeavel','cintoSeguranca','kitPulverizacao','luvaMalhaAco','luvaQuimica','luvaVaqueta','luvaImpermeavel','luvaTricotada','manguito','mascaraFiltro','protetorAuricular','capacete','respiradorPFF2','oculos','vestimentaRF'];
  d.epis = _arr(d.epis).map(e => {
    const row = { funcao: _s(e.funcao || e.cargo) };
    epiKeys.forEach(k => { row[k] = !!e[k]; });
    return row;
  }).filter(e => e.funcao);
  
  // Treinamentos
  d.treinamentos = _arr(d.treinamentos).map(t => ({
    descricao: _s(t.descricao || t.nome || t.treinamento), funcoes: _s(t.funcoes || t.publico)
  })).filter(t => t.descricao);
  
  // Documentos
  d.documentos = _arr(d.documentos).map(doc => ({
    descricao: _s(doc.descricao || doc.nome || doc.documento), norma: _s(doc.norma || doc.referencia)
  })).filter(doc => doc.descricao);
  
  // Procedimentos
  d.procedimentos = d.procedimentos || {};
  ['animais','agrotoxicos','climaticas','penoso','eletrico','transito','residuos','acidentes'].forEach(k => d.procedimentos[k] = _s(d.procedimentos[k]));
  
  // CATs
  d.cats = _arr(d.cats).map(c => ({
    data: _s(c.data), numeroCat: _s(c.numeroCat || c.numero), tipoCat: _s(c.tipoCat || c.tipo),
    tipoAcidente: _s(c.tipoAcidente), parteAtingida: _s(c.parteAtingida), cid: _s(c.cid)
  })).filter(c => c.numeroCat || c.data);
  
  // Ações
  d.acoes = _arr(d.acoes).map(a => ({
    acao: _s(a.acao || a.descricao || a.medida), responsavel: _s(a.responsavel),
    prazo: _s(a.prazo), g: normalizeNumber(a.g || a.gravidade), u: normalizeNumber(a.u || a.urgencia), t: normalizeNumber(a.t || a.tendencia)
  })).filter(a => a.acao);
  
  // Encerramento
  d.encerramento = d.encerramento || {};
  d.encerramento.responsavelTecnico = _s(d.encerramento.responsavelTecnico || d.encerramento.responsavel);
  d.encerramento.registroProfissional = _s(d.encerramento.registroProfissional || d.encerramento.registro || d.encerramento.crea);
  
  return d;
}

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

// Export the Express API for Vercel
module.exports = app;
