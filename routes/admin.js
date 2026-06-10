const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const ApprovedStudent = require("../models/ApprovedStudent");

// ── Admin auth middleware ─────────────────────────────────────────────────────
async function requireAdmin(req, res, next) {
  const adminId = req.headers["x-admin-id"];
  if (!adminId) return res.status(401).json({ message: "Admin ID required" });
  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid admin ID" });
  }
}

// ── Email helper ──────────────────────────────────────────────────────────────
async function sendActivationEmail(to, fullName, studentId, yearLevel) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"MediLearn App" <${process.env.GMAIL_USER}>`,
    to,
    subject: "تم تفعيل حسابك في تطبيق كلية الطب - MediLearn",
    html: `
      <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;
                  max-width:520px;margin:auto;padding:28px;
                  border:1px solid #dde8f0;border-radius:14px;">
        <h2 style="color:#0E4A6B;margin-top:0;">🎓 مرحباً ${fullName}!</h2>
        <p style="font-size:16px;color:#333;">
          تم تفعيل حسابك في تطبيق <strong>MediLearn</strong> لكلية الطب.
        </p>
        <div style="background:#eef6fb;padding:18px;border-radius:10px;margin:18px 0;">
          <p style="margin:0;font-size:15px;">
            <strong>رقمك الجامعي:</strong>
            <span style="color:#0E4A6B;font-size:18px;font-weight:bold;"> ${studentId}</span>
          </p>
          ${yearLevel ? `<p style="margin:10px 0 0;font-size:14px;color:#555;">
            <strong>السنة الدراسية:</strong> ${yearLevel}
          </p>` : ""}
        </div>
        <p style="font-size:15px;color:#333;">
          حمّل التطبيق، اضغط على <strong>"إنشاء حساب"</strong>،
          وأدخل رقمك الجامعي لإكمال التسجيل.
        </p>
        <hr style="border:none;border-top:1px solid #dde8f0;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;margin:0;">
          MediLearn — منصة طلاب كلية الطب
        </p>
      </div>
    `,
  });
}

// ── Public: check if student ID is pre-approved ───────────────────────────────
router.get("/check-student/:studentId", async (req, res) => {
  try {
    const record = await ApprovedStudent.findOne({
      studentId: req.params.studentId.trim(),
    });
    if (!record) {
      return res.status(404).json({
        approved: false,
        message: "رقمك الجامعي غير مسجّل في النظام. راجع إدارة الكلية.",
      });
    }
    if (record.isRegistered) {
      return res.status(409).json({
        approved: false,
        message: "هذا الرقم الجامعي مسجّل مسبقاً. حاول تسجيل الدخول.",
      });
    }
    res.json({
      approved: true,
      fullName: record.fullName,
      email: record.email,
      yearLevel: record.yearLevel,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Admin: stats ──────────────────────────────────────────────────────────────
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [totalApproved, registered, pending, doctors] = await Promise.all([
      ApprovedStudent.countDocuments(),
      ApprovedStudent.countDocuments({ isRegistered: true }),
      ApprovedStudent.countDocuments({ isRegistered: false }),
      User.countDocuments({ role: "doctor" }),
    ]);
    res.json({ totalApproved, registered, pending, doctors });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Admin: list approved students ─────────────────────────────────────────────
router.get("/students", requireAdmin, async (req, res) => {
  try {
    const students = await ApprovedStudent.find().sort({ createdAt: -1 });
    res.json(students);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Admin: add approved student + send email ──────────────────────────────────
router.post("/students", requireAdmin, async (req, res) => {
  const { studentId, fullName, email, yearLevel } = req.body;
  if (!studentId || !fullName || !email) {
    return res.status(400).json({
      message: "studentId و fullName و email مطلوبة",
    });
  }
  try {
    const existing = await ApprovedStudent.findOne({
      studentId: studentId.trim(),
    });
    if (existing) {
      return res.status(409).json({
        message: "هذا الرقم الجامعي موجود مسبقاً في النظام",
      });
    }

    const record = new ApprovedStudent({
      studentId: studentId.trim(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      yearLevel: yearLevel || "",
    });
    await record.save();

    // Send email (non-blocking — don't fail if email fails)
    sendActivationEmail(record.email, record.fullName, record.studentId, record.yearLevel)
      .catch((e) => console.error("Email error:", e.message));

    res.status(201).json({
      message: "تم إضافة الطالب وإرسال الإيميل",
      student: record,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ── Admin: remove approved student ───────────────────────────────────────────
router.delete("/students/:id", requireAdmin, async (req, res) => {
  try {
    await ApprovedStudent.findByIdAndDelete(req.params.id);
    res.json({ message: "تم حذف الطالب" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
