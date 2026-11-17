'use client'

import dynamic from 'next/dynamic'

const MaqueteScene = dynamic(() => import('./MaqueteScene'), { ssr: false })

export function MaqueteDev() {
  return <MaqueteScene />
}
