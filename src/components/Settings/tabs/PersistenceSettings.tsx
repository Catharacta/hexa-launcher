import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
// @ts-ignore
import { save, open } from '@tauri-apps/plugin-dialog';
import { useLauncherStore } from '../../../store/launcherStore';
import { SettingsSection } from '../shared/SettingsSection';
import { exportSettingsJson, saveSettingsToFile, loadSettingsFromFile, saveSettings } from '../../../utils/tauri';

export const PersistenceSettings: React.FC = () => {
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lastExport, setLastExport] = useState<string | null>(null);
    const [lastImport, setLastImport] = useState<string | null>(null);
    const appearance = useLauncherStore(state => state.appearance);
    const isCyberpunk = appearance.style === 'cyberpunk';

    const handleExportToFile = async () => {
        try {
            setIsExporting(true);
            const filePath = await save({
                defaultPath: 'hexa-launcher-settings.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (!filePath) {
                setIsExporting(false);
                return;
            }

            const settingsJson = await exportSettingsJson();
            await saveSettingsToFile(filePath, settingsJson);

            setLastExport(new Date().toLocaleString());
            alert('Settings exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportFromFile = async () => {
        try {
            setIsImporting(true);
            const filePath = await open({
                multiple: false,
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });

            if (!filePath) {
                setIsImporting(false);
                return;
            }

            const settingsJson = await loadSettingsFromFile(filePath as string);
            const settings = JSON.parse(settingsJson);

            if (confirm(t('persistence.importWarning', 'Importing will overwrite current settings. Continue?'))) {
                await saveSettings(settings);
                setLastImport(new Date().toLocaleString());
                alert('Import successful! Reloading...');
                window.location.reload();
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert(`Import failed: ${error}`);
        } finally {
            setIsImporting(false);
        }
    };

    const handleCopyToClipboard = async () => {
        try {
            const settingsJson = await exportSettingsJson();
            await navigator.clipboard.writeText(settingsJson);
            alert('Settings copied to clipboard!');
            setLastExport(new Date().toLocaleString());
        } catch (error) {
            alert(`Copy failed: ${error}`);
        }
    };

    const handlePasteFromClipboard = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const settings = JSON.parse(clipboardText);

            if (confirm(t('persistence.importWarning', 'Importing will overwrite current settings. Continue?'))) {
                await saveSettings(settings);
                setLastImport(new Date().toLocaleString());
                alert('Import successful! Reloading...');
                window.location.reload();
            }
        } catch (error) {
            alert(`Paste failed: ${error}`);
        }
    };

    const ActionButton = ({ onClick, disabled, label, primary }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "px-4 py-2 rounded-lg border transition-all text-sm font-medium w-full sm:w-auto",
                disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]",
                primary
                    ? (isCyberpunk
                        ? "bg-[#00f2ea]/10 border-[#00f2ea] text-[#00f2ea] hover:bg-[#00f2ea]/20"
                        : "bg-gray-700 border-cyan-500 text-white hover:bg-gray-600")
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsSection
                title={t('persistence.exportSettings')}
                description={t('persistence.exportDescription')}
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    <ActionButton
                        onClick={handleExportToFile}
                        disabled={isExporting}
                        label={isExporting ? t('persistence.exporting') : t('persistence.exportToFile')}
                        primary
                    />
                    <ActionButton
                        onClick={handleCopyToClipboard}
                        label={t('persistence.copyToClipboard')}
                    />
                </div>
            </SettingsSection>

            <SettingsSection
                title={t('persistence.importSettings')}
                description={t('persistence.importDescription')}
            >
                <div className="flex flex-col sm:flex-row gap-3">
                    <ActionButton
                        onClick={handleImportFromFile}
                        disabled={isImporting}
                        label={isImporting ? t('persistence.importing') : t('persistence.importFromFile')}
                        primary
                    />
                    <ActionButton
                        onClick={handlePasteFromClipboard}
                        disabled={isImporting}
                        label={t('persistence.pasteFromClipboard')}
                    />
                </div>

                <div className={clsx(
                    "mt-4 p-3 rounded-lg border text-xs",
                    isCyberpunk
                        ? "bg-red-900/20 border-red-500/30 text-red-200"
                        : "bg-yellow-900/20 border-yellow-700/50 text-yellow-200"
                )}>
                    ⚠️ {t('persistence.importWarning')}
                </div>
            </SettingsSection>

            <div className="text-xs text-gray-500 pt-2 px-1">
                <p>{t('persistence.lastExport')}: {lastExport || t('common.never')}</p>
                <p>{t('persistence.lastImport')}: {lastImport || t('common.never')}</p>
            </div>
        </div>
    );
};
