import { notFound } from 'next/navigation'
import { MaqueteDev } from './MaqueteDev'

// Página de verificação visual da maquete. Só existe em desenvolvimento.
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <MaqueteDev />
}
