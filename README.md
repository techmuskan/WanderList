# 🌍 WanderList

**WanderList** is your quirky travel sidekick that *almost* defies reality — discover hidden gems (even on Mars!), enjoy perfect weather, and plan dream trips cheaper than a cup of chai. With lightning-fast itineraries and destinations picked by explorers and astronauts, WanderList makes fantasy travel feel totally doable.

---

## 🚀 Features

* 🧭 Explore hidden travel destinations across the globe
* 🌤 Get real-time weather details for your next trip
* 💸 Plan budget-friendly dream vacations
* 📸 Upload and manage images directly from your PC to the cloud
* 🛡 Authentication and authorization for listings & reviews
* 💬 Fully functional contact and home pages
* 🧩 Clean, modular architecture (controllers, routes, views, and models)

---

## 🛠 Tech Stack

| Category             | Technologies             |
| -------------------- | ------------------------ |
| **Backend**          | Node.js, Express.js      |
| **Frontend (Views)** | EJS Templates, HTML, CSS |
| **Database**         | MongoDB (via Mongoose)   |
| **Authentication**   | JWT / Middleware-based   |
| **Cloud Storage**    | Cloudinary               |
| **Version Control**  | Git & GitHub             |

---

## 📂 Project Structure

```
WanderList/
│
├── controllers/        # Route handlers and business logic
├── init/               # Initialization and configuration scripts
├── models/             # MongoDB schema models
├── public/             # Static files (CSS, JS, images)
├── routes/             # App routing logic
├── utils/              # Helper functions and configurations
├── views/              # EJS templates for rendering pages
│
├── app.js              # Entry point of the application
├── cloudConfig.js      # Cloudinary configuration
├── middleware.js       # Authentication & authorization middleware
├── schema.js           # Mongoose schemas
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── README.md           # Project documentation
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/techmuskan/WanderList.git
   cd WanderList
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory and add:

   ```bash
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   MONGODB_URI=your_mongo_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Run the application**

   ```bash
   npm start
   ```

5. **Visit on browser**

   ```
   http://localhost:3000
   ```

---

## 🧠 Future Enhancements

* AI-powered travel recommendations
* Multi-language support
* Social sharing of travel itineraries
* Integration with Google Maps for location previews

---

## 🤝 Contributing

Contributions are welcome!
Please fork the repository and submit a pull request for any improvements.

---

## 🪪 License

This project is licensed under the **MIT License**.

---

### 👩‍💻 Developed by [Muskan Kawadkar](https://github.com/techmuskan)
