/* =============================================
   PGRTR Generator — Application Logic
   ============================================= */

// =============================================
// Pre-loaded Data Banks
// =============================================

const EPI_LIST = [
  'Avental Impermeável', 'Boné Árabe', 'Bota de Couro', 'Bota Impermeável',
  'Cinto de Segurança', 'Kit Pulverização', 'Luva Malha de Aço', 'Luva Química',
  'Luva de Vaqueta', 'Luva Impermeável', 'Luva Tricotada', 'Manguito Solar',
  'Máscara Filtro Carbono', 'Protetor Auricular', 'Capacete de Segurança',
  'Respirador PFF2', 'Óculos de Proteção', 'Vestimenta RF'
];

const DEFAULT_FUNCTIONS = [
  'Apicultor', 'Assistente Administrativo', 'Auxiliar de agrotóxico',
  'Auxiliar de almoxarifado', 'Auxiliar de campo', 'Auxiliar de escritório',
  'Auxiliar de packing house', 'Auxiliar de serviços gerais', 'Borracheiro',
  'Cozinheiro(a)', 'Eletricista', 'Irrigador', 'Irrigador – Aplic. fertilizante',
  'Mecânico', 'Motorista de ônibus', 'Pedreiro', 'Porteiro', 'Servente',
  'Técnico agrícola', 'Técnico de SST', 'Trabalhador rural – Campo',
  'Trabalhador rural – Expedição', 'Trabalhador rural – Packing house',
  'Trabalhador rural – Pincelamento', 'Trabalhador rural – Pulverização',
  'Tratorista', 'Tratorista – Pulverização', 'Vaqueiro'
];

const RISK_AGENTS = ['Físico', 'Químico', 'Biológico', 'Ergonômico', 'Mecânico'];

const RISK_FACTORS = {
  'Físico': ['Calor', 'Radiação Não Ionizante (Solar)', 'Vibração de Corpo Inteiro', 'Ruído', 'Umidade'],
  'Químico': ['Defensivos agrícolas', 'Produtos de limpeza', 'Poeiras orgânicas', 'Fertilizantes'],
  'Biológico': ['Bactérias e parasitas', 'Microorganismos (contato com animais)', 'Fungos', 'Vírus'],
  'Ergonômico': ['Esforço físico', 'Movimentos repetitivos', 'Postura inadequada', 'Trabalho em pé prolongado'],
  'Mecânico': ['Queda de mesmo nível', 'Queda de nível (acima de 2m)', 'Ataque de animal', 'Cortes e lesões', 'Incêndio / explosão', 'Prensamento', 'Atropelamento']
};

const RISK_DAMAGES = {
  'Calor': 'Aumento da irritabilidade, fraqueza, depressão, ansiedade e incapacidade de concentração.',
  'Radiação Não Ionizante (Solar)': 'Queimaduras, dermatites, desidratação, insolação.',
  'Vibração de Corpo Inteiro': 'Doenças vasculares, neurológicas e musculares.',
  'Ruído': 'Perda auditiva, estresse, irritabilidade.',
  'Umidade': 'Doenças de pele, micoses, problemas respiratórios.',
  'Esforço físico': 'Cansaço, dores musculares, hipertensão arterial, diabetes, úlceras.',
  'Movimentos repetitivos': 'LER/DORT, tendinites, síndrome do túnel do carpo.',
  'Postura inadequada': 'Dores na coluna, problemas posturais crônicos.',
  'Trabalho em pé prolongado': 'Varizes, dores nos membros inferiores, fadiga.',
  'Queda de mesmo nível': 'Fraturas, contusões, escoriações, entorses.',
  'Queda de nível (acima de 2m)': 'Fraturas, escoriações, cortes, sangramento.',
  'Ataque de animal': 'Fraturas, hematomas, lacerações, traumatismo craniano, perfurações.',
  'Cortes e lesões': 'Cortes, lesões, hematomas, amputações e fraturas.',
  'Incêndio / explosão': 'Lesões, fraturas, hematomas, queimaduras, intoxicação e morte.',
  'Prensamento': 'Fraturas, amputações, esmagamento.',
  'Atropelamento': 'Fraturas, traumatismo, morte.',
  'Defensivos agrícolas': 'Intoxicação aguda/crônica, dermatites, problemas respiratórios.',
  'Produtos de limpeza': 'Dermatites, irritações respiratórias.',
  'Poeiras orgânicas': 'Problemas respiratórios, alergias.',
  'Fertilizantes': 'Irritações na pele, problemas respiratórios.',
  'Bactérias e parasitas': 'Doenças infeccionais, parasitoses, doenças patológicas.',
  'Microorganismos (contato com animais)': 'Doenças infectocontagiosas, infecções e morte.',
  'Fungos': 'Micoses, infecções fúngicas.',
  'Vírus': 'Doenças virais, infecções.'
};

const DEFAULT_TRAININGS = [
  { descricao: 'Integração de Segurança (NR 31)', funcoes: 'Todas as funções' },
  { descricao: 'Uso correto de EPIs', funcoes: 'Todas as funções' },
  { descricao: 'Manuseio de Agrotóxicos (NR 31)', funcoes: 'Auxiliar de agrotóxico, Trabalhador rural – Pulverização, Tratorista – Pulverização' },
  { descricao: 'Primeiros Socorros', funcoes: 'Técnico de SST, Auxiliar de campo' },
  { descricao: 'Prevenção de Incêndio', funcoes: 'Todas as funções' },
  { descricao: 'Trabalho em Altura (NR 35)', funcoes: 'Eletricista, Pedreiro' },
  { descricao: 'Segurança com Máquinas e Equipamentos (NR 12)', funcoes: 'Tratorista, Mecânico' },
  { descricao: 'Direção Defensiva', funcoes: 'Motorista de ônibus, Tratorista' },
  { descricao: 'Ergonomia no Trabalho Rural', funcoes: 'Todas as funções' },
  { descricao: 'Segurança em Instalações Elétricas (NR 10)', funcoes: 'Eletricista' }
];

const DEFAULT_DOCUMENTS = [
  { descricao: 'PGRTR – Programa de Gerenciamento de Riscos no Trabalho Rural', norma: 'NR 31' },
  { descricao: 'PCMSO – Programa de Controle Médico de Saúde Ocupacional', norma: 'NR 07' },
  { descricao: 'AET – Análise Ergonômica do Trabalho', norma: 'NR 17' },
  { descricao: 'LTCAT – Laudo Técnico das Condições Ambientais de Trabalho', norma: 'NR 15 / IN 128' },
  { descricao: 'Ordens de Serviço de Segurança', norma: 'NR 01 / NR 31' },
  { descricao: 'Fichas de EPI', norma: 'NR 06' },
  { descricao: 'Registro de Treinamentos', norma: 'NR 31' },
  { descricao: 'PPP – Perfil Profissiográfico Previdenciário', norma: 'IN 128 INSS' }
];

