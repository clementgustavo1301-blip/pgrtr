/* =============================================
   PGRTR Generator — DOCX Generation Module
   Replicates the exact structure of the template, including headers and landscape sections
   ============================================= */

const docx = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, PageBreak, Header, Footer, PageNumber, NumberFormat,
  VerticalAlign, ShadingType, PageOrientation, TextDirection, HeightRule,
  convertInchesToTwip
} = docx;

// =============================================
// Constants
// =============================================
const FONT = 'Arial';
const SZ = { xs: 16, sm: 18, md: 22, lg: 24, xl: 28, xxl: 36, cover: 52 }; // half-pts

// Colors based on the original template (Green Theme)
const CLR = {
  primary: '2D5A1B',
  headerBg: '4E7E2E',
  white: 'FFFFFF',
  black: '000000',
  gray: '666666',
  lightGray: 'F2F2F2',
  labelBg: '8DB86A'
};

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 }
};
const MARGINS = { top: 40, bottom: 40, left: 80, right: 80 };

// Page Sizes (A4)
const PAGE_PORTRAIT = { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69), orientation: PageOrientation.PORTRAIT };
const PAGE_LANDSCAPE = { width: convertInchesToTwip(11.69), height: convertInchesToTwip(8.27), orientation: PageOrientation.LANDSCAPE };
const PAGE_MARGINS = { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) };

// =============================================
// Risk Data
// =============================================
const RISK_DAMAGES_TABLE = [
  { agente: 'Físico', fator: 'Calor', dano: 'Aumento da irritabilidade, fraqueza, depressão, ansiedade e incapacidade de concentração.' },
  { agente: 'Físico', fator: 'Radiação Não Ionizante (Solar)', dano: 'Queimaduras, dermatites, desidratação, insolação.' },
  { agente: 'Físico', fator: 'Vibração de Corpo Inteiro', dano: 'Doenças vasculares, neurológicas e musculares.' },
  { agente: 'Ergonômico', fator: 'Esforço físico', dano: 'Cansaço, dores musculares, hipertensão arterial, diabetes, úlceras.' },
  { agente: 'Ergonômico', fator: 'Movimentos repetitivos', dano: 'LER/DORT, tendinites, síndrome do túnel do carpo.' },
  { agente: 'Ergonômico', fator: 'Postura inadequada', dano: 'Dores na coluna, problemas posturais crônicos.' },
  { agente: 'Mecânico', fator: 'Queda de mesmo nível', dano: 'Fraturas, contusões, escoriações, entorses.' },
  { agente: 'Mecânico', fator: 'Ataque de animal', dano: 'Fraturas, hematomas, lacerações, traumatismo craniano, perfurações.' },
  { agente: 'Mecânico', fator: 'Cortes e lesões', dano: 'Cortes, lesões, hematomas, amputações e fraturas.' },
  { agente: 'Mecânico', fator: 'Queda de nível (acima de 2m)', dano: 'Fraturas, escoriações, cortes, sangramento.' },
  { agente: 'Mecânico', fator: 'Incêndio / explosão', dano: 'Lesões, fraturas, hematomas, queimaduras, intoxicação e morte.' },
  { agente: 'Químico', fator: 'Defensivos agrícolas', dano: 'Intoxicação aguda/crônica, dermatites, problemas respiratórios.' },
  { agente: 'Químico', fator: 'Produtos de limpeza', dano: 'Dermatites, irritações respiratórias.' },
  { agente: 'Biológico', fator: 'Bactérias e parasitas', dano: 'Doenças infeccionais, parasitoses, doenças patológicas.' },
  { agente: 'Biológico', fator: 'Microorganismos (contato com animais)', dano: 'Doenças infectocontagiosas, infecções e morte.' }
];

const RISK_COLORS = {
  'Mecânico': { bg: '5B9BD5', color: 'FFFFFF' },     // Blue
  'Físico': { bg: '00B050', color: 'FFFFFF' },       // Green
  'Ergonômico': { bg: 'FFFF00', color: '000000' },   // Yellow
  'Químico': { bg: 'FF0000', color: 'FFFFFF' },      // Red
  'Biológico': { bg: '833C0B', color: 'FFFFFF' },    // Brown
  'Mecânico/Acidente': { bg: '5B9BD5', color: 'FFFFFF' } // Blue (alias)
};

const CLASS_COLORS = {
  'Trivial': { bg: 'E7E6E6', color: '000000' },      // Grey
  'Tolerável': { bg: '00B050', color: 'FFFFFF' },    // Green
  'Moderado': { bg: 'FFFF00', color: '000000' },     // Yellow
  'Substancial': { bg: 'F4B183', color: '000000' },  // Orange
  'Intolerável': { bg: 'FF0000', color: 'FFFFFF' }   // Red
};

const GUT_ROWS = [
  { nota: '01', g: 'Sem gravidade', u: 'Pode esperar', t: 'Não mudar nada' },
  { nota: '02', g: 'Pouco grave', u: 'Pouco urgente', t: 'Piorar em longo prazo' },
  { nota: '03', g: 'Grave', u: 'O mais rápido possível', t: 'Piorar em médio prazo' },
  { nota: '04', g: 'Muito grave', u: 'Com alguma urgência', t: 'Piorar em curto prazo' },
  { nota: '05', g: 'Extremamente grave', u: 'Ação imediata', t: 'Piorará rapidamente' }
];

