import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface SystemStats {
    cpu: number;
    memory: number; // percentage
    memory_used: number;
    memory_total: number;
}

/**
 * システムリソース（CPU/メモリ使用率）をグラフ表示するウィジェット。
 * バックエンドのTauriコマンド `start_system_monitor` を呼び出して監視を開始し、
 * `system-stats` イベントをリッスンしてリアルタイムに値を更新します。
 */
export const SystemWidget: React.FC = () => {
    const [stats, setStats] = useState<SystemStats>({ cpu: 0, memory: 0, memory_used: 0, memory_total: 0 });

    useEffect(() => {
        // 監視開始
        invoke('start_system_monitor').catch(console.error);

        const unlisten = listen<SystemStats>('system-stats', (event) => {
            setStats(event.payload);
        });

        return () => {
            unlisten.then(f => f());
            // 注意: 他のウィジェットでの利用も考慮し、アンマウント時に監視自体は停止していません。
            // 必要に応じて `stop_system_monitor` を呼び出すロジックを追加可能です。
        };
    }, []);

    const getCpuColor = (usage: number) => {
        if (usage < 50) return 'bg-blue-400';
        if (usage < 80) return 'bg-yellow-400';
        return 'bg-red-500';
    };

    const getMemColor = (usage: number) => {
        if (usage < 50) return 'bg-green-400';
        if (usage < 80) return 'bg-purple-400';
        return 'bg-red-500';
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-3 text-white">
            <div className="w-full mb-2">
                <div className="flex justify-between text-[10px] mb-0.5 opacity-90">
                    <span className="font-mono">CPU</span>
                    <span className="font-mono font-bold">{stats.cpu.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700/50 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                        className={`h-full transition-all duration-500 rounded-full ${getCpuColor(stats.cpu)}`}
                        style={{ width: `${Math.min(stats.cpu, 100)}%`, boxShadow: '0 0 5px currentColor' }}
                    />
                </div>
            </div>

            <div className="w-full">
                <div className="flex justify-between text-[10px] mb-0.5 opacity-90">
                    <span className="font-mono">MEM</span>
                    <span className="font-mono font-bold">{stats.memory.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700/50 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                        className={`h-full transition-all duration-500 rounded-full ${getMemColor(stats.memory)}`}
                        style={{ width: `${Math.min(stats.memory, 100)}%`, boxShadow: '0 0 5px currentColor' }}
                    />
                </div>
            </div>
        </div>
    );
};
