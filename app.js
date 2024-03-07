let notes = [];
let selectedNotes = [];
let selectedModel = 'claude-3-opus-20240229';

const noteInput = document.getElementById('note-input');
const noteText = document.getElementById('note-text');
const noteTags = document.getElementById('note-tags');
const saveNoteButton = document.getElementById('save-note');
const searchInput = document.getElementById('search-input');
const tagSelect = document.getElementById('tag-select');
const notesContainer = document.getElementById('notes-container');
const fuzzyResultsContainer = document.getElementById('fuzzy-results-container');

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

// Filter notes based on search input and selected tags
function filterNotes() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedTags = Array.from(tagSelect.selectedOptions).map(option => option.value);

  // If no search term and no tags selected, return all notes
  if (searchTerm === '' && selectedTags.length === 0) {
    return notes;
  }

  const filteredNotes = notes.filter(note =>
    (note.text.toLowerCase().includes(searchTerm) || note.tags.some(tag => tag.toLowerCase().includes(searchTerm))) &&
    (selectedTags.length === 0 || selectedTags.every(tag => note.tags.includes(tag)))
  );

  return filteredNotes;
}

// Render notes in the UI
function renderNotes() {
  const filteredNotes = filterNotes();

  notesContainer.innerHTML = '';
  filteredNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');

    const noteTextElement = document.createElement('div');
    noteTextElement.classList.add('note-text');
    noteTextElement.innerHTML = highlightText(note.text, searchInput.value);
    noteElement.appendChild(noteTextElement);

    const noteTagsElement = document.createElement('div');
    noteTagsElement.classList.add('note-tags');
    noteTagsElement.innerHTML = highlightTags(note.tags, searchInput.value);
    noteElement.appendChild(noteTagsElement);

    const noteActionsElement = document.createElement('div');
    noteActionsElement.classList.add('note-actions');

    const editNoteButton = document.createElement('button');
    editNoteButton.textContent = 'Edit';
    editNoteButton.addEventListener('click', () => {
      editNote(note.id);
    });
    noteActionsElement.appendChild(editNoteButton);

    const deleteNoteButton = document.createElement('button');
    deleteNoteButton.textContent = 'Delete';
    deleteNoteButton.addEventListener('click', () => {
      deleteNote(note.id);
    });
    noteActionsElement.appendChild(deleteNoteButton);

    const selectNoteCheckbox = document.createElement('input');
    selectNoteCheckbox.type = 'checkbox';
    selectNoteCheckbox.addEventListener('change', () => {
      if (selectNoteCheckbox.checked) {
        selectedNotes.push(note);
      } else {
        selectedNotes = selectedNotes.filter(selectedNote => selectedNote.id !== note.id);
      }
      renderSelectedNotes();
    });
    noteElement.appendChild(selectNoteCheckbox);
    
    noteElement.appendChild(noteActionsElement);

    notesContainer.appendChild(noteElement);
  });

  // Hide fuzzy results when search bar is empty
  if (searchInput.value === '') {
    fuzzyResultsContainer.innerHTML = '';
  } else {
    renderFuzzyResults();
  }
}

// Render fuzzy search results
function renderFuzzyResults() {
  const searchTerm = searchInput.value.toLowerCase();
  const fuzzyResults = notes.filter(note =>
    !filterNotes().includes(note) &&
    (note.text.toLowerCase().includes(searchTerm) || note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );

  fuzzyResultsContainer.innerHTML = '';

  if (fuzzyResults.length > 0) {
    const fuzzyResultsTitle = document.createElement('h3');
    fuzzyResultsTitle.textContent = 'Here are some other results:';
    fuzzyResultsContainer.appendChild(fuzzyResultsTitle);

    fuzzyResults.forEach(note => {
      const noteElement = document.createElement('div');
      noteElement.classList.add('note');

      const noteTextElement = document.createElement('div');
      noteTextElement.classList.add('note-text');
      noteTextElement.innerHTML = highlightText(note.text, searchInput.value);
      noteElement.appendChild(noteTextElement);

      const noteTagsElement = document.createElement('div');
      noteTagsElement.classList.add('note-tags');
      noteTagsElement.innerHTML = highlightTags(note.tags, searchInput.value);
      noteElement.appendChild(noteTagsElement);

      fuzzyResultsContainer.appendChild(noteElement);
    });
  }
}

// Highlight search term in text
function highlightText(text, searchTerm) {
  const regex = new RegExp(searchTerm, 'gi');
  return text.replace(regex, '<span class="highlight">$&</span>');
}

// Highlight search term in tags
function highlightTags(tags, searchTerm) {
  return tags.map(tag => {
    const regex = new RegExp(searchTerm, 'gi');
    return tag.replace(regex, '<span class="highlight">$&</span>');
  }).join(', ');
}

// Update tag select options
function updateTagSelect() {
  const allTags = [...new Set(notes.flatMap(note => note.tags))];

  tagSelect.innerHTML = '';

  allTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagSelect.appendChild(option);
  });
}

