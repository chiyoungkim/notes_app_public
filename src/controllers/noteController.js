exports.getNotes = (req, res) => {
  // Retrieve notes from browser storage
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  res.json(notes);
};

exports.createNote = (req, res) => {
  const { text, tags } = req.body;
  const newNote = {
    id: Date.now(),
    text,
    tags,
  };
  // Retrieve existing notes from browser storage
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.push(newNote);
  // Save updated notes to browser storage
  localStorage.setItem('notes', JSON.stringify(notes));
  res.json(newNote);
};

exports.updateNote = (req, res) => {
  const { id } = req.params;
  const { text, tags } = req.body;
  // Retrieve existing notes from browser storage
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  const noteIndex = notes.findIndex((note) => note.id === parseInt(id));
  if (noteIndex !== -1) {
    notes[noteIndex] = {
      ...notes[noteIndex],
      text,
      tags,
    };
    // Save updated notes to browser storage
    localStorage.setItem('notes', JSON.stringify(notes));
    res.json(notes[noteIndex]);
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
};

exports.deleteNote = (req, res) => {
  const { id } = req.params;
  // Retrieve existing notes from browser storage
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  const updatedNotes = notes.filter((note) => note.id !== parseInt(id));
  // Save updated notes to browser storage
  localStorage.setItem('notes', JSON.stringify(updatedNotes));
  res.sendStatus(204);
};