const DEFAULT_EXAMS = [
  { gheFuncoes: "Fiscal de Campo", riscos: "", exame: "Avaliação Clínica Ocupacional", codigoEsocial: "0295", admissional: true, semestral: false, anual: true, mudancaRisco: true, retornoTrabalho: true },
  { gheFuncoes: "Fiscal de Campo + Pulverização", riscos: "", exame: "Avaliação Clínica Ocupacional, Acetilcolinesterase, Hemograma", codigoEsocial: "0295, 0750, 0693", admissional: true, semestral: true, anual: true, mudancaRisco: true, retornoTrabalho: true },
  { gheFuncoes: "Tratorista", riscos: "", exame: "Avaliação Clínica Ocupacional, Audiometria", codigoEsocial: "0295, 0281", admissional: true, semestral: false, anual: true, mudancaRisco: true, retornoTrabalho: true }
];

const PROBABILITY_OPTIONS = [
  { value: '1', label: '1 - Improvável' },
  { value: '2', label: '2 - Rara' },
  { value: '3', label: '3 - Possível' },
  { value: '4', label: '4 - Provável' },
  { value: '5', label: '5 - Muito Provável' }
];

const SEVERITY_OPTIONS = [
  { value: '1', label: '1 - Leve' },
  { value: '2', label: '2 - Moderada' },
  { value: '3', label: '3 - Significativa' },
  { value: '4', label: '4 - Grave' },
  { value: '5', label: '5 - Catastrófica' }
];

// =============================================
// Application State
// =============================================
let currentStep = 0;
const totalSteps = 8;
let autoSaveTimer = null;

let appData = {
  empresa: {},
  funcionarios: [],
  ambientes: [],
  ghes: [],
  epiMatrix: {},
  treinamentos: [],
  documentos: [],
  procedimentos: {
    animais: '',
    agrotoxicos: '',
    climaticas: '',
    penoso: '',
    eletrico: '',
    transito: '',
    residuos: '',
    acidentes: ''
  },
  exames: [],
  cats: [],
  acoes: [],
  encerramento: {}
};

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  initializeDefaults();
  bindInputListeners();
  renderAll();
  updateStepper();
  
  let selectedFileForImport = null;
  const importInput = document.getElementById('importDocxFile');
  const btnProcessarIA = document.getElementById('btnProcessarIA');
  
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const fileNameSpan = document.getElementById('importFileName');
      if (file) {
        selectedFileForImport = file;
        if (fileNameSpan) fileNameSpan.textContent = file.name;
        if (btnProcessarIA) btnProcessarIA.style.display = 'inline-flex';
      } else {
        selectedFileForImport = null;
        if (fileNameSpan) fileNameSpan.textContent = 'Nenhum arquivo selecionado';
        if (btnProcessarIA) btnProcessarIA.style.display = 'none';
      }
    });
  }

  if (btnProcessarIA) {
    btnProcessarIA.addEventListener('click', () => {
      if (selectedFileForImport) {
        handleImportDocx(selectedFileForImport);
      }
    });
  }
});

function initializeDefaults() {
  // Add default funcionarios if empty
  if (appData.funcionarios.length === 0) {
    addFuncionario();
  }
  // Add default ambientes if empty
  if (appData.ambientes.length === 0) {
    addAmbiente();
  }
  // Add default GHE if empty
  if (appData.ghes.length === 0) {
    addGHE();
  }
  // Load default treinamentos if empty
  if (appData.treinamentos.length === 0) {
    appData.treinamentos = DEFAULT_TRAININGS.map(t => ({ ...t }));
  }
  // Load default documentos if empty
  if (appData.documentos.length === 0) {
    appData.documentos = DEFAULT_DOCUMENTS.map(d => ({ ...d }));
  }
  // Load default exames if empty
  if (appData.exames.length === 0) {
    appData.exames = DEFAULT_EXAMS.map(e => ({ ...e }));
  }
  // Add default acao if empty
  if (appData.acoes.length === 0) {
    addAcao();
  }
  // Load default procedimentos texts
  const procTextareas = document.querySelectorAll('[data-field^="procedimentos."]');
  procTextareas.forEach(ta => {
    const field = ta.dataset.field.split('.')[1];
    if (!appData.procedimentos[field]) {
      appData.procedimentos[field] = ta.value;
    } else {
      ta.value = appData.procedimentos[field];
    }
  });

  // Set default date
  if (!appData.empresa.dataEmissao) {
    const today = new Date().toISOString().split('T')[0];
    appData.empresa.dataEmissao = today;
    const dateInput = document.getElementById('dataEmissao');
    if (dateInput) dateInput.value = today;
  }
}

// =============================================
// Auto-save & Storage
// =============================================
function collectAllData() {
  // Collect empresa fields
  document.querySelectorAll('[data-field^="empresa."]').forEach(el => {
    const key = el.dataset.field.split('.')[1];
    appData.empresa[key] = el.value;
  });

  // Collect procedimentos
  document.querySelectorAll('[data-field^="procedimentos."]').forEach(el => {
    const key = el.dataset.field.split('.')[1];
    appData.procedimentos[key] = el.value;
  });

  // Collect encerramento
  document.querySelectorAll('[data-field^="encerramento."]').forEach(el => {
    const key = el.dataset.field.split('.')[1];
    appData.encerramento[key] = el.value;
  });

  // Collect EPI matrix
  collectEPIMatrix();
}

function collectEPIMatrix() {
  const funcs = getUniqueFunctions();
  const matrix = {};
  funcs.forEach(func => {
    matrix[func] = {};
    EPI_LIST.forEach(epi => {
      const cb = document.querySelector(`input[data-epi-func="${func}"][data-epi-name="${epi}"]`);
      if (cb) {
        matrix[func][epi] = cb.checked;
      }
    });
  });
  appData.epiMatrix = matrix;
}

function saveToStorage() {
  collectAllData();
  try {
    localStorage.setItem('pgrtr_data', JSON.stringify(appData));
    showAutoSave();
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('pgrtr_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      appData = { ...appData, ...parsed };
      // Restore empresa fields
      Object.keys(appData.empresa).forEach(key => {
        const el = document.querySelector(`[data-field="empresa.${key}"]`);
        if (el) el.value = appData.empresa[key] || '';
      });
      // Restore encerramento fields
      Object.keys(appData.encerramento).forEach(key => {
        const el = document.querySelector(`[data-field="encerramento.${key}"]`);
        if (el) el.value = appData.encerramento[key] || '';
      });
    }
  } catch (e) {
    console.warn('Could not load from localStorage', e);
  }
}

function showAutoSave() {
  const indicator = document.getElementById('autosaveIndicator');
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}

