import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function AIBlog() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a title");

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/autoblog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error generating blog");
      } else {
        setGeneratedContent(data.blog.content);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePostBlog = async () => {
    if (!generatedContent.trim()) return alert("No blog content to post");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/postblog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: generatedContent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Blog posted successfully!");
        navigate("/myblogs");
      } else {
        alert(data.error || "Failed to post blog");
      }
    } catch (err) {
      console.error("Error posting blog:", err);
      alert("Something went wrong while posting");
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Generate AI Blog</h1>
        <form onSubmit={handleGenerate} className="space-y-4">
          <input
            type="text"
            placeholder="Enter blog title"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Blog"}
          </button>
        </form>

        {generatedContent && (
          <div className="mt-6 p-4 border rounded bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">Generated Blog:</h2>
            <p className="whitespace-pre-wrap">{generatedContent}</p>
            <button
              onClick={handlePostBlog}
              className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700"
            >
              Post This Blog
            </button>
          </div>
        )}
      </div>
    </>
  );
}
