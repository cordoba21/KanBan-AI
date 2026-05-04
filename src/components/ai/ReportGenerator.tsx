"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, FileText, Loader2, Download,
  FileSpreadsheet, FileType, Archive,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useArchiveReportMutation } from "@/hooks/useArchives";
import { useUser } from "@/lib/auth/hooks";
import { exportToPDF, exportToExcel, exportToWord } from "@/lib/exportReport";

export default function ReportGenerator() {
  const { user } = useUser();
  const { data: metrics } = useDashboardMetrics();
  const archiveReport = useArchiveReportMutation();

  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    generatedAt: string;
    taskCount: number;
    logCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archived, setArchived] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    setArchived(false);

    try {
      const res = await fetch("/api/ai/report", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReport(data.report);
      setMeta({
        generatedAt: data.generatedAt,
        taskCount: data.taskCount,
        logCount: data.logCount,
      });
    } catch (err: any) {
      setError(err.message || "Error generating report");
    } finally {
      setLoading(false);
    }
  }

  function getReportData() {
    return {
      title: "Reporte Ejecutivo Mensual",
      content: report || "",
      stats: {
        totalTasks: metrics?.totalTasks || 0,
        completedTasks: metrics?.completedTasks || 0,
        inProgressTasks: metrics?.inProgressTasks || 0,
        completionRate: metrics?.completionRate || 0,
        statusDistribution: metrics?.statusDistribution || [],
      },
      generatedAt: meta?.generatedAt || new Date().toISOString(),
    };
  }

  async function handleExport(format: "pdf" | "word" | "excel") {
    if (!report) return;
    setExporting(format);
    try {
      const data = getReportData();
      const chartEl = chartsRef.current;
      if (format === "pdf") await exportToPDF(data, chartEl);
      else if (format === "word") await exportToWord(data, chartEl);
      else await exportToExcel(data);
    } catch (err: any) {
      console.error("Export error:", err);
      setError(`Error exporting as ${format.toUpperCase()}: ${err.message}`);
    } finally {
      setExporting(null);
    }
  }

  async function handleArchiveReport() {
    if (!report || !user || !metrics) return;
    try {
      await archiveReport.mutateAsync({
        title: `Reporte Ejecutivo — ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long" })}`,
        content: report,
        userId: user.id,
        taskCount: metrics.totalTasks,
        completedCount: metrics.completedTasks,
        completionRate: metrics.completionRate,
        metadata: { generatedAt: meta?.generatedAt, logCount: meta?.logCount },
      });
      setArchived(true);
    } catch (err: any) {
      setError("Error archiving report: " + err.message);
    }
  }

  const statusDistribution = metrics?.statusDistribution || [];
  const barData = [
    { name: "Total", value: metrics?.totalTasks || 0, fill: "#7dd3fc" },
    { name: "Completed", value: metrics?.completedTasks || 0, fill: "#4ade80" },
    { name: "In Progress", value: metrics?.inProgressTasks || 0, fill: "#c084fc" },
  ];

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <GlassCard padding="lg" glow="gradient" hover={false}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-300/20 to-purple-400/20 flex items-center justify-center border border-white/10">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Monthly Executive Report
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Powered by Gemini — analyzes all tasks and activity
              </p>
            </div>
          </div>
          <GlassButton onClick={generateReport} loading={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText size={16} />
                Generate Report
              </>
            )}
          </GlassButton>
        </div>

        {meta && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/5 flex-wrap">
            <span className="text-[10px] text-white/30">
              Generated: {new Date(meta.generatedAt).toLocaleString("en-US")}
            </span>
            <span className="text-[10px] text-white/30">
              Tasks analyzed: {meta.taskCount}
            </span>
            <span className="text-[10px] text-white/30">
              Activity logs: {meta.logCount}
            </span>
          </div>
        )}
      </GlassCard>

      {/* Error */}
      {error && (
        <motion.div
          className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <GlassCard padding="lg" hover={false}>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="h-4 rounded-full bg-white/5"
                style={{ width: `${60 + Math.random() * 40}%` }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Report Content */}
      {report && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Export Buttons */}
          <GlassCard padding="md" hover={false}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <Download size={16} />
                Download Report
              </h3>
              <div className="flex gap-2 flex-wrap">
                <GlassButton
                  variant="ghost" size="sm"
                  onClick={() => handleExport("pdf")}
                  loading={exporting === "pdf"}
                >
                  <FileText size={14} className="text-red-400" />
                  PDF
                </GlassButton>
                <GlassButton
                  variant="ghost" size="sm"
                  onClick={() => handleExport("word")}
                  loading={exporting === "word"}
                >
                  <FileType size={14} className="text-blue-400" />
                  Word
                </GlassButton>
                <GlassButton
                  variant="ghost" size="sm"
                  onClick={() => handleExport("excel")}
                  loading={exporting === "excel"}
                >
                  <FileSpreadsheet size={14} className="text-green-400" />
                  Excel
                </GlassButton>
                <div className="w-px bg-white/10 mx-1" />
                <GlassButton
                  variant={archived ? "ghost" : "primary"}
                  size="sm"
                  onClick={handleArchiveReport}
                  loading={archiveReport.isPending}
                  disabled={archived}
                >
                  <Archive size={14} />
                  {archived ? "Archived ✓" : "Archive"}
                </GlassButton>
              </div>
            </div>
          </GlassCard>

          {/* Charts for export */}
          <div ref={chartsRef}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GlassCard padding="md" hover={false}>
                <h3 className="text-sm font-semibold text-white/70 mb-4">
                  Status Distribution
                </h3>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={3} dataKey="value"
                        stroke="none"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(10,10,26,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "white",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard padding="md" hover={false}>
                <h3 className="text-sm font-semibold text-white/70 mb-4">
                  Task Summary
                </h3>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(10,10,26,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          color: "white",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* AI Report Text */}
          <GlassCard padding="lg" hover={false}>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold gradient-text mb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-white/90 mt-6 mb-3 border-b border-white/5 pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-medium text-white/80 mt-4 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-white/60 leading-relaxed mb-3">
                      {children}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-white/60 mb-1">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-white/90 font-semibold">
                      {children}
                    </strong>
                  ),
                  code: ({ children }) => (
                    <code className="text-sky-300 bg-sky-300/10 px-1.5 py-0.5 rounded text-xs">
                      {children}
                    </code>
                  ),
                }}
              >
                {report}
              </ReactMarkdown>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
