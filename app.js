let notes = [];

const noteInput = document.getElementById('note-input');
const noteText = document.getElementById('note-text');
const noteTags = document.getElementById('note-tags');
const saveNoteButton = document.getElementById('save-note');
const searchInput = document.getElementById('search-input');
const notesContainer = document.getElementById('notes-container');

// Load notes from local storage
const storedNotes = localStorage.getItem('notes');
if (storedNotes) {
  notes = JSON.parse(storedNotes);
} else {
  // Pre-fill with 9 filler notes
  notes = [
    { id: 1, text: 'Note 1', tags: ['tag1', 'tag2'] },
    { id: 2, text: 'Note 2', tags: ['tag2', 'tag3'] },
    { id: 3, text: 'Note 3', tags: ['tag1', 'tag3'] },
    { id: 4, text: 'Note 4', tags: ['tag4'] },
    { id: 5, text: 'Note 5', tags: ['tag2', 'tag4'] },
    { id: 6, text: 'Note 6', tags: ['tag1', 'tag4'] },
    { id: 7, text: 'Note 7', tags: ['tag3'] },
    { id: 8, text: 'Note 8', tags: ['tag1', 'tag2', 'tag3'] },
    { id: 9, text: 'Note 9', tags: ['tag4'] }
  ];
  saveNotes();
}
renderNotes();

// Show/hide note input on hotkey press (e.g., Ctrl+Shift+N)
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'N') {
    noteInput.classList.toggle('hidden');
    noteText.focus();
  }
});

// Save note on button click
saveNoteButton.addEventListener('click', saveNote);

// Filter notes based on search input
searchInput.addEventListener('input', () => {
  renderNotes();
});

// Save notes to local storage
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

// Render notes in the UI
function renderNotes() {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(searchTerm) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );

  notesContainer.innerHTML = '';
  filteredNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');

    const noteTextElement = document.createElement('div');
    noteTextElement.classList.add('note-text');
    noteTextElement.textContent = note.text;
    noteElement.appendChild(noteTextElement);

    const noteTagsElement = document.createElement('div');
    noteTagsElement.classList.add('note-tags');
    noteTagsElement.textContent = note.tags.join(', ');
    noteElement.appendChild(noteTagsElement);

    const editNoteButton = document.createElement('button');
    editNoteButton.classList.add('edit-note');
    editNoteButton.textContent = 'Edit';
    editNoteButton.addEventListener('click', () => {
      editNote(note.id);
    });
    noteElement.appendChild(editNoteButton);

    notesContainer.appendChild(noteElement);
  });
}

// Save note function
function saveNote() {
  const text = noteText.value.trim();
  const tags = noteTags.value.trim().split(',').map(tag => tag.trim());

  if (text !== '') {
    const note = {
      id: Date.now(),
      text,
      tags
    };
    notes.push(note);
    saveNotes();
    noteText.value = '';
    noteTags.value = '';
    renderNotes();
  }
}

// Edit note function
function editNote(noteId) {
  const note = notes.find(note => note.id === noteId);
  if (note) {
    noteText.value = note.text;
    noteTags.value = note.tags.join(', ');
    noteText.focus();

    // Remove the existing save button event listener
    saveNoteButton.removeEventListener('click', saveNote);

    // Add a new save button event listener for updating the note
    saveNoteButton.addEventListener('click', () => {
      updateNote(noteId);
    });
  }
}

// Update note function
function updateNote(noteId) {
  const note = notes.find(note => note.id === noteId);
  if (note) {
    note.text = noteText.value.trim();
    note.tags = noteTags.value.trim().split(',').map(tag => tag.trim());
    saveNotes();
    noteText.value = '';
    noteTags.value = '';
    renderNotes();

    // Remove the update note event listener
    saveNoteButton.removeEventListener('click', () => {
      updateNote(noteId);
    });

    // Add back the original save note event listener
    saveNoteButton.addEventListener('click', saveNote);
  }
}