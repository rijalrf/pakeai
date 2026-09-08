'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/lib/stores/project-store';
import { Sparkles, ArrowRight, ArrowLeft, Check, Code2, Rocket, Briefcase, Zap, Terminal } from 'lucide-react';
import type { SkillLevel } from '@/lib/db/database.types';

export default function OnboardingPage() {
  const router = useRouter();
  const { userProfile, setProfile } = useProjectStore();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(userProfile.fullName || '');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(userProfile.skillLevel || 'intermediate');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(userProfile.goals || ['Build SaaS']);

  const skillOptions: { level: SkillLevel; title: string; desc: string; key: string }[] = [
    { level: 'beginner', title: 'Beginner', desc: 'Baru belajar koding, membutuhkan panduan detail & task atomic.', key: '1' },
    { level: 'intermediate', title: 'Intermediate', desc: 'Paham stack Next.js/React, ingin mempercepat deliver fitur.', key: '2' },
    { level: 'advanced', title: 'Advanced', desc: 'Berpengalaman, fokus pada arsitektur bersih dan otomatisasi agent.', key: '3' },
    { level: 'expert', title: 'Expert / Staff', desc: 'Desain sistem berskala tinggi, custom prompts & bounded context.', key: '4' },
  ];

  const goalOptions = [
    { id: 'Build SaaS', label: 'Build SaaS', icon: Rocket, desc: 'Membangun produk software komersial.' },
    { id: 'Learn Programming', label: 'Learn Programming', icon: Code2, desc: 'Memahami alur software engineering modern.' },
    { id: 'Build Portfolio', label: 'Build Portfolio', icon: Briefcase, desc: 'Menghasilkan aplikasi showcase siap kerja.' },
    { id: 'Start Business', label: 'Start Business', icon: Sparkles, desc: 'Validasi ide startup dengan MVP kilat.' },
    { id: 'Automate Work', label: 'Automate Work', icon: Zap, desc: 'Otomatisasi alur kerja coding internal.' },
  ];

  const toggleGoal = (id: string) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== id));
    } else {
      setSelectedGoals([...selectedGoals, id]);
    }
  };

  const handleFinish = () => {
    setProfile({
      fullName,
      skillLevel,
      goals: selectedGoals,
      onboardingCompleted: true,
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 bg-dot-grid">
      <div className="w-full max-w-xl">
        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-mono font-medium text-zinc-400">
              Developer Onboarding — Langkah {step} dari 3
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? 'w-6 bg-zinc-100' : s < step ? 'w-3 bg-emerald-500' : 'w-3 bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-md">
          {/* STEP 1: Profile & Nama */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-base">Kenalkan Diri Anda</CardTitle>
                <CardDescription>
                  Nama ini akan digunakan untuk identitas agen dan konfigurasi token CLI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Nama Lengkap / Handle Developer</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Rijal Ahmad"
                    className="h-10 text-sm"
                    autoFocus
                  />
                </div>
                <div className="rounded-md border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs text-zinc-400 flex items-start gap-2.5">
                  <Terminal className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                  <span>
                    CLI token akan digenerate dengan hak akses atas nama developer ini.
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!fullName.trim()}
                  className="gap-1.5"
                >
                  Lanjut ke Skill Level
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* STEP 2: Skill Level */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-base">Tingkat Pengalaman Rekayasa Perangkat Lunak</CardTitle>
                <CardDescription>
                  AI akan menyesuaikan kedalaman penjelasan arsitektur dan tingkat atomic task.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {skillOptions.map((opt) => {
                  const isSelected = skillLevel === opt.level;
                  return (
                    <div
                      key={opt.level}
                      onClick={() => setSkillLevel(opt.level)}
                      className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-zinc-300 bg-zinc-800/80 shadow-sm'
                          : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-100">{opt.title}</span>
                          {isSelected && <Badge variant="emerald">Aktif</Badge>}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{opt.desc}</p>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">
                        [{opt.key}]
                      </span>
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali
                </Button>
                <Button onClick={() => setStep(3)} className="gap-1.5">
                  Lanjut ke Target Goal
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* STEP 3: Goals */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-base">Apa Tujuan Utama Anda?</CardTitle>
                <CardDescription>
                  Pilih satu atau beberapa fokus pengembangan untuk mengoptimalkan prompt AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {goalOptions.map((g) => {
                  const Icon = g.icon;
                  const isChecked = selectedGoals.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-zinc-300 bg-zinc-800/80'
                          : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${isChecked ? 'bg-white text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-100">{g.label}</div>
                          <div className="text-[11px] text-zinc-400">{g.desc}</div>
                        </div>
                      </div>
                      {isChecked && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali
                </Button>
                <Button onClick={handleFinish} disabled={selectedGoals.length === 0} className="gap-1.5">
                  Selesaikan Setup &amp; Masuk Dashboard
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
