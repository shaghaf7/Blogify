import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";

export default function MyBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // <-- Use Render backend URL

  useEffect(() => {
    async function fetchMyBlogs() {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to view your blogs.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/myblogs`, {   // <-- Updated URL
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch your blogs");
        }

        const data = await res.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMyBlogs();
  }, [API_BASE_URL]);

  if (loading) return <p className="text-center mt-10">Loading your blogs...</p>;
  if (error)
    return (
      <p className="text-center mt-10 text-red-600">
        Error: {error}
      </p>
    );

  if (blogs.length === 0)
    return (
      <p className="text-center mt-10 text-gray-600">
        You have not added any blogs yet.
      </p>
    );

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">My Blogs</h1>

        <div className="space-y-8">
          {blogs.map(({ id, title, content, created_at }) => (
            <div
              key={id}
              className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{content}</p>
              <p className="text-sm text-gray-500 italic">
                Created at: {new Date(created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
