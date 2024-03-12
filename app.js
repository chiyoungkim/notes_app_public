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
const selectNotesFilter = document.getElementById('select-notes-filter');

document.addEventListener('DOMContentLoaded', () => {

// Load notes from local storage
const storedNotes = localStorage.getItem('notes');
if (storedNotes) {
  notes = JSON.parse(storedNotes);
  renderNotes();
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
  renderNotes();
}

function loadNotes() {
  const storedNotes = localStorage.getItem('notes');
  if (storedNotes) {
    notes = JSON.parse(storedNotes);
  }
}

loadNotes();
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

    noteElement.addEventListener('click', () => {
      selectNoteCheckbox.checked = !selectNoteCheckbox.checked;
      if (selectNoteCheckbox.checked) {
        selectedNotes.push(note);
      } else {
        selectedNotes = selectedNotes.filter(selectedNote => selectedNote.id !== note.id);
      }
      renderSelectedNotes();
    });

    if (selectedNotes.find(selectedNote => selectedNote.id === note.id)) {
      noteElement.classList.add('selected-note');
    } else {
      noteElement.classList.remove('selected-note');
    }

    const noteTextElement = document.createElement('div');
    noteTextElement.classList.add('note-text');
    noteTextElement.innerHTML = highlightText(note.text, searchInput.value);
    noteTextElement.textContent = note.text;
    noteElement.appendChild(noteTextElement);

    const noteTagsElement = document.createElement('div');
    noteTagsElement.classList.add('note-tags');
    noteTagsElement.textContent = note.tags.join(', ');
    noteElement.appendChild(noteTagsElement);

    const noteActionsElement = document.createElement('div');
    noteActionsElement.classList.add('note-actions');

    const editNoteButton = document.createElement('button');
    editNoteButton.classList.add('edit-note');
    editNoteButton.textContent = 'Edit';
    editNoteButton.addEventListener('click', () => {
      enableNoteEdit(note.id, noteElement, noteTextElement, noteTagsElement, editNoteButton);
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

    // Update tag filter dropdown
    selectNotesFilter.innerHTML = '';

    const allTags = [...new Set(notes.flatMap(note => note.tags))];

    allTags.forEach(tag => {
      const optionElement = document.createElement('option');
      optionElement.value = tag;
      optionElement.textContent = tag;
      selectNotesFilter.appendChild(optionElement);
    });

  });

  renderSelectedNotes();
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
  const noteId = noteInput.getAttribute('data-note-id');
  const text = noteText.value.trim();
  let tags = noteTags.value.trim().split(',').map(tag => tag.trim());

  if (isAutoTaggingEnabled) {
    const generatedTags = await autoTagNote(text);
    tags = [...tags, ...generatedTags];
  }

  if (text !== '') {
    if (noteId) {
      // Update existing note
      const note = notes.find(note => note.id === Number(noteId));
      if (note) {
        note.text = text;
        note.tags = tags;
      }
    } else {
      // Add new note
      const note = {
        id: Date.now(),
        text,
        tags,
      };
      notes.push(note);
    }
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
      const updatedText = noteText.value.trim();
      const updatedTags = noteTags.value.trim().split(',').map(tag => tag.trim());
      updateNote(noteId, updatedText, updatedTags);
    });
  }
}

// Update note function
async function updateNote(noteId, updatedText, updatedTags) {
  const note = notes.find(note => note.id === noteId);
  if (note) {
    note.text = updatedText;
    note.tags = updatedTags;
    saveNotes();
    renderNotes();

    // Remove the update note event listener
    saveNoteButton.removeEventListener('click', () => {
      updateNote(noteId, updatedText, updatedTags);
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
  try {
    const anthropic = new Anthropic({apiKey: userApiKey});
    
    showLoadingSpinner();
    
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
  } catch (error) {
    showErrorMessage('Error auto-tagging note: ' + error.message);
  } finally {
    hideLoadingSpinner();
  }

  const generatedTags = response.content[0].text.trim().split(',').map(tag => tag.trim());
  return generatedTags;
}

async function queryNotes(question) {
  if (userApiKey === '') {
    return 'Please enter your Anthropic API key.';
  }

  if (selectedNotes.length === 0) {
    showErrorMessage('Please select notes first.');
    return;
  }
  try {
    const anthropic = new Anthropic({apiKey: userApiKey});

    const relevantNotes = selectedNotes.filter(note =>
      note.text.toLowerCase().includes(question.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(question.toLowerCase()))
    );

    const relevantNotesText = relevantNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

    showLoadingSpinner();
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
  } catch (error) {
    showErrorMessage('Error querying notes: ' + error.message);
  } finally {
    hideLoadingSpinner();
  }
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

  if (selectedNotes.length === 0) {
    showErrorMessage('Please select notes first.');
    return;
  }
  try {
    const notesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');
    const summaryLength = document.getElementById('summary-length').value;

    showLoadingSpinner();
    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please provide a ${summaryLength} summary of the following notes:\n\n${notesText}\n\nSummary:`,
        },
      ],
    });
  } catch (error) {
    showErrorMessage('Error querying notes: ' + error.message);
  } finally {
    hideLoadingSpinner();
  }

  const summary = response.content[0].text.trim();
  const timestamp = new Date().toLocaleString();
  currentSummary = `${summary}\nGenerated at: ${timestamp}`;
  return { summary, timestamp };
}

async function surfaceInsights() {
  if (userApiKey === '') {
    return 'Please enter your Anthropic API key.';
  }

  if (selectedNotes.length === 0) {
    showErrorMessage('Please select notes first.');
    return;
  }
  try {
    const anthropic = new Anthropic({apiKey: userApiKey});
    
    const notesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');
    const insightsType = document.getElementById('insights-type').value;
    
    showLoadingSpinner();
    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please provide ${insightsType} based on the following notes:\n\n${notesText}\n\nInsights:`,
        },
      ],
    });  
  } catch (error) {
    showErrorMessage('Error querying notes: ' + error.message);
  } finally {
    hideLoadingSpinner();
  }

  const insights = response.content[0].text.trim();
  const timestamp = new Date().toLocaleString();
  currentInsights = `${insights}\nGenerated at: ${timestamp}`;
  return { insights, timestamp };
}

