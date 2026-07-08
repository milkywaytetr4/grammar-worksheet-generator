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
  const [instruction, setInstruction] = useState("次の日本文を英語に直しなさい。");
  const [dragId, setDragId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = useMemo(() => findNodeById(selectedId), [selectedId]);
  const selectedLabel = selectedNode?.label ?? "—";
  const leaves = useMemo(
    () => collectLeavesWithPath(selectedId),
    [selectedId],
  );
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
              background: selected ? "#eef3f0" : "transparent",
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
              {(node.children ?? []).map((child) => renderNode(child, depth + 1))}
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
          background: selected ? "#eef3f0" : "transparent",
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
            background: "#fbfbf9",
            borderRight: "1px solid #e5e4df",
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

          {/* generation panel */}
          <div
            style={{
              flex: "none",
              background: "#ffffff",
              borderTop: "1px solid #e8e7e2",
              padding: "15px 16px 17px",
              boxShadow: "0 -6px 16px rgba(31,40,60,.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 10,
                height: 25,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ACCENT,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".14em",
                  color: ACCENT,
                  fontFamily: MONO,
                }}
              >
                GENERATE
              </span>
            </div>
            <div
              style={{
                background: "#f5f8fd",
                border: "1px solid #e3e9f6",
                borderRadius: 13,
                padding: "13px 13px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#9aa0ad",
                  fontFamily: MONO,
                  letterSpacing: ".08em",
                }}
              >
                SELECTED
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 3,
                  color: "#1b2533",
                  lineHeight: 1.35,
                }}
              >
                {selectedLabel}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginTop: 13,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#7a7e88",
                    whiteSpace: "nowrap",
                  }}
                >
                  難易度
                </span>
                <div style={{ display: "flex", gap: 7 }}>
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
                            : "1px solid #e2e3e7",
                          borderRadius: 999,
                          padding: "7px 17px",
                          fontSize: 13,
                          fontWeight: active ? 700 : 500,
                          color: active ? "#fff" : "#9297a1",
                          background: active ? ACCENT : "#f1f2f5",
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginTop: 13,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#7a7e88",
                    whiteSpace: "nowrap",
                  }}
                >
                  問題数
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #dfe3ec",
                    borderRadius: 9,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCountClamped(count - 1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      width: 32,
                      height: 34,
                      fontSize: 17,
                      color: "#6d6d68",
                    }}
                  >
                    −
                  </button>
                  <div
                    style={{
                      width: 30,
                      textAlign: "center",
                      fontFamily: MONO,
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {count}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCountClamped(count + 1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      width: 32,
                      height: 34,
                      fontSize: 17,
                      color: "#6d6d68",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                style={{
                  marginTop: 13,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: loading ? "#8aa3e0" : ACCENT,
                  color: "#fff",
                  border: "none",
                  height: 44,
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: ".05em",
                  boxShadow: "0 5px 14px rgba(69,96,189,.22)",
                  cursor: loading ? "default" : "pointer",
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>
                  {loading ? "生成中…" : "▶　生成する"}
                </span>
              </button>
              {leafCount > 1 && (
                <button
                  type="button"
                  onClick={generateEach}
                  disabled={loading}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "#fff",
                    color: loading ? "#9aa0ad" : ACCENT,
                    border: `1px solid ${loading ? "#dfe3ec" : "#bcccf0"}`,
                    height: 40,
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: ".03em",
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }}>
                    {loading
                      ? "生成中…"
                      : `各項目1問ずつ（${leafCount}問）`}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={addManual}
                style={{
                  marginTop: 8,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#fff",
                  color: "#3a3a35",
                  border: "1px solid #d8d7d1",
                  height: 40,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: ".03em",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>＋　手動で追加</span>
              </button>
              {error && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#b06a58" }}>
                  {error}
                </div>
              )}
            </div>
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
                  左のツリーから項目を選び{" "}
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
