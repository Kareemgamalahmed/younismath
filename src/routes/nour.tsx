import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { School, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/nour")({
  head: () => ({
    meta: [
      { title: "منهج نور البيان — Nour Al-Bayan" },
      {
        name: "description",
        content: "تعلم الحروف الهجائية وحركة الفتح خطوة بخطوة مع منهج نور البيان للأطفال.",
      },
      { property: "og:title", content: "منهج نور البيان — Nour Al-Bayan" },
      {
        property: "og:description",
        content: "تعلم الحروف الهجائية وحركة الفتح خطوة بخطوة مع منهج نور البيان للأطفال.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NourPage,
});

const LETTERS = [
  "أ","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","هـ","و","ي",
];

const FATHA = [
  "أَ","بَ","تَ","ثَ","جَ","حَ","خَ","دَ","ذَ","رَ","زَ","سَ","شَ","صَ","ضَ","طَ","ظَ","عَ","غَ","فَ","قَ","كَ","لَ","مَ","نَ","هَـ","وَ","يَ",
];

function LetterViewer({ letters }: { letters: string[] }) {
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);

  const prev = () => setI((v) => (v - 1 + letters.length) % letters.length);
  const next = () => setI((v) => (v + 1) % letters.length);

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(letters[i]);
    u.lang = "ar-SA";
    window.speechSynthesis.speak(u);
  }

  return (
    <div dir="rtl" className="flex flex-col items-center gap-4">
      <div
        className="flex w-full items-center justify-between gap-3"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (dx > 40) next();
          else if (dx < -40) prev();
        }}
      >
        {/* In RTL, the right chevron moves to the previous letter */}
        <button
          type="button"
          onClick={next}
          aria-label="التالي"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[oklch(0.88_0.13_200)] text-foreground shadow-lg transition hover:scale-110 active:scale-95"
        >
          <ChevronRight />
        </button>

        <button
          type="button"
          onClick={speak}
          aria-label="استمع"
          className="flex h-40 flex-1 select-none items-center justify-center rounded-3xl bg-[oklch(0.96_0.03_200)] text-7xl font-extrabold text-foreground shadow-inner sm:text-8xl"
          style={{ fontFamily: '"Noto Naskh Arabic","Amiri",serif' }}
        >
          {letters[i]}
        </button>

        <button
          type="button"
          onClick={prev}
          aria-label="السابق"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[oklch(0.88_0.13_200)] text-foreground shadow-lg transition hover:scale-110 active:scale-95"
        >
          <ChevronLeft />
        </button>
      </div>

      <div className="text-sm font-bold text-muted-foreground">
        الحرف {i + 1} من {letters.length}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {letters.map((l, idx) => (
          <button
            key={l + idx}
            type="button"
            onClick={() => setI(idx)}
            className={`h-10 w-10 rounded-xl text-xl font-bold shadow transition ${
              idx === i
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:scale-110"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function NourPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted px-4 py-8">
      <Link
        to="/"
        className="absolute left-4 top-4 rounded-full bg-card px-4 py-2 text-sm font-bold shadow"
      >
        ← Home
      </Link>

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[oklch(0.9_0.12_160)] shadow-xl">
          <School className="h-14 w-14 text-foreground" />
        </div>

        <h1
          dir="rtl"
          className="text-center text-4xl font-extrabold text-foreground sm:text-5xl"
          style={{ fontFamily: '"Noto Naskh Arabic","Amiri",serif' }}
        >
          منهج نور البيان
        </h1>

        <Accordion
          type="single"
          collapsible
          dir="rtl"
          defaultValue="lesson-1"
          className="w-full rounded-3xl bg-card p-4 shadow-2xl"
        >
          <AccordionItem value="lesson-1">
            <AccordionTrigger className="text-xl font-extrabold">
              الدرس الأول: الحروف الهجائية
            </AccordionTrigger>
            <AccordionContent>
              <LetterViewer letters={LETTERS} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lesson-2">
            <AccordionTrigger className="text-xl font-extrabold">
              الدرس الثاني: حركة الفتح
            </AccordionTrigger>
            <AccordionContent>
              <LetterViewer letters={FATHA} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
