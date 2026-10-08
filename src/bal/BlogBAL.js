import { dbFactory } from "../dal/DBFactory";

export class BlogBAL {
  static getBlogs() {
    const driver = dbFactory.getDriver();
    const blogs = driver.findAll("Blogs");
    
    // Ensure we return up to 12 items for 4x3 grid layout
    return blogs.slice(0, 12);
  }

  static getBlogById(id) {
    const driver = dbFactory.getDriver();
    return driver.findById("Blogs", id);
  }

  static addBlog(blogData) {
    if (!blogData.title || !blogData.excerpt) {
      return { success: false, message: "Title and Excerpt are required." };
    }

    const newBlog = {
      id: Date.now(),
      title: blogData.title,
      category: blogData.category || "Travel News",
      author: blogData.author || "PICKMYTRAVELS Travels Desk",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      readTime: "4 min read",
      image: blogData.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
      excerpt: blogData.excerpt,
      content: blogData.content || blogData.excerpt
    };

    const driver = dbFactory.getDriver();
    const inserted = driver.insert("Blogs", newBlog);
    if (inserted) {
      return { success: true, blog: inserted, message: "Blog published successfully!" };
    }
    return { success: false, message: "Could not publish blog." };
  }
}
