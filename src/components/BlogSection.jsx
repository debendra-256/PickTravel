import React, { useState, useEffect } from "react";
import { BookOpen, Calendar, Clock, User, ArrowRight, X } from "lucide-react";
import { assetUrl } from "../config/assetUrl";

export function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    fetch(assetUrl("Blogs/TravelBlogs.json"))
      .then((res) => res.json())
      .then((data) => {
        // Support both array and single-object formats
        const blogList = Array.isArray(data) ? data : [data];
        setBlogs(blogList);
      })
      .catch((err) => console.error("Failed to load blogs:", err));
  }, []);

  return (
    <section id="blogs" className="section-padding" style={{ background: "#f8fafc" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3rem auto" }}>
          <span className="badge badge-red" style={{ marginBottom: "0.5rem" }}>
            Odisha Travel Insights & Guides
          </span>
          <h2>Latest Travel Blogs & Guides</h2>
          <p style={{ color: "var(--text-muted)" }}>
            Explore destination tips, pilgrimage guides, and taxi itineraries curated by Patra Travels experts.
          </p>
        </div>

        {/* 4 In A Row & 3 Rows Grid Layout (12 Blog Cards) */}
        <div className="blog-grid-4x3">
          {blogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <div className="blog-img-box">
                <img src={blog.image} alt={blog.title} className="blog-img" />
                <span className="blog-category-tag">{blog.category}</span>
              </div>

              <div className="blog-content">
                <div className="blog-meta">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <Calendar size={12} />
                    {blog.date}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <Clock size={12} />
                    {blog.readTime}
                  </span>
                </div>

                <h4 className="blog-title">{blog.title}</h4>
                <p className="blog-excerpt" dangerouslySetInnerHTML={{ __html: blog.excerpt }} />

                <button
                  className="blog-read-btn"
                  style={{ marginTop: "auto", background: "none", border: "none", padding: 0 }}
                  onClick={() => setSelectedBlog(blog)}
                >
                  <span>Read Article</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blog Full Content Modal */}
      {selectedBlog && (
        <div className="modal-overlay" onClick={() => setSelectedBlog(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "750px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setSelectedBlog(null)}>
              <X size={18} />
            </button>

            <span className="badge badge-red" style={{ marginBottom: "0.75rem" }}>
              {selectedBlog.category}
            </span>
            <h2 style={{ fontSize: "1.6rem", lineHeight: "1.3", marginBottom: "0.75rem" }}>
              {selectedBlog.title}
            </h2>

            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: "1.25rem",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "0.75rem"
              }}
            >
              <span>By {selectedBlog.author}</span>
              <span>•</span>
              <span>{selectedBlog.date}</span>
              <span>•</span>
              <span>{selectedBlog.readTime}</span>
            </div>

            <div style={{ height: "260px", overflow: "hidden", borderRadius: "12px", marginBottom: "1.25rem" }}>
              <img
                src={selectedBlog.image}
                alt={selectedBlog.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div
              style={{ lineHeight: "1.8", color: "var(--text-dark)", fontSize: "1rem" }}
              dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
            />

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setSelectedBlog(null)}>
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
