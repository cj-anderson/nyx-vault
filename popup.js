document.addEventListener("DOMContentLoaded", initNyx);

function initNyx() {
  const titleInput = document.getElementById("titleInput");
  const contentInput = document.getElementById("contentInput");
  const saveBtn = document.getElementById("saveBtn");
  const list = document.getElementById("notesList");

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const closeBtn = document.getElementById("closeBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  let activeNoteId = null;

  /* ---------------- STORAGE ---------------- */

  async function getNotes() {
    const data = await browser.storage.local.get("notes");
    return Array.isArray(data.notes) ? data.notes : [];
  }

  async function setNotes(notes) {
    await browser.storage.local.set({ notes });
  }

  /* ---------------- CREATE NOTE ---------------- */

  async function saveNote() {
    const content = contentInput.value.trim();
    if (!content) return;

    const notes = await getNotes();

    const newNote = {
      id: crypto.randomUUID(),
      title: titleInput.value.trim(),
      content
    };

    notes.push(newNote);
    await setNotes(notes);

    titleInput.value = "";
    contentInput.value = "";

    loadNotes();
  }

  saveBtn.addEventListener("click", saveNote);

  /* ---------------- LOAD NOTES ---------------- */

  async function loadNotes() {
    const notes = await getNotes();

    list.innerHTML = "";

    if (notes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "note";
      empty.style.opacity = "0.6";
      empty.style.cursor = "default";
      empty.textContent = "No notes yet...";
      list.appendChild(empty);
      return;
    }

    notes.forEach(note => {
      if (!note || typeof note !== "object") return;

      const card = document.createElement("div");
      card.className = "note";

      const title = document.createElement("strong");
      title.textContent = note.title || "Untitled";

      const preview = document.createElement("p");
      preview.textContent = (note.content || "").slice(0, 60);

      card.appendChild(title);
      card.appendChild(preview);

      card.addEventListener("click", () => openNote(note));

      list.appendChild(card);
    });
  }

  /* ---------------- MODAL ---------------- */

  function openNote(note) {
    activeNoteId = note.id;

    modalTitle.textContent = note.title || "Untitled";
    modalContent.textContent = note.content || "";

    modal.classList.add("show");
  }

  function closeModal() {
    modal.classList.remove("show");
    activeNoteId = null;
  }

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  /* ---------------- DELETE ---------------- */

  deleteBtn.addEventListener("click", async () => {
    if (!activeNoteId) return;

    let notes = await getNotes();
    notes = notes.filter(n => n.id !== activeNoteId);

    await setNotes(notes);

    closeModal();
    loadNotes();
  });

  /* ---------------- INIT ---------------- */

  loadNotes();
}