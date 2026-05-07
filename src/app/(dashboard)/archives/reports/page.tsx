"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  FileText, Calendar, BarChart3, ChevronDown, ChevronUp,
  Archive, TrendingUp, Trash2, Search, Filter,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useArchivedReportsQuery, useDeleteArchivedReportMutation } from "@/hooks/useArchives";

export default function ArchivedReportsPage() {
  const { data: reports, isLoading } = useArchivedReportsQuery();
  const deleteReport = useDeleteArchivedReportMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  const months = useMemo(() => {
    if (!reports) return [];
    const uniqueMonths = [...new Set(reports.map((r) => r.report_month))];
    return uniqueMonths.sort((a, b) => b.localeCompare(a));
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    let filtered = [...reports];
    if (selectedMonth) {
      filtered = filtered.filter((r) => r.report_month === selectedMonth);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.board_name?.toLowerCase().includes(query) ||
          r.content.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [reports, selectedMonth, searchQuery]);

  function formatMonth(m: string) {
    const [year, month] = m.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Archive size={24} className="text-purple-400" />
          Report Archive
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Archived monthly executive reports
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>
        {months.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-white/30" />
            <GlassButton
              variant={!selectedMonth ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSelectedMonth(undefined)}
            >
              All
            </GlassButton>
            {months.map((m) => (
              <GlassButton
                key={m}
                variant={selectedMonth === m ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedMonth(m)}
              >
                {formatMonth(m)}
              </GlassButton>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-[40vh]">
          <motion.div
            className="text-[#00FF41] font-mono animate-terminal-blink"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Reports List */}
      {!isLoading && filteredReports.length > 0 && (
        <div className="space-y-4">
          {filteredReports.map((report, index) => {
            const isExpanded = expandedId === report.id;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <GlassCard padding="none" hover={false}>
                  {/* Report Header */}
                  <button
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-[#00FF41]/10 border border-[#00FF41]/20 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white/90">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <Calendar size={9} />
                            {formatMonth(report.report_month)}
                          </span>
                          {report.board_name && (
                            <span className="text-[10px] text-white/30 flex items-center gap-1">
                              <Archive size={9} />
                              {report.board_name}
                            </span>
                          )}
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <BarChart3 size={9} />
                            {report.task_count} tasks
                          </span>
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <TrendingUp size={9} />
                            {report.completion_rate}% completed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Stats badges */}
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="badge badge-green" style={{ fontSize: "9px", padding: "1px 8px" }}>
                          {report.completed_count} completed
                        </span>
                        <span className="badge badge-sky" style={{ fontSize: "9px", padding: "1px 8px" }}>
                          {report.completion_rate}%
                        </span>
                      </div>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeleteError(null);
                          setDeleteTarget(report.id);
                        }}
                        className="text-white/30 hover:text-red-400 cursor-pointer"
                        title="Delete report"
                        disabled={deleteReport.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-white/30" />
                      ) : (
                        <ChevronDown size={16} className="text-white/30" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-white/5">
                          <div className="pt-5 prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold gradient-text mb-3">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-base font-semibold text-white/90 mt-5 mb-2 border-b border-white/5 pb-1">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-medium text-white/80 mt-3 mb-1">{children}</h3>
                                ),
                                p: ({ children }) => (
                                  <p className="text-xs text-white/60 leading-relaxed mb-2">{children}</p>
                                ),
                                li: ({ children }) => (
                                  <li className="text-xs text-white/60 mb-0.5">{children}</li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="text-white/90 font-semibold">{children}</strong>
                                ),
                              }}
                            >
                              {report.content}
                            </ReactMarkdown>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5">
                            <span className="text-[10px] text-white/20">
                              Generated: {new Date(report.created_at).toLocaleString("en-US")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredReports.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center h-[40vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <FileText size={28} className="text-white/15" />
          </div>
          <p className="text-white/30 text-sm">
            {searchQuery || selectedMonth ? "No matching reports" : "No archived reports"}
          </p>
          <p className="text-white/20 text-xs mt-1">
            {searchQuery || selectedMonth ? "Try adjusting your search or filters" : "Generate and archive reports from AI Insights"}
          </p>
        </motion.div>
      )}

      {deleteError && (
        <motion.div
          className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {deleteError}
        </motion.div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              className="glass-strong relative w-full max-w-sm z-10 p-6"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete report</h3>
                  <p className="text-xs text-white/40">This action can be reversed later</p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-4">
                <p className="text-xs text-red-300/80 leading-relaxed">
                  This will hide the report from the archive, but you can restore it later if needed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!deleteTarget) return;
                    setDeleteError(null);
                    try {
                      await deleteReport.mutateAsync({ reportId: deleteTarget });
                      if (expandedId === deleteTarget) setExpandedId(null);
                      setDeleteTarget(null);
                    } catch (error: any) {
                      setDeleteError(error?.message || "Error deleting report");
                    }
                  }}
                  disabled={deleteReport.isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {deleteReport.isPending ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