const summarizeNotesButton = document.getElementById('summarize-notes');
const surfaceInsightsButton = document.getElementById('surface-insights');
const insightsOutput = document.getElementById('insights-output');

summarizeNotesButton.addEventListener('click', async () => {
  const { summary, timestamp } = await summarizeNotes();
  insightsOutput.innerHTML = `
    <h4>Summary:</h4>
    <p>${summary}</p>
    <p>Generated at: ${timestamp}</p>
  `;
});

surfaceInsightsButton.addEventListener('click', async () => {
  const { insights, timestamp } = await surfaceInsights();
  insightsOutput.innerHTML = `
    <h4>Insights:</h4>
    <p>${insights}</p>
    <p>Generated at: ${timestamp}</p>
  `;
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
  if (confirm('Are you sure you want to select all notes?')) {
    selectedNotes = [...notes];
    renderNotes();
  }
});

clearSelectedNotesButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the selected notes?')) {
    selectedNotes = [];
    renderNotes();
  }
});

const modelSelect = document.getElementById('model-select');

modelSelect.addEventListener('change', () => {
  selectedModel = modelSelect.value;
});

const selectNotesSearch = document.getElementById('select-notes-search');

selectNotesSearch.addEventListener('input', () => {
  const searchTerm = selectNotesSearch.value.toLowerCase();
  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(searchTerm) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
  renderNoteSelection(filteredNotes);
});

function renderNoteSelection(notesToRender) {
  const selectedNotesContainer = document.getElementById('selected-notes');
  selectedNotesContainer.innerHTML = '';

  notesToRender.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.textContent = note.text;
    noteElement.addEventListener('click', () => {
      if (selectedNotes.find(selectedNote => selectedNote.id === note.id)) {
        selectedNotes = selectedNotes.filter(selectedNote => selectedNote.id !== note.id);
      } else {
        selectedNotes.push(note);
      }
      renderNoteSelection(notesToRender);
    });

    if (selectedNotes.find(selectedNote => selectedNote.id === note.id)) {
      noteElement.classList.add('selected-note');
    }

    selectedNotesContainer.appendChild(noteElement);
    
  });
  const selectedNotesCount = document.createElement('div');
  selectedNotesCount.textContent = `Selected: ${selectedNotes.length} / ${notesToRender.length}`;
  selectedNotesContainer.appendChild(selectedNotesCount);
}

function filterNotesByTags(notesToFilter, selectedTags) {
  if (selectedTags.length === 0) {
    return notesToFilter;
  }

  return notesToFilter.filter(note =>
    selectedTags.every(tag => note.tags.includes(tag))
  );
}

selectNotesFilter.addEventListener('change', () => {
  const selectedTags = Array.from(selectNotesFilter.selectedOptions).map(option => option.value);
  const searchTerm = selectNotesSearch.value.toLowerCase();
  const filteredNotes = notes.filter(note =>
    (searchTerm === '' || note.text.toLowerCase().includes(searchTerm) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm))) &&
    filterNotesByTags([note], selectedTags).length > 0
  );
  renderNoteSelection(filteredNotes);
});

function showLoadingSpinner() {
  const loadingSpinner = document.getElementById('loading-spinner');
  loadingSpinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
  const loadingSpinner = document.getElementById('loading-spinner');
  loadingSpinner.classList.add('hidden');
}

function showErrorMessage(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 3000);
}

// Implement save and export functionality
const saveSummaryButton = document.getElementById('save-summary');
const exportSummaryButton = document.getElementById('export-summary');
const saveInsightsButton = document.getElementById('save-insights');
const exportInsightsButton = document.getElementById('export-insights');

saveSummaryButton.addEventListener('click', () => {
  // Save summary to localStorage or backend
});

exportSummaryButton.addEventListener('click', () => {
  // Export summary as file
});

saveInsightsButton.addEventListener('click', () => {
  // Save insights to localStorage or backend
});

exportInsightsButton.addEventListener('click', () => {
  // Export insights as file
});

