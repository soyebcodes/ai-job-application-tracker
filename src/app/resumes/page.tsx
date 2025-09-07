"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface Resume {
  id: string;
  createdAt: string;
  url: string;
}

export default function ResumeManagerPage() {
  const { data: session, status } = useSession();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session) fetchResumes();
  }, [session]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resume");
      if (res.status === 401) {
        setMessage("Please sign in to view your resumes.");
        setResumes([]);
      } else {
        const data = await res.json();
        if (data.resumes) setResumes(data.resumes);
        else setMessage("No resumes found.");
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to fetch resumes.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        setMessage("Resume uploaded successfully!");
        fetchResumes();
      } else {
        setMessage(data.error || "Upload failed");
      }
    } catch (err: any) {
      setMessage(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.currentTarget.reset();
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      const res = await fetch("/api/resume/delete", {
        method: "POST",
        body: JSON.stringify({ resumeId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setResumes(resumes.filter((r) => r.id !== resumeId));
      } else {
        alert(data.error || "Failed to delete resume");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete resume");
    }
  };

  const handleAnalyze = async (resumeId: string) => {
    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        body: JSON.stringify({ resumeId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.analysis) alert(data.analysis);
      else alert(data.error || "Analysis failed");
    } catch (err: any) {
      alert(err.message || "Analysis failed");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-green-600"></div>
        <span className="ml-4 text-lg text-zinc-700 dark:text-zinc-300">
          Loading...
        </span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
          Access Denied
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          You must be logged in to view and upload resumes.
        </p>
        <Button
          onClick={() => signIn()}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
          Your Resumes
        </h1>
      </div>

      {/* Upload Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Upload Your Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleUpload}
            className="flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <Input type="file" name="file" accept="application/pdf" required />
            <Button
              type="submit"
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
          </form>
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-center text-gray-600"
            >
              {message}
            </motion.p>
          )}
        </CardContent>
      </Card>

      {/* Resume List */}
      {loading ? (
        <p className="text-center text-gray-500">Loading resumes...</p>
      ) : resumes.length === 0 ? (
        <p className="text-center text-gray-500">No resumes uploaded yet.</p>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border border-zinc-300 dark:border-zinc-700 p-5 rounded-xl shadow-sm transition hover:shadow-md bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Uploaded: {new Date(resume.createdAt).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <a
                        href={resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Download
                      </a>
                    </Button>

                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleDelete(resume.id)}
                    >
                      Delete
                    </Button>

                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => handleAnalyze(resume.id)}
                    >
                      Analyze AI
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
