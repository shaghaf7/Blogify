# 📓 Blogify

**Blogify** is an AI-powered blog application designed for effortless blog creation.  
Users can generate blogs using AI, manually create blogs, view all published blogs, and manage their personal blog posts.

Built with strong user authentication using **JWT** and **bcrypt**, Blogify ensures secure and personalized access to blog content.

---

## 🚀 Features

- ✍️ AI-generated blog creation  
- 📝 Manual blog post creation  
- 📖 View all blogs or personal blogs  
- 🔐 Secure authentication (JWT + bcrypt)  

---

## 🛠️ Getting Started

Follow the steps below to set up the project locally.

---

### 🔁 Clone the Repository

```bash
git clone https://github.com/shaghaf7/Blogify
cd blogify
```

---

### ⚙️ Environment Setup

Create a `.env` file in the **backend** folder and add the following credentials:

```bash
JWT_SECRET=your_jwt_secret
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
DB_CA_PATH=path_to_your_ca_certificate
GEMINI_API_KEY=your_gemini_api_key
```

---

### 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
This will start the frontend development server, typically on [http://localhost:5173](http://localhost:5173).

---

### 🔙 Backend Setup

```bash
cd backend
npm install
npm run dev
```
This will start the backend server, typically on [http://localhost:3000](http://localhost:3000).
