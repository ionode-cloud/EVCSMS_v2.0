import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import { log } from "console";

const app = express();
app.use(express.json());


// ---------------- MongoDB Connection ----------------
mongoose.connect("mongodb+srv://ionode:ionode@ionode.qgqbadm.mongodb.net/EVCMS?retryWrites=true&w=majority")
  .then(() => console.log("MongoDB connected."))
  .catch(err => console.error("Error connecting MongoDB:", err));

// ---------------- Schemas ----------------
const evStationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  disHighway: { type: Number, required: true, default: 0 },
  maxCapacity: { type: Number, default: 0 },
  rate: { type: Number, default: 5 },
  currPower: { type: Number, default: 0 },
  consPower: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  occupancy: { type: Boolean, default: false },
  address: { type: String, default: "Unknown" },
connector: { type: String, default: "Type2" },
power: { type: Number, default: 0 },

});

const userProfile = new mongoose.Schema({
  name: { type: String, required: true },
  vehicleNo: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  wallet: { type: Number, default: 0 }
});

const Stations = mongoose.model("Station", evStationSchema);
const User = mongoose.model("User", userProfile);

//  Allow your React app origin
app.use(cors({
  origin: ["http://localhost:5173","https://evcsms-v2-0.vercel.app"] // <-- frontend origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ---------------- Razorpay Setup ----------------
const razorpay = new Razorpay({
  key_id: "rzp_test_R8hZFBr7vJp0td",
  key_secret: "xJmq8m7LmpcfUUvtS25Vixya"
});

// ---------------- Routes ----------------

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running 🚀" });
});

// User registration/login
app.post("/login", async (req, res) => {
  try {
    const { name, mobile, vehicle } = req.body;
    const existingUser = await User.findOne({ vehicleNo: vehicle });

    if (existingUser) return res.status(200).json({ message: "User logged in", user: existingUser });

    const newUser = await User.create({ name, mobile, vehicleNo: vehicle });
    res.status(201).json({ message: "User registered", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Razorpay order
app.post("/create-order", async (req, res) => {
  try {
    let { amount } = req.body;

    console.log("Create order request received:", req.body);

    //  Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Convert amount to paisa
    const amountInPaisa = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaisa, // amount in paisa
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
    };

    const order = await razorpay.orders.create(options);

    console.log(" Razorpay order created:", order);

    res.status(200).json({ orderId: order.id, currency: order.currency, amount: order.amount });
  } catch (err) {
    console.error(" Razorpay order creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});


// Verify Razorpay payment signature
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start charging session onclick
app.post("/start-session", async (req, res) => {
  try {
    console.log(req.body);
    
    const { stationId, userId, duration } = req.body;
    const station = await Stations.findById(stationId);
    if (!station) return res.status(404).json({ message: "Station not found" });

    const cost = station.rate * duration;
    station.occupancy = true;
    station.duration = duration;
    station.cost = cost;
    await station.save();

    res.status(200).json({ message: "Charging session started", cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End charging session
app.post("/end-session", async (req, res) => {
  try {
    const { stationId } = req.body;
    const station = await Stations.findById(stationId);
    if (!station) return res.status(404).json({ message: "Station not found" });

    station.occupancy = false;
    station.currPower += station.consPower;
    station.duration = 0;
    station.cost = 0;
    await station.save();

    res.status(200).json({ message: "Session ended successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new EV station
app.post("/stations", async (req, res) => {
  try {
    const { name, disHighway, maxCapacity, rate } = req.body;
    const newStation = await Stations.create({
      name,
      disHighway,
      maxCapacity,
      rate,
    });
    res.status(201).json({ message: "Station created", station: newStation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all stations
app.get("/stations", async (req, res) => {
  try {
    const stations = await Stations.find();
    res.status(200).json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get station by ID
app.get("/stations/:id", async (req, res) => {
  try {
    const stationId = req.params.id;
    const station = await Stations.findById(stationId);
    if (!station) return res.status(404).json({ message: "Station not found" });
    res.status(200).json(station);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a station by ID (optional, for future)
app.put("/stations/:id", async (req, res) => {
  try {
    const stationId = req.params.id;
    const updates = req.body;
    const updatedStation = await Stations.findByIdAndUpdate(stationId, updates, { new: true });
    if (!updatedStation) return res.status(404).json({ message: "Station not found" });
    res.status(200).json({ message: "Station updated", station: updatedStation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// delete station by ID 
app.delete("/stations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStation = await Stations.findByIdAndDelete(id);

    if (!deletedStation) {
      return res.status(404).json({ message: "Station not found" });
    }

    res.json({ message: "Station deleted successfully", deletedStation });
  } catch (error) {
    console.error("❌ Error deleting station:", error);
    res.status(500).json({ error: "Failed to delete station" });
  }
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 38923;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
