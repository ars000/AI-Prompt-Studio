export function defaultRefineRequest(title: string): string {
  return `Улучши промпт «${title}»: сохрани смысл, сделай структуру и формулировки понятнее для LLM. Добавь переменные {{…}} там, где это уместно.`
}
