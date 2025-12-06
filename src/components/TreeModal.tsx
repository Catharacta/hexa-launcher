import React, { useEffect } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { Group } from '../types/models';

export const TreeModal: React.FC = () => {
    const {
        treeModalOpen,
        setTreeModalOpen,
        groups,
        navigateToGroup,
        activeGroupId
    } = useLauncherStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && treeModalOpen) {
                setTreeModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [treeModalOpen, setTreeModalOpen]);

    if (!treeModalOpen) return null;

    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setTreeModalOpen(false);
        }
    };

    const handleGroupClick = (groupId: string | null) => {
        navigateToGroup(groupId);
    };

    // Helper to render group hierarchy (flat list for now, can be recursive if we had nested groups structure in store, 
    // but currently groups are flat in store, though they have parentId)
    // Let's build a tree structure for rendering.

    interface GroupNode {
        id: string;
        group: Group;
        children: GroupNode[];
    }

    const buildTree = (): GroupNode[] => {
        const nodes: Record<string, GroupNode> = {};
        const rootNodes: GroupNode[] = [];

        // Create nodes
        Object.values(groups).forEach(group => {
            nodes[group.id] = { id: group.id, group, children: [] };
        });

        // Link parent-child
        Object.values(groups).forEach(group => {
            if (group.parentId && nodes[group.parentId]) {
                nodes[group.parentId].children.push(nodes[group.id]);
            } else {
                rootNodes.push(nodes[group.id]);
            }
        });

        return rootNodes;
    };

    const handleGroupDelete = (e: React.MouseEvent, groupId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this group? All subgroups and cells within it will be deleted.')) {
            useLauncherStore.getState().deleteGroup(groupId);
        }
    };

    const renderNode = (node: GroupNode, depth: number = 0) => {
        const isCurrent = activeGroupId === node.id;
        return (
            <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
                <div
                    className={`
                        p-2 mb-1 rounded cursor-pointer transition-colors flex items-center justify-between group
                        ${isCurrent ? 'bg-cyan-500/30 text-cyan-100' : 'hover:bg-white/10 text-gray-300'}
                    `}
                    onClick={() => handleGroupClick(node.id)}
                >
                    <div className="flex items-center">
                        <span className="material-icons text-sm mr-2">folder</span>
                        {node.group.title}
                    </div>
                    <button
                        onClick={(e) => handleGroupDelete(e, node.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 rounded hover:bg-white/10"
                        title="Delete Group"
                    >
                        <span className="material-icons text-sm">delete</span>
                    </button>
                </div>
                {node.children.map(child => renderNode(child, depth + 1))}
            </div>
        );
    };

    const rootNodes = buildTree();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleBackgroundClick}
        >
            <div className="bg-gray-900/90 border border-white/10 rounded-xl p-6 w-[500px] max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <span className="material-icons mr-2">account_tree</span>
                        Group Navigation
                    </h2>
                    <button
                        onClick={() => setTreeModalOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Root Level Option */}
                    <div
                        className={`
                            p-2 mb-1 rounded cursor-pointer transition-colors flex items-center
                            ${activeGroupId === null ? 'bg-cyan-500/30 text-cyan-100' : 'hover:bg-white/10 text-gray-300'}
                        `}
                        onClick={() => handleGroupClick(null)}
                    >
                        <span className="material-icons text-sm mr-2">home</span>
                        Root
                    </div>

                    <div className="mt-2 pl-2 border-l border-white/10 ml-2">
                        {rootNodes.length === 0 ? (
                            <div className="text-gray-500 text-sm italic p-2">No groups created yet</div>
                        ) : (
                            rootNodes.map(node => renderNode(node))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
