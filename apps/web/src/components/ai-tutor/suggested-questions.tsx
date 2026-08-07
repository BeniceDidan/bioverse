import { Bot, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Apa itu jaringan epitel?",
  "Apa bedanya otot polos dan otot rangka?",
  "Kenapa darah termasuk jaringan ikat?",
  "Apa fungsi sel Schwann pada jaringan saraf?",
];

export function SuggestedQuestions({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bot className="size-7" />
      </span>
      <h2 className="mt-4 font-heading text-xl font-bold text-foreground">Halo! Ada yang mau ditanya?</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Aku siap bantu jelaskan materi Jaringan Hewan. Coba tanya salah satu ini:
      </p>

      <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
