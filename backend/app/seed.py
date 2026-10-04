from app.config import settings
from app.auth import hash_password
from app.models import Guide, Subscription, User

GUIDES = [
    {
        "id": "edit-pdf",
        "title": "Edit PDF",
        "summary": "Open a PDF in the browser editor, change text, mark up pages, then download a clean copy.",
        "tool_slug": "editor",
        "steps": [
            "Open the PDF Editor tool and drop in your file.",
            "Use page thumbnails to jump around the document.",
            "Add text, highlights, whiteout, shapes, or links.",
            "Apply changes and download the updated PDF.",
        ],
        "related": ["fill-sign", "type-on-pdf"],
    },
    {
        "id": "pdf-to-word",
        "title": "Convert PDF to Word",
        "summary": "Turn a PDF into an editable Word document while keeping page order.",
        "tool_slug": "pdf-to-word",
        "steps": [
            "Choose PDF to Word and upload your file.",
            "Optionally set a page range.",
            "Start the conversion and wait for processing.",
            "Download the .docx file and open it in Word.",
        ],
        "related": ["pdf-to-excel", "pdf-to-ppt"],
    },
    {
        "id": "combine-pdfs",
        "title": "Combine PDFs",
        "summary": "Merge several PDFs or images into a single document in the order you want.",
        "tool_slug": "merge",
        "steps": [
            "Open Merge and add two or more files.",
            "Drag to reorder pages or documents.",
            "Optionally add a cover title.",
            "Download the combined PDF.",
        ],
        "related": ["split", "organize"],
    },
    {
        "id": "pdf-to-jpg",
        "title": "Convert PDF to JPG",
        "summary": "Export each page as a high-quality JPEG image archive.",
        "tool_slug": "pdf-to-jpg",
        "steps": [
            "Upload a PDF to PDF to JPG.",
            "Pick quality and page range.",
            "Run the conversion.",
            "Download the ZIP of JPEG pages.",
        ],
        "related": ["jpg-to-pdf", "extract-images"],
    },
    {
        "id": "delete-pdf-pages",
        "title": "Delete PDF pages",
        "summary": "Remove unwanted pages without affecting the rest of the file.",
        "tool_slug": "delete-pages",
        "steps": [
            "Upload the PDF.",
            "Enter the page ranges to remove, such as 2, 5-7.",
            "Preview the remaining page count.",
            "Download the trimmed PDF.",
        ],
        "related": ["extract", "organize"],
    },
    {
        "id": "edit-pdf-mac",
        "title": "Edit PDF on Mac",
        "summary": "Use Folio in Safari or Chrome on macOS — no Preview.app required.",
        "tool_slug": "editor",
        "steps": [
            "Open Folio in your Mac browser.",
            "Drop a PDF into the editor.",
            "Make text and markup changes.",
            "Download and save to iCloud or Finder.",
        ],
        "related": ["edit-pdf", "fill-sign"],
    },
    {
        "id": "type-on-pdf",
        "title": "Type on PDF",
        "summary": "Place typed text anywhere on a page for forms, notes, or captions.",
        "tool_slug": "fill-sign",
        "steps": [
            "Open Fill & Sign.",
            "Click a page to place a text field.",
            "Type your content and adjust size.",
            "Apply and download.",
        ],
        "related": ["edit-pdf", "create-forms"],
    },
    {
        "id": "password-protect-pdf",
        "title": "Password protect PDF",
        "summary": "Lock a document so only people with the password can open or reuse it.",
        "tool_slug": "protect",
        "steps": [
            "Upload the PDF to Protect.",
            "Set a password and confirm it.",
            "Choose print, copy, and edit permissions.",
            "Download the encrypted file.",
        ],
        "related": ["unlock", "watermark"],
    },
    {
        "id": "compress-pdf",
        "title": "Compress PDF",
        "summary": "Shrink a large PDF for email or storage while keeping it readable.",
        "tool_slug": "compress",
        "steps": [
            "Upload the original PDF.",
            "Choose Low, Medium, or High compression.",
            "Compare before and after file size.",
            "Download the smaller file.",
        ],
        "related": ["ocr", "deskew"],
    },
]


def seed(db):
    if db.query(Guide).count() == 0:
        for g in GUIDES:
            db.add(Guide(**g))

    if settings.bootstrap_superadmin_email and settings.bootstrap_superadmin_password:
        super_email = settings.bootstrap_superadmin_email
        super_user = db.query(User).filter(User.email == super_email).first()
        if not super_user:
            super_user = User(
                email=super_email,
                name="Folio Super Admin",
                password_hash=hash_password(settings.bootstrap_superadmin_password),
                plan="unlimited",
                role="super_admin",
                is_admin=True,
                is_active=True,
                daily_quota=0,
            )
            db.add(super_user)
            db.flush()
            db.add(
                Subscription(
                    user_id=super_user.id,
                    plan="unlimited",
                    status="active",
                    daily_quota=0,
                    notes="Platform owner",
                )
            )

    if settings.bootstrap_admin_email and settings.bootstrap_admin_password:
        admin_email = settings.bootstrap_admin_email
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                name="Folio Admin",
                password_hash=hash_password(settings.bootstrap_admin_password),
                plan="pro",
                role="admin",
                is_admin=True,
                is_active=True,
                daily_quota=400,
            )
            db.add(admin)
            db.flush()
            db.add(
                Subscription(
                    user_id=admin.id,
                    plan="pro",
                    status="active",
                    daily_quota=400,
                )
            )
        elif not getattr(admin, "role", None) or admin.role == "user":
            admin.role = "admin"
            admin.is_admin = True

    db.commit()
