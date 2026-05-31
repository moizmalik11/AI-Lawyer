import React from 'react';
import { motion } from 'framer-motion';
import { FloatingNav } from '../components/ui/floating-navbar';
import { Scale, Home, Users } from 'lucide-react';
import {
    IconScale,
    IconBrain,
    IconUsers,
    IconTargetArrow,
    IconMapPin,
    IconGavel,
    IconShieldCheck,
    IconBulb,
    IconHeartHandshake,
} from '@tabler/icons-react';

/* ─── Animation Variants ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    }),
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ─── Values Data ─── */
const values = [
    {
        icon: IconShieldCheck,
        title: 'Accuracy',
        desc: 'Every legal answer is grounded in verified Pakistani civil law statutes and court judgments.',
    },
    {
        icon: IconBulb,
        title: 'Innovation',
        desc: 'Combining modern AI with traditional legal practice to make justice more accessible.',
    },
    {
        icon: IconHeartHandshake,
        title: 'Accessibility',
        desc: 'Bringing professional legal guidance to citizens who cannot afford traditional legal fees.',
    },
    {
        icon: IconGavel,
        title: 'Integrity',
        desc: 'We build with transparency, never replacing lawyers but empowering people with knowledge.',
    },
];

/* ─── Stats ─── */
const stats = [
    { label: 'Civil Law Topics', value: '50+' },
    { label: 'Court Judgments Indexed', value: '1000+' },
    { label: 'IBA Sukkur Students', value: '3' },
    { label: 'AI Model Accuracy', value: '~87%' },
];

/* ────────────────────────────── */

export default function AboutUs() {
    const navItems = [
        { name: 'Home', link: '/', icon: <Home className="h-4 w-4 text-brand-500" /> },
        { name: 'About Us', link: '/about', icon: <Users className="h-4 w-4 text-brand-500" /> },
    ];

    return (
        <div className="bg-[var(--background)] font-sans text-[var(--foreground)] min-h-screen w-full overflow-x-hidden">
            <FloatingNav navItems={navItems} />

            <div className="flex-1 overflow-y-auto pb-24 pt-20">

            {/* ── Hero Banner ── */}
            <div className="relative overflow-hidden bg-[var(--navbar-bg)] px-8 lg:px-16 pt-16 pb-20">
                {/* Background glow blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--brand-500)]/10 blur-3xl" />
                    <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-[var(--brand-500)]/8 blur-3xl" />
                </div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 bg-[var(--brand-500)]/15 border border-[var(--brand-500)]/30 rounded-full px-4 py-1.5 mb-6"
                    >
                        <IconMapPin size={14} className="text-[var(--brand-500)]" />
                        <span className="text-[12px] font-semibold text-[var(--brand-500)] tracking-wider uppercase">
                            IBA Sukkur · Sindh, Pakistan
                        </span>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-5"
                    >
                        Built by Students,{' '}
                        <span className="text-[var(--brand-500)]">
                            for Citizens
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        custom={2}
                        initial="hidden"
                        animate="visible"
                        className="text-[15px] text-white/60 leading-relaxed max-w-2xl mx-auto font-medium"
                    >
                        Smart Lawyer is a Final Year Project by students of{' '}
                        <span className="text-white/80 font-semibold">
                            Institute of Business Administration (IBA), Sukkur
                        </span>
                        . We built an AI-powered legal assistant trained exclusively on{' '}
                        <span className="text-[var(--brand-500)] font-semibold">
                            Pakistani Civil Law
                        </span>{' '}
                        — making legal knowledge accessible to everyone.
                    </motion.p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 lg:px-12 pt-14 space-y-20">

                {/* ── Stats Row ── */}
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            variants={fadeUp}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-center shadow-sm"
                        >
                            <p className="text-3xl font-bold text-[var(--brand-500)] tracking-tight">{s.value}</p>
                            <p className="text-[12px] text-[var(--text-soft)] font-medium mt-1">{s.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── Mission ── */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="flex flex-col lg:flex-row gap-10 items-center"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-9 w-9 rounded-xl bg-[var(--brand-500)]/15 flex items-center justify-center">
                                <IconTargetArrow size={20} className="text-[var(--brand-500)]" />
                            </div>
                            <span className="text-[11px] font-bold tracking-widest text-[var(--text-soft)] uppercase">
                                Our Mission
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-snug mb-4 tracking-tight">
                            Democratizing Legal Access in Pakistan
                        </h2>
                        <p className="text-[14px] text-[var(--text-soft)] leading-relaxed font-medium">
                            Pakistan's legal system remains inaccessible to millions due to language barriers,
                            high costs, and lack of awareness. Smart Lawyer aims to bridge this gap by providing
                            an intelligent assistant that understands Civil Law — from property disputes and
                            tenancy rights to contracts and family law.
                        </p>
                        <p className="text-[14px] text-[var(--text-soft)] leading-relaxed font-medium mt-3">
                            Our AI does not replace lawyers — it empowers citizens with the knowledge they
                            need to understand their rights, ask the right questions, and seek the right help.
                        </p>
                    </div>

                    <div className="flex-shrink-0 w-full lg:w-72">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm space-y-4">
                            {[
                                { icon: IconScale, text: 'Pakistani Civil Law trained AI' },
                                { icon: IconBrain, text: 'RAG-based knowledge retrieval' },
                                { icon: IconGavel, text: 'Real court judgments indexed' },
                                { icon: IconUsers, text: 'Built for Pakistani citizens' },
                            ].map(({ icon: Icon, text }, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeUp}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-[var(--brand-500)]/10 flex items-center justify-center flex-shrink-0">
                                        <Icon size={16} className="text-[var(--brand-500)]" />
                                    </div>
                                    <p className="text-[13px] font-medium text-[var(--foreground)]">{text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Values ── */}
                <div>
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <span className="text-[11px] font-bold tracking-widest text-[var(--text-soft)] uppercase">
                            What We Stand For
                        </span>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mt-2 tracking-tight">
                            Our Core Values
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {values.map(({ icon: Icon, title, desc }, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm cursor-default"
                            >
                                <div className="h-10 w-10 rounded-xl bg-[var(--brand-500)]/10 flex items-center justify-center mb-4">
                                    <Icon size={20} className="text-[var(--brand-500)]" />
                                </div>
                                <h3 className="text-[15px] font-semibold text-[var(--foreground)] mb-2 tracking-tight">
                                    {title}
                                </h3>
                                <p className="text-[13px] text-[var(--text-soft)] leading-relaxed font-medium">
                                    {desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>


                {/* ── University Badge ── */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="bg-[var(--navbar-bg)] rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden"
                >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[var(--brand-500)]/10 blur-3xl rounded-full" />
                    </div>
                    <div className="relative">
                        <div className="h-14 w-14 bg-[var(--brand-500)] rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-xl">
                            <IconScale size={28} className="text-[var(--navbar-bg)]" stroke={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Smart Lawyer</h3>
                        <p className="text-[13px] text-white/50 font-medium mb-1">
                            Final Year Project — BS Computer Science
                        </p>
                        <p className="text-[13px] text-[var(--brand-500)] font-semibold">
                            Institute of Business Administration (IBA), Sukkur
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-[12px] font-medium">
                            <IconMapPin size={13} />
                            <span>Sukkur, Sindh, Pakistan</span>
                        </div>
                    </div>
                </motion.div>

            </div>
            </div>
        </div>
    );
}
