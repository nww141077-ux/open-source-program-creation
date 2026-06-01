import { useState } from "react";
import SettingsTab from "@/components/admin/SettingsTab";
import ModulesTab from "@/components/admin/ModulesTab";
import DalanTab from "@/components/admin/DalanTab";
import BackupTab from "@/components/admin/BackupTab";
import GatewayTab from "@/components/admin/GatewayTab";
import AiAssistantTab from "@/components/admin/AiAssistantTab";
import StoreTab from "@/components/admin/StoreTab";
import DocsTab from "@/components/admin/DocsTab";
import Icon from "@/components/ui/icon";

type Tab = "ai" | "settings" | "modules" | "dalan" | "backup" | "gateway" | "store" | "docs";

const tabs: { id: Tab; label: string; icon: string; highlight?: boolean }[] = [
  { id: "ai", label: "ИИ-Ассистент", icon: "Bot", highlight: true },
  { id: "store", label: "Магазин", icon: "Store" },
  { id: "settings", label: "Интерфейс", icon: "Settings" },
  { id: "modules", label: "Модули", icon: "LayoutGrid" },
  { id: "dalan", label: "Dalan", icon: "Brain" },
  { id: "gateway", label: "Шлюз ПК", icon: "Cpu" },
  { id: "backup", label: "Восстановление", icon: "ArchiveRestore" },
  { id: "docs", label: "Документы", icon: "FolderOpen" },
];

interface Props {
  onLogout: () => void;
}

const AdminPanel = ({ onLogout }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a2e] border-b border-[#e94560]/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#e94560] rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">ECSU DALAN</div>
            <div className="text-gray-500 text-xs">Панель управления системой</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-gray-500 hover:text-[#e94560] transition-colors flex items-center gap-1 text-sm"
        >
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-52 bg-[#12121f] border-r border-[#e94560]/10 flex flex-col py-4 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#e94560]/10 text-[#e94560] border-r-2 border-[#e94560]"
                  : tab.highlight
                  ? "text-[#e94560]/70 hover:text-[#e94560] hover:bg-[#e94560]/5"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label}</span>
              {tab.highlight && activeTab !== tab.id && (
                <span className="ml-auto w-2 h-2 bg-[#e94560] rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "ai" && <AiAssistantTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "modules" && <ModulesTab />}
          {activeTab === "dalan" && <DalanTab />}
          {activeTab === "gateway" && <GatewayTab />}
          {activeTab === "backup" && <BackupTab />}
          {activeTab === "store" && <StoreTab />}
          {activeTab === "docs" && <DocsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;