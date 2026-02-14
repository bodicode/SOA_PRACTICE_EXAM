'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useUserStore } from '@/stores/userStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Coffee, Copy, Check, Sparkles, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const BANK_INFO = {
    bankName: 'TPBank',
    accountNumber: '06544693401',
    accountHolder: 'Huỳnh Lê Nhật Hoàng',
    bankCode: 'TPB',
}

export default function DonatePage() {
    const t = useTranslations('donate')
    const { user } = useUserStore()

    const [step, setStep] = useState(1)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [donorName, setDonorName] = useState(user?.fullName || '')
    const [amount, setAmount] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showThankYou, setShowThankYou] = useState(false)

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const presetAmounts = [20000, 50000, 100000, 200000, 500000, 1000000]

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/donations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    donorName: donorName || undefined,
                    donorEmail: user?.email || undefined,
                    amount: parseFloat(amount),
                    method: 'bank',
                    message: message || undefined,
                }),
            })
            if (res.ok) {
                setShowThankYou(true)
                setStep(1)
                setAmount('')
                setMessage('')
            }
        } catch (error) {
            console.error('Error submitting donation:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatVND = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num) + 'đ'
    }

    const canProceedStep1 = !!amount && parseFloat(amount) > 0

    const getBankQRUrl = () => {
        const params = new URLSearchParams({
            accountName: BANK_INFO.accountHolder,
            amount: amount,
        })
        if (message) params.append('addInfo', message)
        return `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNumber}-compact2.png?${params.toString()}`
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Section */}
            <section className="relative pt-12 pb-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm font-medium mb-6">
                            <Heart className="w-4 h-4 fill-current" />
                            {t('badge')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 mb-4">
                            {t('title')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('subtitle')}
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-2xl mx-auto px-4">
                {/* Thank You Modal */}
                <AnimatePresence>
                    {showThankYou && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowThankYou(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-card rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.6, repeat: 2 }}
                                    className="text-6xl mb-4"
                                >
                                    💖
                                </motion.div>
                                <h2 className="text-2xl font-bold mb-2">{t('thankYouTitle')}</h2>
                                <p className="text-muted-foreground mb-6">{t('thankYouMessage')}</p>
                                <Button
                                    onClick={() => setShowThankYou(false)}
                                    className="bg-linear-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
                                >
                                    {t('close')}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step Indicator (2 steps now) */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${step === s
                                    ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-110'
                                    : step > s
                                        ? 'bg-green-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 2 && (
                                <div className={`w-12 h-1 rounded-full transition-colors ${step > s ? 'bg-green-500' : 'bg-muted'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {/* STEP 1: Amount & Info */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-card rounded-2xl border p-6 md:p-8 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-linear-to-br from-pink-500 to-purple-600 text-white">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{t('step1Title')}</h2>
                                    <p className="text-sm text-muted-foreground">{t('step1Desc')}</p>
                                </div>
                            </div>

                            {/* Preset Amounts */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-muted-foreground mb-3 block">{t('selectAmount')}</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {presetAmounts.map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => setAmount(preset.toString())}
                                            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${amount === preset.toString()
                                                    ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-md'
                                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                                                }`}
                                        >
                                            {formatVND(preset)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">{t('yourName')}</label>
                                        <Input
                                            placeholder={t('namePlaceholder')}
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">{t('amountLabel')}</label>
                                        <Input
                                            type="number"
                                            placeholder={t('amountPlaceholder')}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">{t('messageLabel')}</label>
                                    <Textarea
                                        placeholder={t('messagePlaceholder')}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="rounded-xl resize-none"
                                        rows={3}
                                    />
                                </div>

                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!canProceedStep1}
                                    className="w-full py-6 text-base rounded-xl bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20"
                                >
                                    <span className="flex items-center gap-2">
                                        {t('nextStep')}
                                        <ArrowRight className="w-5 h-5" />
                                    </span>
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: QR Code & Confirm */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-card rounded-2xl border p-6 md:p-8 shadow-sm"
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold">{t('step2Title')}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{t('step2Desc')}</p>
                            </div>

                            {/* Amount display */}
                            <div className="text-center mb-4">
                                <div className="inline-block bg-linear-to-r from-pink-500/10 to-purple-500/10 rounded-2xl px-8 py-4">
                                    <p className="text-sm text-muted-foreground mb-1">{t('amountLabel')}</p>
                                    <p className="text-3xl font-bold text-pink-500">{formatVND(parseFloat(amount))}</p>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center mb-6">
                                <div className="bg-white rounded-2xl p-3 border-2 border-dashed border-gray-200 shadow-inner">
                                    <img
                                        src={getBankQRUrl()}
                                        alt={t('scanQR')}
                                        className="w-72 h-72 object-contain"
                                    />
                                </div>
                            </div>

                            {/* Bank details */}
                            <div className="space-y-2 mb-6">
                                {[
                                    { label: t('bankName'), value: BANK_INFO.bankName, key: 'bankName' },
                                    { label: t('accountNumber'), value: BANK_INFO.accountNumber, key: 'accountNumber' },
                                    { label: t('accountHolder'), value: BANK_INFO.accountHolder, key: 'accountHolder' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2.5">
                                        <div>
                                            <p className="text-xs text-muted-foreground">{item.label}</p>
                                            <p className="font-medium text-sm">{item.value}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(item.value, item.key)}
                                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                        >
                                            {copiedField === item.key
                                                ? <Check className="w-4 h-4 text-green-500" />
                                                : <Copy className="w-4 h-4 text-muted-foreground" />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-center text-muted-foreground mb-4">{t('note')}</p>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="py-6 rounded-xl flex-1"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t('backButton')}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="py-6 rounded-xl flex-2 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('submitting')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" />
                                            {t('confirmTransfer')}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Coffee Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Coffee className="w-5 h-5" />
                        <p className="text-sm">{t('coffeeNote')}</p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
