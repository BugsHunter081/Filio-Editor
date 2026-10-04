export const CATEGORIES = [
  { id: "popular", label: "Most Popular" },
  { id: "split", label: "Split" },
  { id: "edit", label: "Edit & Sign" },
  { id: "compress", label: "Compress & Scans" },
  { id: "security", label: "Security" },
  { id: "from-pdf", label: "Convert From PDF" },
  { id: "to-pdf", label: "Convert To PDF" },
  { id: "others", label: "Others" },
];

export const TOOLS = [
  { slug: "editor", name: "PDF Editor", category: "popular", blurb: "Edit text, images, and markup in the browser.", accept: ".pdf", multi: false, mark: "Aa" },
  { slug: "compress", name: "Compress", category: "popular", blurb: "Shrink file size while keeping pages readable.", accept: ".pdf", multi: false, mark: "Kb" },
  { slug: "delete-pages", name: "Delete Pages", category: "popular", blurb: "Remove pages by number or range.", accept: ".pdf", multi: false, mark: "—" },
  { slug: "merge", name: "Merge", category: "popular", blurb: "Combine PDFs and images into one file.", accept: ".pdf,.jpg,.jpeg,.png", multi: true, mark: "+" },
  { slug: "split", name: "Split", category: "popular", blurb: "Break a PDF into separate documents.", accept: ".pdf", multi: false, mark: "/" },
  { slug: "crop", name: "Crop", category: "popular", blurb: "Trim margins from selected pages.", accept: ".pdf", multi: false, mark: "[]" },
  { slug: "fill-sign", name: "Fill & Sign", category: "popular", blurb: "Fill forms and place a signature.", accept: ".pdf", multi: false, mark: "Sg" },
  { slug: "pdf-to-word", name: "PDF To Word", category: "popular", blurb: "Export pages as an editable Word file.", accept: ".pdf", multi: false, mark: "W" },
  { slug: "extract", name: "Extract Pages", category: "popular", blurb: "Keep only the pages you need.", accept: ".pdf", multi: false, mark: "Ex" },
  { slug: "alternate-mix", name: "Alternate & Mix", category: "popular", blurb: "Interleave or mix pages from several files.", accept: ".pdf", multi: true, mark: "Mx" },
  { slug: "organize", name: "Organize", category: "popular", blurb: "Reorder pages with a simple page list.", accept: ".pdf", multi: false, mark: "Or" },
  { slug: "extract", name: "Extract Pages", category: "split", blurb: "Save a subset of pages as a new PDF.", accept: ".pdf", multi: false, mark: "Ex" },
  { slug: "split", name: "Split By Pages", category: "split", blurb: "Split using page ranges such as 1-3;4-8.", accept: ".pdf", multi: false, mark: "Pg" },
  { slug: "split-bookmarks", name: "Split By Bookmarks", category: "split", blurb: "Cut the file at each bookmark.", accept: ".pdf", multi: false, mark: "Bm" },
  { slug: "split-half", name: "Split In Half", category: "split", blurb: "Create two equal halves of the document.", accept: ".pdf", multi: false, mark: "½" },
  { slug: "split-size", name: "Split By Size", category: "split", blurb: "Keep each output under a size limit.", accept: ".pdf", multi: false, mark: "Mb" },
  { slug: "split-text", name: "Split By Text", category: "split", blurb: "Start a new file wherever text is found.", accept: ".pdf", multi: false, mark: "Tx" },
  { slug: "editor", name: "PDF Editor", category: "edit", blurb: "Full markup and text overlay tools.", accept: ".pdf", multi: false, mark: "Aa" },
  { slug: "fill-sign", name: "Fill & Sign", category: "edit", blurb: "Text, checkboxes, initials, and dates.", accept: ".pdf", multi: false, mark: "Sg" },
  { slug: "create-forms", name: "Create Forms", category: "edit", blurb: "Place fillable-style fields on a page.", accept: ".pdf", multi: false, mark: "Fm" },
  { slug: "delete-pages", name: "Delete Pages", category: "edit", blurb: "Drop pages you no longer need.", accept: ".pdf", multi: false, mark: "—" },
  { slug: "compress", name: "Compress", category: "compress", blurb: "Choose low, medium, or high compression.", accept: ".pdf", multi: false, mark: "Kb" },
  { slug: "deskew", name: "Deskew", category: "compress", blurb: "Straighten crooked scanned pages.", accept: ".pdf", multi: false, mark: "//" },
  { slug: "ocr", name: "OCR", category: "compress", blurb: "Make scanned pages searchable.", accept: ".pdf", multi: false, mark: "Oc" },
  { slug: "protect", name: "Protect", category: "security", blurb: "Password-protect printing and editing.", accept: ".pdf", multi: false, mark: "Lk" },
  { slug: "unlock", name: "Unlock", category: "security", blurb: "Remove restrictions when authorized.", accept: ".pdf", multi: false, mark: "Un" },
  { slug: "watermark", name: "Watermark", category: "security", blurb: "Stamp text across selected pages.", accept: ".pdf", multi: false, mark: "Wm" },
  { slug: "flatten", name: "Flatten", category: "security", blurb: "Bake annotations and fields into the page.", accept: ".pdf", multi: false, mark: "Fl" },
  { slug: "pdf-to-excel", name: "PDF To Excel", category: "from-pdf", blurb: "Extract tables into a spreadsheet.", accept: ".pdf", multi: false, mark: "Xl" },
  { slug: "pdf-to-jpg", name: "PDF To JPG", category: "from-pdf", blurb: "Export pages as JPEG images.", accept: ".pdf", multi: false, mark: "Jp" },
  { slug: "pdf-to-ppt", name: "PDF To PPT", category: "from-pdf", blurb: "Turn pages into PowerPoint slides.", accept: ".pdf", multi: false, mark: "Pt" },
  { slug: "pdf-to-text", name: "PDF To Text", category: "from-pdf", blurb: "Pull plain text from every page.", accept: ".pdf", multi: false, mark: "Tt" },
  { slug: "pdf-to-word", name: "PDF To Word", category: "from-pdf", blurb: "Create a Word document from PDF text.", accept: ".pdf", multi: false, mark: "W" },
  { slug: "html-to-pdf", name: "HTML To PDF", category: "to-pdf", blurb: "Paste HTML and render a PDF.", accept: ".html", multi: false, mark: "H" },
  { slug: "jpg-to-pdf", name: "JPG To PDF", category: "to-pdf", blurb: "Build a PDF from photos or scans.", accept: ".jpg,.jpeg,.png,.webp", multi: true, mark: "Im" },
  { slug: "word-to-pdf", name: "Word To PDF", category: "to-pdf", blurb: "Convert a Word document to PDF.", accept: ".docx,.doc", multi: false, mark: "Wd" },
  { slug: "batch-numbering", name: "Batch Numbering", category: "others", blurb: "Add consistent page numbers.", accept: ".pdf", multi: false, mark: "No" },
  { slug: "bookmarks", name: "Create Bookmarks", category: "others", blurb: "Build a table of contents.", accept: ".pdf", multi: false, mark: "Bk" },
  { slug: "crop", name: "Crop", category: "others", blurb: "Tighten page crop boxes.", accept: ".pdf", multi: false, mark: "[]" },
  { slug: "metadata", name: "Edit Metadata", category: "others", blurb: "Update title, author, and keywords.", accept: ".pdf", multi: false, mark: "Md" },
  { slug: "extract-images", name: "Extract Images", category: "others", blurb: "Save embedded images as a ZIP.", accept: ".pdf", multi: false, mark: "Pi" },
  { slug: "flip", name: "Flip", category: "others", blurb: "Mirror pages horizontally or vertically.", accept: ".pdf", multi: false, mark: "<>" },
  { slug: "grayscale", name: "Grayscale", category: "others", blurb: "Convert color pages to grayscale.", accept: ".pdf", multi: false, mark: "Gy" },
  { slug: "header-footer", name: "Header & Footer", category: "others", blurb: "Add running headers and footers.", accept: ".pdf", multi: false, mark: "Hf" },
  { slug: "n-up", name: "N-Up", category: "others", blurb: "Place multiple pages on one sheet.", accept: ".pdf", multi: false, mark: "N" },
  { slug: "page-numbers", name: "Page Numbers", category: "others", blurb: "Stamp page numbers on every page.", accept: ".pdf", multi: false, mark: "#" },
  { slug: "rename", name: "Rename", category: "others", blurb: "Export the file under a new name.", accept: ".pdf", multi: false, mark: "Rn" },
  { slug: "repair", name: "Repair", category: "others", blurb: "Rewrite and clean a damaged PDF.", accept: ".pdf", multi: false, mark: "Rp" },
  { slug: "resize", name: "Resize", category: "others", blurb: "Fit pages to A4, Letter, or Legal.", accept: ".pdf", multi: false, mark: "Sz" },
  { slug: "rotate", name: "Rotate", category: "others", blurb: "Rotate selected pages 90 or 180 degrees.", accept: ".pdf", multi: false, mark: "90" },
  { slug: "remove-annotations", name: "Remove Annotations", category: "others", blurb: "Strip highlights, comments, and markup.", accept: ".pdf", multi: false, mark: "Cl" },
];

export function toolsFor(category) {
  return TOOLS.filter((t) => t.category === category);
}

export function findTool(slug) {
  return TOOLS.find((t) => t.slug === slug);
}

export const UNIQUE_TOOLS = Object.values(
  TOOLS.reduce((acc, t) => {
    if (!acc[t.slug]) acc[t.slug] = t;
    return acc;
  }, {})
);
