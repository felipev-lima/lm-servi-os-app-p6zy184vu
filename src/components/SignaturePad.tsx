/**
 * Assinatura no dedo (celular) ou no mouse (computador).
 *
 * Copiado da FL, onde já foi testado e corrigido:
 *  - o canvas é exportado SEM fundo branco: os pixels claros viram transparentes.
 *    Na FL a assinatura saía como um retângulo branco cobrindo a linha no PDF.
 *  - `onCanvasReady` entrega a referência do canvas para o formulário ler o
 *    desenho na hora de salvar. Depender só do evento de fim de traço fazia a
 *    assinatura se perder quando a pessoa tocava em "Salvar" logo depois.
 */
import { useEffect, useRef } from 'react'

export interface SignaturePadRef {
  limpar: () => void
  /** dataURL PNG com fundo transparente, ou '' se não desenhou nada */
  exportar: () => string
}

export default function SignaturePad({
  onCanvasReady,
  altura = 140,
}: {
  onCanvasReady?: (ref: SignaturePadRef) => void
  altura?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const desenhando = useRef(false)
  const temTraco = useRef(false)
  const ultimo = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1
      const largura = canvas.clientWidth
      canvas.width = largura * dpr
      canvas.height = altura * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#0B3D91'
      }
    }
    ajustar()
    window.addEventListener('resize', ajustar)

    /** Lê o canvas e devolve só o traço, sem o fundo branco */
    const exportar = (): string => {
      const cv = canvasRef.current
      if (!cv || !temTraco.current) return ''
      const ctx = cv.getContext('2d')
      if (!ctx) return ''
      const img = ctx.getImageData(0, 0, cv.width, cv.height)
      const d = img.data
      let algumPonto = false
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]
        const g = d[i + 1]
        const b = d[i + 2]
        const a = d[i + 3]
        // quase branco (ou já transparente) -> transparente
        if (a === 0 || (r > 235 && g > 235 && b > 235)) {
          d[i + 3] = 0
        } else {
          d[i] = 11
          d[i + 1] = 61
          d[i + 2] = 145
          d[i + 3] = 255
          algumPonto = true
        }
      }
      if (!algumPonto) return ''
      ctx.putImageData(img, 0, 0)
      return cv.toDataURL('image/png')
    }

    const limpar = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      temTraco.current = false
    }

    onCanvasReady?.({ limpar, exportar })

    return () => window.removeEventListener('resize', ajustar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e: React.PointerEvent) => {
    const cv = canvasRef.current!
    const r = cv.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const iniciar = (e: React.PointerEvent) => {
    e.preventDefault()
    desenhando.current = true
    ultimo.current = pos(e)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const mover = (e: React.PointerEvent) => {
    if (!desenhando.current) return
    e.preventDefault()
    const cv = canvasRef.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx || !ultimo.current) return
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(ultimo.current.x, ultimo.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ultimo.current = p
    temTraco.current = true
  }

  const terminar = () => {
    desenhando.current = false
    ultimo.current = null
  }

  return (
    <div className="space-y-1">
      <canvas
        ref={canvasRef}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerLeave={terminar}
        style={{ height: altura, touchAction: 'none' }}
        className="w-full rounded-md border-2 border-dashed border-slate-300 bg-white cursor-crosshair"
      />
      <p className="text-[9px] text-muted-foreground text-center">
        Assine com o dedo (celular) ou com o mouse
      </p>
    </div>
  )
}
