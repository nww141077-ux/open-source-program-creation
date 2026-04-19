import Icon from "@/components/ui/icon";

interface TrainingItem {
  id: number; data_type: string; instruction: string; response: string;
  category: string; quality_score: number; created_at: string;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU");

interface Props {
  training: TrainingItem[];
  loading: boolean;
  newInstruction: string;
  newResponse: string;
  newCategory: string;
  newScore: number;
  onInstructionChange: (v: string) => void;
  onResponseChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onScoreChange: (v: number) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
}

export default function ModelTraining({
  training, loading,
  newInstruction, newResponse, newCategory, newScore,
  onInstructionChange, onResponseChange, onCategoryChange, onScoreChange,
  onAdd, onDelete,
}: Props) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Обучающие данные</h2>
        <p className="text-white/40 text-sm mt-1">{training.length} примеров — каждый фиксируется в журнале</p>
      </div>

      {/* Форма добавления */}
      <div className="p-5 rounded-2xl space-y-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Добавить обучающий пример</div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Вопрос / Инструкция</label>
          <textarea value={newInstruction} onChange={e => onInstructionChange(e.target.value)}
            placeholder="Например: Как подать заявление в суд?"
            rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Ответ / Результат</label>
          <textarea value={newResponse} onChange={e => onResponseChange(e.target.value)}
            placeholder="Для подачи заявления в суд необходимо..."
            rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1.5">Категория</label>
            <input type="text" value={newCategory} onChange={e => onCategoryChange(e.target.value)}
              placeholder="legal, faq, technical..."
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Качество: {newScore}/10</label>
            <input type="range" min="1" max="10" value={newScore} onChange={e => onScoreChange(parseInt(e.target.value))}
              className="w-32 accent-indigo-500" />
          </div>
          <button onClick={onAdd} disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", marginTop: "20px" }}>
            <Icon name="Plus" size={15} className="inline mr-1" />
            Добавить
          </button>
        </div>
      </div>

      {/* Список примеров */}
      <div className="space-y-3">
        {training.map(t => (
          <div key={t.id} className="p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>#{t.id}</span>
                <span className="text-[10px] text-white/30">{t.category}</span>
                <span className="text-[10px] text-amber-400">★ {t.quality_score}/10</span>
                <span className="text-[10px] text-white/20">{fmtDate(t.created_at)}</span>
              </div>
              <button onClick={() => onDelete(t.id)}
                className="text-white/20 hover:text-red-400 transition-colors p-1">
                <Icon name="Trash2" size={13} />
              </button>
            </div>
            <div className="text-sm text-white/80 font-medium mb-1">Q: {t.instruction}</div>
            <div className="text-xs text-white/45 leading-relaxed">A: {t.response.slice(0, 200)}{t.response.length > 200 ? "..." : ""}</div>
          </div>
        ))}
        {training.length === 0 && (
          <div className="text-center py-12 text-white/25">
            <Icon name="BookOpen" size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Пока нет обучающих примеров</p>
            <p className="text-xs mt-1">Добавьте пары вопрос-ответ выше</p>
          </div>
        )}
      </div>
    </div>
  );
}
