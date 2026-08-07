"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuestionType } from "@/lib/quiz-types";

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  TRUE_FALSE: "Benar/Salah",
  MATCHING: "Mencocokkan",
  IMAGE_IDENTIFICATION: "Identifikasi Gambar",
  DRAG_DROP: "Drag & Drop",
  ESSAY: "Essay",
};

export interface QuestionFormValue {
  type: QuestionType;
  prompt: string;
  explanation: string;
  points: number;
  imageUrl: string;
  choices: { text: string; isCorrect: boolean }[];
  pairs: { prompt: string; answer: string }[];
}

export function emptyQuestionForm(type: QuestionType = "MULTIPLE_CHOICE"): QuestionFormValue {
  if (type === "TRUE_FALSE") {
    return {
      type,
      prompt: "",
      explanation: "",
      points: 10,
      imageUrl: "",
      choices: [
        { text: "Benar", isCorrect: true },
        { text: "Salah", isCorrect: false },
      ],
      pairs: [],
    };
  }
  if (type === "MATCHING" || type === "DRAG_DROP") {
    return {
      type,
      prompt: "",
      explanation: "",
      points: 20,
      imageUrl: "",
      choices: [],
      pairs: [
        { prompt: "", answer: "" },
        { prompt: "", answer: "" },
      ],
    };
  }
  if (type === "ESSAY") {
    return { type, prompt: "", explanation: "", points: 20, imageUrl: "", choices: [], pairs: [] };
  }
  return {
    type,
    prompt: "",
    explanation: "",
    points: 10,
    imageUrl: "",
    choices: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    pairs: [],
  };
}

export function QuestionForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  allowTypeChange = true,
}: {
  value: QuestionFormValue;
  onChange: (v: QuestionFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
  allowTypeChange?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof QuestionFormValue>(key: K, val: QuestionFormValue[K]) {
    onChange({ ...value, [key]: val });
  }

  function validate(): string | null {
    if (!value.prompt.trim()) return "Pertanyaan wajib diisi.";
    if (!value.explanation.trim()) return "Penjelasan wajib diisi.";
    if (["MULTIPLE_CHOICE", "TRUE_FALSE", "IMAGE_IDENTIFICATION"].includes(value.type)) {
      if (value.choices.some((c) => !c.text.trim())) return "Semua pilihan jawaban wajib diisi.";
      if (!value.choices.some((c) => c.isCorrect)) return "Tandai salah satu jawaban yang benar.";
    }
    if (["MATCHING", "DRAG_DROP"].includes(value.type)) {
      if (value.pairs.some((p) => !p.prompt.trim() || !p.answer.trim())) return "Semua pasangan wajib diisi lengkap.";
      if (value.pairs.length < 2) return "Minimal 2 pasangan.";
    }
    if (value.type === "IMAGE_IDENTIFICATION" && !value.imageUrl.trim()) {
      return "URL gambar wajib diisi untuk soal Identifikasi Gambar.";
    }
    return null;
  }

  function handleSubmit() {
    const err = validate();
    if (err) return setError(err);
    setError(null);
    onSubmit();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      {allowTypeChange && (
        <div>
          <Label>Tipe Soal</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange(emptyQuestionForm(t))}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  value.type === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="q-prompt">Pertanyaan</Label>
        <Input id="q-prompt" value={value.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder="Tulis pertanyaan..." />
      </div>

      {value.type === "IMAGE_IDENTIFICATION" && (
        <div>
          <Label htmlFor="q-image">URL Gambar</Label>
          <Input
            id="q-image"
            value={value.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="Contoh: /uploads/nama-file.jpg"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Tempel URL gambar preparat (misalnya dari Virtual Microscope) atau path file yang sudah diunggah.
          </p>
        </div>
      )}

      {["MULTIPLE_CHOICE", "TRUE_FALSE", "IMAGE_IDENTIFICATION"].includes(value.type) && (
        <div>
          <Label>Pilihan Jawaban (tandai yang benar)</Label>
          <div className="mt-1.5 space-y-2">
            {value.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-choice"
                  checked={c.isCorrect}
                  onChange={() =>
                    set(
                      "choices",
                      value.choices.map((cc, idx) => ({ ...cc, isCorrect: idx === i }))
                    )
                  }
                  className="size-4 accent-[var(--color-primary)]"
                />
                <Input
                  value={c.text}
                  disabled={value.type === "TRUE_FALSE"}
                  onChange={(e) =>
                    set(
                      "choices",
                      value.choices.map((cc, idx) => (idx === i ? { ...cc, text: e.target.value } : cc))
                    )
                  }
                  placeholder={`Pilihan ${i + 1}`}
                />
                {value.type === "MULTIPLE_CHOICE" && value.choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => set("choices", value.choices.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {value.type === "MULTIPLE_CHOICE" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("choices", [...value.choices, { text: "", isCorrect: false }])}
              >
                <Plus className="size-3.5" /> Tambah Pilihan
              </Button>
            )}
          </div>
        </div>
      )}

      {["MATCHING", "DRAG_DROP"].includes(value.type) && (
        <div>
          <Label>Pasangan (kiri dicocokkan dengan kanan)</Label>
          <div className="mt-1.5 space-y-2">
            {value.pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={p.prompt}
                  onChange={(e) =>
                    set(
                      "pairs",
                      value.pairs.map((pp, idx) => (idx === i ? { ...pp, prompt: e.target.value } : pp))
                    )
                  }
                  placeholder="Istilah"
                />
                <Input
                  value={p.answer}
                  onChange={(e) =>
                    set(
                      "pairs",
                      value.pairs.map((pp, idx) => (idx === i ? { ...pp, answer: e.target.value } : pp))
                    )
                  }
                  placeholder="Pasangannya"
                />
                {value.pairs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => set("pairs", value.pairs.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set("pairs", [...value.pairs, { prompt: "", answer: "" }])}>
              <Plus className="size-3.5" /> Tambah Pasangan
            </Button>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="q-explanation">{value.type === "ESSAY" ? "Jawaban Model / Rubrik" : "Penjelasan Jawaban"}</Label>
        <Input id="q-explanation" value={value.explanation} onChange={(e) => set("explanation", e.target.value)} placeholder="Jelaskan mengapa jawaban ini benar..." />
      </div>

      <div>
        <Label htmlFor="q-points">Poin</Label>
        <Input id="q-points" type="number" min={1} value={value.points} onChange={(e) => set("points", Number(e.target.value) || 10)} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={handleSubmit} loading={submitting}>
          Simpan Soal
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <Trash2 className="size-4" /> Batal
        </Button>
      </div>
    </div>
  );
}
