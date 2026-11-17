import { getPhoto, getProjects } from '@/content/projetos'
import { HouseSection } from '@/components/house/HouseSection'
import s from './home.module.css'

/**
 * 01 · A casa. O título fica aqui (servidor); o palco (`[data-casa-stage]`) é a maquete 3D
 * interativa, com a capa do projeto como imagem de espera, e a lista de ambientes navega por ela.
 */
export function Casa() {
  const projeto = getProjects()[0]
  const capa = getPhoto(projeto.capa)
  // até 4 fotos por cômodo, resolvidas no servidor (o cliente não carrega o catálogo inteiro)
  const rooms = projeto.rooms.map((r) => ({
    id: r.id,
    nome: r.nome,
    descricao: r.descricao,
    fotos: r.fotos.slice(0, 4).map(getPhoto),
  }))
  return (
    <section id="casa" className={s.casa} aria-labelledby="casa-titulo">
      <div className={s.casaIntro}>
        <p className={s.eyebrow}>Arquitetura e interiores</p>
        <h1 className={s.casaH1}>
          <span className="sr-only">Amene, arquitetura e interiores: </span>
          Casas desenhadas pela luz de cada hora
        </h1>
      </div>

      <HouseSection
        projeto={{ nome: projeto.nome, slug: projeto.slug }}
        rooms={rooms}
        cover={capa}
        coverAlt={`${projeto.nome}: living com parede de pedra natural, painéis de freijó e sofá em bouclê`}
        stageClassName={s.casaStage}
        infoClassName={s.casaInfo}
        h2ClassName={s.casaH2}
        linkClassName={s.textLink}
        eyebrow={
          <p className={s.eyebrow}>
            <span className={s.num}>01</span> A casa
          </p>
        }
      />
    </section>
  )
}
