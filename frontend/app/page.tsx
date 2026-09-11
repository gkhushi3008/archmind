"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Task = {
  id?: number;
  analysis_id?: number;
  title: string;
  assignee: string | null;
  deadline: string | null;
  source_text: string;
  created_at?: string;
};

type Decision = {
  id?: number;
  analysis_id?: number;
  title: string;
  status: string;
  decided_by: string | null;
  source_text: string;
  created_at?: string;
};

type PendingDecision = {
  title: string;
  source_text: string;
};

type Analysis = {
  summary: string;
  tasks: Task[];
  decisions: Decision[];
  pending_decisions: PendingDecision[];
  key_points: string[];
};

type HistoryItem = {
  id: number;
  conversation: string;
  summary: string;
  created_at: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [conversation, setConversation] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allDecisions, setAllDecisions] = useState<Decision[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");

  const [selectedFileName, setSelectedFileName] = useState("");
  const [fileError, setFileError] = useState("");

  async function loadHistory() {
    try {
      const response = await fetch(`${API_URL}/history`);

      if (!response.ok) {
        throw new Error("Failed to load history");
      }

      const data = await response.json();

      setHistory(data);
      setTotalConversations(data.length);
    } catch (error) {
      console.error("History load failed:", error);
    }
  }

  async function loadTasks() {
    try {
      const response = await fetch(`${API_URL}/tasks`);

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();
      setAllTasks(data);
    } catch (error) {
      console.error("Task load failed:", error);
    }
  }

  async function loadDecisions() {
    try {
      const response = await fetch(`${API_URL}/decisions`);

      if (!response.ok) {
        throw new Error("Failed to load decisions");
      }

      const data = await response.json();
      setAllDecisions(data);
    } catch (error) {
      console.error("Decision load failed:", error);
    }
  }

  async function loadDashboard() {
    await Promise.all([
      loadHistory(),
      loadTasks(),
      loadDecisions(),
    ]);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setFileError("");

    if (!file) {
      return;
    }

    const isTxtFile =
      file.name.toLowerCase().endsWith(".txt") ||
      file.type === "text/plain";

    if (!isTxtFile) {
      setSelectedFileName("");
      setFileError("Please upload a .txt transcript file.");
      event.target.value = "";
      return;
    }

    const maxFileSize = 2 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setSelectedFileName("");
      setFileError("File is too large. Maximum size is 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();

      if (!text.trim()) {
        setSelectedFileName("");
        setFileError("The selected transcript file is empty.");
        return;
      }

      setConversation(text);
      setSelectedFileName(file.name);
      setFileError("");
      setError("");
      setResult(null);
    } catch {
      setSelectedFileName("");
      setFileError("Could not read the selected file.");
    }
  }

  function clearInput() {
    setConversation("");
    setSelectedFileName("");
    setFileError("");
    setError("");
    setResult(null);
  }

  async function analyzeConversation() {
    if (!conversation.trim()) {
      setError("Please enter or upload a conversation first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: conversation,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();

      setResult(data);
      setSearchQuery("");

      await loadDashboard();
    } catch {
      setError("Could not connect to the ArchMind backend.");
    } finally {
      setLoading(false);
    }
  }

  async function searchMemory() {
    if (!searchQuery.trim()) {
      await loadHistory();
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(
        `${API_URL}/search?query=${encodeURIComponent(
          searchQuery.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  }

  async function clearSearch() {
    setSearchQuery("");
    await loadHistory();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      <div className="border-b border-gray-900 bg-gray-950/90">
        <div className="mx-auto max-w-6xl px-6 py-8">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="mb-3 inline-flex rounded-full border border-blue-900 bg-blue-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
                Project Intelligence Platform
              </div>

              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                ArchMind
              </h1>

              <p className="mt-3 max-w-2xl text-gray-400">
                Transform project conversations into structured tasks,
                decisions, pending items, and searchable project memory.
              </p>
            </div>

            <div className="rounded-xl border border-green-900 bg-green-950/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-green-500">
                System Status
              </p>

              <p className="mt-1 text-sm font-semibold text-green-300">
                ● Ready
              </p>
            </div>

          </div>

        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Stats */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Project Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Live intelligence extracted from project communications.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">
                  Conversations
                </p>

                <span className="rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400">
                  Memory
                </span>
              </div>

              <p className="mt-4 text-4xl font-bold">
                {totalConversations}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Saved project analyses
              </p>
            </div>

            <div className="rounded-2xl border border-blue-900/60 bg-gray-900 p-6 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">
                  Tasks
                </p>

                <span className="rounded-lg bg-blue-950 px-2 py-1 text-xs text-blue-300">
                  Actions
                </span>
              </div>

              <p className="mt-4 text-4xl font-bold text-blue-400">
                {allTasks.length}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Extracted action items
              </p>
            </div>

            <div className="rounded-2xl border border-green-900/60 bg-gray-900 p-6 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">
                  Decisions
                </p>

                <span className="rounded-lg bg-green-950 px-2 py-1 text-xs text-green-300">
                  Confirmed
                </span>
              </div>

              <p className="mt-4 text-4xl font-bold text-green-400">
                {allDecisions.length}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Recorded project decisions
              </p>
            </div>

          </div>
        </section>

        {/* Intelligence Dashboard */}
        <section className="mt-10">

          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Project Intelligence
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Recent structured information extracted from conversations.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Tasks */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    Recent Tasks
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest action items
                  </p>
                </div>

                <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
                  {allTasks.length} total
                </span>
              </div>

              {allTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center">
                  <p className="font-medium text-gray-300">
                    No tasks yet
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Analyze a conversation to extract action items.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {allTasks.slice(0, 5).map((task, index) => (
                    <div
                      key={task.id ?? index}
                      className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-100">
                            {task.title}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">

                            <span className="rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-400">
                              Assignee: {task.assignee || "Unknown"}
                            </span>

                            <span className="rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-400">
                              Deadline: {task.deadline || "Not specified"}
                            </span>

                          </div>
                        </div>

                        <span className="shrink-0 rounded-full border border-blue-900 bg-blue-950 px-3 py-1 text-xs text-blue-300">
                          Task
                        </span>

                      </div>
                    </div>
                  ))}

                </div>
              )}

            </div>

            {/* Decisions */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    Project Decisions
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest confirmed decisions
                  </p>
                </div>

                <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300">
                  {allDecisions.length} total
                </span>
              </div>

              {allDecisions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center">
                  <p className="font-medium text-gray-300">
                    No decisions yet
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Confirmed project decisions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {allDecisions.slice(0, 5).map((decision, index) => (
                    <div
                      key={decision.id ?? index}
                      className="rounded-xl border border-gray-800 bg-gray-950 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-100">
                            {decision.title}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">

                            <span className="rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-400">
                              By: {decision.decided_by || "Unknown"}
                            </span>

                            <span className="rounded-md bg-gray-900 px-2 py-1 text-xs capitalize text-gray-400">
                              {decision.status}
                            </span>

                          </div>
                        </div>

                        <span className="shrink-0 rounded-full border border-green-900 bg-green-950 px-3 py-1 text-xs text-green-300">
                          Approved
                        </span>

                      </div>
                    </div>
                  ))}

                </div>
              )}

            </div>

          </div>

        </section>

        {/* Analyze */}
        <section className="mt-10 rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">

          <div className="mb-6">
            <div className="mb-2 inline-flex rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
              Analyze
            </div>

            <h2 className="text-2xl font-semibold">
              Analyze Project Conversation
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Paste a meeting transcript, WhatsApp discussion, email conversation,
              project note, or upload a text transcript.
            </p>
          </div>

          {/* Upload */}
          <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 p-5">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="font-semibold">
                  Upload Transcript
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  TXT files up to 2 MB
                </p>
              </div>

              <label className="cursor-pointer rounded-xl border border-blue-800 bg-blue-950 px-5 py-3 text-center text-sm font-semibold text-blue-300 transition hover:bg-blue-900">

                Choose .txt File

                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />

              </label>

            </div>

            {selectedFileName && (
              <div className="mt-4 rounded-xl border border-green-900 bg-green-950/30 p-4">

                <p className="text-xs font-semibold uppercase tracking-wider text-green-500">
                  Transcript Loaded
                </p>

                <p className="mt-1 text-sm text-green-300">
                  {selectedFileName}
                </p>

              </div>
            )}

            {fileError && (
              <p className="mt-4 text-sm text-red-400">
                {fileError}
              </p>
            )}

          </div>

          <div className="my-5 flex items-center gap-4">

            <div className="h-px flex-1 bg-gray-800" />

            <span className="text-xs uppercase tracking-widest text-gray-600">
              Or paste text
            </span>

            <div className="h-px flex-1 bg-gray-800" />

          </div>

          <textarea
            value={conversation}
            onChange={(e) => {
              setConversation(e.target.value);

              if (selectedFileName) {
                setSelectedFileName("");
              }

              setError("");
            }}
            placeholder={`Example:

Aisha: I will submit the revised drawings by Friday.
Client: The facade option is approved.
Architect: Material selection is awaiting approval.`}
            className="h-64 w-full resize-none rounded-xl border border-gray-700 bg-gray-950 p-5 text-sm leading-6 text-white outline-none transition focus:border-blue-500"
          />

          <div className="mt-2 flex items-center justify-between">

            <p className="text-xs text-gray-600">
              Conversations are stored in project memory after analysis.
            </p>

            <p className="text-xs text-gray-500">
              {conversation.length} characters
            </p>

          </div>

          <div className="mt-5 flex flex-wrap gap-3">

            <button
              onClick={analyzeConversation}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Conversation"}
            </button>

            <button
              type="button"
              onClick={clearInput}
              disabled={loading}
              className="rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
            >
              Clear Input
            </button>

          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

        </section>

        {/* Result */}
        {result && (
          <section className="mt-10">

            <div className="mb-5">
              <div className="mb-2 inline-flex rounded-full bg-purple-950 px-3 py-1 text-xs font-semibold text-purple-300">
                Analysis Result
              </div>

              <h2 className="text-2xl font-semibold">
                Conversation Intelligence
              </h2>
            </div>

            <div className="space-y-5">

              {/* Summary */}
              <div className="rounded-2xl border border-purple-900/50 bg-gray-900 p-6">

                <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
                  Summary
                </p>

                <p className="mt-3 text-lg leading-7 text-gray-200">
                  {result.summary}
                </p>

              </div>

              {/* Tasks */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

                <div className="mb-5 flex items-center justify-between">

                  <h3 className="text-xl font-semibold">
                    Tasks
                  </h3>

                  <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
                    {result.tasks.length}
                  </span>

                </div>

                {result.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No tasks detected.
                  </p>
                ) : (
                  <div className="space-y-4">

                    {result.tasks.map((task, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-800 bg-gray-950 p-5"
                      >

                        <p className="font-semibold text-gray-100">
                          {task.title}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          <span className="rounded-md bg-gray-900 px-3 py-1 text-sm text-gray-400">
                            Assignee: {task.assignee || "Unknown"}
                          </span>

                          <span className="rounded-md bg-gray-900 px-3 py-1 text-sm text-gray-400">
                            Deadline: {task.deadline || "Not specified"}
                          </span>

                        </div>

                        <div className="mt-4 border-t border-gray-800 pt-4">

                          <p className="text-xs uppercase tracking-wider text-gray-600">
                            Source Evidence
                          </p>

                          <p className="mt-2 text-sm italic text-gray-400">
                            &quot;{task.source_text}&quot;
                          </p>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </div>

              {/* Decisions */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

                <div className="mb-5 flex items-center justify-between">

                  <h3 className="text-xl font-semibold">
                    Decisions
                  </h3>

                  <span className="rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300">
                    {result.decisions.length}
                  </span>

                </div>

                {result.decisions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No decisions detected.
                  </p>
                ) : (
                  <div className="space-y-4">

                    {result.decisions.map((decision, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-800 bg-gray-950 p-5"
                      >

                        <p className="font-semibold text-gray-100">
                          {decision.title}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          <span className="rounded-md bg-gray-900 px-3 py-1 text-sm capitalize text-gray-400">
                            Status: {decision.status}
                          </span>

                          <span className="rounded-md bg-gray-900 px-3 py-1 text-sm text-gray-400">
                            Decided by: {decision.decided_by || "Unknown"}
                          </span>

                        </div>

                        <div className="mt-4 border-t border-gray-800 pt-4">

                          <p className="text-xs uppercase tracking-wider text-gray-600">
                            Source Evidence
                          </p>

                          <p className="mt-2 text-sm italic text-gray-400">
                            &quot;{decision.source_text}&quot;
                          </p>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </div>

              {/* Pending */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

                <div className="mb-5 flex items-center justify-between">

                  <h3 className="text-xl font-semibold">
                    Pending Decisions
                  </h3>

                  <span className="rounded-full bg-yellow-950 px-3 py-1 text-xs font-semibold text-yellow-300">
                    {result.pending_decisions.length}
                  </span>

                </div>

                {result.pending_decisions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No pending decisions.
                  </p>
                ) : (
                  <div className="space-y-4">

                    {result.pending_decisions.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-yellow-900/40 bg-gray-950 p-5"
                      >

                        <p className="font-semibold text-gray-100">
                          {item.title}
                        </p>

                        <p className="mt-3 text-sm italic text-gray-400">
                          &quot;{item.source_text}&quot;
                        </p>

                      </div>
                    ))}

                  </div>
                )}

              </div>

              {/* Key Points */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

                <h3 className="mb-5 text-xl font-semibold">
                  Key Points
                </h3>

                {result.key_points.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No key points detected.
                  </p>
                ) : (
                  <div className="space-y-3">

                    {result.key_points.map((point, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-xl border border-gray-800 bg-gray-950 p-4"
                      >

                        <span className="mt-0.5 text-blue-400">
                          •
                        </span>

                        <p className="text-sm text-gray-300">
                          {point}
                        </p>

                      </div>
                    ))}

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* Project Memory */}
        <section className="mt-10 rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">

          <div className="mb-6">

            <div className="mb-2 inline-flex rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
              Knowledge Base
            </div>

            <h2 className="text-2xl font-semibold">
              Project Memory
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Search previously analyzed project conversations and decisions.
            </p>

          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchMemory();
                }
              }}
              placeholder="Search people, tasks, decisions, dates..."
              className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />

            <button
              onClick={searchMemory}
              disabled={searching}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>

            <button
              onClick={clearSearch}
              className="rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition hover:bg-gray-800"
            >
              Clear
            </button>

          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950 p-10 text-center">

              <p className="font-medium text-gray-300">
                No matching project memory
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try another search term or analyze a new conversation.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {history.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-gray-800 bg-gray-950 p-5 transition hover:border-gray-700"
                >

                  <div className="flex flex-wrap items-center justify-between gap-3">

                    <div className="flex items-center gap-3">

                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-gray-400">
                        #{item.id}
                      </span>

                      <p className="font-semibold">
                        Project Analysis
                      </p>

                    </div>

                    <span className="text-xs text-gray-600">
                      {item.created_at}
                    </span>

                  </div>

                  <div className="mt-5">

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Summary
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      {item.summary}
                    </p>

                  </div>

                  <details className="mt-4 border-t border-gray-800 pt-4">

                    <summary className="cursor-pointer text-sm font-medium text-blue-400">
                      View original conversation
                    </summary>

                    <p className="mt-4 whitespace-pre-line rounded-xl bg-gray-900 p-4 text-sm leading-6 text-gray-400">
                      {item.conversation}
                    </p>

                  </details>

                </article>
              ))}

            </div>
          )}

        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-900 py-8 text-center">

          <p className="text-sm text-gray-600">
            ArchMind — Project Conversation Intelligence
          </p>

        </footer>

      </div>

    </main>
  );
}