"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { brandColors } from "@/lib/brand-colors";
import Image from "next/image";

const steps = [
    {
        title: "Connect",
        description: "Connect your Zoho CRM or accounting software in just a few clicks.",
        image: "/how-it-works-connect.png",
        color: brandColors.secondary,
    },
    {
        title: "Configure",
        description: "Customize your AI voice agent's script, frequency, and follow-up rules.",
        image: "/how-it-works-configure.png",
        color: brandColors.accent,
    },
    {
        title: "Collect",
        description: "Sit back as InvoCall automatically follows up and collects payments.",
        image: "/how-it-works-collect.png",
        color: brandColors.success,
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function HowItWorks() {
    return (
        <section className={`py-24 relative overflow-hidden ${brandColors.backgrounds.hero}`}>
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(148,163,184,0.1),transparent_50%),radial-gradient(circle_at_30%_80%,rgba(148,163,184,0.1),transparent_50%)]" />

            <div className="container px-4 mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <Badge
                        variant="secondary"
                        className={`mb-4 ${brandColors.border.accent} ${brandColors.backgrounds.glass}`}
                    >
                        Simple Process
                    </Badge>
                    <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${brandColors.text.gradient}`}>
                        How InvoCall Works
                    </h2>
                    <p className={`text-lg max-w-2xl mx-auto ${brandColors.text.secondary}`}>
                        Get started in minutes and transform your accounts receivable process.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
                >
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-blue-500 to-transparent -translate-y-1/2 z-0" />

                    {steps.map((step, index) => {
                        return (
                            <motion.div
                                key={index}
                                variants={item}
                                className="relative z-10 h-full"
                            >
                                <Card
                                    className={`relative overflow-hidden rounded-3xl h-[400px] border-0 shadow-2xl group transition-all duration-500 hover:scale-[1.02]`}
                                >
                                    {/* Full Bleed Image */}
                                    <div className="absolute inset-0">
                                        <Image
                                            src={step.image}
                                            alt={step.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                        {/* Gradient Overlay for Text Readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                                    </div>

                                    {/* Text Content Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end h-full z-20">
                                        <h3 className="text-2xl font-bold mb-2 text-white">
                                            {step.title}
                                        </h3>
                                        <p className="text-slate-200/90 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Glass sheen effect */}
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
