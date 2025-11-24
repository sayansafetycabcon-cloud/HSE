import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ------------------ LOGIN ---------------------
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password);

  if (data && data.length === 1) res.json(data[0]);
  else res.status(401).json({ error: "Invalid credentials" });
});

// ------------------ REPORTS -------------------
app.post("/api/report", async (req, res) => {
  const { id, reporter, loc, date, sev, desc } = req.body;
  const { error } = await supabase.from("reports").insert([
    { id, reporter, loc, date, sev, desc }
  ]);
  if (error) return res.status(400).json(error);
  res.json({ success: true });
});

app.get("/api/reports", async (req, res) => {
  const { data } = await supabase
    .from("reports")
    .select("*")
    .order("id", { ascending: false });
  res.json(data);
});

// ------------------ FACTORIES -----------------
app.get("/api/factories", async (req, res) => {
  const { data } = await supabase.from("factories").select("*");
  res.json(data);
});

app.post("/api/factories/update", async (req, res) => {
  const { factory, fire, firstAid, manpower } = req.body;

  const { error } = await supabase
    .from("factories")
    .upsert([
      { factory_name: factory, fire, firstAid, manpower }
    ]);

  if (error) return res.status(400).json(error);
  res.json({ success: true });
});

// ------------------ GALLERY UPLOAD --------------
app.post("/api/gallery/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const fileName = `gallery/${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from("files")
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (error) return res.status(400).json(error);

  const { data: urlData } =
    supabase.storage.from("files").getPublicUrl(fileName);

  await supabase.from("gallery").insert([
    { id: Date.now(), url: urlData.publicUrl }
  ]);

  res.json({ url: urlData.publicUrl });
});

// ------------------ POLICIES UPLOAD -------------
app.post("/api/policy/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { title } = req.body;
  const fileName = `policies/${Date.now()}-${file.originalname}`;

  const { error } = await supabase.storage
    .from("files")
    .upload(fileName, file.buffer, { contentType: file.mimetype });

  if (error) return res.status(400).json(error);

  const { data: urlData } =
    supabase.storage.from("files").getPublicUrl(fileName);

  await supabase.from("policies").insert([
    { id: Date.now(), title, url: urlData.publicUrl }
  ]);

  res.json({ url: urlData.publicUrl });
});

// ------------------ CHAT -------------------------
app.post("/api/chat/send", async (req, res) => {
  const msg = req.body;
  const { error } = await supabase.from("chat").insert([msg]);
  if (error) return res.status(400).json(error);
  res.json({ success: true });
});

app.get("/api/chat", async (req, res) => {
  const { data } = await supabase
    .from("chat")
    .select("*")
    .order("id", { ascending: true });
  res.json(data);
});

// ------------------ START SERVER -------------------
app.listen(process.env.PORT, () =>
  console.log("ONLINE SERVER RUNNING ON PORT", process.env.PORT)
);
