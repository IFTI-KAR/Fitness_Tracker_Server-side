

# 🏋️‍♂️ Fitness Tracker (assignment12\_category\_007)

**Client repository**: [https://github.com/IFTI-KAR/Fitness\_Tracker\_Client-side](https://github.com/IFTI-KAR/Fitness_Tracker_Client-side)

**Server repository**: [https://github.com/IFTI-KAR/Fitness\_Tracker\_Server-side](https://github.com/IFTI-KAR/Fitness_Tracker_Server-side)

**Live website**: [https://fitness-tracker-faf6f.web.app/](https://fitness-tracker-faf6f.web.app/)

**Admin Login Credentials**

* **Email:** [admin@gmail.com](mailto:admin@gmail.com)
* **Password:** @Dmin123

---

## ✅ About The Project

Fitness Tracker is a full-stack MERN application that allows users to track their fitness journey, book trainers, enroll in classes and engage with a growing fitness community. It provides individual dashboards depending on the user’s role (Admin, Trainer or Member) and integrates various features such as Stripe payments, role-based access, JWT secured private routes, React Helmet dynamic titles and TanStack Query for efficient data fetching.

---

## 🌟 Key Features

* 🔐 **Role-Based Authentication** (Admin / Trainer / Member) with protected routes using JWT
* 🖥️ **Fully Responsive Design** for mobile, tablet and desktop devices
* ⚙️ **Real-Time CRUD Operations** with toast notifications for all actions (create/update/delete)
* 📊 **Admin Dashboard** with financial overview, newsletter subscribers and trainer management
* 🧑‍🏫 **Trainer Portal** with slot management (add/delete) and booking info display
* 👥 **Member Dashboard** with activity log, profile update and trainer review System
* ⚡ **Stripe Payment Integration** for secure trainer booking payments
* 🎬 **Forum / Community Page** with upvote/downvote functionality and dynamic badge display (Admin/Trainer)
* 📈 **Featured Classes** section on the homepage showing the TOP 6 most booked classes (using \$sort in backend)
* 📰 **Latest Community Posts and Newsletter Subscription** (public and saved to DB)
* 🛠️ **TanStack Query** used across the app for all GET data fetching
* 🧢 **Dynamic Page Titles** using `react-helmet` (e.g. Fitness Tracker | Login, Fitness Tracker | Dashboard)
* 📨 **Applied Trainer Module** including admin approval/rejection with feedback modal system
* 🔎 **Search functionality** in the All Classes Page with case-insensitive backend filtering

---

## 🛠️ Technologies Used

| Technology        | Usage                                                |
| ----------------- | ---------------------------------------------------- |
| React.js          | Front-end UI & routing (React Router)                |
| Tailwind CSS      | Styling & visual design                              |
| Node.js & Express | Backend server and API routes                        |
| MongoDB           | Database for users, classes, forums and bookings     |
| Firebase Auth     | User Authentication & JWT creation                   |
| Stripe            | Secure payment gateway integration                   |
| React Select      | Multi-select inputs (Trainer form / Slot management) |
| TanStack Query    | Efficient data fetching (GET requests)               |
| React Helmet      | Dynamic page titles                                  |

---

## 🚀 Getting Started (Local Development)

### Clone the Repositories

```
git clone https://github.com/IFTI-KAR/Fitness_Tracker_Client-side.git
git clone https://github.com/IFTI-KAR/Fitness_Tracker_Server-side.git
```

### Client Setup

```
cd Fitness_Tracker_Client-side
npm install
# create a `.env` file and add all Firebase config with
# REACT_APP_ prefix (do NOT commit this file)
npm run dev
```

### Server Setup

```
cd Fitness_Tracker_Server-side
npm install
# add MONGODB connection string and JWT_SECRET in a `.env` file
npm run start
```

---

## 📸 Screenshots / Demo

> (Add a few screenshots of your homepage, dashboard and mobile view here to showcase the UI)

---

## 🙌 Acknowledgements

Special thanks to the concept of MERN stack and open-source libraries like Tailwind, TanStack Query, Stripe, and Firebase for powering this application.

---

If you find this project helpful, feel free to ⭐ the repository or connect with me on GitHub for future collaborations.

