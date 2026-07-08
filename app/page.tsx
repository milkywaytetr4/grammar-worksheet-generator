"use client";

import { useCallback, useMemo, useState } from "react";
import {
  collectLeavesWithPath,
  findNodeById,
  grammarTree,
} from "@/lib/grammar-tree";
import type { GrammarNode, Problem } from "@/lib/types";

const ACCENT = "#4488ff";
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

export default function Home() {
  const [selectedId, setSelectedId] = useState("to-inf-noun");
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    grammarTree.forEach((c, i) => {
      init[c.id] = i === 0;
    });
    return init;
  });
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "difficult">(
    "difficult",
  );
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ japanese: "", answer: "" });
  const [printMode, setPrintMode] = useState(false);
  const [title, setTitle] = useState("英作文 練習プリント");
  const [instruction, setInstruction] = useState(
    "次の日本文を英語に直しなさい。",
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(() => findNodeById(selectedId), [selectedId]);
  const selectedLabel = selectedNode?.label ?? "—";
  const leaves = useMemo(() => collectLeavesWithPath(selectedId), [selectedId]);
  const leafCount = leaves.length;

  // ---- actions ----
  const selectNode = useCallback((id: string, isCategory: boolean) => {
    setSelectedId(id);
    if (isCategory) {
      setOpen((o) => ({ ...o, [id]: true }));
    }
  }, []);

  const toggleCat = useCallback((id: string) => {
    setSelectedId(id);
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  }, []);

  const setCountClamped = useCallback((n: number) => {
    setCount(Math.max(1, Math.min(10, n)));
  }, []);

  const generate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grammarPointId: selectedId, count, difficulty }),
      });
      if (!res.ok) {
        throw new Error(`生成に失敗しました (${res.status})`);
      }
      const data = (await res.json()) as { problems: Problem[] };
      setProblems((prev) => [...prev, ...data.problems]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [loading, selectedId, count, difficulty]);

  // 選択カテゴリ配下の全リーフに対して1問ずつ生成する
  const generateEach = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        leaves.map(async ({ leaf }) => {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              grammarPointId: leaf.id,
              count: 1,
              difficulty,
            }),
          });
          if (!res.ok) {
            throw new Error(`生成に失敗しました (${res.status})`);
          }
          const data = (await res.json()) as { problems: Problem[] };
          return data.problems;
        }),
      );
      setProblems((prev) => [...prev, ...results.flat()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [loading, leaves, difficulty]);

  const addManual = useCallback(() => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `manual-${Date.now()}`;
    const newProblem: Problem = {
      id,
      japanese: "",
      answer: "",
      grammarPoint: selectedLabel,
    };
    setProblems((prev) => [...prev, newProblem]);
    setEditingId(id);
    setEditDraft({ japanese: "", answer: "" });
  }, [selectedLabel]);

  const del = useCallback((id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id));
    setEditingId((cur) => (cur === id ? null : cur));
  }, []);

  const clearAll = useCallback(() => {
    setProblems([]);
    setEditingId(null);
  }, []);

  const startEdit = useCallback((p: Problem) => {
    setEditingId(p.id);
    setEditDraft({ japanese: p.japanese, answer: p.answer });
  }, []);

  const saveEdit = useCallback(() => {
    setProblems((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? { ...p, japanese: editDraft.japanese, answer: editDraft.answer }
          : p,
      ),
    );
    setEditingId(null);
  }, [editingId, editDraft]);

  const cancelEdit = useCallback(() => {
    // 中身が空のまま（手動追加直後など）キャンセルした場合はカードを残さない
    setProblems((prev) =>
      prev.filter((p) => p.id !== editingId || p.japanese || p.answer),
    );
    setEditingId(null);
  }, [editingId]);

  const reorder = useCallback(
    (targetId: string) => {
      setProblems((prev) => {
        if (!dragId || dragId === targetId) return prev;
        const from = prev.findIndex((p) => p.id === dragId);
        const to = prev.findIndex((p) => p.id === targetId);
        if (from < 0 || to < 0 || from === to) return prev;
        const arr = [...prev];
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
        return arr;
      });
    },
    [dragId],
  );

  // ---- grammar tree (再帰描画) ----
  const renderNode = (node: GrammarNode, depth: number) => {
    const hasChildren = !!node.children?.length;
    const selected = selectedId === node.id;
    const isOpen = !!open[node.id];

    if (hasChildren) {
      return (
        <div key={node.id} style={{ marginBottom: depth === 0 ? 2 : 1 }}>
          <button
            type="button"
            onClick={() => toggleCat(node.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "9px 10px",
              paddingLeft: 10 + depth * 14,
              border: "none",
              background: selected ? "#d8e6fb" : "transparent",
              borderRadius: 8,
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#b0afa4",
                transition: ".15s",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                display: "inline-block",
              }}
            >
              ▶
            </span>
            <span
              style={{
                flex: 1,
                fontWeight: depth === 0 ? 700 : 600,
                fontSize: depth === 0 ? 14 : 13,
                color: selected ? ACCENT : "#33332e",
              }}
            >
              {node.label}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: "#b6b5aa",
              }}
            >
              {node.children?.length ?? 0}
            </span>
          </button>
          {isOpen && (
            <div style={{ margin: "1px 0 6px 0" }}>
              {(node.children ?? []).map((child) =>
                renderNode(child, depth + 1),
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        key={node.id}
        onClick={() => selectNode(node.id, false)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          paddingLeft: 22 + depth * 14,
          border: "none",
          background: selected ? "#d8e6fb" : "transparent",
          borderLeft: `2px solid ${selected ? ACCENT : "transparent"}`,
          borderRadius: "0 7px 7px 0",
          textAlign: "left",
          marginBottom: 1,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: selected ? ACCENT : "#5a5a52",
            fontWeight: selected ? 700 : 500,
          }}
        >
          {node.label}
        </span>
      </button>
    );
  };

  // ===== Print preview =====
  if (printMode) {
    return (
      <div
        className="print-root"
        style={{
          position: "fixed",
          inset: 0,
          background: "#e9e8e3",
          overflow: "auto",
          zIndex: 50,
        }}
      >
        <div
          className="no-print"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 24px",
            background: "rgba(244,244,241,.9)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #e0dfd9",
          }}
        >
          <button
            type="button"
            onClick={() => setPrintMode(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #d8d7d1",
              background: "#fff",
              color: "#4a4a45",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ← 編集に戻る
          </button>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: ".04em",
              color: "#8a897f",
            }}
          >
            PRINT PREVIEW · A4
          </div>
          <div style={{ flex: 1 }} />
          <AnswerToggle
            showAnswers={showAnswers}
            onToggle={() => setShowAnswers((v) => !v)}
          />
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              background: ACCENT,
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            印刷する
          </button>
        </div>
        <div
          className="print-shell"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "32px 16px 64px",
          }}
        >
          <div
            className="print-sheet"
            style={{
              width: "210mm",
              minHeight: "297mm",
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,.12)",
              padding: "18mm 16mm",
              color: "#16160f",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "2px solid #16160f",
                paddingBottom: 8,
                marginBottom: 6,
              }}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトルを入力"
                className="print-editable"
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "inherit",
                  flex: 1,
                  minWidth: 0,
                  padding: "0 0 1px",
                }}
              />
            </div>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="問題文を入力"
              className="print-editable"
              style={{
                fontSize: 12,
                color: "#777",
                marginBottom: 22,
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                padding: "2px 0",
              }}
            />
            {problems.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  gap: 14,
                  marginBottom: i === problems.length - 1 ? 0 : 26,
                  breakInside: "avoid",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 15,
                    minWidth: 30,
                    paddingTop: 1,
                  }}
                >
                  {i + 1}.
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, lineHeight: 1.7 }}>
                    {p.japanese}
                  </div>
                  {showAnswers ? (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        color: ACCENT,
                        fontWeight: 500,
                      }}
                    >
                      {p.answer}
                    </div>
                  ) : (
                    <div style={{ height: 17, marginTop: 8 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== Editor =====
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "#f4f4f1",
        color: "#1b1b19",
      }}
    >
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 300,
            flex: "none",
            background: "#eef4fc",
            borderRight: "2px solid #bbddff",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ padding: "18px 20px 12px", flex: "none" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".12em",
                color: "#9a998f",
                fontFamily: MONO,
              }}
            >
              GRAMMAR TREE
            </div>
            <div style={{ fontSize: 12, color: "#8a897f", marginTop: 5 }}>
              項目を選んで問題を生成
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "0 12px 18px" }}>
            {grammarTree.map((node) => renderNode(node, 0))}
          </div>
        </aside>

        {/* Workspace */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* action bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 26px",
              flex: "none",
              borderBottom: "1px solid #ededea",
            }}
          >
            <AnswerToggle
              showAnswers={showAnswers}
              onToggle={() => setShowAnswers((v) => !v)}
            />
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={clearAll}
              style={{
                border: "1px solid #ececdf",
                background: "#fff",
                color: "#9a5a4a",
                padding: "7px 13px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              すべて削除
            </button>
            <button
              type="button"
              onClick={() => setPrintMode(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                border: "1px solid #d8d7d1",
                background: "#fff",
                color: "#3a3a35",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              🖨 印刷プレビュー
            </button>
          </div>

          {/* problem list */}
          <div style={{ flex: 1, overflow: "auto", padding: "22px 26px 40px" }}>
            {problems.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: 300,
                  textAlign: "center",
                  color: "#9a988c",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 10,
                    background: "#fff",
                    border: "1px solid #ddd9cd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    color: ACCENT,
                    marginBottom: 16,
                  }}
                >
                  ∅
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#5a584e",
                    fontFamily: MONO,
                    letterSpacing: ".1em",
                  }}
                >
                  NO_PROBLEMS_QUEUED
                </div>
                <div
                  style={{
                    fontSize: 13,
                    marginTop: 9,
                    maxWidth: 300,
                    lineHeight: 1.7,
                    color: "#8b897e",
                  }}
                >
                  左のツリーで項目を選び、下の{" "}
                  <span style={{ color: ACCENT, fontWeight: 600 }}>
                    生成する
                  </span>{" "}
                  を実行するか、{" "}
                  <span style={{ color: ACCENT, fontWeight: 600 }}>
                    手動で追加
                  </span>{" "}
                  してください。
                </div>
              </div>
            ) : (
              <div
                style={{
                  maxWidth: 760,
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {problems.map((p, i) => {
                  const editing = editingId === p.id;
                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: ドラッグ&ドロップで問題カードを並び替えるための意図的なハンドラー
                    <div
                      key={p.id}
                      draggable={!editing}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(p.id);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        reorder(p.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={() => setDragId(null)}
                      style={{
                        display: "flex",
                        gap: 14,
                        background: "#fff",
                        border: `1px solid ${dragId === p.id ? ACCENT : "#e9e8e3"}`,
                        borderRadius: 12,
                        padding: "16px 18px",
                        boxShadow: "0 1px 2px rgba(0,0,0,.03)",
                        opacity: dragId === p.id ? 0.35 : 1,
                        transition: "opacity .12s, border-color .12s",
                      }}
                    >
                      {/* drag handle */}
                      <div
                        title="ドラッグして並び替え"
                        style={{
                          cursor: "grab",
                          color: "#c4c3b8",
                          fontSize: 15,
                          lineHeight: 0.7,
                          letterSpacing: "1px",
                          userSelect: "none",
                          alignSelf: "center",
                        }}
                      >
                        ⠿
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 7,
                          flex: "none",
                          alignSelf: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: "#eaf0fc",
                            color: ACCENT,
                            fontFamily: MONO,
                            fontWeight: 700,
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {i + 1}
                        </div>
                      </div>

                      {/* body */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          gap: 9,
                        }}
                      >
                        {!editing ? (
                          <>
                            <div style={{ fontSize: 15, lineHeight: 1.7 }}>
                              {p.japanese}
                              <span
                                style={{
                                  marginLeft: 8,
                                  whiteSpace: "nowrap",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: ACCENT,
                                  background: "#eaf0fc",
                                  padding: "2px 8px",
                                  borderRadius: 5,
                                  letterSpacing: ".02em",
                                }}
                              >
                                {p.grammarPoint}
                              </span>
                            </div>
                            {showAnswers && (
                              <div
                                style={{
                                  paddingTop: 9,
                                  borderTop: "1px dashed #e6e5e0",
                                  fontSize: 14,
                                  color: ACCENT,
                                  fontWeight: 500,
                                  lineHeight: 1.6,
                                }}
                              >
                                {p.answer}
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#a4a39a",
                                  marginBottom: 3,
                                  fontFamily: MONO,
                                }}
                              >
                                日本語
                              </div>
                              <textarea
                                value={editDraft.japanese}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    japanese: e.target.value,
                                  }))
                                }
                                rows={2}
                                style={{
                                  width: "100%",
                                  border: "1px solid #d8d7d1",
                                  borderRadius: 8,
                                  padding: "8px 10px",
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                  resize: "vertical",
                                  color: "#1b1b19",
                                  outline: "none",
                                }}
                              />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#a4a39a",
                                  marginBottom: 3,
                                  fontFamily: MONO,
                                }}
                              >
                                解答（英文）
                              </div>
                              <textarea
                                value={editDraft.answer}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    answer: e.target.value,
                                  }))
                                }
                                rows={2}
                                style={{
                                  width: "100%",
                                  border: "1px solid #d8d7d1",
                                  borderRadius: 8,
                                  padding: "8px 10px",
                                  fontSize: 14,
                                  lineHeight: 1.6,
                                  resize: "vertical",
                                  color: ACCENT,
                                  outline: "none",
                                }}
                              />
                            </div>
                            <div
                              style={{ display: "flex", gap: 8, marginTop: 2 }}
                            >
                              <button
                                type="button"
                                onClick={saveEdit}
                                style={{
                                  background: ACCENT,
                                  color: "#fff",
                                  border: "none",
                                  padding: "7px 16px",
                                  borderRadius: 7,
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                保存
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                style={{
                                  background: "#fff",
                                  color: "#6d6d68",
                                  border: "1px solid #e0dfd9",
                                  padding: "7px 14px",
                                  borderRadius: 7,
                                  fontSize: 13,
                                }}
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* actions */}
                      {!editing && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            flex: "none",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            title="編集"
                            style={{
                              width: 30,
                              height: 30,
                              border: "1px solid #ececdf",
                              background: "#fff",
                              borderRadius: 7,
                              fontSize: 13,
                              color: "#6d6d68",
                            }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => del(p.id)}
                            title="削除"
                            style={{
                              width: 30,
                              height: 30,
                              border: "1px solid #f0e4e0",
                              background: "#fff",
                              borderRadius: 7,
                              fontSize: 13,
                              color: "#b06a58",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* generation dock */}
          <div
            style={{
              flex: "none",
              borderTop: "2px solid #bbddff",
              background: "#eef4fc",
              boxShadow: "0 -6px 16px rgba(31,40,60,.05)",
              padding: "20px 22px 24px",
            }}
          >
            <div style={{ width: "100%" }}>
              {error && (
                <div
                  style={{ marginBottom: 10, fontSize: 12, color: "#b06a58" }}
                >
                  {error}
                </div>
              )}
              {/* GENERATION ラベル（左上・単独） */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".14em",
                  color: "#6b7c93",
                  fontFamily: MONO,
                  marginBottom: 12,
                }}
              >
                GENERATION
              </div>
              {/* 操作列: SELECTED → 難易度 →（間隔）→ 各項目1問ずつ → 生成 → 手動 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* SELECTED と難易度をまとめて少し右へ寄せる */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 60,
                    paddingLeft: 100,
                  }}
                >
                  {/* SELECTED: 装飾ラベル。角丸を付けず左アクセントにし、ボタンに見せない。
                      固定幅にして難易度チップの位置がラベル長で動かないようにする */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      padding: "6px 14px",
                      background: "rgba(255,255,255,.55)",
                      borderLeft: `4px solid ${ACCENT}`,
                      width: 220,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: MONO,
                        letterSpacing: ".08em",
                        color: "#8a97ad",
                      }}
                    >
                      SELECTED
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: ACCENT,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedLabel}
                    </span>
                  </div>
                  {/* 難易度 */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#5a6b82",
                        whiteSpace: "nowrap",
                      }}
                    >
                      難易度
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(
                        [
                          { key: "easy", label: "典型" },
                          { key: "difficult", label: "実用" },
                        ] as const
                      ).map((opt) => {
                        const active = difficulty === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setDifficulty(opt.key)}
                            style={{
                              border: active
                                ? "1px solid transparent"
                                : "1px solid #cdddef",
                              borderRadius: 999,
                              padding: "6px 14px",
                              fontSize: 13,
                              fontWeight: active ? 700 : 500,
                              color: active ? "#fff" : "#5f7091",
                              background: active ? ACCENT : "#ffffff",
                              boxShadow: active
                                ? "0 2px 6px rgba(69,96,189,.25)"
                                : "none",
                              cursor: "pointer",
                              transition: "background .15s, color .15s",
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* 難易度とボタン群の間隔 */}
                <div style={{ flex: 1, minWidth: 20 }} />
                {/* 各項目1問ずつ: 白地に青のセカンダリ */}
                {leafCount > 1 && (
                  <button
                    type="button"
                    onClick={generateEach}
                    disabled={loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#fff",
                      color: loading ? "#9aa0ad" : ACCENT,
                      border: `1px solid ${loading ? "#dfe3ec" : "#bcccf0"}`,
                      height: 44,
                      padding: "0 18px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: ".03em",
                      whiteSpace: "nowrap",
                      cursor: loading ? "default" : "pointer",
                    }}
                  >
                    <span style={{ fontSize: 11, lineHeight: 1 }}>▶</span>
                    各項目1問ずつ（{leafCount}問）
                  </button>
                )}
                {/* 生成: ▶を左に、問題数ステッパーを内蔵。全体が生成のクリック領域 */}
                {/* biome-ignore lint/a11y/useSemanticElements: 内部に −/+ ボタンを持つため button ではなく role=button の div にしている */}
                <div
                  role="button"
                  tabIndex={loading ? -1 : 0}
                  aria-label="生成する"
                  onClick={() => {
                    if (!loading) generate();
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !loading) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 44,
                    borderRadius: 10,
                    background: loading ? "#8aa3e0" : ACCENT,
                    boxShadow: "0 5px 14px rgba(69,96,189,.22)",
                    padding: "0 6px 0 14px",
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>
                    ▶
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,.2)",
                      borderRadius: 8,
                      height: 32,
                      marginLeft: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCountClamped(count - 1);
                      }}
                      disabled={loading}
                      aria-label="問題数を減らす"
                      style={{
                        border: "none",
                        background: "transparent",
                        width: 28,
                        height: 32,
                        fontSize: 18,
                        color: "#fff",
                        cursor: loading ? "default" : "pointer",
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: 32,
                        textAlign: "center",
                        color: "#fff",
                        fontFamily: MONO,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCountClamped(count + 1);
                      }}
                      disabled={loading}
                      aria-label="問題数を増やす"
                      style={{
                        border: "none",
                        background: "transparent",
                        width: 28,
                        height: 32,
                        fontSize: 18,
                        color: "#fff",
                        cursor: loading ? "default" : "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: ".04em",
                      padding: "0 12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loading ? "生成中…" : "問生成する"}
                  </span>
                </div>
                {/* 手動で追加: ニュートラル */}
                <button
                  type="button"
                  onClick={addManual}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#fff",
                    color: "#3a3a35",
                    border: "1px solid #cdd6e4",
                    height: 40,
                    padding: "0 14px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  ＋ 手動で追加
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AnswerToggle({
  showAnswers,
  onToggle,
}: {
  showAnswers: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid #e0dfd9",
        background: "#fff",
        color: "#4a4a45",
        padding: "7px 13px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 32,
          height: 18,
          borderRadius: 9,
          position: "relative",
          transition: ".15s",
          background: showAnswers ? ACCENT : "#d3d2cb",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: showAnswers ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: ".15s",
          }}
        />
      </span>
      解答を表示
    </button>
  );
}
