/* Roteiro das 4 situações de aprendizagem (equipamentos, TAGs e eventos de FSI genéricos) */
const PESSOAS = {
  sup: { nome: 'Supervisor de manutenção', cor: '#c9a227' },
  op: { nome: 'Operador da área', cor: '#4a78b5' },
  col: { nome: 'Colega experiente', cor: '#6f8f5a' },
  tst: { nome: 'Técnica de segurança', cor: '#2f9e6a' },
  ctr: { nome: 'Mecânico da contratada', cor: '#8a6fb5' },
  out: { nome: 'Mecânico de outra equipe', cor: '#8a6fb5' },
  nar: { nome: 'Situação', cor: '#7d8790' },
};
const CRITERIOS = {
  C1: ['Crítico', 'Distingue perigo de risco na AST'],
  C2: ['Crítico', 'Identifica todas as fontes de energia, inclusive as não elétricas'],
  C3: ['Crítico', 'Bloqueia no ponto de isolamento correto, conferindo o TAG'],
  C4: ['Crítico', 'Testa a ausência de energia antes de intervir'],
  C5: ['Crítico', 'Para e sai da linha de fogo diante de mudança de condição'],
  C6: ['Crítico', 'Exerce o direito de recusa diante de condição insegura'],
  D1: ['Desejável', 'Usa bloqueio coletivo com cadeado de cada pessoa'],
  D2: ['Desejável', 'Comunica a decisão com clareza e sem confronto'],
  D3: ['Desejável', 'Reconhece frases de normalização do desvio'],
};
const testeLiga = (S, R, api, cond) => {
  if (S.test) return api.info('Teste já feito: nada se move.');
  if (!S.isolado()) { if (R.state.running) return api.info('O equipamento já está em funcionamento.'); R.state.running = true; return api.mod('O equipamento partiu ao apertar LIGA: ele não estava isolado.', 'C3'); }
  if (!S.travado()) { S.test = true; return api.mod('Nada se moveu, mas o teste foi feito antes do cadeado. Primeiro bloqueie, depois teste.', 'C4'); }
  S.test = true; api.ok('Teste de partida: nada se moveu. Energia zero confirmada.');
};

