import React, { useState, useEffect } from 'react';

const DebugConsole = () => {
    const [collapsed, setCollapsed] = useState(true);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const handleLog = (type, ...args) => {
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
            setLogs(prev => [...prev.slice(-99), { type, message, time: new Date().toLocaleTimeString() }]);
        };

        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        console.log = (...args) => {
            originalConsoleLog(...args);
            handleLog('log', ...args);
        };
        console.error = (...args) => {
            originalConsoleError(...args);
            handleLog('error', ...args);
        };
        console.warn = (...args) => {
            originalConsoleWarn(...args);
            handleLog('warn', ...args);
        };

        // Capture global unhandled errors
        const errorHandler = (e) => {
            handleLog('error', 'Uncaught Error: ' + e.message);
        };
        window.addEventListener('error', errorHandler);

        return () => {
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            console.warn = originalConsoleWarn;
            window.removeEventListener('error', errorHandler);
        };
    }, []);

    if (collapsed) {
        return (
            <div className="fixed bottom-0 right-0 m-4 z-[9999]">
                <button
                    onClick={() => setCollapsed(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded shadow-lg text-xs font-mono border border-slate-600"
                >
                    Debug: {logs.length} logs
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-slate-900 border-t border-slate-700 z-[9999] flex flex-col font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center bg-slate-800 px-4 py-1 border-b border-slate-700">
                <span className="text-slate-300 font-bold">Debug Console</span>
                <div className="flex gap-2">
                    <button onClick={() => setLogs([])} className="text-slate-400 hover:text-white">Clear</button>
                    <button onClick={() => setCollapsed(true)} className="text-slate-400 hover:text-white">Close</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {logs.length === 0 ? <div className="text-slate-500 italic">No logs yet...</div> : null}
                {logs.map((log, i) => (
                    <div key={i} className={`
                        flex gap-3
                        ${log.type === 'error' ? 'text-red-400' : ''}
                        ${log.type === 'warn' ? 'text-amber-400' : ''}
                        ${log.type === 'log' ? 'text-slate-300' : ''}
                    `}>
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span className="break-all">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DebugConsole;
