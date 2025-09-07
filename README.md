# Parking Management System - Admin Panel

![Parking Admin Dashboard](https://via.placeholder.com/800x200.png?text=Parking+Admin+Dashboard)

A full-featured **Admin Panel** for managing parking zones, employees, categories, subscriptions, rush hours, and vacations with **real-time updates**. Built with **React**, **TypeScript**, **Tailwind CSS**, **React Query**, **Axios**, and **WebSockets**.

---

## 🛠️ Features

### 🔑 Authentication
- Admin login with JWT token stored in localStorage.
- Logout with confirmation and toast notifications.

### 🏢 Employees Management
- Add, edit, delete employees.
- Assign roles: Admin or Employee.
- Real-time updates using React Query cache.

### 🅿️ Zones Management
- View all parking zones with details: total slots, occupied, free, reserved.
- Toggle zones open/close in real-time.

### 💳 Subscriptions Management
- List all subscriptions.
- Show active/inactive status per user.
- Real-time updates when subscription status changes.

### 🏷️ Categories Management
- Update normal and special rates for parking categories.
- Live update using React Query.

### ⏱️ Rush Hours Management
- Add rush hours for each day of the week.
- Display all configured rush hours.

### 🌴 Vacations Management
- Add and view vacations.
- Display active vacations.

### 📊 Overview Dashboard
- Summary of employees, open/closed zones, active/inactive subscriptions.

### ⚡ Real-Time Audit Log
- WebSocket integration to show admin actions live.

---

## 💻 Technologies Used

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion  
- **State Management & Data Fetching:** React Query, Axios  
- **Notifications:** react-toastify  
- **WebSocket:** For real-time audit log  
- **Other:** LocalStorage for token persistence

---

## 🏗️ Project Structure

src/
├─ Components/ # Reusable UI components (Loading, Modals, etc.)
├─ Interfaces/ # TypeScript interfaces for Employees, Zones, etc.
├─ Pages/ # AdminDashboard and all tabs (Employees, Zones, etc.)
├─ App.tsx # Main app component
└─ main.tsx # Entry point



## 🚀 Setup / Run Instructions

1. **Clone the repository**

```bash
git clone https://github.com/your-username/parking-admin-panel.git
cd parking-admin-panel
Install dependencies

bash
Copy code
npm install
Set up environment variables

Create a .env file in the root directory:

env
Copy code
VITE_API_URL=http://localhost:3000/api/v1
Start the development server

bash
Copy code
npm run dev
Open the app in your browser

Visit: http://localhost:5173

Backend

Make sure your backend server is running at http://localhost:3000/api/v1 with endpoints for:

/auth/login

/admin/users

/admin/zones

/admin/subscriptions

/admin/rush-hours

/admin/vacations

/master/categories

WebSocket (Optional for real-time updates)

Backend WebSocket server should be available at:
ws://localhost:3000/api/v1/ws/admin