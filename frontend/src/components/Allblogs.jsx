import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
export default function AllBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch("http://localhost:3000/blogs");
        if (!res.ok) throw new Error("Failed to fetch blogs");
        const data = await res.json();
        setBlogs(data.blogs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading blogs...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (blogs.length === 0) return <p className="text-center mt-10">No blogs found.</p>;

  return (
    <>
    <Navbar />
    <div className="max-w-3xl mx-auto mt-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">All Blogs</h1>

      <div className="space-y-8">
        {blogs.map(({ id, title, content, username }) => (
          <div key={id} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{content}</p>
            <p className="text-sm text-gray-500 italic">By: {username}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