// =============================================
// Helpers
// =============================================
function t(text, opts = {}) {
  return new TextRun({ text: text || '', font: FONT, size: opts.size || SZ.md, bold: !!opts.bold, italics: !!opts.italics, color: opts.color || CLR.black });
}

function p(text, opts = {}) {
  const children = typeof text === 'string' ? [t(text, opts)] : (Array.isArray(text) ? text : [text]);
  return new Paragraph({
    children,
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after !== undefined ? opts.after : 120, before: opts.before || 0 },
    indent: opts.indent
  });
}

function pCenter(text, opts = {}) { return p(text, { ...opts, align: AlignmentType.CENTER }); }
function pLeft(text, opts = {}) { return p(text, { ...opts, align: AlignmentType.LEFT }); }
function blank(n = 1) { const r = []; for (let i = 0; i < n; i++) r.push(p('', { after: 0 })); return r; }

function tFont(text, opts = {}) {
  return new TextRun({ text: text || '', font: opts.font || FONT, size: opts.size || SZ.md, bold: !!opts.bold, italics: !!opts.italics, color: opts.color || CLR.black });
}

function pFont(text, opts = {}) {
  const children = typeof text === 'string' ? [tFont(text, opts)] : (Array.isArray(text) ? text : [text]);
  return new Paragraph({
    children,
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after !== undefined ? opts.after : 120, before: opts.before || 0 },
    indent: opts.indent
  });
}

function hdr(text, num) {
  return p([t(`${num} `, { bold: true, size: SZ.xl, color: CLR.primary }), t(text, { bold: true, size: SZ.xl, color: CLR.primary })], { align: AlignmentType.LEFT, before: 300, after: 200 });
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; }
}

function riskLabel(prob, sev) {
  const score = (parseInt(prob) || 0) * (parseInt(sev) || 0);
  if (!score) return '';
  if (score <= 3) return 'Trivial';
  if (score <= 6) return 'Tolerável';
  if (score <= 12) return 'Moderado';
  if (score <= 20) return 'Substancial';
  return 'Intolerável';
}

// Table cells
function cell(text, opts = {}) {
  const para = p(text || '', { size: opts.size || SZ.sm, bold: !!opts.bold, align: opts.align || AlignmentType.LEFT, after: 0, color: opts.fontColor || CLR.black, italics: opts.italics });
  return new TableCell({
    children: [para],
    verticalAlign: VerticalAlign.CENTER,
    margins: MARGINS,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: opts.colspan,
    rowSpan: opts.rowspan,
    shading: opts.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
    borders: opts.noBorder ? NO_BORDERS : ALL_BORDERS
  });
}

function hCell(text, opts = {}) {
  return cell(text, { ...opts, bold: true, bg: CLR.headerBg, fontColor: CLR.white, align: AlignmentType.CENTER, size: opts.size || SZ.sm });
}

function lblCell(text, opts = {}) {
  return cell(text, { ...opts, bold: true, bg: CLR.labelBg, size: SZ.sm });
}

function valCell(text, opts = {}) {
  return cell(text || '', { ...opts, size: opts.size || SZ.sm });
}

function tblRow(...cells) { return new TableRow({ children: cells, cantSplit: true }); }
function hdrRow(...cells) { return new TableRow({ children: cells, tableHeader: true, cantSplit: true }); }
function tbl(rows, width = 100) { return new Table({ width: { size: width, type: WidthType.PERCENTAGE }, rows }); }
function titleRow(text, cols) { return tblRow(cell(text, { colspan: cols, bold: true, bg: CLR.primary, fontColor: CLR.white, align: AlignmentType.CENTER, size: SZ.sm })); }

