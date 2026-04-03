import React, { useEffect, useRef, useState } from 'react'
import { Camera, ScanLine, AlertCircle } from 'lucide-react'
import Modal from '../shared/Modal'
import Button from '../shared/Button'

export default function BarcodeScannerModal({ open, onClose, onDetected }) {
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const intervalRef = useRef(null)
    const detectorRef = useRef(null)

    const [status, setStatus] = useState('Requesting camera access...')
    const [error, setError] = useState('')
    const [manualCode, setManualCode] = useState('')

    useEffect(() => {
        if (!open) return undefined

        let cancelled = false

        const stopScanner = () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
                streamRef.current = null
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null
            }
        }

        const handleDetected = (value) => {
            const code = String(value || '').trim()
            if (!code) return
            stopScanner()
            onDetected(code)
            onClose()
        }

        const startScanner = async () => {
            setError('')
            setStatus('Requesting camera access...')
            setManualCode('')

            if (!window.isSecureContext) {
                setStatus('Manual entry required')
                setError('Barcode scanning needs HTTPS or localhost camera access. Enter the code manually.')
                return
            }

            if (!('BarcodeDetector' in window)) {
                setStatus('Manual entry required')
                setError('This browser does not support BarcodeDetector. Enter the code manually.')
                return
            }

            try {
                const supportedFormats = await window.BarcodeDetector.getSupportedFormats()
                const preferredFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
                const formats = preferredFormats.filter((format) => supportedFormats.includes(format))
                if (!formats.length) {
                    setStatus('Manual entry required')
                    setError('No supported barcode formats were reported by this browser. Enter the code manually.')
                    return
                }

                detectorRef.current = new window.BarcodeDetector({ formats })

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                })

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }

                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                }

                setStatus('Point the camera at a barcode')
                intervalRef.current = window.setInterval(async () => {
                    if (!videoRef.current || !detectorRef.current) return
                    try {
                        const barcodes = await detectorRef.current.detect(videoRef.current)
                        if (barcodes.length > 0) {
                            handleDetected(barcodes[0].rawValue)
                        }
                    } catch {
                        setError('Scanning failed. You can still enter the barcode manually.')
                    }
                }, 500)
            } catch {
                setStatus('Manual entry required')
                setError('Unable to access the camera. Check browser permissions or enter the barcode manually.')
            }
        }

        startScanner()

        return () => {
            cancelled = true
            stopScanner()
        }
    }, [open, onClose, onDetected])

    const submitManualCode = () => {
        const code = manualCode.trim()
        if (!code) return
        onDetected(code)
        onClose()
    }

    return (
        <Modal open={open} onClose={onClose} title="Scan Barcode" width={640}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                    position: 'relative',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: '#0b0e13',
                    minHeight: 300,
                }}>
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            width: '68%',
                            height: 120,
                            border: '2px solid rgba(240,192,64,0.9)',
                            borderRadius: 16,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.28)',
                            position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: 8,
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                height: 2,
                                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                            }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <ScanLine size={18} color="var(--accent)" style={{ marginTop: 2 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontWeight: 600 }}>{status}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                            Supports camera scanning when the browser exposes `BarcodeDetector`.
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        background: '#ed89361a',
                        border: '1px solid #ed893655',
                        color: 'var(--warning)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        fontSize: '0.85rem',
                    }}>
                        <AlertCircle size={16} style={{ marginTop: 1 }} />
                        <span>{error}</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }} className="barcode-manual-grid">
                    <input
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Enter barcode manually"
                        style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            color: 'var(--text)',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-body)',
                            width: '100%',
                            outline: 'none',
                        }}
                    />
                    <Button onClick={submitManualCode} disabled={!manualCode.trim()}>
                        <Camera size={15} /> Use Code
                    </Button>
                </div>

                <style>{`
                    @media (max-width: 640px) {
                        .barcode-manual-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>
            </div>
        </Modal>
    )
}
