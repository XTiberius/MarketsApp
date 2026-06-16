'use client'

import { useRef, useEffect, useState } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onChange: (dataUrl: string | null) => void
}

export function SignatureField({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    setIsDrawing(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
    onChange(canvasRef.current!.toDataURL())
  }

  function stopDrawing() {
    setIsDrawing(false)
  }

  function clearSignature() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-input bg-white/95 shadow-[inset_0_1px_3px_hsl(var(--primary)/0.08)]">
        <canvas
          ref={canvasRef}
          data-testid="signature-canvas"
          width={400}
          height={150}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      {hasSignature && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          className="h-auto px-0 text-xs"
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear signature
        </Button>
      )}
    </div>
  )
}
