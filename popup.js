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

  /* NEW: Tabs */
  const tabUnsecured = document.getElementById("tabUnsecured");
  const tabSecured = document.getElementById("tabSecured");

  let activeNoteId = null;
  let isEditing = false;
  let currentTab = "unsecured";

  let isUnlocked = false;
  let masterKey = null;

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
    const title = titleInput.value.trim();

    if (!content) return;

    const notes = await getNotes();

    const newNote = {
      id: crypto.randomUUID(),
      title: title || "",
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      tags: [],
      secured: currentTab === "secured"
    };

    notes.push(newNote);
    await setNotes(notes);

    titleInput.value = "";
    contentInput.value = "";

    loadNotes();
  }

  saveBtn.addEventListener("click", saveNote);

  /* ---------------- TAB SWITCHING ---------------- */

  tabUnsecured.addEventListener("click", () => {
    currentTab = "unsecured";

    tabUnsecured.classList.add("active");
    tabSecured.classList.remove("active");

    loadNotes();
  });

  tabSecured.addEventListener("click", () => {
    currentTab = "secured";

    tabSecured.classList.add("active");
    tabUnsecured.classList.remove("active");

    loadNotes();
  });

  /* ---------------- LOAD NOTES ---------------- */

  async function loadNotes() {
    const allNotes = await getNotes();

    const notes = allNotes.filter(note =>
      currentTab === "secured"
        ? note.secured
        : !note.secured
    );

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
    isEditing = false;

    renderView(note);

    modal.classList.add("show");
  }

  function renderView(note) {
    modalTitle.textContent = note.title || "Untitled";
    modalContent.textContent = note.content || "";

    modalContent.contentEditable = false;
    modalContent.style.outline = "none";
  }

  function enterEditMode(note) {
    isEditing = true;

    modalTitle.textContent = "Editing…";
    modalContent.textContent = note.content || "";

    modalContent.contentEditable = true;
    modalContent.focus();
  }

  function closeModal() {
    modal.classList.remove("show");
    activeNoteId = null;
    isEditing = false;
  }

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  /* ---------------- EDIT (BUTTON-DRIVEN) ---------------- */

  async function handleEdit() {
    if (!activeNoteId) return;

    const notes = await getNotes();
    const index = notes.findIndex(n => n.id === activeNoteId);

    if (index === -1) return;

    const note = notes[index];

    if (!isEditing) {
      enterEditMode(note);
      return;
    }

    // SAVE EDIT
    notes[index] = {
      ...note,
      content: modalContent.textContent,
      updatedAt: Date.now()
    };

    await setNotes(notes);

    isEditing = false;

    renderView(notes[index]);
    loadNotes();
  }

  /* ---------------- DELETE ---------------- */

  deleteBtn.addEventListener("click", async () => {
    if (!activeNoteId) return;

    let notes = await getNotes();
    notes = notes.filter(n => n.id !== activeNoteId);

    await setNotes(notes);

    closeModal();
    loadNotes();
  });

  /* ---------------- KEYBOARD SHORTCUTS ---------------- */

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("show")) return;

    if (e.key === "Escape") {
      closeModal();
    }

    if (e.ctrlKey && e.key === "e") {
      e.preventDefault();
      const note = { id: activeNoteId };
      handleEdit(note);
    }

    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      if (isEditing) handleEdit();
    }
  });

  /* ---------------- INIT ---------------- */

  loadNotes();
}