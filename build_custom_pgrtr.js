const fs = require('fs');
const { generatePGRTR } = require('./generate-docx');

const data = {
  empresa: {
    razaoSocial: "Fazenda F. A. Frutas Ltda (F.A. Frutas)",
    nomeFantasia: "Fazenda F. A. Frutas Ltda (F.A. Frutas)",
    cnpj: "11.058.983/0001-33",
    endereco: "Sitio Toca Da Raposa, nº 83, Zona Rural",
    cep: "59695-000",
    bairro: "Zona Rural",
    cidade: "Baraúna",
    uf: "RN",
    telefone: "(84) 99858-5992",
    cnae: "(0119-9/04)",
    atividadeEconomica: "Cultivo de cebola",
    grauRisco: "3",
    dataEmissao: "2026-05-18",
    representanteLegal: "Representante da Fazenda F.A. Frutas"
  },
  funcionarios: [
    { setor: "Campo", funcao: "Fiscal de Campo", numFuncionarios: "1" },
    { setor: "Campo", funcao: "Fiscal de Campo + Pulverização", numFuncionarios: "1" },
    { setor: "Campo", funcao: "Trabalhador Rural", numFuncionarios: "5" },
    { setor: "Campo", funcao: "Trabalhador Rural + Pulverização", numFuncionarios: "2" },
    { setor: "Campo", funcao: "Tratorista", numFuncionarios: "2" },
    { setor: "Campo", funcao: "Tratorista + Pulverização", numFuncionarios: "1" }
  ],
  ambientes: [
    { setor: "Campo", descricao: "Ambiente a céu aberto, piso rustico, ventilação e iluminação natural.", funcoes: "Fiscal de Campo, Trabalhador Rural, Tratorista" }
  ],
  ghes: [
    {
      nome: "Fiscal de Campo",
      setor: "Campo",
      funcao: "Fiscal de Campo",
      descricaoAtividades: "Fiscalizar a operabilidade de processos manuais e mecanizados de máquinas e implementos em funcionamento.",
      riscos: [
        { agente: "Mecânico", fator: "Queda de mesmo nível", fonteGeradora: "Piso escorregadio, arranjo físico inadequado, pisos rústicos", trajetoria: "", atividade: "Habitual", frequencia: "Habitual", norma: "", nivelAcao: "", resultado: "", tecnicaUsada: "Critério Qualitativo", medidasControle: "Orientação sobre riscos de acidentes", eficaz: "S", probabilidade: "2", severidade: "2" },
        { agente: "Mecânico", fator: "Acidente de trânsito", fonteGeradora: "Condução de veículos (moto)", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Direção Defensiva", eficaz: "S", probabilidade: "2", severidade: "3" },
        { agente: "Mecânico", fator: "Animais peçonhentos", fonteGeradora: "Cobras, escorpião, etc.", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Diálogo de segurança", eficaz: "S", probabilidade: "3", severidade: "3" },
        { agente: "Ergonômico", fator: "Postura inadequada", fonteGeradora: "Alternâncias de posturas", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Pausas para alongamento", eficaz: "S", probabilidade: "2", severidade: "3" },
        { agente: "Ergonômico", fator: "Fatores Psicossociais", fonteGeradora: "Produtividade, assédio, relações", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Informação do risco", eficaz: "S", probabilidade: "2", severidade: "2" },
        { agente: "Físico", fator: "Radiação não ionizante", fonteGeradora: "Radiação UVB", atividade: "Contínua", frequencia: "Permanente", tecnicaUsada: "Critério Qualitativo", medidasControle: "Protetor solar", eficaz: "S", probabilidade: "3", severidade: "3" }
      ],
      recomendacoes: "Fazer uso de EPI, Seguir os procedimentos estabelecidos pela organização"
    },
    {
      nome: "Fiscal de Campo + Pulverização",
      setor: "Campo",
      funcao: "Fiscal de Campo + Pulverização",
      descricaoAtividades: "Fiscalizar a operabilidade de processos manuais e mecanizados. E aplicação de defensivos agrícolas.",
      riscos: [
        { agente: "Mecânico", fator: "Queda de mesmo nível", fonteGeradora: "Piso escorregadio, arranjo físico inadequado", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Orientação sobre riscos", eficaz: "S", probabilidade: "2", severidade: "2" },
        { agente: "Mecânico", fator: "Acidente de trânsito", fonteGeradora: "Condução de veículos (moto)", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Direção Defensiva", eficaz: "S", probabilidade: "2", severidade: "3" },
        { agente: "Mecânico", fator: "Animais peçonhentos", fonteGeradora: "Cobras, escorpião", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Diálogo de segurança", eficaz: "S", probabilidade: "3", severidade: "3" },
        { agente: "Ergonômico", fator: "Postura inadequada", fonteGeradora: "Alternâncias de posturas", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Pausas", eficaz: "S", probabilidade: "2", severidade: "3" },
        { agente: "Físico", fator: "Radiação não ionizante", fonteGeradora: "Radiação UVB", atividade: "Contínua", frequencia: "Permanente", tecnicaUsada: "Critério Qualitativo", medidasControle: "Protetor solar", eficaz: "S", probabilidade: "3", severidade: "3" },
        { agente: "Químico", fator: "Produtos Orgânicos Defensivos", fonteGeradora: "Manipulação de defensivos", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "EPI", eficaz: "S", probabilidade: "2", severidade: "4" }
      ],
      recomendacoes: "Fazer uso de EPI, Seguir os procedimentos estabelecidos"
    },
    {
      nome: "Trabalhador Rural",
      setor: "Campo",
      funcao: "Trabalhador Rural",
      descricaoAtividades: "Realizar atividades de mão de obra de produção, limpar e preparar solo para plantio...",
      riscos: [
         { agente: "Mecânico", fator: "Queda de mesmo nível", fonteGeradora: "Piso escorregadio", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Orientação", eficaz: "S", probabilidade: "2", severidade: "2" },
         { agente: "Mecânico", fator: "Animais peçonhentos", fonteGeradora: "Cobras, escorpião", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Diálogo", eficaz: "S", probabilidade: "3", severidade: "3" },
         { agente: "Mecânico", fator: "Contato com objetos cortantes", fonteGeradora: "Ferramentas manuais", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Manutenção e EPI", eficaz: "S", probabilidade: "3", severidade: "3" },
         { agente: "Ergonômico", fator: "Posturas incômodas", fonteGeradora: "Alternâncias de posturas", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Pausas", eficaz: "S", probabilidade: "2", severidade: "3" },
         { agente: "Ergonômico", fator: "Transporte manual de cargas", fonteGeradora: "Palma de banana", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Técnica adequada", eficaz: "S", probabilidade: "3", severidade: "3" },
         { agente: "Físico", fator: "Radiação não ionizante", fonteGeradora: "Radiação UVB", atividade: "Contínua", frequencia: "Permanente", tecnicaUsada: "Critério Qualitativo", medidasControle: "Protetor solar", eficaz: "S", probabilidade: "3", severidade: "3" }
      ],
      recomendacoes: "Fazer uso de EPI, Seguir os procedimentos"
    },
    {
      nome: "Tratorista",
      setor: "Campo",
      funcao: "Tratorista",
      descricaoAtividades: "Operam, ajustam e preparam máquinas...",
      riscos: [
         { agente: "Mecânico", fator: "Acidente de trânsito", fonteGeradora: "Condução de veículos (trator)", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Direção defensiva", eficaz: "S", probabilidade: "2", severidade: "3" },
         { agente: "Mecânico", fator: "Animais peçonhentos", fonteGeradora: "Cobras, escorpião", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Orientação", eficaz: "S", probabilidade: "3", severidade: "3" },
         { agente: "Ergonômico", fator: "Postura sentada por longos períodos", fonteGeradora: "Cadeiras, assentos", atividade: "Habitual", frequencia: "Habitual", tecnicaUsada: "Critério Qualitativo", medidasControle: "Mobiliário adequado", eficaz: "S", probabilidade: "2", severidade: "2" },
         { agente: "Físico", fator: "Radiação não ionizante", fonteGeradora: "Radiação UVB", atividade: "Contínua", frequencia: "Permanente", tecnicaUsada: "Critério Qualitativo", medidasControle: "Protetor", eficaz: "S", probabilidade: "3", severidade: "3" },
         { agente: "Físico", fator: "Ruído", fonteGeradora: "Trator, implementos", atividade: "Contínua", frequencia: "Permanente", tecnicaUsada: "Quantitativo", resultado: "84,73 dB(A)", norma: "NHO 01", medidasControle: "Protetor Auditivo", eficaz: "S", probabilidade: "3", severidade: "3" },
         { agente: "Físico", fator: "Vibração de corpo inteiro", fonteGeradora: "Operação do Trator", atividade: "Contínua", frequencia: "Permanente", tecnicaUsada: "Quantitativo", resultado: "19,40", norma: "NHO 09", medidasControle: "Assento ante vibração", eficaz: "S", probabilidade: "3", severidade: "4" }
      ],
      recomendacoes: "Fazer uso de EPI, Seguir os procedimentos"
    }
  ],
  epis: [
    { nome: "Bota de Segurança", ca: "40872" },
    { nome: "Bota de PVC", ca: "42291" },
    { nome: "Touca Árabe", ca: "" },
    { nome: "Camisa Manga Longa", ca: "" },
    { nome: "Respirador Semifacial Carbografite", ca: "7072" },
    { nome: "Vestimenta Corpo Inteiro", ca: "26636" },
    { nome: "Luva para Proteção Contra Agentes Químicos", ca: "15685" },
    { nome: "Luva para Proteção Contra Agentes Mecânicos", ca: "45087" },
    { nome: "Protetor Auditivo Tipo Concha", ca: "14235" }
  ],
  epiMatrix: {
    "Fiscal de Campo": { "Bota de Segurança": true },
    "Fiscal de Campo + Pulverização": {
        "Bota de Segurança": true, "Touca Árabe": true, "Camisa Manga Longa": true, 
        "Respirador Semifacial Carbografite": true, "Luva para Proteção Contra Agentes Químicos": true, 
        "Vestimenta Corpo Inteiro": true
    },
    "Trabalhador Rural": {
        "Bota de PVC": true, "Touca Árabe": true, "Camisa Manga Longa": true,
        "Luva para Proteção Contra Agentes Químicos": true, "Luva para Proteção Contra Agentes Mecânicos": true
    },
    "Trabalhador Rural + Pulverização": {
        "Bota de PVC": true, "Touca Árabe": true, "Camisa Manga Longa": true,
        "Respirador Semifacial Carbografite": true, "Luva para Proteção Contra Agentes Químicos": true, 
        "Vestimenta Corpo Inteiro": true
    },
    "Tratorista": {
        "Bota de Segurança": true, "Bota de PVC": true, "Touca Árabe": true, 
        "Camisa Manga Longa": true, "Protetor Auditivo Tipo Concha": true
    },
    "Tratorista + Pulverização": {
        "Bota de Segurança": true, "Bota de PVC": true, "Touca Árabe": true, 
        "Camisa Manga Longa": true, "Protetor Auditivo Tipo Concha": true,
        "Respirador Semifacial Carbografite": true, "Luva para Proteção Contra Agentes Químicos": true, 
        "Vestimenta Corpo Inteiro": true
    }
  },
  exames: [
    { gheFuncoes: "Fiscal de Campo", exame: "Avaliação Clínica Ocupacional", codigoEsocial: "0295", admissional: true, semestral: false, anual: true, mudancaRisco: true, retornoTrabalho: true },
    { gheFuncoes: "Fiscal de Campo + Pulverização", exame: "Avaliação Clínica Ocupacional, Acetilcolinesterase, Hemograma", codigoEsocial: "0295, 0750, 0693", admissional: true, semestral: true, anual: true, mudancaRisco: true, retornoTrabalho: true },
    { gheFuncoes: "Tratorista", exame: "Avaliação Clínica Ocupacional, Audiometria", codigoEsocial: "0295, 0281", admissional: true, semestral: false, anual: true, mudancaRisco: true, retornoTrabalho: true }
  ],
  acoes: [
    { acao: "APRESENTAÇÃO DO PGRTR E ORIENTAÇÃO SOBRE RISCOS", responsavel: "Diretoria", prazo: "06/2026 - 07/2026", g: "3", u: "3", t: "3" },
    { acao: "CAPACITAÇÃO DOS COLABORADORES NO MANUSEIO DE DEFENSIVOS", responsavel: "Diretoria", prazo: "06/2026 - 08/2026", g: "4", u: "4", t: "4" }
  ],
  encerramento: {
    responsavelTecnico: "EDEVAGNO MENDES DE SOUSA",
    registroProfissional: "TECNICO DE SEGURANÇA DO TRABALHO SRTE Nº 0007846 RN"
  }
};

async function main() {
  console.log("Generating PGRTR...");
  const buffer = await generatePGRTR(data);
  fs.writeFileSync('PGRTR_FA_FRUTAS_1 (1), ultimo (1).docx', buffer);
  console.log('[PGRTR] Arquivo salvo: PGRTR_FA_FRUTAS_1 (1), ultimo (1).docx');
}

main().catch(console.error);