function bindInputListeners() {
  document.addEventListener('input', (e) => {
    if (e.target.matches('.form-input, .form-select, .form-textarea, .epi-check')) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(saveToStorage, 800);
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('.form-select, .epi-check, input[type="checkbox"]')) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(saveToStorage, 500);
    }
  });
}

// =============================================
// Step Navigation
// =============================================
function nextStep() {
  if (currentStep < totalSteps - 1) {
    saveToStorage();
    currentStep++;
    showStep(currentStep);
    // Rebuild EPI matrix when entering step 3
    if (currentStep === 3) {
      renderEPIMatrix();
    }
  }
}

function prevStep() {
  if (currentStep > 0) {
    saveToStorage();
    currentStep--;
    showStep(currentStep);
    if (currentStep === 3) {
      renderEPIMatrix();
    }
  }
}

function goToStep(step) {
  saveToStorage();
  currentStep = step;
  showStep(currentStep);
  if (currentStep === 3) {
    renderEPIMatrix();
  }
}

function showStep(step) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.toggle('active', i === step);
  });
  updateStepper();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper() {
  const items = document.querySelectorAll('.stepper__item');
  const lines = document.querySelectorAll('.stepper__line');

  items.forEach((item, i) => {
    item.classList.remove('active', 'completed');
    if (i === currentStep) {
      item.classList.add('active');
    } else if (i < currentStep) {
      item.classList.add('completed');
      // Show checkmark for completed
      const circle = item.querySelector('.stepper__circle');
      circle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
    }
    item.onclick = () => {
      if (i <= currentStep + 1) goToStep(i);
    };
  });

  lines.forEach((line, i) => {
    line.classList.toggle('completed', i < currentStep);
  });
}

// =============================================
// Dynamic Funcionários
// =============================================
function addFuncionario(data = null) {
  const func = data || { setor: '', funcao: '', numFuncionarios: '' };
  appData.funcionarios.push(func);
  renderFuncionarios();
}

function removeFuncionario(index) {
  appData.funcionarios.splice(index, 1);
  renderFuncionarios();
  saveToStorage();
}

