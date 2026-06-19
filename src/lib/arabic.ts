// Shared Arabic word list and normalization for speech recognition matching.

// 50 three-letter Arabic words with fatha on each letter
export const WORDS = [
  "أَكَلَ", "بَحَثَ", "تَرَكَ", "ثَبَتَ", "جَلَسَ", "حَمَلَ", "خَرَجَ", "دَخَلَ", "ذَهَبَ", "رَسَمَ",
  "زَرَعَ", "سَأَلَ", "شَرَحَ", "صَبَرَ", "ضَرَبَ", "طَبَخَ", "ظَهَرَ", "عَرَفَ", "غَسَلَ", "فَتَحَ",
  "قَرَأَ", "كَتَبَ", "لَمَسَ", "مَسَكَ", "نَظَرَ", "هَرَبَ", "وَقَفَ", "نَزَلَ", "حَرَثَ", "رَكَضَ",
  "طَرَقَ", "سَجَدَ", "عَبَدَ", "قَطَعَ", "لَبَسَ", "نَصَرَ", "وَجَدَ", "رَفَعَ", "صَنَعَ", "قَفَزَ",
  "حَكَمَ", "سَبَحَ", "طَحَنَ", "نَشَرَ", "حَصَدَ", "خَلَقَ", "ذَبَحَ", "رَكَبَ", "سَكَنَ", "شَكَرَ",
];

// Normalize Arabic: strip diacritics, normalize alif/hamza variants
export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670]/g, "") // diacritics
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // alif variants -> ا
    .replace(/[\u0624]/g, "\u0648") // ؤ -> و
    .replace(/[\u0626]/g, "\u064A") // ئ -> ي
    .replace(/[\u0629]/g, "\u0647") // ة -> ه
    .replace(/[\s\u061F\u060C.!?]/g, "")
    .trim();
}
