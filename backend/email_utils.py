import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


async def send_otp_email(to_email: str, otp_code: str, student_name: str) -> bool:
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()

    if not smtp_user or not smtp_pass:
        print(f"[OTP] Generated OTP for {to_email}: {otp_code} (Valid for 10 min)")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = "College Search - Password Reset OTP"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #3C3489;">Password Reset Request</h2>
        <p>Hello <strong>{student_name}</strong>,</p>
        <p>You requested an OTP to reset your password. Use the 6-digit code below:</p>
        <div style="background: #F4F3FE; border: 2px solid #3C3489; border-radius: 8px; padding: 16px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #3C3489; text-align: center; max-width: 250px; margin: 20px 0;">
          {otp_code}
        </div>
        <p style="color: #666; font-size: 13px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=smtp_user,
            password=smtp_pass,
            timeout=5.0
        )
        print(f"[+] Real OTP email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[!] Email send error: {e}")
        print(f"[OTP] Fallback OTP for {to_email}: {otp_code}")
        return False


async def send_status_email(to_email: str, student_name: str, status: str) -> bool:
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()

    if not smtp_user or not smtp_pass:
        print(f"[STATUS] Status update for {to_email}: {status}")
        return False

    subject = "Account Approved - College Search" if status == "approved" else "Account Update - College Search"
    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = subject
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: {'#085041' if status == 'approved' else '#8B1A1A'};">Registration {status.title()}</h2>
        <p>Hello <strong>{student_name}</strong>,</p>
        <p>Your student registration has been <strong>{status}</strong> by the administrator.</p>
        {'<p>You can now log in using your student ID and password.</p>' if status == 'approved' else ''}
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=smtp_user,
            password=smtp_pass,
            timeout=5.0
        )
        return True
    except Exception as e:
        print(f"[!] Status email error: {e}")
        return False