let currentSummary = '';
let currentInsights = '';

saveSummaryButton.addEventListener('click', () => {
  if (currentSummary) {
    localStorage.setItem('savedSummary', currentSummary);
    alert('Summary saved successfully!');
  } else {
    alert('No summary available to save.');
  }
});

exportSummaryButton.addEventListener('click', () => {
  if (currentSummary) {
    const blob = new Blob([currentSummary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'summary.txt';
    link.click();
    URL.revokeObjectURL(url);
  } else {
    alert('No summary available to export.');
  }
});

saveInsightsButton.addEventListener('click', () => {
  if (currentInsights) {
    localStorage.setItem('savedInsights', currentInsights);
    alert('Insights saved successfully!');
  } else {
    alert('No insights available to save.');
  }
});

exportInsightsButton.addEventListener('click', () => {
  if (currentInsights) {
    const blob = new Blob([currentInsights], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'insights.txt';
    link.click();
    URL.revokeObjectURL(url);
  } else {
    alert('No insights available to export.');
  }
});

function sortNotes(criteria) {
  switch (criteria) {
    case 'date-desc':
      notes.sort((a, b) => b.id - a.id);
      break;
    case 'date-asc':
      notes.sort((a, b) => a.id - b.id);
      break;
    case 'title-asc':
      notes.sort((a, b) => a.text.localeCompare(b.text));
      break;
    case 'title-desc':
      notes.sort((a, b) => b.text.localeCompare(a.text));
      break;
    default:
      break;
  }

  renderNotes();
}

const sortSelect = document.getElementById('sort-select');

sortSelect.addEventListener('change', () => {
  const selectedCriteria = sortSelect.value;
  sortNotes(selectedCriteria);
});

function enableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton) {
  noteTextElement.setAttribute('contenteditable', 'true');
  noteTagsElement.setAttribute('contenteditable', 'true');
  noteTextElement.focus();

  editNoteButton.textContent = 'Save';

  const eventHandlers = {
    clickOutsideHandler: (event) => {
      if (!noteElement.contains(event.target)) {
        disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers);
      }
    },
    keydownHandler: (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers);
      }
    }
  };

  noteElement.addEventListener('click', eventHandlers.clickOutsideHandler);
  noteElement.addEventListener('keydown', eventHandlers.keydownHandler);
}

function disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers) {
  noteTextElement.removeAttribute('contenteditable');
  noteTagsElement.removeAttribute('contenteditable');

  const updatedText = noteTextElement.textContent.trim();
  const updatedTags = noteTagsElement.textContent.trim().split(',').map(tag => tag.trim());
  updateNote(noteId, updatedText, updatedTags);
  saveNotes();

  editNoteButton.textContent = 'Edit';

  noteElement.removeEventListener('click', eventHandlers.clickOutsideHandler);
  noteElement.removeEventListener('keydown', eventHandlers.keydownHandler);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

const toggleDarkModeButton = document.getElementById('toggle-dark-mode');
toggleDarkModeButton.addEventListener('click', toggleDarkMode);

const toggleFlyoutButton = document.getElementById('toggle-flyout');

const flyoutPanel = document.getElementById('flyout-panel');
const toggleChatButton = document.getElementById('toggle-chat');
const chatWindow = document.getElementById('chat-window');

// Toggle chat window
toggleChatButton.addEventListener('click', () => {
  chatWindow.classList.toggle('open');
});

function toggleFlyoutPanel() {
  flyoutPanel.classList.toggle('open');
}

toggleFlyoutButton.addEventListener('click', toggleFlyoutPanel);
});

const toggleSortSearchButton = document.getElementById('toggle-sort-search');
const sortSearchContainer = document.getElementById('sort-search-container');
const sortingOptions = document.getElementById('sorting-options');
const searchContainer = document.getElementById('search-container');
const notesView = document.getElementById('notes-view');

sortSearchContainer.classList.toggle('hidden');
sortingOptions.classList.toggle('hidden')
searchContainer.classList.toggle('hidden')
searchInput.classList.toggle('hidden')
tagSelect.classList.toggle('hidden')
sortSearchContainer.style.maxHeight = '0';
sortSearchContainer.style.margin = '0';
sortSearchContainer.style.padding = '0';

toggleSortSearchButton.addEventListener('click', () => {
  sortSearchContainer.classList.toggle('hidden');
  sortingOptions.classList.toggle('hidden')
  searchContainer.classList.toggle('hidden')
  searchInput.classList.toggle('hidden')
  tagSelect.classList.toggle('hidden')

  if (sortSearchContainer.classList.contains('hidden')) {
    sortSearchContainer.style.maxHeight = '0';
    sortSearchContainer.style.margin = '0';
    sortSearchContainer.style.padding = '0';
  } else {
    sortSearchContainer.style.maxHeight = `${sortSearchContainer.scrollHeight}px`;
    sortSearchContainer.style.margin = '20px';
    sortSearchContainer.style.padding = '20px';
  }
});

function adjustNotesViewMargin(maxHeight) {
  console.log(maxHeight)
  notesView.style.marginTop = `${maxHeight + 20}px`;
}