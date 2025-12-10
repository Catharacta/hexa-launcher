import React from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { clsx } from 'clsx';
import { Toast } from '../store/slices/uiSlice';

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    return (
        <div
            className={clsx(
                "mb-2 p-3 rounded shadow-lg text-white text-sm flex items-center justify-between min-w-[250px] transition-all duration-300 transform translate-y-0 opacity-100",
                toast.type === 'success' && "bg-green-600",
                toast.type === 'error' && "bg-red-600",
                toast.type === 'warning' && "bg-yellow-600",
                toast.type === 'info' && "bg-blue-600"
            )}
            onClick={() => onDismiss(toast.id)}
        >
            <span>{toast.message}</span>
            <button className="ml-3 text-white/80 hover:text-white font-bold">×</button>
        </div>
    );
};

/**
 * アプリケーション全体のトースト通知を表示するコンテナコンポーネント。
 * ストア内のトースト状態を監視し、画面右下に通知を積み重ねて表示します。
 */
export const ToastContainer: React.FC = () => {
    const toasts = useLauncherStore(state => state.toasts);
    const removeToast = useLauncherStore(state => state.removeToast);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};