function renderFuncionarios() {
  const container = document.getElementById('funcionariosList');
  container.innerHTML = appData.funcionarios.map((f, i) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">Função ${i + 1}</span>
        <div class="dynamic-item__actions">
          <button class="btn btn--danger" onclick="removeFuncionario(${i})" ${appData.funcionarios.length <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Remover
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Setor <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(f.setor)}" placeholder="Ex: Campo, Packing House, Administrativo"
            onchange="appData.funcionarios[${i}].setor = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Função <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(f.funcao)}" placeholder="Ex: Trabalhador rural – Campo" list="funcoesSugestoes"
            onchange="appData.funcionarios[${i}].funcao = this.value">
          <datalist id="funcoesSugestoes">
            ${DEFAULT_FUNCTIONS.map(fn => `<option value="${fn}">`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label class="form-label">Nº de Funcionários</label>
          <input type="number" class="form-input" value="${f.numFuncionarios}" placeholder="Ex: 10" min="0"
            onchange="appData.funcionarios[${i}].numFuncionarios = this.value">
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================
// Dynamic Ambientes
// =============================================
function addAmbiente(data = null) {
  const amb = data || { setor: '', descricao: '', funcoes: '' };
  appData.ambientes.push(amb);
  renderAmbientes();
}

function removeAmbiente(index) {
  appData.ambientes.splice(index, 1);
  renderAmbientes();
  saveToStorage();
}

function renderAmbientes() {
  const container = document.getElementById('ambientesList');
  container.innerHTML = appData.ambientes.map((a, i) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">Ambiente ${i + 1}</span>
        <div class="dynamic-item__actions">
          <button class="btn btn--danger" onclick="removeAmbiente(${i})" ${appData.ambientes.length <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Remover
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Setor / Ambiente <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(a.setor)}" placeholder="Ex: Campo aberto, Packing House"
            onchange="appData.ambientes[${i}].setor = this.value">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Descrição do Ambiente</label>
          <textarea class="form-textarea" rows="2" placeholder="Descreva as características do ambiente de trabalho..."
            onchange="appData.ambientes[${i}].descricao = this.value">${escapeHtml(a.descricao)}</textarea>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Funções neste Ambiente</label>
          <input type="text" class="form-input" value="${escapeHtml(a.funcoes)}" placeholder="Ex: Trabalhador rural – Campo, Irrigador"
            onchange="appData.ambientes[${i}].funcoes = this.value">
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================
// Dynamic GHEs (Inventário de Riscos)
// =============================================
function addGHE(data = null) {
  const ghe = data || {
    nome: '',
    setor: '',
    funcao: '',
    descricaoAtividades: '',
    riscos: [createDefaultRisk()],
    recomendacoes: ''
  };
  appData.ghes.push(ghe);
  renderGHEs();
}

function removeGHE(index) {
  appData.ghes.splice(index, 1);
  renderGHEs();
  saveToStorage();
}

function duplicateGHE(index) {
  const copy = JSON.parse(JSON.stringify(appData.ghes[index]));
  copy.nome = copy.nome + ' (Cópia)';
  appData.ghes.push(copy);
  renderGHEs();
  saveToStorage();
  showToast('GHE Duplicado', 'O GHE foi copiado. Edite os dados necessários.');
}

async function suggestRisksAI() {
  const cnae = appData.empresa.cnae;
  const atividade = appData.empresa.atividadeEconomica;
  
  if (!cnae || !atividade) {
    showToast('Atenção', 'Preencha o CNAE e a Atividade Econômica na Etapa 1 primeiro.', 'warning');
    return;
  }
  
  const btn = document.getElementById('btnSuggestAI');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="loading-spinner__circle" style="width:16px;height:16px;border-width:2px;display:inline-block;margin-right:8px;"></span> Sugerindo...';
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/ai/suggest-risks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnae, atividade })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro na IA');
    }
    
    const data = await res.json();
    if (data.ghes && data.ghes.length > 0) {
      // Clear empty default GHE if it's the only one
      if (appData.ghes.length === 1 && !appData.ghes[0].nome && appData.ghes[0].riscos[0].agente === '') {
        appData.ghes = [];
      }
      
      data.ghes.forEach((g, idx) => {
        const ghe = {
          nome: g.setor || `GHE ${appData.ghes.length + 1}`,
          setor: g.setor || '',
          funcao: g.funcoes || '',
          descricaoAtividades: 'Sugestão IA: Verifique e edite',
          riscos: [createDefaultRisk()],
          recomendacoes: ''
        };
        // We put the AI suggested risks string in the first risk's description just to not lose it, or map it.
        ghe.riscos[0].agente = 'Mecânico/Acidentes';
        ghe.riscos[0].fonteGeradora = 'IA Sugeriu: ' + g.riscos;
        
        appData.ghes.push(ghe);
        
        // Add exams if suggested
        if (g.exames) {
          const exameCodes = [];
          const examesArr = g.exames.split(',').map(e => e.trim().toLowerCase());
          
          examesArr.forEach(exam => {
            for (const [key, code] of Object.entries(ESOCIAL_EXAM_MAP)) {
              if (exam.includes(key)) {
                if (!exameCodes.includes(code)) exameCodes.push(code);
                break;
              }
            }
          });
          
          appData.exames.push({
            gheFuncoes: g.funcoes,
            riscos: g.riscos,
            exame: g.exames,
            codigoEsocial: exameCodes.join(', '),
            admissional: true, semestral: false, anual: true, mudancaRisco: true, retornoTrabalho: true
          });
        }
      });
      
      renderGHEs();
      renderExames();
      saveToStorage();
      showToast('Sucesso', 'Sugestões de GHEs e Exames aplicadas!');
    }
  } catch (err) {
    showToast('Erro IA', err.message, 'error');
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}


function createDefaultRisk() {
  return {
    agente: '',
    fator: '',
    fonteGeradora: '',
    frequencia: '',
    trajetoria: '',
    atividade: '',
    norma: '',
    nivelAcao: '',
    resultado: '',
    tecnicaUsada: '',
    medidasControle: '',
    eficaz: '',
    probabilidade: '',
    severidade: ''
  };
}

function addRiskToGHE(gheIndex) {
  appData.ghes[gheIndex].riscos.push(createDefaultRisk());
  renderGHEs();
}

function removeRiskFromGHE(gheIndex, riskIndex) {
  appData.ghes[gheIndex].riscos.splice(riskIndex, 1);
  renderGHEs();
  saveToStorage();
}

function getRiskClassification(prob, sev) {
  const p = parseInt(prob) || 0;
  const s = parseInt(sev) || 0;
  const score = p * s;
  if (score === 0) return { label: '-', class: '' };
  if (score <= 3) return { label: 'Trivial', class: 'risk-chip--trivial' };
  if (score <= 6) return { label: 'Tolerável', class: 'risk-chip--toleravel' };
  if (score <= 12) return { label: 'Moderado', class: 'risk-chip--moderado' };
  if (score <= 20) return { label: 'Substancial', class: 'risk-chip--substancial' };
  return { label: 'Intolerável', class: 'risk-chip--intoleravel' };
}

function onAgentChange(gheIdx, riskIdx, value) {
  appData.ghes[gheIdx].riscos[riskIdx].agente = value;
  appData.ghes[gheIdx].riscos[riskIdx].fator = '';
  renderGHEs();
}

function renderGHEs() {
  const container = document.getElementById('gheList');
  container.innerHTML = appData.ghes.map((ghe, gi) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">GHE ${String(gi + 1).padStart(2, '0')} – ${escapeHtml(ghe.nome) || 'Sem nome'}</span>
        <div class="dynamic-item__actions">
          <button class="btn btn--ghost" onclick="duplicateGHE(${gi})" title="Duplicar GHE">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Duplicar
          </button>
          <button class="btn btn--danger" onclick="removeGHE(${gi})" ${appData.ghes.length <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Remover
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label">Nome do GHE <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(ghe.nome)}" placeholder="Ex: Trabalhadores de Campo"
            onchange="appData.ghes[${gi}].nome = this.value; renderGHEs();">
        </div>
        <div class="form-group">
          <label class="form-label">Setor</label>
          <input type="text" class="form-input" value="${escapeHtml(ghe.setor)}" placeholder="Ex: Campo"
            onchange="appData.ghes[${gi}].setor = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Função</label>
          <input type="text" class="form-input" value="${escapeHtml(ghe.funcao)}" placeholder="Ex: Trabalhador rural"
            onchange="appData.ghes[${gi}].funcao = this.value" list="funcoesSugestoes">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Descrição das Atividades</label>
          <textarea class="form-textarea" rows="2" placeholder="Descreva as atividades realizadas nesta função/setor..."
            onchange="appData.ghes[${gi}].descricaoAtividades = this.value">${escapeHtml(ghe.descricaoAtividades)}</textarea>
        </div>
      </div>

      <div class="ghe-risks mt-lg">
        <div class="d-flex align-center justify-between mb-md">
          <h4 style="font-size:0.9rem; color:var(--text-accent);">Riscos Identificados</h4>
          <button class="btn btn--ghost" onclick="addRiskToGHE(${gi})">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M12 4v16m8-8H4"/></svg>
            Adicionar Risco
          </button>
        </div>

        ${ghe.riscos.map((risk, ri) => {
          const classif = getRiskClassification(risk.probabilidade, risk.severidade);
          const factorOptions = risk.agente && RISK_FACTORS[risk.agente]
            ? RISK_FACTORS[risk.agente].map(f => `<option value="${f}" ${f === risk.fator ? 'selected' : ''}>${f}</option>`).join('')
            : '';
          return `
          <div style="background:rgba(10,14,26,0.5); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:var(--space-md); margin-bottom:var(--space-sm);">
            <div class="d-flex align-center justify-between mb-sm">
              <span style="font-size:0.78rem; color:var(--text-muted);">Risco ${ri + 1}</span>
              <button class="btn btn--danger" onclick="removeRiskFromGHE(${gi}, ${ri})" ${ghe.riscos.length <= 1 ? 'disabled' : ''}
                style="padding:4px 8px; font-size:0.72rem;">
                ✕
              </button>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Agente de Risco</label>
                <select class="form-select" onchange="onAgentChange(${gi}, ${ri}, this.value)">
                  <option value="">Selecione</option>
                  ${RISK_AGENTS.map(a => `<option value="${a}" ${a === risk.agente ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Fator de Risco</label>
                <select class="form-select" onchange="appData.ghes[${gi}].riscos[${ri}].fator = this.value">
                  <option value="">Selecione</option>
                  ${factorOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Fonte Geradora (Perigo)</label>
                <input type="text" class="form-input" value="${escapeHtml(risk.fonteGeradora)}" placeholder="Ex: Exposição solar"
                  onchange="appData.ghes[${gi}].riscos[${ri}].fonteGeradora = this.value">
              </div>
              <div class="form-group">
                <label class="form-label">Frequência / Exposição</label>
                <select class="form-select" onchange="appData.ghes[${gi}].riscos[${ri}].frequencia = this.value">
                  <option value="">Selecione</option>
                  <option ${risk.frequencia === 'Habitual' ? 'selected' : ''}>Habitual</option>
                  <option ${risk.frequencia === 'Intermitente' ? 'selected' : ''}>Intermitente</option>
                  <option ${risk.frequencia === 'Eventual' ? 'selected' : ''}>Eventual</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Medidas de Controle</label>
                <input type="text" class="form-input" value="${escapeHtml(risk.medidasControle)}" placeholder="EPI, EPC, Treinamento..."
                  onchange="appData.ghes[${gi}].riscos[${ri}].medidasControle = this.value">
              </div>
              <div class="form-group">
                <label class="form-label">Eficaz?</label>
                <select class="form-select" onchange="appData.ghes[${gi}].riscos[${ri}].eficaz = this.value">
                  <option value="">-</option>
                  <option ${risk.eficaz === 'S' ? 'selected' : ''}>S</option>
                  <option ${risk.eficaz === 'N' ? 'selected' : ''}>N</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Probabilidade</label>
                <select class="form-select" onchange="appData.ghes[${gi}].riscos[${ri}].probabilidade = this.value; renderGHEs();">
                  <option value="">-</option>
                  ${PROBABILITY_OPTIONS.map(o => `<option value="${o.value}" ${risk.probabilidade === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Severidade</label>
                <select class="form-select" onchange="appData.ghes[${gi}].riscos[${ri}].severidade = this.value; renderGHEs();">
                  <option value="">-</option>
                  ${SEVERITY_OPTIONS.map(o => `<option value="${o.value}" ${risk.severidade === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
              </div>
            </div>
            ${classif.label !== '-' ? `<div class="mt-sm"><span class="risk-chip ${classif.class}">${classif.label} (${(parseInt(risk.probabilidade)||0) * (parseInt(risk.severidade)||0)})</span></div>` : ''}
          </div>`;
        }).join('')}
      </div>

      <div class="form-group form-group--full mt-md">
        <label class="form-label">Recomendação de Novas Medidas de Controle</label>
        <textarea class="form-textarea" rows="2" placeholder="Descreva recomendações de novas medidas..."
          onchange="appData.ghes[${gi}].recomendacoes = this.value">${escapeHtml(ghe.recomendacoes)}</textarea>
      </div>
    </div>
  `).join('');
}

// =============================================
// EPI Matrix
// =============================================
function getUniqueFunctions() {
  const funcs = new Set();
  appData.funcionarios.forEach(f => {
    if (f.funcao && f.funcao.trim()) funcs.add(f.funcao.trim());
  });
  return Array.from(funcs);
}

function renderEPIMatrix() {
  const funcs = getUniqueFunctions();
  if (funcs.length === 0) {
    document.getElementById('epiMatrixHead').innerHTML = '';
    document.getElementById('epiMatrixBody').innerHTML = '<tr><td colspan="20" class="text-center text-muted" style="padding:40px">Nenhuma função cadastrada. Adicione funções na Etapa 2.</td></tr>';
    return;
  }

  // Header
  const headHTML = `<tr><th>Função</th>${EPI_LIST.map(e => `<th>${e}</th>`).join('')}</tr>`;
  document.getElementById('epiMatrixHead').innerHTML = headHTML;

  // Body
  const bodyHTML = funcs.map(func => {
    const cells = EPI_LIST.map(epi => {
      const checked = appData.epiMatrix[func] && appData.epiMatrix[func][epi] ? 'checked' : '';
      return `<td><input type="checkbox" class="epi-check" data-epi-func="${escapeAttr(func)}" data-epi-name="${escapeAttr(epi)}" ${checked}></td>`;
    }).join('');
    return `<tr><td>${escapeHtml(func)}</td>${cells}</tr>`;
  }).join('');
  document.getElementById('epiMatrixBody').innerHTML = bodyHTML;
}

// =============================================
// Treinamentos
// =============================================
function addTreinamento(data = null) {
  const t = data || { descricao: '', funcoes: '' };
  appData.treinamentos.push(t);
  renderTreinamentos();
}

function removeTreinamento(index) {
  appData.treinamentos.splice(index, 1);
  renderTreinamentos();
  saveToStorage();
}

function renderTreinamentos() {
  const container = document.getElementById('treinamentosList');
  container.innerHTML = appData.treinamentos.map((t, i) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">Treinamento ${i + 1}</span>
        <button class="btn btn--danger" onclick="removeTreinamento(${i})">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Remover
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label">Descrição do Treinamento</label>
          <input type="text" class="form-input" value="${escapeHtml(t.descricao)}" placeholder="Ex: Integração de Segurança"
            onchange="appData.treinamentos[${i}].descricao = this.value">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Funções / Atividades Aplicáveis</label>
          <input type="text" class="form-input" value="${escapeHtml(t.funcoes)}" placeholder="Ex: Todas as funções / Tratorista, Mecânico"
            onchange="appData.treinamentos[${i}].funcoes = this.value">
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================
// Documentos
// =============================================
function addDocumento(data = null) {
  const d = data || { descricao: '', norma: '' };
  appData.documentos.push(d);
  renderDocumentos();
}

function removeDocumento(index) {
  appData.documentos.splice(index, 1);
  renderDocumentos();
  saveToStorage();
}

function renderDocumentos() {
  const container = document.getElementById('documentosList');
  container.innerHTML = appData.documentos.map((d, i) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">Documento ${i + 1}</span>
        <button class="btn btn--danger" onclick="removeDocumento(${i})">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Remover
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label">Descrição do Documento</label>
          <input type="text" class="form-input" value="${escapeHtml(d.descricao)}" placeholder="Ex: PGRTR"
            onchange="appData.documentos[${i}].descricao = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Norma de Referência</label>
          <input type="text" class="form-input" value="${escapeHtml(d.norma)}" placeholder="Ex: NR 31"
            onchange="appData.documentos[${i}].norma = this.value">
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================
// Exames Ocupacionais
// =============================================
function addExame(data = null) {
  const e = data || {
    gheFuncoes: '',
    riscos: '',
    exame: '',
    codigoEsocial: '',
    admissional: false,
    semestral: false,
    anual: false,
    mudancaRisco: false,
    retornoTrabalho: false
  };
  appData.exames.push(e);
  renderExames();
}

const ESOCIAL_EXAM_MAP = {
  'avaliação clínica': '0295',
  'audiometria': '0281',
  'eletrocardiograma': '0530',
  'ecg': '0530',
  'eletroencefalograma': '0536',
  'eeg': '0536',
  'espirometria': '1050',
  'acuidade visual': '0296',
  'hemograma': '0693',
  'glicemia': '0658',
  'acetilcolinesterase': '0750',
  'raio x': '0561',
  'radiografia': '0561'
};

function updateEsocialCode(index, examText) {
  if (!examText) return;
  const exams = examText.split(',').map(e => e.trim().toLowerCase());
  const codes = [];
  
  exams.forEach(exam => {
    for (const [key, code] of Object.entries(ESOCIAL_EXAM_MAP)) {
      if (exam.includes(key)) {
        if (!codes.includes(code)) codes.push(code);
        break;
      }
    }
  });
  
  if (codes.length > 0) {
    const currentCode = appData.exames[index].codigoEsocial;
    // Only update if current is empty or we want to overwrite
    appData.exames[index].codigoEsocial = codes.join(', ');
    const input = document.getElementById(`esocial-code-${index}`);
    if (input) input.value = codes.join(', ');
  }
}

function removeExame(index) {
  appData.exames.splice(index, 1);
  renderExames();
  saveToStorage();
}

function renderExames() {
  const container = document.getElementById('examesList');
  container.innerHTML = appData.exames.map((e, i) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">Exame ${i + 1}</span>
        <button class="btn btn--danger" onclick="removeExame(${i})" ${appData.exames.length <= 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Remover
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">GHE / Funções</label>
          <input type="text" class="form-input" value="${escapeHtml(e.gheFuncoes)}" placeholder="Ex: GHE 01 – Campo"
            onchange="appData.exames[${i}].gheFuncoes = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Agentes Ambientais (Riscos)</label>
          <input type="text" class="form-input" value="${escapeHtml(e.riscos)}" placeholder="Ex: Calor, Radiação Solar"
            onchange="appData.exames[${i}].riscos = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Exame</label>
          <input type="text" class="form-input" value="${escapeHtml(e.exame)}" placeholder="Ex: Audiometria, Hemograma"
            onchange="appData.exames[${i}].exame = this.value; updateEsocialCode(${i}, this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">Código eSocial</label>
          <input type="text" class="form-input" id="esocial-code-${i}" value="${escapeHtml(e.codigoEsocial)}" placeholder="Ex: 0281"
            onchange="appData.exames[${i}].codigoEsocial = this.value">
        </div>
      </div>
      <div class="checkbox-grid mt-md">
        <label class="checkbox-item ${e.admissional ? 'checked' : ''}">
          <input type="checkbox" ${e.admissional ? 'checked' : ''} onchange="appData.exames[${i}].admissional = this.checked; this.parentElement.classList.toggle('checked', this.checked)">
          Admissional
        </label>
        <label class="checkbox-item ${e.semestral ? 'checked' : ''}">
          <input type="checkbox" ${e.semestral ? 'checked' : ''} onchange="appData.exames[${i}].semestral = this.checked; this.parentElement.classList.toggle('checked', this.checked)">
          6 meses após Admissão
        </label>
        <label class="checkbox-item ${e.anual ? 'checked' : ''}">
          <input type="checkbox" ${e.anual ? 'checked' : ''} onchange="appData.exames[${i}].anual = this.checked; this.parentElement.classList.toggle('checked', this.checked)">
          Periódico Anual
        </label>
        <label class="checkbox-item ${e.mudancaRisco ? 'checked' : ''}">
          <input type="checkbox" ${e.mudancaRisco ? 'checked' : ''} onchange="appData.exames[${i}].mudancaRisco = this.checked; this.parentElement.classList.toggle('checked', this.checked)">
          Mudança de Risco
        </label>
        <label class="checkbox-item ${e.retornoTrabalho ? 'checked' : ''}">
          <input type="checkbox" ${e.retornoTrabalho ? 'checked' : ''} onchange="appData.exames[${i}].retornoTrabalho = this.checked; this.parentElement.classList.toggle('checked', this.checked)">
          Retorno ao Trabalho
        </label>
      </div>
    </div>
  `).join('');
}

// =============================================
// CAT Records
// =============================================
function addCAT(data = null) {
  const c = data || { data: '', numeroCat: '', tipoCat: '', tipoAcidente: '', parteAtingida: '', cid: '' };
  appData.cats.push(c);
  renderCATs();
}

function removeCAT(index) {
  appData.cats.splice(index, 1);
  renderCATs();
  saveToStorage();
}

function renderCATs() {
  const container = document.getElementById('catList');
  if (appData.cats.length === 0) {
    container.innerHTML = '<p class="text-muted" style="padding: 12px; font-size: 0.85rem;">Nenhum registro de CAT. Clique em "Adicionar" se houver acidentes a registrar.</p>';
    return;
  }
  container.innerHTML = appData.cats.map((c, i) => `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">CAT ${i + 1}</span>
        <button class="btn btn--danger" onclick="removeCAT(${i})">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Remover
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Data</label>
          <input type="date" class="form-input" value="${c.data}" onchange="appData.cats[${i}].data = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Nº da CAT</label>
          <input type="text" class="form-input" value="${escapeHtml(c.numeroCat)}" placeholder="Nº" onchange="appData.cats[${i}].numeroCat = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Tipo da CAT</label>
          <select class="form-select" onchange="appData.cats[${i}].tipoCat = this.value">
            <option value="">Selecione</option>
            <option ${c.tipoCat === 'Inicial' ? 'selected' : ''}>Inicial</option>
            <option ${c.tipoCat === 'Reabertura' ? 'selected' : ''}>Reabertura</option>
            <option ${c.tipoCat === 'Comunicação de Óbito' ? 'selected' : ''}>Comunicação de Óbito</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo do Acidente</label>
          <input type="text" class="form-input" value="${escapeHtml(c.tipoAcidente)}" placeholder="Ex: Típico, Trajeto"
            onchange="appData.cats[${i}].tipoAcidente = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Parte Atingida</label>
          <input type="text" class="form-input" value="${escapeHtml(c.parteAtingida)}" placeholder="Ex: Mão direita"
            onchange="appData.cats[${i}].parteAtingida = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">CID</label>
          <input type="text" class="form-input" value="${escapeHtml(c.cid)}" placeholder="Ex: S61.0"
            onchange="appData.cats[${i}].cid = this.value">
        </div>
      </div>
    </div>
  `).join('');
}

// =============================================
// Plano de Ações (Matriz GUT)
// =============================================
function addAcao(data = null) {
  const a = data || { acao: '', responsavel: '', recursos: '', g: '', u: '', t: '', prazo: '' };
  appData.acoes.push(a);
  renderAcoes();
}

function removeAcao(index) {
  appData.acoes.splice(index, 1);
  renderAcoes();
  saveToStorage();
}

function calcGUT(g, u, t) {
  const gv = parseInt(g) || 0;
  const uv = parseInt(u) || 0;
  const tv = parseInt(t) || 0;
  return gv * uv * tv;
}

function renderAcoes() {
  const container = document.getElementById('acoesList');
  container.innerHTML = appData.acoes.map((a, i) => {
    const gut = calcGUT(a.g, a.u, a.t);
    return `
    <div class="dynamic-item">
      <div class="dynamic-item__header">
        <span class="dynamic-item__title">Ação ${String(i + 1).padStart(2, '0')} ${gut > 0 ? `<span class="risk-chip ${gut >= 64 ? 'risk-chip--intoleravel' : gut >= 27 ? 'risk-chip--substancial' : gut >= 8 ? 'risk-chip--moderado' : 'risk-chip--toleravel'}">GUT: ${gut}</span>` : ''}</span>
        <button class="btn btn--danger" onclick="removeAcao(${i})" ${appData.acoes.length <= 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Remover
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label">Ação / Medida de Controle <span class="required">*</span></label>
          <input type="text" class="form-input" value="${escapeHtml(a.acao)}" placeholder="Descreva a ação a ser implementada"
            onchange="appData.acoes[${i}].acao = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Responsável</label>
          <input type="text" class="form-input" value="${escapeHtml(a.responsavel)}" placeholder="Ex: TST, Gerência"
            onchange="appData.acoes[${i}].responsavel = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Recursos Necessários</label>
          <input type="text" class="form-input" value="${escapeHtml(a.recursos)}" placeholder="Ex: Financeiro, Material"
            onchange="appData.acoes[${i}].recursos = this.value">
        </div>
        <div class="form-group">
          <label class="form-label">G (Gravidade 1-5)</label>
          <select class="form-select" onchange="appData.acoes[${i}].g = this.value; renderAcoes();">
            <option value="">-</option>
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${a.g == n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">U (Urgência 1-5)</label>
          <select class="form-select" onchange="appData.acoes[${i}].u = this.value; renderAcoes();">
            <option value="">-</option>
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${a.u == n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">T (Tendência 1-5)</label>
          <select class="form-select" onchange="appData.acoes[${i}].t = this.value; renderAcoes();">
            <option value="">-</option>
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${a.t == n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prazo / Previsão</label>
          <input type="text" class="form-input" value="${escapeHtml(a.prazo)}" placeholder="Ex: 30 dias, Imediato"
            onchange="appData.acoes[${i}].prazo = this.value">
        </div>
      </div>
    </div>`;
  }).join('');
}

// =============================================
// Render All
// =============================================
function renderAll() {
  renderFuncionarios();
  renderAmbientes();
  renderGHEs();
  renderTreinamentos();
  renderDocumentos();
  renderExames();
  renderCATs();
  renderAcoes();
}

// =============================================
// Collapsible Toggle
// =============================================
function toggleCollapsible(trigger) {
  const parent = trigger.closest('.collapsible');
  parent.classList.toggle('open');
}

// =============================================
// Toast Notification
// =============================================
function showToast(title, sub, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = toast.querySelector('.toast__icon');
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastSub').textContent = sub || '';

  toast.className = `toast toast--${type}`;
  if (type === 'success') {
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>';
  } else {
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>';
  }

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// =============================================
// Generate Report
// =============================================
async function generateReport() {
  saveToStorage();
  collectAllData();

  // Validation
  if (!appData.empresa.razaoSocial) {
    showToast('Campo obrigatório', 'Preencha a Razão Social na Etapa 1', 'error');
    goToStep(0);
    return;
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('active');

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao gerar o relatório');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const razao = appData.empresa.razaoSocial || 'PGRTR';
    const safeName = razao.replace(/[^a-zA-Z0-9\s\-áéíóúãõâêîôûàèìòùçÁÉÍÓÚÃÕÂÊÎÔÛÀÈÌÒÙÇ]/g, '').trim().substring(0, 50);
    a.download = `PGRTR_${safeName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Relatório Gerado!', 'O arquivo DOCX foi baixado com sucesso');
  } catch (error) {
    console.error('Error generating report:', error);
    showToast('Erro', error.message || 'Não foi possível gerar o relatório', 'error');
  } finally {
    overlay.classList.remove('active');
  }
}

// =============================================
// Import PGRTR via AI
// =============================================
async function handleImportDocx(file) {
  if (!file) return;

  const fileNameSpan = document.getElementById('importFileName');
  if (fileNameSpan) fileNameSpan.textContent = file.name;

  const overlay = document.getElementById('loadingOverlay');
  const spinnerText = overlay.querySelector('.loading-spinner__text');
  const spinnerSub = overlay.querySelector('.loading-spinner__sub');
  
  const originalText = spinnerText ? spinnerText.textContent : 'Gerando relatório PGRTR...';
  const originalSub = spinnerSub ? spinnerSub.textContent : 'Isso pode levar alguns segundos';

  if (spinnerText) spinnerText.textContent = 'Analisando documento com IA...';
  if (spinnerSub) spinnerSub.textContent = 'Extraindo e estruturando todos os dados do PGRTR antigo';
  
  overlay.classList.add('active');

  try {
    const base64 = await toBase64(file);
    const cleanBase64 = base64.split(',')[1] || base64;
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    const response = await fetch('/api/import-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: cleanBase64, fileType: isPdf ? 'pdf' : 'docx' })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Erro ao importar documento');
    }

    const data = await response.json();
    console.log('[IMPORT] Dados recebidos da API:', Object.keys(data));

    // === EMPRESA ===
    if (data.empresa) {
      appData.empresa = { ...appData.empresa, ...data.empresa };
      Object.keys(appData.empresa).forEach(key => {
        const el = document.querySelector(`[data-field="empresa.${key}"]`);
        if (el) el.value = appData.empresa[key] || '';
      });
    }

    // === FUNCIONÁRIOS ===
    if (data.funcionarios && Array.isArray(data.funcionarios) && data.funcionarios.length > 0) {
      appData.funcionarios = data.funcionarios.map(f => ({
        setor: f.setor || '',
        funcao: f.funcao || '',
        numFuncionarios: f.numFuncionarios || f.nFuncionarios || f.quantidade || ''
      }));
    }

    // === AMBIENTES ===
    if (data.ambientes && Array.isArray(data.ambientes) && data.ambientes.length > 0) {
      appData.ambientes = data.ambientes.map(a => ({
        setor: a.setor || a.nome || '',
        descricao: a.descricao || '',
        funcoes: a.funcoes || ''
      }));
    }

    // === GHEs ===
    if (data.ghes && Array.isArray(data.ghes) && data.ghes.length > 0) {
      appData.ghes = data.ghes.map(g => ({
        nome: g.nome || g.funcao || 'GHE',
        setor: g.setor || '',
        funcao: g.funcao || g.funcoes || '',
        descricaoAtividades: g.descricaoAtividades || g.descricao || '',
        riscos: (g.riscos || []).map(r => ({
          agente: r.agente || '',
          fator: r.fator || '',
          fonteGeradora: r.fonteGeradora || r.fonte || '',
          frequencia: r.frequencia || 'Habitual',
          trajetoria: r.trajetoria || '',
          atividade: r.exposicaoAtividade || r.atividade || '',
          norma: r.exposicaoNorma || r.norma || '',
          nivelAcao: r.nivelAcao || '',
          resultado: r.resultado || '',
          tecnicaUsada: r.tecnicaUsada || r.metodologia || 'Qualitativa',
          medidasControle: r.medidasControle || r.medidas || '',
          eficaz: r.eficaz || '',
          probabilidade: r.probabilidade || '',
          severidade: r.severidade || '',
          classificacaoRisco: r.classificacaoRisco || r.classificacao || ''
        })),
        recomendacoes: g.recomendacoes || ''
      }));
      // Ensure each GHE has at least one risk
      appData.ghes.forEach(g => {
        if (!g.riscos || g.riscos.length === 0) {
          g.riscos = [createDefaultRisk()];
        }
      });
    }

    // === EXAMES ===
    if (data.exames && Array.isArray(data.exames) && data.exames.length > 0) {
      appData.exames = data.exames.map(e => ({
        gheFuncoes: e.gheFuncoes || '',
        riscos: e.riscos || '',
        exame: e.exame || '',
        codigoEsocial: e.codigoEsocial || '',
        admissional: e.admissional !== undefined ? e.admissional : true,
        semestral: e.semestral !== undefined ? e.semestral : false,
        anual: e.anual !== undefined ? e.anual : true,
        mudancaRisco: e.mudancaRisco !== undefined ? e.mudancaRisco : true,
        retornoTrabalho: e.retornoTrabalho !== undefined ? e.retornoTrabalho : true
      }));
    }

    // === EPIs ===
    if (data.epis && Array.isArray(data.epis) && data.epis.length > 0) {
      const serverKeys = ['avental','boneArabe','botaCouro','botaImpermeavel','cintoSeguranca','kitPulverizacao','luvaMalhaAco','luvaQuimica','luvaVaqueta','luvaImpermeavel','luvaTricotada','manguito','mascaraFiltro','protetorAuricular','capacete','respiradorPFF2','oculos','vestimentaRF'];
      const matrix = {};
      const uniqueFuncs = getUniqueFunctions(); // Get currently registered functions to match exactly
      
      data.epis.forEach(epiRow => {
        let func = epiRow.funcao || epiRow.cargo;
        if (!func) return;
        
        // Find case-insensitive match in existing functions to avoid creating disconnected rows
        const match = uniqueFuncs.find(f => f.trim().toLowerCase() === func.trim().toLowerCase());
        if (match) func = match;
        
        if (!matrix[func]) matrix[func] = {};
        
        EPI_LIST.forEach((epi, idx) => {
          const sKey = serverKeys[idx];
          const cleanKey = toCamelCase(epi);
          matrix[func][epi] = !!epiRow[sKey] || !!epiRow[cleanKey] || !!epiRow[epi];
        });
      });
      appData.epiMatrix = { ...appData.epiMatrix, ...matrix };
    }

    // === TREINAMENTOS ===
    if (data.treinamentos && Array.isArray(data.treinamentos) && data.treinamentos.length > 0) {
      appData.treinamentos = data.treinamentos.map(t => ({
        descricao: t.descricao || '',
        funcoes: t.funcoes || ''
      }));
    }

    // === DOCUMENTOS ===
    if (data.documentos && Array.isArray(data.documentos) && data.documentos.length > 0) {
      appData.documentos = data.documentos.map(d => ({
        descricao: d.descricao || '',
        norma: d.norma || ''
      }));
    }

    // === PROCEDIMENTOS ===
    if (data.procedimentos) {
      const procKeys = ['animais', 'agrotoxicos', 'climaticas', 'penoso', 'eletrico', 'transito', 'residuos', 'acidentes'];
      procKeys.forEach(key => {
        if (data.procedimentos[key]) {
          appData.procedimentos[key] = data.procedimentos[key];
          const el = document.querySelector(`[data-field="procedimentos.${key}"]`);
          if (el) el.value = data.procedimentos[key];
        }
      });
    }

    // === CATs ===
    if (data.cats && Array.isArray(data.cats) && data.cats.length > 0) {
      appData.cats = data.cats.map(c => ({
        data: c.data || '',
        numeroCat: c.numeroCat || '',
        tipoCat: c.tipoCat || '',
        tipoAcidente: c.tipoAcidente || '',
        parteAtingida: c.parteAtingida || '',
        cid: c.cid || ''
      }));
    }

    // === AÇÕES ===
    if (data.acoes && Array.isArray(data.acoes) && data.acoes.length > 0) {
      appData.acoes = data.acoes.map(a => ({
        acao: a.acao || '',
        responsavel: a.responsavel || '',
        prazo: a.prazo || '',
        g: a.g || '',
        u: a.u || '',
        t: a.t || ''
      }));
    }

    // === ENCERRAMENTO ===
    if (data.encerramento) {
      appData.encerramento = {
        responsavelTecnico: data.encerramento.responsavelTecnico || '',
        registroProfissional: data.encerramento.registroProfissional || ''
      };
      const rtEl = document.querySelector('[data-field="encerramento.responsavelTecnico"]');
      const rpEl = document.querySelector('[data-field="encerramento.registroProfissional"]');
      if (rtEl) rtEl.value = appData.encerramento.responsavelTecnico;
      if (rpEl) rpEl.value = appData.encerramento.registroProfissional;
    }

    // Refresh UI
    renderAll();
    saveToStorage();
    showToast('Importação concluída!', `Dados extraídos: ${appData.funcionarios.length} funções, ${appData.ghes.length} GHEs, ${appData.exames.length} exames.`);
  } catch (error) {
    console.error('Import error:', error);
    showToast('Erro ao importar', error.message || 'Houve um erro no processamento do arquivo', 'error');
  } finally {
    overlay.classList.remove('active');
    if (spinnerText) spinnerText.textContent = originalText;
    if (spinnerSub) spinnerSub.textContent = originalSub;
    // Hide process button and clear input so it can be re-selected if wanted
    const btnProcessarIA = document.getElementById('btnProcessarIA');
    const importInput = document.getElementById('importDocxFile');
    const fileNameSpan = document.getElementById('importFileName');
    
    if (importInput) importInput.value = '';
    if (btnProcessarIA) btnProcessarIA.style.display = 'none';
    if (fileNameSpan) fileNameSpan.textContent = 'Nenhum arquivo selecionado';
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function toCamelCase(str) {
  const map = {
    'Avental Impermeável': 'avental',
    'Boné Árabe': 'boneArabe',
    'Bota de Couro': 'botaCouro',
    'Bota Impermeável': 'botaImpermeavel',
    'Cinto de Segurança': 'cintoSeguranca',
    'Kit Pulverização': 'kitPulverizacao',
    'Luva Malha de Aço': 'luvaMalhaAco',
    'Luva Química': 'luvaQuimica',
    'Luva de Vaqueta': 'luvaVaqueta',
    'Luva Impermeável': 'luvaImpermeavel',
    'Luva Tricotada': 'luvaTricotada',
    'Manguito Solar': 'manguito',
    'Máscara Filtro Carbono': 'mascaraFiltro',
    'Protetor Auricular': 'protetorAuricular',
    'Capacete de Segurança': 'capacete',
    'Respirador PFF2': 'respiradorPFF2',
    'Óculos de Proteção': 'oculos',
    'Vestimenta RF': 'vestimentaRF'
  };
  return map[str] || str;
}

// =============================================
// Utility Functions
// =============================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
