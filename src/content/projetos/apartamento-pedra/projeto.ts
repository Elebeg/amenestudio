import type { Projeto, Room } from '../schema'

const room = (r: Omit<Room, 'capa'>): Room => ({ ...r, capa: r.fotos[0] })
const f = (...n: number[]) => n.map((x) => `IMG_${x}`)

// Textos provisórios, a validar com o escritório.
export const apartamentoPedra: Projeto = {
  slug: 'apartamento-pedra',
  nome: 'Apartamento Pedra',
  local: 'A definir',
  metragem: null,
  ano: null,
  conceito:
    'Um apartamento em que a pedra natural, a madeira clara e as fibras naturais constroem uma atmosfera acolhedora, com a luz como fio condutor entre os ambientes.',
  capa: 'IMG_4736',
  placeholder: true,
  ficha: [
    { rotulo: 'Escopo', valor: 'Arquitetura de interiores' },
    { rotulo: 'Materiais', valor: 'Pedra natural, freijó, palha, bouclê' },
  ],
  rooms: [
    room({
      id: 'cozinha',
      nome: 'Cozinha e jantar',
      descricao: 'Cozinha integrada ao jantar, com marcenaria contínua e iluminação que valoriza os materiais.',
      fotos: f(4592, 4598, 4607, 4643, 4646, 5050),
    }),
    room({
      id: 'living',
      nome: 'Living',
      descricao: 'Parede de pedra natural, painéis de freijó e sofá em bouclê com toques de terracota.',
      fotos: f(4736, 4631, 4687, 4712, 4748, 4759, 4763, 5034),
    }),
    room({
      id: 'lavabo',
      nome: 'Lavabo',
      descricao: 'Um espaço compacto tratado como joia, com materiais marcantes e luz pontual.',
      fotos: f(4783),
    }),
    room({
      id: 'suite-casal',
      nome: 'Suíte casal',
      descricao: 'Cabeceira em treliça e paleta verde, para um quarto sereno e envolvente.',
      fotos: f(4796, 4810, 4823),
    }),
    room({
      id: 'quarto-solteiro',
      nome: 'Quarto de solteiro',
      descricao: 'Quarto com duas camas, marcenaria sob medida e aproveitamento inteligente do espaço.',
      fotos: f(4837, 4853, 4866, 4880, 4963),
    }),
    room({
      id: 'suite-ripada',
      nome: 'Suíte com ripado',
      descricao:
        'Cabeceira ripada em madeira e pendentes de palha; do outro lado, escrivaninha de desenho curvo diante de um ripado vertical branco.',
      fotos: f(4924, 4951, 4943, 4946),
    }),
    room({
      id: 'quarto-espelho',
      nome: 'Quarto com espelho orgânico',
      descricao: 'Espelho de forma orgânica e escrivaninha integrada em um quarto leve e luminoso.',
      fotos: f(5055, 5061, 5070),
    }),
  ],
}