const SAS = [
  /* ========== SA1 ========== */
  {
    id: 1, area: 'Refinaria', hora: '07:00', scene: 'pump', titulo: 'A bomba tem que voltar antes da troca de turno',
    foco: 'Perigo × risco, energias perigosas e ponto de isolamento correto',
    cfg: { bg: 0x20262c, cam: [3.5, 4.6, 11.5], target: [-0.6, 1.4, 0] },
    os: { num: 'OS 4711', equip: 'BP-201 · Bomba de licor', local: 'Refinaria · Casa de bombas 2', desc: 'Vibração alta no lado acoplado. Inspecionar o acoplamento.', prio: 'Alta' },
    falas: [
      ['sup', 'Preciso dela rodando em uma hora. A reserva, a BP-202, está em manutenção.'],
      ['col', 'É só olhar o acoplamento. Dá pra fazer com ela parada na botoeira, a gente sempre fez assim.'],
      ['op', 'Ah, o CCM-2A foi reformado na semana passada. Mudaram umas gavetas de lugar.'],
      ['nar', 'Sua equipe: dois mecânicos e um eletricista. Antes de tocar no equipamento, montem a AST.'],
    ],
    ast: {
      cards: [['Eletricidade 440 V no motor', 'P'], ['Choque elétrico', 'R'], ['Partes rotativas do acoplamento', 'P'], ['Prensamento ou corte das mãos', 'R'], ['Licor quente na linha de sucção', 'P'], ['Queimadura', 'R']],
      controls: [['Desligar e bloquear a gaveta G1 do CCM, conferindo o TAG', 1], ['Cadeado pessoal e etiqueta de cada executante', 1], ['Teste de partida para confirmar energia zero', 1], ['Manter a proteção até confirmar energia zero', 1], ['Desligar e bloquear na botoeira local', 0, 'A botoeira é comando, não isolamento.'], ['Trabalhar com atenção redobrada', 0, 'Atenção não é barreira física.'], ['Pedir ao operador para não ligar a bomba', 0, 'Combinado verbal não substitui o bloqueio.']],
    },
    init(S, R) { Object.assign(S, { com: false, tag: false, g1off: false, g1lock: false, test: false, guard: true, insp: false }); S.isolado = () => S.g1off; S.travado = () => S.g1lock; },
    actions(id, S, R, api) {
      const A = [];
      if (id === 'operador') A.push({ t: 'Avisar o operador e pedir a liberação da BP-201', done: S.com, run() { S.com = true; api.ok('Operador ciente. BP-201 liberada para parada.'); } });
      if (id === 'botoeira') {
        A.push({ t: 'Desligar pela botoeira (parada operacional)', done: !R.state.running, run() { if (!S.com) api.mod('Parou a bomba sem avisar a operação.', 'D2'); R.state.running = false; api.info('Bomba parada pelo comando. Isso não é isolamento: o circuito continua energizado.'); } });
        A.push({ t: 'Pôr o cadeado na botoeira e liberar o serviço', run() { return api.crit('Bloqueio no ponto errado', 'A botoeira só envia um comando ao contator. Com a gaveta energizada, um defeito, um jumper ou um comando remoto pode partir o motor com as mãos de alguém no acoplamento.', 'C3'); } });
        A.push({ t: 'Apertar LIGA (teste de partida)', done: S.test, run() { testeLiga(S, R, api); } });
      }
      if (id === 'ccm') {
        A.push({ t: 'Conferir os TAGs das gavetas', done: S.tag, run() { S.tag = true; api.info('A gaveta de cima agora é a G2 · BP-202 (reserva). A BP-201 está na G1, a do meio, desde a reforma.'); } });
        if (!S.g1off) A.push({ t: 'Desligar a gaveta de cima (a de sempre)', run() { return api.crit('Gaveta errada', 'Depois da reforma, a gaveta de cima é a G2 · BP-202, que já estava desligada. A BP-201 continua energizada pela G1. O bloqueio ficou no equipamento errado.', 'C3'); } });
        A.push({ t: 'Desligar a gaveta G1 · BP-201', done: S.g1off, run() { if (!S.com) api.mod('Desligou sem avisar a operação.', 'D2'); S.g1off = true; R.state.running = false; R.setDrawer('G1', false); api.ok('Gaveta G1 desligada. A bomba para por inércia.'); } });
        A.push({ t: 'Bloquear a G1 com cadeado pessoal e etiqueta', done: S.g1lock, dis: !S.g1off, run() { S.g1lock = true; R.drawers.G1.lk.visible = true; api.ok('Cadeado pessoal e etiqueta na G1.'); } });
      }
      if (id === 'acopl') {
        if (S.guard) A.push({ t: 'Retirar a proteção do acoplamento', run() {
          if (R.state.running) return api.crit('Mão na zona de rotação', 'A bomba ainda está girando. Retirar a proteção agora expõe mãos e roupas ao acoplamento em movimento.', 'C3');
          if (!S.g1lock) return api.crit('Intervenção sem bloqueio', 'O equipamento está só desligado. Sem cadeado, qualquer pessoa pode religar a gaveta durante o serviço.', 'C3');
          if (!S.test) return api.crit('Intervenção sem teste', 'Ninguém confirmou energia zero. Se o bloqueio estivesse no ponto errado, o motor partiria com a mão no acoplamento.', 'C4');
          S.guard = false; R.guard.visible = false; api.ok('Proteção retirada.');
        } });
        else A.push({ t: 'Inspecionar o acoplamento', done: S.insp, run() { S.insp = true; api.ok('Elemento elástico com desgaste e trincas: troca programada. O alinhamento precisará ser refeito.'); } });
      }
      if (id === 'motor') A.push({ t: 'Observar o motor', run() { api.info(R.state.running ? 'Vibração alta e ruído no lado acoplado.' : 'Motor parado.'); } });
      return A;
    },
    check: (S) => [['Avisar a operação', S.com], ['Conferir o TAG no CCM', S.tag], ['Desligar a gaveta G1', S.g1off], ['Cadeado e etiqueta na G1', S.g1lock], ['Teste de partida: energia zero', S.test], ['Retirar a proteção', !S.guard], ['Inspecionar o acoplamento', S.insp]],
    done: (S) => S.insp,
    cen: {
      when: (S) => S.g1lock && !S.test, who: 'sup', fala: 'Já liberou? A produção está cobrando. Pula esse teste aí, a gaveta já está desligada.',
      texto: 'Vocês acabaram de pôr o cadeado na G1. Falta o teste de partida.',
      opts: [
        { t: 'Pular o teste de partida e já abrir a proteção', k: 'crit', c: 'C4', fb: 'Sem o teste, ninguém confirmou energia zero. Se a gaveta errada tivesse sido bloqueada, vocês só descobririam com a mão no acoplamento.' },
        { t: 'Explicar ao supervisor que falta um passo e fazer o teste agora', k: 'best', c: 'D2', fb: 'Um minuto de teste confirma o que o cadeado sozinho não garante. Dizer isso com calma também é segurança.' },
        { t: 'Pedir ao colega para conferir o TAG da gaveta antes de seguir', k: 'ok', fb: 'Boa conferência, mas o teste de partida continua obrigatório antes de intervir.' },
      ],
    },
    deb: {
      fsi: { t: 'Bloqueio no equipamento errado', d: 'Evento genérico para discussão: após a reforma de um painel, um mantenedor desligou e bloqueou a gaveta pela posição de costume. Ela alimentava outro equipamento. O motor certo continuava energizado e partiu por um comando remoto durante a intervenção.', l: 'O TAG manda, não a posição. O teste de partida é a última barreira antes da mão.' },
      perguntas: ['O que é perigo e o que é risco nesta tarefa?', 'Por que a botoeira não serve como bloqueio?', 'Em que momento a pressa entrou na decisão de vocês?'],
      bancada: 'Lab de Comandos: localizar e bloquear o disjuntor certo do painel montado, com teste de partida.',
    },
    crits: ['C1', 'C2', 'C3', 'C4', 'D2'],
  },
  /* ========== SA2 ========== */
  {
    id: 2, area: 'Redução', hora: '09:30', scene: 'crane', titulo: 'A carga ficou no gancho',
    foco: 'Energia gravitacional, segunda fonte não mapeada e planejar antes de agir',
    cfg: { bg: 0x1a1c1f, cam: [10, 7.5, 18], target: [-0.5, 4.8, 0], fov: 44, maxD: 32, shadowSize: 16 },
    os: { num: 'OS 4730', equip: 'PR-301 · Ponte rolante 10 t', local: 'Redução · Sala de cubas 3', desc: 'Freio de elevação falhando. Carga de 2 t no gancho.', prio: 'Emergencial' },
    falas: [
      ['op', 'Corta a energia logo, que eu preciso do corredor livre para a troca de anodos.'],
      ['tst', '(pelo rádio) Ninguém passa embaixo dessa carga, entendido?'],
      ['col', 'Essa ponte tem alimentação do comando separada, lembra? Vi no diagrama uma vez.'],
      ['nar', 'O freio segura a carga, mas está falhando. Montem a AST antes de qualquer comando.'],
    ],
    ast: {
      cards: [['Carga suspensa de 2 t', 'P'], ['Queda da carga e esmagamento', 'R'], ['Eletricidade 440 V do barramento', 'P'], ['Choque elétrico', 'R'], ['Segunda alimentação 220 V do comando', 'P'], ['Energização inesperada', 'R']],
      controls: [['Isolar a área sob a carga', 1], ['Baixar a carga sobre calços antes de desenergizar', 1], ['Mapear e bloquear todas as fontes, inclusive a auxiliar', 1], ['Bloqueio coletivo com cadeado de cada pessoa', 1], ['Desligar a energia imediatamente', 0, 'Com o freio falhando, sem energia não há controle da carga.'], ['Trabalhar ao lado da carga com cuidado', 0, 'Ninguém fica sob ou ao lado de carga suspensa.'], ['Confiar no freio enquanto repara', 0, 'O freio é justamente o que está falhando.']],
    },
    init(S, R) { Object.assign(S, { area: false, down: false, q1: false, q1lock: false, found: false, qa: false, qalock: false, test: false, col: false, rep: false }); S.isolado = () => S.q1 && S.qa; S.travado = () => S.q1lock && S.qalock; R.state.moving = false; },
    actions(id, S, R, api) {
      const A = [];
      if (id === 'area') A.push({ t: 'Isolar a área sob a carga com cones e corrente', done: S.area, run() { S.area = true; R.ring.visible = true; api.ok('Área isolada. Ninguém sob a carga.'); } });
      if (id === 'controle') {
        A.push({ t: 'Pedir ao operador para baixar a carga sobre os calços', done: S.down, run() {
          if (S.q1) return api.info('Sem energia a ponte não responde.');
          if (!S.area) api.mod('Baixou a carga sem isolar a área.', 'C2');
          S.down = true; R.state.down = true; api.ok('Carga apoiada nos calços. Energia gravitacional controlada.');
        } });
        A.push({ t: 'Apertar SUBIR no controle (teste de partida)', done: S.test, dis: !S.q1lock, run() {
          if (!S.qalock) { S.half = true; return api.info('A ponte não se move. Mas a lâmpada amarela de COMANDO do painel continua acesa.'); }
          S.test = true; api.ok('Nada se move e o painel está apagado. Energia zero confirmada.');
        } });
      }
      if (id === 'chave') {
        A.push({ t: 'Desligar a chave Q1 do barramento', done: S.q1, run() {
          if (!S.down) return api.crit('Carga suspensa sem energia', 'Com o freio falhando, cortar a energia tira o controle da carga. Duas toneladas podem descer sem comando sobre quem estiver embaixo.', 'C2');
          S.q1 = true; api.animate(R.knob, 'rotation.z', -Math.PI / 2, 0.7); R.lampMain.material.emissiveIntensity = 0.05; api.ok('Q1 desligada.');
        } });
        A.push({ t: 'Bloquear a Q1 com cadeado e etiqueta', done: S.q1lock, dis: !S.q1, run() { S.q1lock = true; R.lockChave.visible = true; api.ok('Cadeado e etiqueta na Q1.'); } });
      }
      if (id === 'painel') {
        A.push({ t: 'Medir tensão no painel com o detector', dis: !S.q1, run() { if (!S.qa) { S.found = true; return api.info('220 V presentes no circuito de comando e do freio. O diagrama indica a origem: QA-02, na parede do fundo.'); } api.ok('Ausência de tensão confirmada no painel.'); } });
        A.push({ t: 'Abrir o painel e iniciar o reparo do freio', done: S.rep, run() {
          if (!S.down) return api.crit('Carga suspensa', 'A carga ainda está no gancho, presa por um freio que falha.', 'C2');
          if (!S.q1lock) return api.crit('Intervenção sem bloqueio', 'A chave do barramento não está bloqueada.', 'C3');
          if (!S.qalock) return api.crit('Fonte não mapeada', 'A QA-02 alimenta o comando e o freio em 220 V. Com ela ligada, o circuito energiza as mãos de quem está dentro do painel.', 'C2');
          if (!S.test) return api.crit('Intervenção sem teste', 'Ninguém confirmou energia zero no controle.', 'C4');
          if (!S.col) api.mod('Reparo iniciado sem bloqueio coletivo da equipe.', 'D1');
          S.rep = true; api.ok('Painel aberto com energia zero. Reparo do freio iniciado.');
        } });
      }
      if (id === 'aux') {
        A.push({ t: 'Desligar a QA-02', done: S.qa, run() { S.qa = true; api.animate(R.lever, 'rotation.z', Math.PI / 2, 0.7); R.lampCmd.material.emissiveIntensity = 0.05; api.ok('QA-02 desligada. Lâmpada de comando apagou.'); } });
        A.push({ t: 'Bloquear a QA-02 com cadeado e etiqueta', done: S.qalock, dis: !S.qa, run() { S.qalock = true; R.lockAux.visible = true; api.ok('Cadeado e etiqueta na QA-02.'); } });
      }
      if (id === 'caixa') A.push({ t: 'Chaves na caixa coletiva; cada executante aplica o seu cadeado', done: S.col, dis: !(S.q1lock && S.qalock), run() { S.col = true; R.boxLocks.forEach(l => l.visible = true); api.ok('Bloqueio coletivo com três cadeados.'); } });
      return A;
    },
    check: (S) => [['Isolar a área sob a carga', S.area], ['Baixar a carga sobre os calços', S.down], ['Desligar e bloquear a Q1', S.q1lock], ['Encontrar e bloquear a QA-02', S.qalock], ['Teste: nada se move, painel apagado', S.test], ['Bloqueio coletivo', S.col], ['Iniciar o reparo do freio', S.rep]],
    done: (S) => S.rep,
    cen: {
      when: (S) => S.q1lock, who: 'out', fala: 'Esqueci meu cadeado no vestiário. Me empresta um dos seus? É rapidinho, só vou olhar o freio junto.',
      texto: 'Um mecânico de outra equipe vai entrar na área bloqueada para ajudar.',
      opts: [
        { t: 'Emprestar um cadeado seu', k: 'mod', c: 'D1', fb: 'Um cadeado seu no nome dele confunde quem está exposto. Na hora de retirar, ninguém sabe se ele ainda está lá dentro.' },
        { t: 'Deixar ele trabalhar sem cadeado: você já bloqueou tudo', k: 'crit', c: 'D1', fb: 'Se você terminar antes e retirar o seu cadeado, ele fica exposto sem nenhuma proteção própria.' },
        { t: 'Ele pega um cadeado pessoal no kit reserva, com etiqueta nominal, e aplica na caixa coletiva', k: 'best', fb: 'Cada pessoa exposta, um cadeado com o seu nome. Só sai o último cadeado quando o último executante sair.' },
      ],
    },
    deb: {
      fsi: { t: 'Energização por fonte não mapeada', d: 'Evento genérico para discussão: durante o reparo de um equipamento de içamento, a alimentação principal estava bloqueada, mas o circuito de comando era alimentado por outra fonte. Ao abrir o painel, o executante tocou um borne energizado.', l: 'Toda fonte precisa estar no mapa antes da tarefa. O teste revela o que o diagrama esqueceu.' },
      perguntas: ['Quais energias existiam além da elétrica?', 'Por que a ordem das ações importava aqui?', 'Quem deveria ter mapeado a QA-02 antes da tarefa?'],
      bancada: 'Lab de Comandos: painel com duas alimentações. O grupo encontra e bloqueia as duas, com bloqueio coletivo.',
    },
    crits: ['C1', 'C2', 'C3', 'C4', 'D1'],
  },
  /* ========== SA3 ========== */
  {
    id: 3, area: 'Refinaria', hora: '11:00', scene: 'pump', titulo: 'Alinhamento com a válvula passando',
    foco: 'Múltiplas energias, energia residual, parar e pedir ajuda',
    cfg: { bg: 0x20262c, cam: [5.5, 4.2, 9.5], target: [0.6, 1.6, 0] },
    os: { num: 'OS 4744', equip: 'BP-201 · Bomba de licor', local: 'Refinaria · Casa de bombas 2', desc: 'Realinhar motor e bomba após troca do elemento elástico.', prio: 'Alta' },
    falas: [
      ['col', 'A válvula de sucção está fechada desde cedo. Pode abrir o dreno e começar.'],
      ['op', 'O licor aqui está a uns 105 °C, e a linha fica pressurizada pelo tanque.'],
      ['sup', 'Tolerância de 0,05 mm, hein. Quero ela girando antes do almoço.'],
      ['nar', 'A BP-201 está parada, mas os bloqueios da manhã foram retirados. Montem a AST.'],
    ],
    ast: {
      cards: [['Eletricidade 440 V no motor', 'P'], ['Choque elétrico', 'R'], ['Licor cáustico a 105 °C', 'P'], ['Queimadura química e térmica', 'R'], ['Pressão na linha', 'P'], ['Projeção de fluido', 'R'], ['Partes rotativas', 'P'], ['Prensamento das mãos', 'R']],
      controls: [['Bloquear a gaveta G1 e testar a partida', 1], ['Fechar e bloquear sucção e recalque', 1], ['Drenar e confirmar 0 bar no manômetro', 1], ['EPI para produto químico quente', 1], ['Parar e sair da linha de fogo se a pressão voltar', 1], ['Confiar que válvula fechada não passa', 0, 'Válvula fechada pode passar. Por isso se drena e se confirma no manômetro.'], ['Abrir o dreno sem EPI porque é rápido', 0, 'O primeiro jato do dreno é o mais quente.'], ['Alinhar com a bomba girando devagar', 0, 'Alinhamento é com energia zero.']],
    },
    init(S, R) {
      Object.assign(S, { epi: false, com: false, g1off: false, g1lock: false, test: false, sucC: false, sucL: false, recC: false, recL: false, drain: false, zero: false, guard: true, meas: false, V: 0.32, H: -0.18, adj: 0, ok: false, leak: false, up: false, redrain: false });
      S.isolado = () => S.g1off; S.travado = () => S.g1lock; R.state.running = false; R.state.pressure = 4.2;
    },
    actions(id, S, R, api) {
      const A = []; const f2 = (v) => v.toFixed(2).replace('.', ',');
      const block = S.leak && !S.zero;
      if (id === 'epi') A.push({ t: 'Vestir EPI para produto químico quente (face shield, luvas, avental)', done: S.epi, run() { S.epi = true; api.ok('EPI para produto químico vestido.'); } });
      if (id === 'operador') {
        A.push({ t: 'Combinar com o operador o isolamento da BP-201', done: S.com, run() { S.com = true; api.ok('Operação ciente. BP-201 fora de serviço para alinhamento.'); } });
        if (S.leak) A.push({ t: 'Pedir ao operador o bloqueio a montante da sucção', done: S.up, run() { S.up = true; R.capSuc.visible = true; api.ok('Operador fechou e bloqueou a válvula a montante. Bloqueio duplo na sucção.'); } });
      }
      if (id === 'ccm') {
        A.push({ t: 'Desligar a gaveta G1 · BP-201', done: S.g1off, run() { if (!S.com) api.mod('Desligou sem combinar com a operação.', 'D2'); S.g1off = true; R.setDrawer('G1', false); api.ok('Gaveta G1 desligada.'); } });
        A.push({ t: 'Bloquear a G1 com cadeado pessoal e etiqueta', done: S.g1lock, dis: !S.g1off, run() { S.g1lock = true; R.drawers.G1.lk.visible = true; api.ok('Cadeado e etiqueta na G1.'); } });
      }
      if (id === 'botoeira') A.push({ t: 'Apertar LIGA (teste de partida)', done: S.test, run() { testeLiga(S, R, api); } });
      const valve = (k, nome, wheel, cap) => {
        A.push({ t: 'Fechar a ' + nome, done: S[k + 'C'], run() { S[k + 'C'] = true; api.animate(wheel, 'rotation.z', wheel.rotation.z + Math.PI * 3, 1.8); api.ok(nome[0].toUpperCase() + nome.slice(1) + ' fechada.'); } });
        A.push({ t: 'Instalar capa bloqueadora com cadeado', done: S[k + 'L'], dis: !S[k + 'C'], run() { S[k + 'L'] = true; cap.visible = true; api.ok('Capa bloqueadora com cadeado na ' + nome + '.'); } });
      };
      if (id === 'vsuc') valve('suc', 'válvula de sucção V-201', R.wheelSuc, R.capSuc);
      if (id === 'vrec') valve('rec', 'válvula de recalque V-202', R.wheelRec, R.capRec);
      if (id === 'dreno') A.push({ t: S.leak ? 'Drenar de novo para o coletor' : 'Abrir o dreno para o coletor', done: S.leak ? (S.redrain) : S.drain, run() {
        if (!S.epi) return api.crit('Respingo de licor quente', 'O primeiro jato do dreno sai a 105 °C e cáustico. Sem face shield e luvas, atinge rosto e mãos.', 'C2');
        if (!(S.sucC && S.recC)) return api.mod('Abriu o dreno com válvula aberta: o licor continua entrando e não despressuriza.', 'C2');
        if (S.leak && !S.up) return api.mod('A sucção continua passando. Sem bloqueio a montante, a drenagem não zera a pressão.', 'C2');
        if (S.leak) S.redrain = true; else S.drain = true;
        R.state.draining = true; R.state.pressure = 0; R.state.hot = false; S.zero = false; setTimeout(() => { R.state.draining = false; }, 6000);
        api.ok('Dreno aberto. Pressão e temperatura caindo.');
      } });
      if (id === 'manometro') A.push({ t: 'Ler o manômetro', run() { if (R.state.pressure < 0.1 && (S.drain || S.redrain)) { S.zero = true; api.ok('0 bar. Linha despressurizada.'); } else api.info('O manômetro indica ' + f2(R.state.pressure).replace(',00', '') + ' bar: ainda há pressão.'); } });
      if (id === 'acopl') {
        if (S.guard) A.push({ t: 'Retirar a proteção do acoplamento', run() {
          if (!S.g1lock) return api.crit('Intervenção sem bloqueio elétrico', 'A gaveta G1 não está bloqueada.', 'C3');
          if (!S.test) return api.crit('Intervenção sem teste', 'Ninguém confirmou energia zero no motor.', 'C4');
          if (!(S.sucL && S.recL)) return api.crit('Válvulas sem bloqueio', 'Sem capa e cadeado, alguém pode abrir uma válvula e pressurizar a bomba com vocês ali.', 'C2');
          if (!S.zero) return api.crit('Pressão residual', 'Ninguém confirmou 0 bar. Ao soltar algo na bomba, licor quente pressurizado pode sair.', 'C2');
          S.guard = false; R.guard.visible = false; api.ok('Proteção retirada. Energia zero em todas as fontes.');
        } });
        else if (!S.ok) {
          A.push({ t: 'Montar o relógio comparador e medir', done: S.meas, run() { S.meas = true; api.info(`Leitura inicial: vertical ${f2(S.V)} mm, horizontal ${f2(S.H)} mm.`); } });
          const adj = (k, d, t) => A.push({ t, small: true, dis: !S.meas || block, run() { S[k] = Math.round((S[k] + d) * 100) / 100; S.adj++; api.info(`${t}: vertical ${f2(S.V)}, horizontal ${f2(S.H)}`); } });
          adj('V', -0.10, 'Calço + 0,10 mm'); adj('V', -0.05, 'Calço + 0,05 mm'); adj('V', 0.05, 'Retirar 0,05 mm');
          adj('H', 0.05, 'Motor → 0,05 mm'); adj('H', -0.05, 'Motor ← 0,05 mm'); adj('H', 0.02, 'Ajuste fino → 0,02'); adj('H', -0.02, 'Ajuste fino ← 0,02');
          A.push({ t: 'Reapertar a base e medir de novo', dis: !S.meas || block, run() { if (Math.abs(S.V) <= 0.05 && Math.abs(S.H) <= 0.05) { S.ok = true; api.ok(`Alinhado: vertical ${f2(S.V)} mm, horizontal ${f2(S.H)} mm.`); } else api.info('Ainda fora da tolerância de 0,05 mm.'); } });
        }
      }
      return A;
    },
    panel(id, S) { if (id !== 'acopl' || S.guard) return ''; const f2 = (v) => (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ','); const okV = Math.abs(S.V) <= 0.05, okH = Math.abs(S.H) <= 0.05; return S.meas ? `<div class="readout"><div><span>Vertical</span><b class="${okV ? 'g' : 'r'}">${f2(S.V)}</b><i>mm</i></div><div><span>Horizontal</span><b class="${okH ? 'g' : 'r'}">${f2(S.H)}</b><i>mm</i></div><div><span>Tolerância</span><b>±0,05</b><i>mm</i></div></div>` : ''; },
    check: (S) => { const L = [['EPI para produto químico', S.epi], ['Combinar com a operação', S.com], ['Bloquear a G1', S.g1lock], ['Teste de partida', S.test], ['Bloquear sucção e recalque', S.sucL && S.recL], ['Drenar e confirmar 0 bar', S.drain && (S.zero || S.leak)], ['Retirar a proteção', !S.guard]]; if (S.leak) L.push(['Bloqueio a montante, nova drenagem e 0 bar', S.up && S.redrain && S.zero]); L.push(['Alinhar dentro de 0,05 mm', S.ok]); return L; },
    done: (S) => S.ok,
    cen: {
      when: (S) => S.adj >= 2, who: 'nar', fala: 'Um chiado vem da carcaça. O manômetro do recalque voltou a subir: 0 → 1,8 bar.',
      texto: 'Vocês estão ajoelhados ao lado do acoplamento, na frente do dreno.',
      before(S, R) { R.state.pressure = 1.8; R.state.hot = true; },
      opts: [
        { t: 'Terminar rápido: falta pouco para fechar o alinhamento', k: 'crit', c: 'C5', fb: '"Falta pouco" é a armadilha. A pressão subindo mostra que uma energia voltou, e vocês estão na linha de fogo.' },
        { t: 'Apertar mais o volante da válvula e seguir', k: 'mod', c: 'C5', fb: 'O volante já estava no fim de curso: a válvula está passando. Apertar não resolve, e vocês continuaram na linha de fogo.' },
        { t: 'Parar, sair da linha de fogo e chamar o operador', k: 'best', fb: 'Parar e pedir ajuda é a decisão certa. Com o operador, dá para bloquear a montante e drenar de novo.' },
      ],
      after(S) { S.leak = true; S.zero = false; },
    },
    deb: {
      fsi: { t: 'Energia residual com o trabalhador na linha de fogo', d: 'Evento genérico para discussão: durante a manutenção de uma bomba, a válvula de bloqueio passou produto quente. A pressão voltou aos poucos e o executante, focado na tarefa, continuou ao lado do dreno até a liberação do fluido.', l: 'Mudou a condição, para a tarefa. Sair da linha de fogo vem antes de entender o problema.' },
      perguntas: ['Que sinal mostrou que a energia voltou?', 'O que significa "linha de fogo" nesta cena?', 'Por que "falta pouco" é uma armadilha?'],
      bancada: 'Lab de Alinhamento: alinhamento real no conjunto didático, precedido do bloqueio completo do conjunto.',
    },
    crits: ['C1', 'C2', 'C3', 'C4', 'C5', 'D2'],
  },
  /* ========== SA4 ========== */
  {
    id: 4, area: 'Porto', hora: '14:00', scene: 'conveyor', titulo: 'O navio está esperando',
    foco: 'Normalização do desvio, pressão de terceiros e direito de recusa',
    cfg: { bg: 0x9fb0bd, fog: 0x9fb0bd, fogNear: 30, fogFar: 140, cam: [2.5, 4.6, 11], target: [-1.5, 1.2, 0], sunI: 2.6, sun: [12, 20, 14], hemi: 0.5, env: 0.55, maxD: 30, exposure: 0.72 },
    os: { num: 'OS 4769', equip: 'CT-101 · Correia de bauxita', local: 'Porto · Galeria de embarque', desc: 'Rolete de carga travado. Substituir.', prio: 'Alta' },
    falas: [
      ['op', 'Tem navio atracado. Me dá só um minuto com ela rodando, eu desligo depois.'],
      ['ctr', 'Vim ajudar. Meu cadeado ficou no outro serviço, mas a gente resolve.'],
      ['col', 'Sempre fizemos assim: o rolete troca com a correia devagar, é rapidinho.'],
      ['nar', 'Cada minuto parado custa caro ao embarque. Montem a AST.'],
    ],
    ast: {
      cards: [['Correia em movimento', 'P'], ['Arrastamento e esmagamento entre correia e rolete', 'R'], ['Eletricidade do motor de acionamento', 'P'], ['Partida inesperada', 'R'], ['Contrapeso do esticador tensionando a correia', 'P'], ['Chicoteamento da correia ou queda do contrapeso', 'R']],
      controls: [['Parar e bloquear no painel, com cadeado de cada pessoa', 1], ['Teste de partida', 1], ['Travar o contrapeso e aliviar a tensão', 1], ['Recusar trabalho com a correia em movimento', 1], ['Trocar com a correia em velocidade mínima', 0, 'Em qualquer velocidade a correia arrasta um braço.'], ['Usar o cabo de emergência como bloqueio', 0, 'O cabo para, mas não isola.'], ['Contratado trabalha sob o cadeado do colega', 0, 'Cada pessoa exposta precisa do próprio cadeado.']],
    },
    init(S, R) { Object.assign(S, { com: false, recusa: false, off: false, lock: false, cabo: false, test: false, tens: true, ctr: false, col: false, swap: false }); S.isolado = () => S.off; S.travado = () => S.lock; },
    actions(id, S, R, api) {
      const A = [];
      if (id === 'operador') A.push({ t: 'Pedir a parada da CT-101 para a troca do rolete', done: S.com, run() { S.com = true; api.ok('Pedido de parada feito à operação.'); } });
      if (id === 'rolete') {
        if (R.state.running) A.push({ t: 'Trocar o rolete com a correia rodando devagar', run() { return api.crit('Mão entre correia e rolete', 'O ponto de convergência entre correia e rolete puxa luva, mão e braço. Em velocidade baixa, a força continua a mesma.', 'C6'); } });
        A.push({ t: 'Trocar o rolete', done: S.swap, run() {
          if (R.state.running) return api.crit('Correia em movimento', 'A correia está rodando.', 'C6');
          if (!S.lock) return api.crit('Intervenção sem bloqueio', 'A correia está só desligada. Alguém na sala de controle pode partir.', 'C3');
          if (!S.test) return api.crit('Intervenção sem teste', 'Ninguém confirmou energia zero.', 'C4');
          if (S.tens) return api.crit('Contrapeso tensionado', 'Com 3,5 t tensionando a correia, soltar o rolete faz a correia chicotear e o contrapeso descer.', 'C2');
          if (!S.ctr) return api.crit('Pessoa exposta sem cadeado', 'O mecânico da contratada está na área sem cadeado próprio.', 'D1');
          if (!S.col) api.mod('Troca sem bloqueio coletivo.', 'D1');
          S.swap = true; R.jam.children[0].material = R.idlers[0].children[0].material; api.ok('Rolete substituído com energia zero.');
        } });
      }
      if (id === 'painel') {
        A.push({ t: 'Desligar a CT-101 no painel', done: S.off, run() { if (!S.com) api.mod('Parou sem combinar com a operação.', 'D2'); S.off = true; R.state.running = false; R.setPanel(false); api.ok('CT-101 desligada.'); } });
        A.push({ t: 'Bloquear o painel com cadeado e etiqueta', done: S.lock, dis: !S.off, run() { S.lock = true; R.lockPanel.visible = true; api.ok('Cadeado e etiqueta no painel.'); } });
      }
      if (id === 'cabo') {
        A.push({ t: 'Puxar o cabo de emergência e conferir o desarme', done: S.cabo, run() { S.cabo = true; if (R.state.running) { R.state.running = false; api.info('A correia parou pelo cabo. O cabo para, não isola.'); } else api.ok('Cabo de emergência desarmado e conferido.'); } });
        A.push({ t: 'Usar o cabo como bloqueio para a troca', run() { return api.crit('Bloqueio no ponto errado', 'O cabo de emergência é um dispositivo de parada. Rearmado por alguém, a correia volta a partir.', 'C3'); } });
      }
      if (id === 'botoeira') A.push({ t: 'Apertar LIGA (teste de partida)', done: S.test, run() { testeLiga(S, R, api); } });
      if (id === 'esticador') A.push({ t: 'Travar o contrapeso com o pino e aliviar a tensão', done: !S.tens, run() { if (R.state.running) return api.crit('Contrapeso com a correia rodando', 'Mexer no esticador com a correia em movimento expõe a pessoa ao contrapeso e à correia.', 'C2'); S.tens = false; R.state.tension = false; R.pin.visible = true; api.ok('Contrapeso travado. Correia sem tensão.'); } });
      if (id === 'contratado') {
        A.push({ t: 'Entregar cadeado do kit reserva com etiqueta nominal', done: S.ctr, run() { S.ctr = true; api.ok('Mecânico da contratada com cadeado e etiqueta próprios.'); } });
        if (!S.ctr) A.push({ t: 'Deixar ele ajudar sob o seu cadeado', run() { return api.crit('Pessoa exposta sem cadeado', 'Se você retirar o seu cadeado antes dele terminar, ele fica exposto sem nenhuma proteção.', 'D1'); } });
      }
      if (id === 'caixa') A.push({ t: 'Chave na caixa coletiva; cada um aplica o seu cadeado', done: S.col, dis: !S.lock, run() { if (!S.ctr) return api.mod('O mecânico da contratada ainda está sem cadeado.', 'D1'); S.col = true; R.boxLocks.forEach(l => l.visible = true); api.ok('Bloqueio coletivo com três cadeados.'); } });
      return A;
    },
    check: (S) => [['Pedir a parada à operação', S.com], ['Recusar a troca com a correia rodando', S.recusa], ['Desligar e bloquear no painel', S.lock], ['Teste de partida', S.test], ['Travar o contrapeso', !S.tens], ['Cadeado para o contratado', S.ctr], ['Bloqueio coletivo', S.col], ['Trocar o rolete', S.swap]],
    done: (S) => S.swap,
    cen: {
      when: (S) => S.com, who: 'sup', fala: 'Faz rápido, eu assumo. O navio não pode esperar.',
      texto: 'O supervisor chegou e confirmou o pedido do operador: trocar com a correia rodando.',
      opts: [
        { t: 'Obedecer: o supervisor assumiu a responsabilidade', k: 'crit', c: 'C6', fb: 'Responsabilidade assumida não muda a física: a correia continua puxando a mão para o rolete.' },
        { t: 'Trocar em velocidade mínima, com alguém no cabo de emergência', k: 'crit', c: 'C6', fb: 'O cabo reage depois do acidente. Em velocidade mínima a correia ainda arrasta um braço. "Sempre fizemos assim" é normalização do desvio.' },
        { t: 'Exercer o direito de recusa, registrar, chamar a técnica de segurança e propor parada curta com bloqueio', k: 'best', c: 'D3', fb: 'A técnica de segurança apoia e o supervisor concorda com 20 minutos de parada. O navio espera menos do que esperaria por um acidente.' },
      ],
      after(S, R, o) { S.recusa = o.k === 'best'; if (!S.recusa) S.recusaTarde = true; },
    },
    deb: {
      fsi: { t: 'Religamento com pessoa exposta', d: 'Evento genérico para discussão: uma intervenção rápida em correia virou rotina sem bloqueio porque "sempre deu certo". Num dia de pressão de embarque, a correia foi religada por outra pessoa com o executante no ponto de convergência.', l: 'O que sempre deu certo não estava seguro: estava com sorte. Recusar é um direito e um dever.' },
      perguntas: ['Quais frases da cena mostravam normalização do desvio?', 'Como recusar sem romper com a equipe?', 'O que muda quando quem pressiona é o supervisor?'],
      bancada: 'Roda de conversa sobre o direito de recusa, com dramatização da cena pelo grupo.',
    },
    crits: ['C1', 'C2', 'C3', 'C4', 'C6', 'D1', 'D3'],
  },
];
