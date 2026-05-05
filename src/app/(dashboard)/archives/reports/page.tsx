"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  FileText, Calendar, BarChart3, ChevronDown, ChevronUp,
  Archive, TrendingUp, Trash2,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useArchivedReportsQuery, useDeleteArchivedReportMutation } from "@/hooks/useArchives";

export default function ArchivedReportsPage() {
  const { data: reports, isLoading } = useArchivedReportsQuery();
  const deleteReport = useDeleteArchivedReportMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-[40vh]">
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-transparent border-t-sky-300 border-r-purple-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Reports List */}
      {!isLoading && reports && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report, index) => {
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
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-sky-300/20 flex items-center justify-center border border-white/10 flex-shrink-0">
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
                        onClick={async (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setDeleteError(null);
                          const confirmed = window.confirm(
                            "¿Eliminar este reporte? Esta accion se puede revertir mas tarde si lo decides."
                          );
                          if (!confirmed) return;
                          try {
                            await deleteReport.mutateAsync({ reportId: report.id });
                            if (expandedId === report.id) setExpandedId(null);
                          } catch (error: any) {
                            setDeleteError(error?.message || "Error deleting report");
                          }
                        }}
                        className="text-white/30 hover:text-red-400"
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
      {!isLoading && (!reports || reports.length === 0) && (
        <motion.div
          className="flex flex-col items-center justify-center h-[40vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <FileText size={28} className="text-white/15" />
          </div>
          <p className="text-white/30 text-sm">No archived reports</p>
          <p className="text-white/20 text-xs mt-1">
            Generate and archive reports from AI Insights
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
    </div>
  );
}