// Save notes to local storage
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
  updateTagSelect();
}

// Save note function
async function saveNote() {
  const text = noteText.value.trim();
  let tags = noteTags.value.trim().split(',').map(tag => tag.trim());

  if (isAutoTaggingEnabled) {
    const generatedTags = await autoTagNote(text);
    tags = [...tags, ...generatedTags];
  }

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

// Delete note function
function deleteNote(noteId) {
  notes = notes.filter(note => note.id !== noteId);
  saveNotes();
  renderNotes();
}

// Event listeners
searchInput.addEventListener('input', renderNotes);
tagSelect.addEventListener('change', renderNotes);

const autoTagSetting = document.getElementById('auto-tag-setting');
let isAutoTaggingEnabled = false;

autoTagSetting.addEventListener('change', () => {
  isAutoTaggingEnabled = autoTagSetting.checked;
});

async function autoTagNote(noteText) {
  if (!isAutoTaggingEnabled || userApiKey === '') {
    return [];
  }

  const anthropic = new Anthropic({apiKey: userApiKey});

  const response = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Please generate relevant tags for the following note:\n\n${noteText}\n\nTags:`
      }
    ]
  });

  const generatedTags = response.content[0].text.trim().split(',').map(tag => tag.trim());
  return generatedTags;
}

async function queryNotes(question) {
  if (userApiKey === '') {
    return 'Please enter your Anthropic API key.';
  }

  const anthropic = new Anthropic({apiKey: userApiKey});

  const relevantNotes = selectedNotes.filter(note =>
    note.text.toLowerCase().includes(question.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(question.toLowerCase()))
  );

  const relevantNotesText = relevantNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

  const response = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Here are some relevant notes:\n\n${relevantNotesText}\n\nQuestion: ${question}\n\nAnswer:`
      }
    ]
  });

  return response.content[0].text.trim();
}

function displayResponse(question, answer) {
  const chatMessages = document.getElementById('chat-messages');

  const userMessage = document.createElement('div');
  userMessage.classList.add('chat-message', 'user-message');
  userMessage.textContent = question;
  chatMessages.appendChild(userMessage);

  const assistantMessage = document.createElement('div');
  assistantMessage.classList.add('chat-message', 'assistant-message');
  assistantMessage.textContent = answer;
  chatMessages.appendChild(assistantMessage);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

const chatInput = document.getElementById('chat-input');
const sendQuestionButton = document.getElementById('send-question');

sendQuestionButton.addEventListener('click', async () => {
  const question = chatInput.value.trim();
  if (question !== '') {
    const answer = await queryNotes(question);
    displayResponse(question, answer);
    chatInput.value = '';
  }
});

let userApiKey = '';

const apiKeyInput = document.getElementById('api-key-input');
const setApiKeyButton = document.getElementById('set-api-key');

setApiKeyButton.addEventListener('click', () => {
  userApiKey = apiKeyInput.value.trim();
  apiKeyInput.value = '';
});

async function summarizeNotes() {
  if (userApiKey === '') {
    return 'Please enter your Anthropic API key.';
  }

  const anthropic = new Anthropic({apiKey: userApiKey});

  const notesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

  const response = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Please provide a summary of the following notes:\n\n${notesText}\n\nSummary:`
      }
    ]
  });

  return response.content[0].text.trim();
}

async function surfaceInsights() {
  if (userApiKey === '') {
    return 'Please enter your Anthropic API key.';
  }

  const anthropic = new Anthropic({apiKey: userApiKey});

  const notesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

  const response = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Please provide insights and observations based on the following notes:\n\n${notesText}\n\nInsights:`
      }
    ]
  });

  return response.content[0].text.trim();
}

const summarizeNotesButton = document.getElementById('summarize-notes');
const surfaceInsightsButton = document.getElementById('surface-insights');
const insightsOutput = document.getElementById('insights-output');

summarizeNotesButton.addEventListener('click', async () => {
  const summary = await summarizeNotes();
  insightsOutput.textContent = summary;
});

surfaceInsightsButton.addEventListener('click', async () => {
  const insights = await surfaceInsights();
  insightsOutput.textContent = insights;
});

function renderSelectedNotes() {
  const selectedNotesContainer = document.getElementById('selected-notes');
  selectedNotesContainer.innerHTML = '';

  selectedNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.textContent = note.text;
    selectedNotesContainer.appendChild(noteElement);
  });
}

const selectAllNotesButton = document.getElementById('select-all-notes');
const clearSelectedNotesButton = document.getElementById('clear-selected-notes');

selectAllNotesButton.addEventListener('click', () => {
  selectedNotes = [...notes];
  renderSelectedNotes();
  renderNotes();
});

clearSelectedNotesButton.addEventListener('click', () => {
  selectedNotes = [];
  renderSelectedNotes();
  renderNotes();
});

const modelSelect = document.getElementById('model-select');

modelSelect.addEventListener('change', () => {
  selectedModel = modelSelect.value;
});