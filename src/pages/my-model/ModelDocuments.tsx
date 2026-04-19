import Icon from "@/components/ui/icon";

interface DocItem {
  id: number; doc_type: string; title: string; base_model: string;
  model_name: string; owner_name: string; doc_hash: string; created_at: string;
}
interface LogItem {
  id: number; action: string; details: string; base_model: string;
  model_name: string; owner_name: string; created_at: string;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU");

interface DocumentsProps {
  docs: DocItem[];
  generatedDoc: string;
  loading: boolean;
  onGenerate: () => void;
  onDownload: () => void;
}

interface LogProps {
  logs: LogItem[];
}

export function ModelDocumentsTab({ docs, generatedDoc, loading, onGenerate, onDownload }: DocumentsProps) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Юридические документы</h2>
          <p className="text-white/40 text-sm mt-1">Декларации об использовании открытых моделей</p>
        </div>
        <button onClick={onGenerate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
          <Icon name="FilePlus" size={15} />
          Новый документ
        </button>
      </div>

      {generatedDoc && (
        <div className="p-5 rounded-2xl space-y-3"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.25)" }}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-indigo-400">Последний сформированный документ</div>
            <button onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
              style={{ background: "rgba(99,102,241,0.3)", border: "1px solid rgba(99,102,241,0.5)" }}>
              <Icon name="Download" size={13} />
              Скачать .txt
            </button>
          </div>
          <pre className="text-xs text-white/60 leading-relaxed overflow-auto max-h-96 font-mono whitespace-pre-wrap"
            style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px" }}>
            {generatedDoc}
          </pre>
        </div>
      )}

      <div className="space-y-3">
        {docs.map(d => (
          <div key={d.id} className="p-4 rounded-2xl flex items-center gap-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,102,241,0.15)" }}>
              <Icon name="FileText" size={16} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white">{d.title}</div>
              <div className="text-[10px] text-white/30 mt-0.5">
                {d.base_model} · {d.owner_name} · {fmtDate(d.created_at)}
              </div>
              <div className="text-[10px] font-mono text-white/20 mt-0.5">SHA: {d.doc_hash}</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,200,160,0.1)", color: "#00c8a0" }}>
              Декларация
            </span>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="text-center py-12 text-white/25">
            <Icon name="FileText" size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Документов ещё нет</p>
            <p className="text-xs mt-1">Сначала сохраните конфигурацию модели, затем нажмите «Новый документ»</p>
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl text-xs text-white/30 space-y-2"
        style={{ background: "rgba(0,200,160,0.04)", border: "1px solid rgba(0,200,160,0.15)" }}>
        <div className="font-semibold text-emerald-400">Юридическая справка</div>
        <p>Декларация подтверждает: (1) вы используете легальную open-source модель, (2) соблюдаете её лицензию, (3) все изменения — ваша оригинальная работа. Этого достаточно для защиты от претензий по авторским правам при использовании Apache 2.0 и MIT моделей.</p>
      </div>
    </div>
  );
}

export function ModelLogTab({ logs }: LogProps) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Журнал дообучения</h2>
        <p className="text-white/40 text-sm mt-1">Все действия с моделью фиксируются с временной меткой</p>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <th className="text-left px-4 py-3 text-white/30 text-xs font-medium">Дата</th>
              <th className="text-left px-4 py-3 text-white/30 text-xs font-medium">Действие</th>
              <th className="text-left px-4 py-3 text-white/30 text-xs font-medium hidden md:table-cell">Детали</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{fmtDate(l.created_at)}</td>
                <td className="px-4 py-3 text-white/80 text-xs">{l.action}</td>
                <td className="px-4 py-3 text-white/35 text-xs hidden md:table-cell max-w-xs truncate">{l.details || "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-white/25">
                  <Icon name="ScrollText" size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Журнал пуст</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
