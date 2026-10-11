/**
 * Seed da base de dados — cria os dados de referência (tipos, estados),
 * as 3 contas de demonstração e alguns dados de exemplo.
 *
 * Uso (dentro de backend/):
 *   npx prisma db push      # cria as tabelas
 *   node prisma/seed.js     # ou: npx prisma db seed
 *
 * É idempotente: pode ser corrido várias vezes sem duplicar dados.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Os IDs destes estados estão fixos no código dos services (ESTADO_MARCACAO, EVENT_STATE, ...)
const TIPOS_UTILIZADOR = [
  { id_tipo: 1, nome: 'Coordenadora' },
  { id_tipo: 2, nome: 'Docente' },
  { id_tipo: 3, nome: 'Aluno' },
];

const ESTADOS_MARCACAO = [
  { id_estado: 1, nome: 'Pendente' },
  { id_estado: 2, nome: 'Em validação' },
  { id_estado: 3, nome: 'Confirmada' },
  { id_estado: 4, nome: 'Concluída' },
  { id_estado: 5, nome: 'Cancelada' },
];

const ESTADOS_ALUNO = [
  { id_aluno_estado: 1, nome: 'Pendente', descricao: 'A aguardar resposta do aluno' },
  { id_aluno_estado: 2, nome: 'Confirmado', descricao: 'O aluno confirmou presença' },
  { id_aluno_estado: 3, nome: 'Concluído', descricao: 'Sessão concluída' },
  { id_aluno_estado: 4, nome: 'Recusado', descricao: 'O aluno recusou o convite' },
];

const ESTADOS_EVENTO = [
  { id_evento_estado: 1, nome: 'Planeado', descricao: 'Evento criado, ainda sem participantes' },
  { id_evento_estado: 2, nome: 'Aberto', descricao: 'Evento com participantes atribuídos' },
  { id_evento_estado: 3, nome: 'Em realização', descricao: 'Evento a decorrer' },
  { id_evento_estado: 4, nome: 'Concluído', descricao: 'Evento terminado' },
  { id_evento_estado: 5, nome: 'Cancelado', descricao: 'Evento cancelado' },
];

const CONTAS_DEMO = [
  { codigo_username: 'admin', password: 'admin123', id_tipo: 1, nome: 'Ana', apelido: 'Coordenadora', email: 'admin@entartes.demo' },
  { codigo_username: 'docente', password: 'docente123', id_tipo: 2, nome: 'Daniel', apelido: 'Docente', email: 'docente@entartes.demo' },
  { codigo_username: 'aluno', password: 'aluno123', id_tipo: 3, nome: 'Alice', apelido: 'Aluna', email: 'aluno@entartes.demo' },
];

const MODALIDADES = ['Ballet', 'Hip-Hop', 'Contemporâneo', 'Jazz'];
const SALAS = [
  { nome: 'Sala 1', descricao: 'Sala principal com espelhos e barras' },
  { nome: 'Sala 2', descricao: 'Sala pequena para aulas individuais' },
  { nome: 'Estúdio', descricao: 'Estúdio com piso flutuante' },
];

// Campos @db.Time são guardados como Date com data 1970-01-01 (UTC)
const hora = (hhmm) => new Date(`1970-01-01T${hhmm}:00.000Z`);

// Como inserimos IDs explícitos, acertamos a sequência do autoincrement
// para que os próximos INSERT feitos pela app não colidam.
async function acertarSequencia(tabela, coluna) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tabela}"', '${coluna}'), COALESCE((SELECT MAX("${coluna}") FROM "${tabela}"), 1))`
  );
}

async function seedReferencia() {
  for (const t of TIPOS_UTILIZADOR) {
    await prisma.tipo_utilizador.upsert({ where: { id_tipo: t.id_tipo }, update: { nome: t.nome }, create: t });
  }
  for (const e of ESTADOS_MARCACAO) {
    await prisma.estado_marcacao.upsert({ where: { id_estado: e.id_estado }, update: { nome: e.nome }, create: e });
  }
  for (const e of ESTADOS_ALUNO) {
    await prisma.aluno_estado.upsert({ where: { id_aluno_estado: e.id_aluno_estado }, update: e, create: e });
  }
  for (const e of ESTADOS_EVENTO) {
    await prisma.evento_estado.upsert({ where: { id_evento_estado: e.id_evento_estado }, update: e, create: e });
  }

  await acertarSequencia('tipo_utilizador', 'id_tipo');
  await acertarSequencia('estado_marcacao', 'id_estado');
  await acertarSequencia('aluno_estado', 'id_aluno_estado');
  await acertarSequencia('evento_estado', 'id_evento_estado');
}

async function seedContas() {
  const contas = {};

  for (const conta of CONTAS_DEMO) {
    const { password, ...dados } = conta;
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.utilizador.upsert({
      where: { codigo_username: dados.codigo_username },
      // Repor password e desbloquear a conta se o seed voltar a ser corrido
      update: { password: hash, estado: 'ATIVO', tentativas_login: 0 },
      create: { ...dados, password: hash, estado: 'ATIVO', tentativas_login: 0 },
    });

    const id_utilizador = user.id_utilizador;
    if (dados.id_tipo === 1) {
      await prisma.coordenadora.upsert({ where: { id_utilizador }, update: {}, create: { id_utilizador } });
    } else if (dados.id_tipo === 2) {
      await prisma.docente.upsert({ where: { id_utilizador }, update: {}, create: { id_utilizador, estado_atividade: true } });
    } else if (dados.id_tipo === 3) {
      await prisma.aluno.upsert({ where: { id_utilizador }, update: {}, create: { id_utilizador, coaching: true } });
    }

    contas[dados.codigo_username] = id_utilizador;
  }

  return contas;
}

async function seedExemplos({ admin, docente, aluno }) {
  // Só cria dados de exemplo numa BD vazia, para não duplicar nem mexer em dados reais
  if ((await prisma.modalidade.count()) > 0) {
    console.log('  Dados de exemplo já existem — a saltar.');
    return;
  }

  const modalidades = [];
  for (const nome of MODALIDADES) {
    modalidades.push(await prisma.modalidade.create({ data: { nome } }));
  }
  await prisma.sala.createMany({ data: SALAS });

  // Docente leciona Ballet e Contemporâneo; aluno inscrito em Ballet
  await prisma.docente_modalidade.createMany({
    data: [modalidades[0], modalidades[2]].map((m) => ({ id_docente: docente, id_modalidade: m.id_modalidade })),
  });
  await prisma.aluno_modalidade.create({ data: { id_utilizador: aluno, id_modalidade: modalidades[0].id_modalidade } });

  // Disponibilidade do docente: segundas e quartas, 18h–20h (dia_semana: 0 = Domingo)
  await prisma.disponibilidade.createMany({
    data: [1, 3].map((dia_semana) => ({ id_docente: docente, dia_semana, hora_inicio: hora('18:00'), hora_fim: hora('20:00') })),
  });

  // Evento daqui a 30 dias, com o docente e o aluno como participantes
  const dataEvento = new Date();
  dataEvento.setDate(dataEvento.getDate() + 30);
  dataEvento.setHours(21, 0, 0, 0);

  const evento = await prisma.evento.create({
    data: {
      nome: 'Espetáculo de Fim de Ano',
      descricao: 'Apresentação anual dos alunos da escola.',
      data_de_realizacao: dataEvento,
      local: 'Auditório Municipal',
      duracao_minutos: 120,
      id_evento_estado: 2, // Aberto (já tem participantes)
      coordenadora_evento: { create: { id_utilizador: admin } },
      evento_docente: { create: { id_docente: docente } },
      evento_aluno: { create: { id_utilizador: aluno } },
    },
  });

  await prisma.notificacao.createMany({
    data: [admin, docente, aluno].map((id_user) => ({
      id_user,
      titulo: 'Bem-vindo(a) à demo da Ent\'artes',
      mensagem: `Foi criado o evento "${evento.nome}". Explora a aplicação à vontade!`,
    })),
  });
}

async function main() {
  console.log('A criar dados de referência...');
  await seedReferencia();

  console.log('A criar contas de demonstração...');
  const contas = await seedContas();

  console.log('A criar dados de exemplo...');
  await seedExemplos(contas);

  console.log('\nSeed concluído. Contas de demonstração:');
  console.table(CONTAS_DEMO.map(({ codigo_username, password, id_tipo }) => ({
    perfil: TIPOS_UTILIZADOR.find((t) => t.id_tipo === id_tipo).nome,
    username: codigo_username,
    password,
  })));
}

main()
  .catch((err) => {
    console.error('Erro no seed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
