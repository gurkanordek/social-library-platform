# 📚 Social Library Platform (CineLib)

A full-stack social platform where users can track movies and books, create custom lists, rate content, and interact with a community feed. Developed with **MERN Stack** (MongoDB, Express, React, Node.js).

## 🚀 Features

* **Multi-Content Tracking:** Search and track both Movies (via TMDB API) and Books (via Google Books API).
* **Social Feed:** See what your friends are watching or reading in real-time with rich activity cards.
* **User Interaction:** Follow/Unfollow users, like and comment on activities.
* **Custom Lists:** Create personalized collections (e.g., "Best Sci-Fi Movies", "Summer Reading List").
* **Rating & Reviews:** Rate content out of 10 and write detailed reviews.
* **Profile Management:** customizable user profiles with stats and library tabs.
* **Secure Authentication:** JWT-based authentication with BCrypt password hashing.

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* Context API (State Management)
* Tailwind CSS (Styling)
* Axios

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose
* JWT (JSON Web Token)
* Bcryptjs

**External APIs:**
* [TMDB API](https://www.themoviedb.org/documentation/api) (Movies)
* [Google Books API](https://developers.google.com/books) (Books)

## 📂 Project Structure

The project is organized as a monorepo:

```bash
.
├── web/
│   ├── backend/         # Node.js/Express API
│   ├── frontend/        # React Client
│   └── ...
└── README.md

```

## ⚙️ Installation & Setup
Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone [https://github.com/YOUR_USERNAME/REPO_NAME.git](https://github.com/YOUR_USERNAME/REPO_NAME.git)
cd REPO_NAME
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:

```bash
cd web/backend
npm install
```

Create a .env file in the web/backend directory and add the following variables:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
TMDB_API_KEY=your_tmdb_api_key
```

Start the backend server:

```bash
npm start
# Server will run on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend folder and install dependencies:

```bash
cd web/frontend
npm install
```

Start the React application:

```bash
npm run dev
# App will run on http://localhost:5173
```