// =============================================
// Header Builder
// =============================================
function buildHeader(data) {
  const emp = data.empresa || {};
  const dEmit = fmtDate(emp.dataEmissao) || '[DD/MM/AAAA]';
  const razao = emp.razaoSocial || '[RAZÃO SOCIAL DA EMPRESA]';
  
  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              cell('[LOGOTIPO]', { bold: true, align: AlignmentType.CENTER, rowspan: 4, width: 15, fontColor: '999999' }),
              cell('PGRTR – PROGRAMA DE GERENCIAMENTO DE RISCOS NO TRABALHO RURAL', { bold: true, align: AlignmentType.CENTER, size: SZ.sm, bg: '8DB86A', fontColor: 'FFFFFF' })
            ]
          }),
          new TableRow({
            children: [
              cell(`Empresa: ${razao}`, { bold: true })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: ALL_BORDERS,
                children: [
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                      new TableRow({
                        children: [
                          cell(`Data de Revisão do Plano de Ação: ${dEmit}`, { width: 80, noBorder: true }),
                          cell('Revisão: 01', { width: 20, noBorder: true })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: ALL_BORDERS,
                children: [
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                      new TableRow({
                        children: [
                          cell(`Data de Emissão do PGRTR: ${dEmit}`, { width: 40, noBorder: true }),
                          cell(`Data de Revisão do PGRTR: ${dEmit}`, { width: 40, noBorder: true }),
                          cell('Doc nº 01', { width: 20, noBorder: true })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),
      p('', { after: 120 })
    ]
  });
}

function buildFooter() {
  return new Footer({
    children: [
      pCenter([
        t('Página '),
        new TextRun({ children: [PageNumber.CURRENT] }),
        t(' de '),
        new TextRun({ children: [PageNumber.TOTAL_PAGES] })
      ], { size: SZ.xs, color: CLR.gray })
    ]
  });
}

// =============================================
// MAIN
// =============================================
async function generatePGRTR(data) {
  const emp = data.empresa || {};

  // --- SECTION 1: COVER (Portrait, No Header) ---
  const sCover = [];
  sCover.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [cell('', { bg: '8DB86A' })], height: { value: 1200, rule: HeightRule.EXACT } })]
  }));
  sCover.push(...blank(2));
  sCover.push(pCenter('[LOGOTIPO DA EMPRESA]', { bold: true, size: SZ.md, color: CLR.gray }));
  sCover.push(...blank(2));
  sCover.push(pFont('PGRTR', { bold: true, size: 160, color: CLR.primary, font: 'Times New Roman', align: AlignmentType.CENTER }));
  sCover.push(pFont('Programa de Gerenciamento de Riscos no Trabalho Rural', { bold: true, italics: true, size: SZ.xl, color: CLR.black, font: 'Times New Roman', align: AlignmentType.CENTER }));
  sCover.push(...blank(6));
  sCover.push(pCenter('Razão Social:', { size: SZ.lg }));
  sCover.push(pCenter(emp.razaoSocial || '', { bold: true, size: SZ.lg }));
  sCover.push(pCenter(`CNPJ: ${emp.cnpj || ''}`, { size: SZ.md }));
  sCover.push(...blank(8));
  sCover.push(pCenter(`Data de Emissão: ${fmtDate(emp.dataEmissao)}`, { size: SZ.md }));

  // --- SECTION 2: INTRO & IDENTIFICAÇÃO (Portrait) ---
  const sIntro = [];
  sIntro.push(pCenter('SUMÁRIO', { bold: true, size: SZ.xl, color: CLR.primary, after: 300 }));
  const sumItems = [
    '1. INTRODUÇÃO', '2. IDENTIFICAÇÃO DO EMPREGADOR RURAL',
    '3. INVENTÁRIO DE RISCOS OCUPACIONAIS (IRO)', '4. MATRIZ DE EPI POR FUNÇÃO',
    '5. MATRIZ DE TREINAMENTOS', '6. MATRIZ DE DOCUMENTOS',
    '7. PROCEDIMENTOS NO TRABALHO COM ANIMAIS', '8. AGROTÓXICOS NO PGRTR',
    '9. CONDIÇÕES CLIMÁTICAS ADVERSAS', '10. TRABALHO PENOSO',
    '11. TRABALHO EM ZONA DE RISCO ELÉTRICO', '12. CONDIÇÕES INTERNAS DE TRÂNSITO VEICULAR',
    '13. GESTÃO DE RESÍDUOS', '14. ACIDENTES DE TRABALHO',
    '15. DIRETRIZES DA MEDICINA OCUPACIONAL', '16. TIPOS DE EXAMES OCUPACIONAIS',
    '17. PLANO DE VACINAÇÃO', '18. AÇÕES PRIMÁRIAS DE PREVENÇÃO À SAÚDE DO TRABALHADOR',
    '19. MATERIAIS PARA PRIMEIROS SOCORROS', '20. ASO – ATESTADO DE SAÚDE OCUPACIONAL',
    '21. PLANEJAMENTO DOS EXAMES OCUPACIONAIS', '22. DANOS À SAÚDE',
    '23. CAT – COMUNICAÇÃO DE ACIDENTE DE TRABALHO', '24. PLANO ANUAL DE AÇÕES',
    '25. ENCERRAMENTO'
  ];
  sumItems.forEach(item => {
    const parts = item.split(/\.\s/);
    sIntro.push(pLeft([t(`${parts[0]}. `, { bold: true, size: SZ.md }), t(parts.slice(1).join('. ') + '\t...', { size: SZ.md })], { after: 80 }));
  });
  
  sIntro.push(hdr('INTRODUÇÃO', '1.'));
  sIntro.push(p('De acordo com a Portaria SEPRT nº 22.677, de outubro de 2020 com início de vigência em 27 de outubro de 2021 regulamentada pela NR 31, passa a ser obrigatório que os empregadores rurais mantenham atualizados o PGRTR – Programa de Gerenciamento de Riscos no Trabalho Rural.'));
  sIntro.push(p('O PGRTR contém o Inventário Geral dos Riscos e Planilhas de Exames Ocupacionais relacionados às atividades existentes no empregador rural, contemplando o reconhecimento e a avaliação dos riscos físicos, químicos, biológicos, ergonômicos e mecânicos em atendimento da NR principal (NR 31) e das complementares NR 01, NR 07, NR 09 e NR 17.'));
  
  sIntro.push(hdr('IDENTIFICAÇÃO DO EMPREGADOR RURAL', '2.'));
  sIntro.push(tbl([
    titleRow('DADOS CADASTRAIS DA EMPRESA', 2),
    tblRow(lblCell('Razão Social', { width: 30 }), valCell(emp.razaoSocial, { width: 70 })),
    tblRow(lblCell('Nome Fantasia'), valCell(emp.nomeFantasia)),
    tblRow(lblCell('CNPJ'), valCell(emp.cnpj)),
    tblRow(lblCell('Endereço'), valCell(emp.endereco)),
    tblRow(lblCell('CEP'), valCell(emp.cep)),
    tblRow(lblCell('Bairro'), valCell(emp.bairro)),
    tblRow(lblCell('Cidade'), valCell(emp.cidade)),
    tblRow(lblCell('UF'), valCell(emp.uf)),
    tblRow(lblCell('Telefone'), valCell(emp.telefone)),
    tblRow(lblCell('E-mail'), valCell(emp.email))
  ]));
  sIntro.push(...blank(1));
  
  sIntro.push(tbl([
    titleRow('DADOS DO REPRESENTANTE LEGAL', 2),
    tblRow(lblCell('Nome Completo', { width: 30 }), valCell(emp.representanteLegal, { width: 70 }))
  ]));
  sIntro.push(...blank(1));
  
  sIntro.push(tbl([
    titleRow('ATIVIDADE ECONÔMICA PRINCIPAL', 2),
    tblRow(lblCell('CNAE Principal', { width: 30 }), valCell(emp.cnae, { width: 70 })),
    tblRow(lblCell('Atividade'), valCell(emp.atividadeEconomica)),
    tblRow(lblCell('Grau de Risco'), valCell(emp.grauRisco))
  ]));
  sIntro.push(...blank(1));
  
  const funcRows = [
    titleRow('QUADRO DE FUNCIONÁRIOS DA EMPRESA', 4),
    tblRow(hCell('ID', { width: 10 }), hCell('Setor', { width: 30 }), hCell('Função', { width: 40 }), hCell('Nº Funcionários', { width: 20 }))
  ];
  (data.funcionarios || []).forEach((f, i) => {
    funcRows.push(tblRow(cell(String(i + 1).padStart(2, '0'), { align: AlignmentType.CENTER }), valCell(f.setor), valCell(f.funcao), cell(f.numFuncionarios || '', { align: AlignmentType.CENTER })));
  });
  sIntro.push(tbl(funcRows));
  sIntro.push(...blank(1));
  
  const ambRows = [
    titleRow('DESCRIÇÃO DOS AMBIENTES DE TRABALHO', 2),
    tblRow(hCell('Setor / Ambiente', { width: 30 }), hCell('Descrição', { width: 70 }))
  ];
  (data.ambientes || []).forEach(a => ambRows.push(tblRow(valCell(a.setor), valCell(a.descricao))));
  sIntro.push(tbl(ambRows));
  sIntro.push(...blank(1));
  
  const relRows = [
    titleRow('RELAÇÃO DE FUNÇÕES POR AMBIENTE DE TRABALHO', 2),
    tblRow(hCell('Ambiente de Trabalho', { width: 35 }), hCell('Funções', { width: 65 }))
  ];
  (data.ambientes || []).forEach(a => relRows.push(tblRow(valCell(a.setor), valCell(a.funcoes))));
  sIntro.push(tbl(relRows));

  // --- SECTION 3: IRO & EPI (Landscape) ---
  const sIroEpi = [];
  sIroEpi.push(hdr('INVENTÁRIO DE RISCOS OCUPACIONAIS (IRO)', '3.'));
  sIroEpi.push(p('Para obtenção do inventário de riscos global da empresa foram avaliadas todas as funções mediante reconhecimento e avaliação da exposição aos riscos ocupacionais atrelados às atividades desenvolvidas pelo cargo e ambientes de trabalho. Abaixo consta a separação de inventário de riscos com uma planilha separada por GHE'));
  sIroEpi.push(new Paragraph({ children: [new PageBreak()] }));

  (data.ghes || []).forEach((ghe, gi) => {
    const num = String(gi + 1).padStart(2, '0');
    
    // GHE Header Table
    const headerRows = [];
    headerRows.push(tblRow(cell(`GHE ${num} - ${ghe.nome || '[NOME DA FUNÇÃO]'}`, { colspan: 3, bold: true, bg: '8DB86A', align: AlignmentType.CENTER, size: 16 })));
    headerRows.push(tblRow(
      lblCell('Setor:', { size: 14 }), valCell(ghe.setor || '', { italics: true, size: 14 }),
      valCell(`Função: ${ghe.funcao || ''}`, { italics: true, size: 14, bold: true })
    ));
    headerRows.push(tblRow(lblCell('Descrição das Atividades:', { size: 14 }), valCell(ghe.descricaoAtividades || '', { colspan: 2, italics: true, size: 14 })));
    sIroEpi.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [2000, 4000, 4000], rows: headerRows }));

    // GHE Risks Table
    const gheRows = [];
    gheRows.push(hdrRow(
      hCell('Agente de Risco', { rowspan: 2, size: 12 }), hCell('Fator de Risco', { rowspan: 2, size: 12 }), hCell('Fonte Geradora (Perigo)', { rowspan: 2, size: 12 }),
      hCell('Avaliações Quantitativas', { colspan: 6, size: 12 }), hCell('Medidas de Controle Existentes', { colspan: 2, size: 12 }), 
      hCell('Metodologia', { rowspan: 2, size: 12 }), hCell('Matriz de Risco', { colspan: 3, size: 12 })
    ));
    gheRows.push(hdrRow(
      hCell('Trajetória', { size: 12 }), hCell('Frequência Exposição', { size: 12 }), hCell('L.T.', { size: 12 }), hCell('Nível de Ação', { size: 12 }), hCell('Resultado', { size: 12 }), hCell('Técnica Utilizada', { size: 12 }),
      hCell('Descrição das Medidas', { size: 12 }), hCell('Eficaz (S/N)', { size: 12 }), 
      hCell('Probabilidade', { size: 12 }), hCell('Severidade', { size: 12 }), hCell('Classif. do Risco', { size: 12 })
    ));
    (ghe.riscos || []).forEach(risk => {
      const agenteColor = RISK_COLORS[risk.agente] || {};
      const classifStr = riskLabel(risk.probabilidade, risk.severidade);
      const classifColor = CLASS_COLORS[classifStr] || {};
      
      gheRows.push(tblRow(
        cell(risk.agente, { align: AlignmentType.CENTER, bg: agenteColor.bg, fontColor: agenteColor.color, bold: true, size: 12 }),
        valCell(risk.fator, { size: 12 }), valCell(risk.fonteGeradora, { size: 12 }), 
        valCell(risk.trajetoria || '', { size: 12 }), valCell(risk.frequencia || '', { size: 12 }), valCell('', { size: 12 }), // L.T.
        valCell(risk.nivelAcao || '', { size: 12 }), valCell(risk.resultado || '', { size: 12 }), valCell(risk.tecnicaUsada || '', { size: 12 }), 
        valCell(risk.medidasControle || '', { size: 12 }), valCell(risk.eficaz || '', { align: AlignmentType.CENTER, size: 12 }), 
        valCell('Matriz 6x4', { align: AlignmentType.CENTER, size: 12 }), // Metodologia
        valCell(risk.probabilidade || '', { align: AlignmentType.CENTER, size: 12 }),
        valCell(risk.severidade || '', { align: AlignmentType.CENTER, size: 12 }), 
        cell(classifStr, { align: AlignmentType.CENTER, bold: true, bg: classifColor.bg, fontColor: classifColor.color, size: 12 })
      ));
    });
    gheRows.push(new TableRow({
      children: [new TableCell({
        children: [new Paragraph({ children: [t('Recomendação de Novas Medidas de Controle: ', { bold: true, size: SZ.sm }), t(ghe.recomendacoes || '', { size: SZ.sm })], spacing: { after: 0 } })],
        columnSpan: 15, margins: MARGINS, borders: ALL_BORDERS
      })]
    }));
    sIroEpi.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: gheRows }));
    
    if (gi < data.ghes.length - 1) {
      sIroEpi.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  // EPI Matrix
  sIroEpi.push(new Paragraph({ children: [new PageBreak()] })); // Page break before EPI inside landscape
  sIroEpi.push(hdr('MATRIZ DE EPI POR FUNÇÃO', '4.'));
  
  const matrix = data.epiMatrix || {};
  const allFuncs = Object.keys(matrix);
  const funcsToShow = allFuncs.length > 0 ? allFuncs : (data.funcionarios || []).map(f => f.funcao).filter(f => f);
  const uniqueFuncs = [...new Set(funcsToShow)];
  const epis = data.epis || [];
  
  const epiRows = [];
  const epiCols = 2 + uniqueFuncs.length;
  
  epiRows.push(new TableRow({
    children: [cell('MATRIZ DE EPI POR FUNÇÃO', { colspan: epiCols, bold: true, bg: CLR.primary, fontColor: CLR.white, align: AlignmentType.CENTER, size: SZ.sm })],
    tableHeader: true, cantSplit: true
  }));
  
  const headerCells = [
    hCell('Equipamento de Proteção Individual (EPI)', { size: 14 }),
    hCell('C.A.', { size: 14 })
  ];
  
  uniqueFuncs.forEach(func => {
    headerCells.push(new TableCell({
      children: [p(func, { size: 12, bold: true, align: AlignmentType.CENTER, color: CLR.white })],
      verticalAlign: VerticalAlign.CENTER,
      textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
      shading: { type: ShadingType.SOLID, color: CLR.headerBg },
      borders: ALL_BORDERS,
      margins: MARGINS
    }));
  });

  epiRows.push(new TableRow({
    children: headerCells,
    tableHeader: true,
    cantSplit: true,
    height: { value: 3000, rule: HeightRule.EXACT }
  }));

  epis.forEach(epi => {
    const rowCells = [
      valCell(epi.nome, { size: 14 }),
      valCell(epi.ca || '-', { size: 14, align: AlignmentType.CENTER })
    ];
    uniqueFuncs.forEach(func => {
      const checked = matrix[func] && matrix[func][epi.nome];
      rowCells.push(cell(checked ? 'X' : '', { align: AlignmentType.CENTER, bold: true, size: 16 }));
    });
    epiRows.push(tblRow(...rowCells));
  });
  
  const colWidths = [4000, 1500, ...uniqueFuncs.map(() => 800)];
  sIroEpi.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: colWidths, rows: epiRows }));

  // --- SECTION 4: PROCEDIMENTOS (Portrait) ---
  const sProcs = [];
  sProcs.push(hdr('MATRIZ DE TREINAMENTOS', '5.'));
  const treinRows = [titleRow('TREINAMENTOS APLICÁVEIS', 2), tblRow(hCell('Descrição do Treinamento', { width: 50 }), hCell('Funções / Atividades', { width: 50 }))];
  (data.treinamentos || []).forEach(tr => treinRows.push(tblRow(valCell(tr.descricao), valCell(tr.funcoes))));
  sProcs.push(tbl(treinRows));
  
  sProcs.push(...blank(1));
  sProcs.push(hdr('MATRIZ DE DOCUMENTOS', '6.'));
  const docRows = [titleRow('DOCUMENTOS OBRIGATÓRIOS', 2), tblRow(hCell('Descrição do Documento', { width: 65 }), hCell('Norma de Referência', { width: 35 }))];
  (data.documentos || []).forEach(d => docRows.push(tblRow(valCell(d.descricao), valCell(d.norma))));
  sProcs.push(tbl(docRows));

  const procs = data.procedimentos || {};
  const procSections = [
    { n: '7.', t: 'PROCEDIMENTOS NO TRABALHO COM ANIMAIS', f: 'animais' }, { n: '8.', t: 'AGROTÓXICOS NO PGRTR', f: 'agrotoxicos' },
    { n: '9.', t: 'CONDIÇÕES CLIMÁTICAS ADVERSAS', f: 'climaticas' }, { n: '10.', t: 'TRABALHO PENOSO', f: 'penoso' },
    { n: '11.', t: 'TRABALHO EM ZONA DE RISCO ELÉTRICO', f: 'eletrico' }, { n: '12.', t: 'CONDIÇÕES INTERNAS DE TRÂNSITO VEICULAR', f: 'transito' },
    { n: '13.', t: 'GESTÃO DE RESÍDUOS', f: 'residuos' }, { n: '14.', t: 'ACIDENTES DE TRABALHO', f: 'acidentes' }
  ];
  procSections.forEach(sec => {
    sProcs.push(hdr(sec.t, sec.n));
    (procs[sec.f] || '').split('\n').filter(l => l.trim()).forEach(line => sProcs.push(p(line.trim(), { after: 60 })));
  });

  sProcs.push(hdr('DIRETRIZES DA MEDICINA OCUPACIONAL', '15.'));
  sProcs.push(p('As ações de saúde ocupacional referentes ao PGRTR são de responsabilidade do médico coordenador do PCMSO e da empresa, e incluem: monitoramento da saúde dos trabalhadores expostos aos riscos identificados no inventário; controle da imunização ativa dos empregados relacionada a riscos ocupacionais conforme o Ministério da Saúde.'));
  
  sProcs.push(hdr('TIPOS DE EXAMES OCUPACIONAIS', '16.'));
  ['• Admissional: realizado antes que o empregado assuma suas atividades;', '• Periódico: realizado em intervalos regulares conforme os riscos identificados;', '• Retorno ao trabalho: após ausência superior a 30 dias por motivo de doença ou acidente;', '• Mudança de risco: antes da mudança de função que implique exposição a risco diferente;', '• Demissional: realizado até a data de homologação da demissão.'].forEach(e => sProcs.push(p(e, { after: 60 })));
  
  sProcs.push(hdr('PLANO DE VACINAÇÃO', '17.'));
  ['• Hepatite B: todos os funcionários com exposição a riscos biológicos e objetos perfurocortantes;', '• Dupla adulto – tétano e difteria: todos os funcionários com risco de lesões abertas;', '• Demais vacinas conforme indicação do médico do trabalho e histórico ocupacional.'].forEach(v => sProcs.push(p(v, { after: 60 })));
  
  sProcs.push(hdr('AÇÕES PRIMÁRIAS DE PREVENÇÃO À SAÚDE DO TRABALHADOR', '18.'));
  ['• Treinamentos sobre percepção de riscos e importância do uso de EPIs;', '• Realização de palestras relacionadas à saúde;', '• Cartazes e orientações sobre prevenção (Diabetes, DST, COVID, Tabagismo, Depressão, etc.);', '• Implantação de Ginástica Laboral;', '• Campanhas de incentivo à vacinação.'].forEach(a => sProcs.push(p(a, { after: 60 })));
  
  sProcs.push(hdr('MATERIAIS PARA PRIMEIROS SOCORROS', '19.'));
  sProcs.push(p('Todo estabelecimento deverá estar equipado com material necessário à prestação dos primeiros socorros...'));
  sProcs.push(p('Instrumentos:', { bold: true })); sProcs.push(p('• Termômetro; Tesoura sem ponta; Pinça.'));
  sProcs.push(p('Material para Curativo:', { bold: true })); sProcs.push(p('• Luvas de Látex; Polvidine; Algodão Hidrófilo; Gaze esterilizada; Esparadrapo; Ataduras de crepe (4 e 10 cm); Curativo adesivo (Band Aid); Tampão Oftálmico; Cotonetes.'));
  sProcs.push(p('Antissépticos:', { bold: true })); sProcs.push(p('• Solução de Iodo; Soro Fisiológico 0,9%.'));
  
  sProcs.push(hdr('ASO – ATESTADO DE SAÚDE OCUPACIONAL', '20.'));
  sProcs.push(p('Para todo exame clínico ocupacional realizado, os médicos examinadores autorizados no presente PGRTR irão emitir o ASO...'));

  // --- SECTION 5: PLANOS (Landscape) ---
  const sPlanos = [];
  sPlanos.push(hdr('PLANEJAMENTO DOS EXAMES OCUPACIONAIS', '21.'));
  const exRows = [
    titleRow('PLANEJAMENTO DOS EXAMES OCUPACIONAIS', 9),
    tblRow(hCell('Função', { rowspan: 2 }), hCell('Agentes Ambientais (Riscos)', { rowspan: 2 }), hCell('Exame', { rowspan: 2 }), hCell('Código eSocial', { rowspan: 2 }), hCell('Periodicidade dos Exames', { colspan: 5 })),
    tblRow(hCell('Admissional'), hCell('6 meses após Admissão'), hCell('Periódico Anual'), hCell('Mudança de Risco'), hCell('Retorno ao Trabalho'))
  ];
  (data.exames || []).forEach(e => exRows.push(tblRow(
    valCell(e.gheFuncoes), valCell(e.riscos), valCell(e.exame), cell(e.codigoEsocial || '', { align: AlignmentType.CENTER }),
    cell(e.admissional ? 'X' : '', { align: AlignmentType.CENTER, bold: true }), cell(e.semestral ? 'X' : '', { align: AlignmentType.CENTER, bold: true }),
    cell(e.anual ? 'X' : '', { align: AlignmentType.CENTER, bold: true }), cell(e.mudancaRisco ? 'X' : '', { align: AlignmentType.CENTER, bold: true }),
    cell(e.retornoTrabalho ? 'X' : '', { align: AlignmentType.CENTER, bold: true })
  )));
  sPlanos.push(tbl(exRows));
  
  sPlanos.push(hdr('DANOS À SAÚDE', '22.'));
  const dmgRows = [titleRow('TABELA DE FATOR DE RISCO x PREJUÍZO À SAÚDE', 3), tblRow(hCell('Agente de Risco', { width: 15 }), hCell('Fator de Risco', { width: 30 }), hCell('Possível Dano à Saúde', { width: 55 }))];
  RISK_DAMAGES_TABLE.forEach(r => {
    const colorOpts = RISK_COLORS[r.agente] || {};
    dmgRows.push(tblRow(
      cell(r.agente, { bold: true, align: AlignmentType.CENTER, bg: colorOpts.bg, fontColor: colorOpts.color }),
      valCell(r.fator, { align: AlignmentType.CENTER }),
      valCell(r.dano, { align: AlignmentType.CENTER })
    ));
  });
  sPlanos.push(tbl(dmgRows));
  
  sPlanos.push(hdr('CAT – COMUNICAÇÃO DE ACIDENTE DE TRABALHO', '23.'));
  const catRows = [titleRow('REGISTRO DE CAT', 6), tblRow(hCell('Data'), hCell('Nº da CAT'), hCell('Tipo da CAT'), hCell('Tipo do Acidente'), hCell('Parte Atingida'), hCell('CID'))];
  if (data.cats && data.cats.length > 0) {
    data.cats.forEach(c => catRows.push(tblRow(cell(fmtDate(c.data) || '', { align: AlignmentType.CENTER }), valCell(c.numeroCat), valCell(c.tipoCat), valCell(c.tipoAcidente), valCell(c.parteAtingida), valCell(c.cid))));
  } else {
    for (let i = 0; i < 3; i++) catRows.push(tblRow(valCell(''), valCell(''), valCell(''), valCell(''), valCell(''), valCell('')));
  }
  sPlanos.push(tbl(catRows));
  
  sPlanos.push(hdr('PLANO ANUAL DE AÇÕES', '24.'));
  sPlanos.push(p('A ordem de prioridades das ações do presente PGR será definidas de acordo a metodologia da Matriz GUT através do produto da nota da gravidade, urgência e tendência constante na tabela abaixo.'));
  
  const gutRows = [titleRow('Metodologia da Matriz GUT', 4), tblRow(hCell('Nota'), hCell('Gravidade'), hCell('Urgência'), hCell('Tendência'))];
  GUT_ROWS.forEach(g => gutRows.push(tblRow(cell(g.nota, { bold: true, align: AlignmentType.CENTER }), valCell(g.g), valCell(g.u), valCell(g.t))));
  sPlanos.push(tbl(gutRows));
  sPlanos.push(...blank(1));
  
  const actRows = [
    tblRow(cell('PLANO DE AÇÃO', { colspan: 12, bold: true, bg: '8DB86A', fontColor: CLR.white, align: AlignmentType.CENTER }))
  ];
  
  actRows.push(tblRow(
    hCell('Hierarquia NR - 01', { colspan: 4 }),
    hCell('Medidas de Prevenção', { rowspan: 2 }),
    hCell('Projeto', { colspan: 2 }),
    hCell('Implementação', { colspan: 2 }),
    hCell('Aferição', { colspan: 2 }),
    hCell('Responsável', { rowspan: 2 })
  ));

  actRows.push(new TableRow({
    children: [
      new TableCell({ children: [pCenter('1- Eliminação', { size: 14 })], textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.SOLID, color: CLR.headerBg }, borders: ALL_BORDERS, margins: MARGINS }),
      new TableCell({ children: [pCenter('2- Controle Coletivo', { size: 14 })], textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.SOLID, color: CLR.headerBg }, borders: ALL_BORDERS, margins: MARGINS }),
      new TableCell({ children: [pCenter('3- Medidas Adm/Organ.', { size: 14 })], textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.SOLID, color: CLR.headerBg }, borders: ALL_BORDERS, margins: MARGINS }),
      new TableCell({ children: [pCenter('4- Proteção Individual', { size: 14 })], textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT, verticalAlign: VerticalAlign.CENTER, shading: { type: ShadingType.SOLID, color: CLR.headerBg }, borders: ALL_BORDERS, margins: MARGINS }),
      hCell('Data de Início', { size: 14 }), hCell('Data de Término', { size: 14 }),
      hCell('Data de Início', { size: 14 }), hCell('Data de Término', { size: 14 }),
      hCell('Data de Início', { size: 14 }), hCell('Data de Término', { size: 14 })
    ],
    height: { value: 1500, rule: HeightRule.EXACT }
  }));

  const sortedAcoes = [...(data.acoes || [])].sort((a, b) => ((parseInt(b.g)||0)*(parseInt(b.u)||0)*(parseInt(b.t)||0)) - ((parseInt(a.g)||0)*(parseInt(a.u)||0)*(parseInt(a.t)||0)));
  sortedAcoes.forEach(a => {
    const dt = a.prazo ? a.prazo.split('-') : ['',''];
    const ini = dt[0] ? dt[0].trim() : '';
    const fim = dt[1] ? dt[1].trim() : ini;

    actRows.push(tblRow(
      valCell(''), // Eliminação
      valCell(''), // Controle Coletivo
      valCell('X', { align: AlignmentType.CENTER, bold: true }), // Medidas Adm
      valCell(''), // Proteção Individual
      valCell(a.acao),
      valCell(ini, { align: AlignmentType.CENTER }), valCell(fim, { align: AlignmentType.CENTER }),
      valCell(''), valCell(''), // Implementação
      valCell(''), valCell(''), // Aferição
      valCell(a.responsavel)
    ));
  });
  sPlanos.push(tbl(actRows));

  // --- SECTION 6: ENCERRAMENTO (Portrait) ---
  const sEnc = [];
  sEnc.push(hdr('ENCERRAMENTO', '25.'));
  sEnc.push(p('O presente PGRTR constitui-se em instrumento de gestão dos riscos ocupacionais no trabalho rural, elaborado com base nas normas regulamentadoras vigentes, visando a prevenção de acidentes e doenças do trabalho e a preservação da saúde e integridade física dos trabalhadores rurais.'));
  sEnc.push(p('Este programa deverá ser revisado anualmente ou sempre que houver modificações nas condições de trabalho que possam alterar os riscos ocupacionais identificados.'));
  sEnc.push(...blank(3));
  const enc = data.encerramento || {};
  sEnc.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({ children: [pCenter('____________________________________________', { after: 40 }), pCenter(enc.responsavelTecnico || '[NOME DO RESPONSÁVEL TÉCNICO]', { bold: true, after: 40 }), pCenter(enc.registroProfissional || '[CRT/CREA/CFT nº XXXXX]', { after: 40 }), pCenter('Responsável Técnico pelo PGRTR', { after: 0 })], borders: NO_BORDERS, verticalAlign: VerticalAlign.TOP }),
        new TableCell({ children: [p('', { after: 0 })], borders: NO_BORDERS, width: { size: 5, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [pCenter('____________________________________________', { after: 40 }), pCenter(emp.representanteLegal || '[NOME DO REPRESENTANTE LEGAL]', { bold: true, after: 40 }), pCenter(emp.cargoRepresentante || '[Cargo]', { after: 40 }), pCenter('Empregador Rural', { after: 0 })], borders: NO_BORDERS, verticalAlign: VerticalAlign.TOP })
      ]
    })]
  }));
  sEnc.push(...blank(2));
  sEnc.push(pCenter(`${emp.cidade || '[Cidade]'}/${emp.uf || '[UF]'}, ${fmtDate(emp.dataEmissao) || '[DD/MM/AAAA]'}`, { italics: true }));

  // ===== BUILD DOCUMENT =====
  const headerDefault = buildHeader(data);
  const commonFooter = buildFooter();

  const doc = new Document({
    sections: [
      { properties: { page: { margin: PAGE_MARGINS, size: PAGE_PORTRAIT } }, children: sCover },
      { properties: { page: { margin: PAGE_MARGINS, size: PAGE_PORTRAIT } }, headers: { default: headerDefault }, footers: { default: commonFooter }, children: sIntro },
      { properties: { page: { margin: PAGE_MARGINS, size: PAGE_LANDSCAPE } }, headers: { default: headerDefault }, footers: { default: commonFooter }, children: sIroEpi },
      { properties: { page: { margin: PAGE_MARGINS, size: PAGE_PORTRAIT } }, headers: { default: headerDefault }, footers: { default: commonFooter }, children: sProcs },
      { properties: { page: { margin: PAGE_MARGINS, size: PAGE_LANDSCAPE } }, headers: { default: headerDefault }, footers: { default: commonFooter }, children: sPlanos },
      { properties: { page: { margin: PAGE_MARGINS, size: PAGE_PORTRAIT } }, headers: { default: headerDefault }, footers: { default: commonFooter }, children: sEnc }
    ]
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generatePGRTR };
