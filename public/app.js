let notes = [];
let selectedNotes = [];
let selectedModel = 'claude-3-opus-20240229';
let taggingModel = 'claude-3-haiku-20240307';

const noteInput = document.getElementById('note-input');
const noteText = document.getElementById('note-text');
const noteTags = document.getElementById('note-tags');
const saveNoteButton = document.getElementById('save-note');
const searchInput = document.getElementById('search-input');
const tagSelect = document.getElementById('tag-select');
const notesContainer = document.getElementById('notes-container');
// const selectNotesFilter = document.getElementById('select-notes-filter');

const toggleBatchEditButton = document.getElementById('toggle-batch-edit');
const batchEditToolbox = document.getElementById('batch-edit-toolbox');
const deleteSelectedNotesButton = document.getElementById('delete-selected-notes');
const selectedNotesTagsInput = document.getElementById('selected-notes-tags');
const updateSelectedNotesTagsButton = document.getElementById('update-selected-notes-tags');


document.addEventListener('DOMContentLoaded', () => {
  fetchNotes(true);

  // Fetch notes from the server
  async function fetchNotes(playAnimation = false) {
    try {
      showLoadingSpinner();
      const sessionToken = sessionStorage.getItem('sessionToken');
      const response = await fetch('/api/notes', {
        method: 'GET',
        // headers: {
        //   'Authorization': sessionToken,        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          notes = data.notes;
          renderNotes(playAnimation);
          updateTagSelect();
        } else {
          console.error('Error fetching notes:', data.error);
        }
      } else {
        console.error('Error fetching notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      hideLoadingSpinner();
    }
  }

// renderNotes(true);

const apiKeyWarningPopup = document.createElement('div');
apiKeyWarningPopup.textContent = 'Please enter your Anthropic API key to enable AI functions.';
apiKeyWarningPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
apiKeyWarningPopup.style.color = 'white';
apiKeyWarningPopup.style.padding = '20px';
apiKeyWarningPopup.style.position = 'fixed';
apiKeyWarningPopup.style.top = '50%';
apiKeyWarningPopup.style.left = '50%';
apiKeyWarningPopup.style.transform = 'translate(-50%, -50%)';
apiKeyWarningPopup.style.zIndex = '9999';
apiKeyWarningPopup.style.display = 'none';

const closeWarningButton = document.createElement('button');
closeWarningButton.textContent = 'Close';
closeWarningButton.addEventListener('click', () => {
  apiKeyWarningPopup.style.display = 'none';
});
apiKeyWarningPopup.appendChild(closeWarningButton);

document.body.appendChild(apiKeyWarningPopup);

// Show the warning popup when the user tries to use an AI-related feature without an API key
function showApiKeyWarning() {
  apiKeyWarningPopup.style.display = 'block';
}

// Hide the warning popup when a valid API key is entered or the page is refreshed
function hideApiKeyWarning() {
  apiKeyWarningPopup.style.display = 'none';
}

const apiKeyContainer = document.getElementById('api-key-container');
const setApiKeyButton = document.getElementById('set-api-key');

const apiKeyInput = document.createElement('input');
apiKeyInput.type = 'password';
apiKeyInput.placeholder = 'Enter Anthropic API key';
apiKeyInput.style.display = 'none';
apiKeyInput.style.margin = '0px 10px';
apiKeyContainer.appendChild(apiKeyInput);

const saveApiKeyButton = document.createElement('button');
saveApiKeyButton.textContent = 'Save API Key';
saveApiKeyButton.style.display = 'none';
saveApiKeyButton.addEventListener('click', saveApiKey);
apiKeyContainer.appendChild(saveApiKeyButton);

const updateApiKeyInput = document.createElement('input');
updateApiKeyInput.type = 'password';
updateApiKeyInput.placeholder = 'Enter updated Anthropic API key';
updateApiKeyInput.style.display = 'none';
apiKeyContainer.appendChild(updateApiKeyInput);

const updateApiKeyButton = document.createElement('button');
updateApiKeyButton.textContent = 'Update API Key';
updateApiKeyButton.style.display = 'none';
updateApiKeyButton.addEventListener('click', updateApiKey);
apiKeyContainer.appendChild(updateApiKeyButton);

setApiKeyButton.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/checkApiKey');
    if (response.ok) {
      const { hasApiKey } = await response.json();
      if (hasApiKey) {
        if (updateApiKeyInput.style.display == 'block') {
          updateApiKeyInput.style.display = 'none';
          updateApiKeyButton.style.display = 'none';
        } else {
          updateApiKeyInput.style.display = 'block';
          updateApiKeyButton.style.display = 'block';
        }
      } else {
        if (apiKeyInput.style.display == 'block') {
          apiKeyInput.style.display = 'none';
          saveApiKeyButton.style.display = 'none';
        } else {
          apiKeyInput.style.display = 'block';
          saveApiKeyButton.style.display = 'block';
        }
      }
      if (setApiKeyButton.textContent == 'Update API Key') {
        setApiKeyButton.textContent = 'Return';
      } else {
        setApiKeyButton.textContent = 'Update API Key';
      }
      hideApiKeyWarning();
    } else {
      showApiKeyWarning();
      console.error('Error checking API key');
    }
  } catch (error) {
    console.error('Error checking API key:', error);
  }
});

async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    try {
      const response = await fetch('/api/saveApiKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        apiKeyInput.style.display = 'none';
        saveApiKeyButton.style.display = 'none';
        setApiKeyButton.textContent = 'Update API Key';
        hideApiKeyWarning();
      } else {
        showApiKeyWarning();
        console.error('Error saving API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }
}

// Check if a valid API key exists on page load and hide the warning popup if necessary
async function checkApiKeyOnLoad() {
  try {
    const response = await fetch('/api/checkApiKey');
    if (response.ok) {
      const { hasApiKey } = await response.json();
      if (hasApiKey) {
        setApiKeyButton.textContent = 'Update API Key';
        hideApiKeyWarning();
      } else {
        showApiKeyWarning();
      }
    }
  } catch (error) {
    console.error('Error checking API key on load:', error);
  }
}

window.addEventListener('load', checkApiKeyOnLoad);

const apiKeyErrorWarning = document.createElement('div');
apiKeyErrorWarning.textContent = 'Error: Invalid Anthropic API key. Please enter a valid API key.';
apiKeyErrorWarning.style.color = 'red';
apiKeyErrorWarning.style.display = 'none';
document.body.appendChild(apiKeyErrorWarning);

async function updateApiKey() {
  const apiKey = updateApiKeyInput.value.trim();
  if (apiKey) {
    try {
      const response = await fetch('/api/updateApiKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        updateApiKeyInput.style.display = 'none';
        updateApiKeyButton.style.display = 'none';
      } else {
        console.error('Error updating API key');
      }
    } catch (error) {
      console.error('Error updating API key:', error);
    }
  }
}

// Show/hide note input on hotkey press (e.g., Ctrl+Shift+N)
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'n':
        event.preventDefault();
        if (document.activeElement === noteText) {
          saveNote();
        } else {
          addNoteToolbox.classList.toggle('open');
          adjustNotesViewHeight();
          noteText.focus(); // Add this line to focus on the text input
        }
        break;
      case 'f':
        event.preventDefault();
        searchSortToolbox.classList.toggle('open');
        adjustNotesViewHeight();
        break;
      case 's':
        event.preventDefault();
        selectNotesToolbox.classList.toggle('open');
        adjustNotesViewHeight();
        break;
      case 'b':
        event.preventDefault();
        batchEditToolbox.classList.toggle('open');
        adjustNotesViewHeight();
        break;
      // ... other hotkey cases ...
    }
  }
});

// Save note on button click
saveNoteButton.addEventListener('click', saveNote);

// Filter notes based on search input and selected tags
function filterNotes() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedTags = Array.from(tagSelect.selectedOptions).map(option => option.value);

  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(searchTerm) &&
    (selectedTags.length === 0 || selectedTags.every(tag => note.tags.includes(tag)))
  );

  return filteredNotes;
}

// Render notes in the UI
function renderNotes(playAnimation = false) {
  const filteredNotes = filterNotes();
  const prioritizeSelectedNotes = document.getElementById('prioritize-selected-notes').checked;
  const selectedNotesArray = filteredNotes.filter(note => selectedNotes.includes(note));
  const deselectedNotesArray = filteredNotes.filter(note => !selectedNotes.includes(note));
  const sortedNotes = prioritizeSelectedNotes ? [...selectedNotesArray, ...deselectedNotesArray] : filteredNotes;

  notesContainer.innerHTML = '';

    sortedNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');

    noteElement.style.opacity = 0;
    noteElement.style.transform = 'translateY(20px)';

    noteElement.addEventListener('click', (event) => {
      if (!noteElement.classList.contains('editing')) {
        event.stopPropagation();
        const wasSelected = selectedNotes.find(selectedNote => selectedNote.id === note.id);
        if (wasSelected) {
          selectedNotes = selectedNotes.filter(selectedNote => selectedNote.id !== note.id);
          noteElement.classList.remove('selected');
        } else {
          selectedNotes.push(note);
          noteElement.classList.add('selected');
        }

        if (prioritizeSelectedNotes) {
          const noteIndex = Array.from(notesContainer.children).indexOf(noteElement);
          notesContainer.removeChild(noteElement);
          if (wasSelected) {
            const lastSelectedNoteIndex = Array.from(notesContainer.children).findIndex(
              child => !selectedNotes.includes(child.note)
            );
            notesContainer.insertBefore(noteElement, notesContainer.children[lastSelectedNoteIndex]);
          } else {
            notesContainer.insertBefore(noteElement, notesContainer.firstChild);
          }
        }

        renderNotes();
      }
    });

    if (selectedNotes.find(selectedNote => selectedNote.id === note.id)) {
      noteElement.classList.add('selected');
    } else {
      noteElement.classList.remove('selected');
    }

    const noteTextElement = document.createElement('div');
    noteTextElement.classList.add('note-text');
    noteTextElement.innerHTML = highlightText(note.text, searchInput.value);
    noteTextElement.textContent = note.text;
    noteElement.appendChild(noteTextElement);

    const noteTagsElement = document.createElement('div');
    noteTagsElement.classList.add('note-tags');
    noteTagsElement.textContent = note.tags.join(', ');
    noteTagsElement.innerHTML = highlightTags(note.tags, searchInput.value); // highlightTags
    noteElement.appendChild(noteTagsElement);

    const noteActionsElement = document.createElement('div');
    noteActionsElement.classList.add('note-actions');

    const editNoteButton = document.createElement('button');
    editNoteButton.textContent = 'Edit';
    editNoteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      enableNoteEdit(note.id, noteElement, noteTextElement, noteTagsElement, editNoteButton);
    });
    noteActionsElement.appendChild(editNoteButton);

    const deleteNoteButton = document.createElement('button');
    deleteNoteButton.textContent = 'Delete';
    deleteNoteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteNote(note.id);
    });
    noteActionsElement.appendChild(deleteNoteButton);
    
    noteElement.appendChild(noteActionsElement);

    notesContainer.appendChild(noteElement);
    if (playAnimation) {
      setTimeout(() => {
        noteElement.classList.add('show');
      }, 100);
    } else {
      noteElement.classList.add('show');
    }
  });

  updateSummarizationInsightsButtons();
  // renderSelectedNotes();
  updateSelectedNotesCount();
}

// Highlight search term in text
function highlightText(text, searchTerm) {
  const regex = new RegExp(searchTerm, 'gi');
  return text.replace(regex, '<span class="highlight">$&</span>');
}

const prioritizeSelectedNotesCheckbox = document.getElementById('prioritize-selected-notes');

prioritizeSelectedNotesCheckbox.addEventListener('change', () => {
  renderNotes();
});

// Highlight search term in tags
function highlightTags(tags, searchTerm) {
  return tags.map(tag => {
    const regex = new RegExp(searchTerm, 'gi');
    return tag.replace(regex, '<span class="highlight">$&</span>');
  }).join(', ');
}

  // Update the updateTagSelect() function
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
// Save note function
async function saveNote() {
  const noteId = noteInput.getAttribute('data-note-id');
  const text = noteText.value.trim();
  let tags = noteTags.value.trim().split(',').map(tag => tag.trim());

  const noteElement = document.querySelector(`.note[data-note-id="${noteId}"]`);
  const isSelected = noteElement.classList.contains('selected');

  if (isAutoTaggingEnabled) {
    const generatedTags = await autoTagNote(text);
    if (tags.length > 1){
      tags = [...tags, ...generatedTags];  
    }
    else {
      tags = [...generatedTags];  
    }
  }

  if (isSelected) {
    noteElement.classList.add('selected');
    if (!selectedNotes.includes(note)) {
      selectedNotes.push(note);
    }
  } else {
    noteElement.classList.remove('selected');
    selectedNotes = selectedNotes.filter(selectedNote => selectedNote.id !== note.id);
  }

  if (text !== '') {
    if (noteId) {
      // Update existing note
      updateNote(noteId, text, tags);
    } else {
      // Add new note
      createNote(text, tags);
    }
    noteText.value = '';
    noteTags.value = '';
    updateTagSelect();
    renderNotes();
  }
}

// Create note function
async function createNote(text, tags) {
  try {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': sessionToken,
      },
      body: JSON.stringify({
        text,
        tags,
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('Note created successfully');
        fetchNotes();
        updateTagSelect();
      } else {
        console.error('Error creating note:', data.error);
      }
    } else {
      console.error('Error creating note');
    }
  } catch (error) {
    console.error('Error creating note:', error);
  }
}

// Update note function
async function updateNote(noteId, text, tags) {
  try {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': sessionToken,
      },
      body: JSON.stringify({
        text,
        tags,
        lastEdited: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('Note updated successfully');
        fetchNotes();
        updateTagSelect();
      } else {
        console.error('Error updating note:', data.error);
      }
    } else {
      console.error('Error updating note');
    }
  } catch (error) {
    console.error('Error updating note:', error);
  }
}

// Delete note function
async function deleteNote(noteId) {
  if (confirm('Are you sure you want to delete this note?')) {
    try {
      const sessionToken = sessionStorage.getItem('sessionToken');
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          // 'Authorization': sessionToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Note deleted successfully');
          fetchNotes();
          updateTagSelect();
        } else {
          console.error('Error deleting note:', data.error);
        }
      } else {
        console.error('Error deleting note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }
}
// Event listeners
searchInput.addEventListener('input', renderNotes);

const autoTagSetting = document.getElementById('auto-tag-setting');
let isAutoTaggingEnabled = false;

autoTagSetting.addEventListener('change', () => {
  isAutoTaggingEnabled = autoTagSetting.checked;
});

async function callAnthropicAPI(model, messages, max_tokens) {
  try {
    const requestPayload = {
      model,
      messages,
      max_tokens,
    };

    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (response.status === 401) {
      apiKeyErrorWarning.style.display = 'block';
      updateApiKeyInput.style.display = 'block';
      updateApiKeyButton.style.display = 'block';
      throw new Error('Invalid Anthropic API key');
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}

async function autoTagNote(noteText) {
  if (!isAutoTaggingEnabled) {
    return [];
  }

  try {
    showLoadingSpinner();

    const messages = [
      {
        role: 'user',
        content: `Please generate relevant tags for the following note. Provide only a comma-separated list of tags without any additional text or formatting.

        Note:
        ${noteText}
        
        Tags:`,
      },
    ];

    const response = await callAnthropicAPI(taggingModel, messages, 1024);
    const generatedTags = response.content[0].text.trim().split(',').map(tag => tag.trim());
    return generatedTags;
  } catch (error) {
    showErrorMessage('Error auto-tagging note: ' + error.message);
    return [];
  } finally {
    hideLoadingSpinner();
  }
}

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-question');
const resetButton = document.getElementById('reset-chat');

let chatHistory = [];

function displayChatMessage(role, content) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', `${role}-message`);
  messageElement.textContent = content;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const userInput = chatInput.value.trim();
  if (userInput === '') return;
  chatInput.value = '';
  displayChatMessage('user', userInput);

  try {
    showLoadingSpinner();

    const relevantNotesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

    const messages = [
      {
        role: 'user',
        content: `${selectedNotes.length > 0 ? `Based on the following notes:\n\n${relevantNotesText}\n\n` : ''}Question: ${userInput}\n\nAnswer:`,
      },
    ];

    const assistantResponse = await getAssistantResponse(messages);
    displayChatMessage('assistant', assistantResponse);
    chatHistory.push({ user: userInput, assistant: assistantResponse });
  } catch (error) {
    showErrorMessage('Error sending message: ' + error.message);
  } finally {
    hideLoadingSpinner();
  }
}

async function getAssistantResponse(messages) {
  const response = await callAnthropicAPI(selectedModel, messages, 1024);
  return response.content[0].text.trim();
}

function resetChat() {
  chatMessages.innerHTML = '';
  chatHistory = [];
  chatInput.value = '';
}

chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener('click', sendMessage);
resetButton.addEventListener('click', resetChat);

async function summarizeNotes() {
  if (selectedNotes.length === 0) {
    showErrorMessage('Please select notes first.');
    return;
  }

  try {
    showLoadingSpinner();

    const notesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');
    const summaryLength = document.getElementById('summary-length').value;

    const messages = [
      {
        role: 'user',
        content: `Please provide a ${summaryLength} summary of the following notes. Include only the summary without any additional text or formatting.

        Notes:
        ${notesText}
        
        Summary:`,
      },
    ];

    const response = await callAnthropicAPI(selectedModel, messages, 1024);
    const summary = response.content[0].text.trim();
    const timestamp = new Date().toLocaleString();
    const result = `${summary}\nGenerated at: ${timestamp}`;
    return { summary: result, timestamp };
  } catch (error) {
    showErrorMessage('Error summarizing notes: ' + error.message);
    return { summary: '', timestamp: '' };
  } finally {
    hideLoadingSpinner();
  }
}

async function surfaceInsights() {
  if (selectedNotes.length === 0) {
    showErrorMessage('Please select notes first.');
    return;
  }

  try {
    showLoadingSpinner();

    const notesText = selectedNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');
    const insightsType = document.getElementById('insights-type').value;

    const messages = [
      {
        role: 'user',
        content: `Please provide ${insightsType} based on the following notes. Include only the insights without any additional text or formatting.

        Notes:
        ${notesText}
        
        Insights:`,
      },
    ];

    const response = await callAnthropicAPI(selectedModel, messages, 1024);
    const insights = response.content[0].text.trim();
    const timestamp = new Date().toLocaleString();
    const result = `${insights}\nGenerated at: ${timestamp}`;
    return { insights: result, timestamp };
  } catch (error) {
    showErrorMessage('Error surfacing insights: ' + error.message);
    return { insights: '', timestamp: '' };
  } finally {
    hideLoadingSpinner();
  }
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

selectAllNotesButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to select all notes?')) {
    selectedNotes = [...notes];
    renderNotes();
  }
});

const modelSelect = document.getElementById('model-select');

modelSelect.addEventListener('change', () => {
  selectedModel = modelSelect.value;
});

// const selectNotesSearch = document.getElementById('select-notes-search');

// selectNotesSearch.addEventListener('input', () => {
//   const searchTerm = selectNotesSearch.value.toLowerCase();
//   const filteredNotes = notes.filter(note =>
//     note.text.toLowerCase().includes(searchTerm) ||
//     note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
//   );
//   renderNoteSelection(filteredNotes);
// });

// function renderNoteSelection(notesToRender = notes) {
//   const selectedNotesContainer = document.getElementById('selected-notes');
//   selectedNotesContainer.innerHTML = '';

//   notesToRender.forEach(note => {
//     const noteElement = document.createElement('div');
//     noteElement.textContent = note.text;
//     noteElement.addEventListener('click', () => {
//       if (selectedNotes.find(selectedNote => selectedNote.id === note.id)) {
//         selectedNotes = selectedNotes.filter(selectedNote => selectedNote.id !== note.id);
//       } else {
//         selectedNotes.push(note);
//       }
//       renderNoteSelection(notesToRender);
//     });

//     if (selectedNotes.find(selectedNote => selectedNote.id === note.id)) {
//       noteElement.classList.add('selected-note');
//     } else {
//       noteElement.classList.remove('selected-note');
//     }
//     updateSummarizationInsightsButtons();
//     selectedNotesContainer.appendChild(noteElement);
//   });

//   const selectedNotesCount = document.createElement('div');
//   selectedNotesCount.textContent = `Selected: ${selectedNotes.length} / ${notesToRender.length}`;
//   selectedNotesContainer.appendChild(selectedNotesCount);
// }

const deselectAllTagsButton = document.getElementById('deselect-all-tags');

deselectAllTagsButton.addEventListener('click', () => {
  tagSelect.selectedIndex = -1;
  renderNotes();
});


function filterNotesByTags(notesToFilter, selectedTags) {
  if (selectedTags.length === 0) {
    return notesToFilter;
  }

  return notesToFilter.filter(note =>
    selectedTags.every(tag => note.tags.includes(tag))
  );
}

// selectNotesFilter.addEventListener('change', () => {
//   const selectedTags = Array.from(selectNotesFilter.selectedOptions).map(option => option.value);
//   const searchTerm = selectNotesSearch.value.toLowerCase();
//   const filteredNotes = notes.filter(note =>
//     (searchTerm === '' || note.text.toLowerCase().includes(searchTerm) ||
//       note.tags.some(tag => tag.toLowerCase().includes(searchTerm))) &&
//     (selectedTags.length === 0 || selectedTags.every(tag => note.tags.includes(tag)))
//   );
//   renderNoteSelection(filteredNotes);
// });

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
      notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'date-asc':
      notes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'title-asc':
      notes.sort((a, b) => a.text.localeCompare(b.text));
      break;
    case 'title-desc':
      notes.sort((a, b) => b.text.localeCompare(a.text));
      break;
    case 'last-edited':
      notes.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
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
  renderNotes();
});

function enableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton) {
  noteTextElement.setAttribute('contenteditable', 'true');
  noteTagsElement.setAttribute('contenteditable', 'true');
  noteTextElement.focus();

  editNoteButton.textContent = 'Save';

  const eventHandlers = {
    clickOutsideHandler: (event) => {
      if (!noteElement.contains(event.target) && event.target !== editNoteButton) {
        disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers);
        renderNotes();
      }
    },
    keydownHandler: (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers);
      }
    },
    saveButtonHandler: () => {
      disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers);
    }
  };

  noteElement.classList.add('editing');
  noteElement.classList.remove('selected');

  document.addEventListener('click', eventHandlers.clickOutsideHandler);
  noteElement.addEventListener('keydown', eventHandlers.keydownHandler);
  editNoteButton.addEventListener('click', eventHandlers.saveButtonHandler);
}

// Update the disableNoteEdit() function
function disableNoteEdit(noteId, noteElement, noteTextElement, noteTagsElement, editNoteButton, eventHandlers) {
  noteTextElement.removeAttribute('contenteditable');
  noteTagsElement.removeAttribute('contenteditable');

  const updatedText = noteTextElement.textContent.trim();
  const updatedTags = noteTagsElement.textContent.trim().split(',').map(tag => tag.trim());
  updateNote(noteId, updatedText, updatedTags);

  editNoteButton.textContent = 'Edit';

  noteElement.classList.remove('editing');

  document.removeEventListener('click', eventHandlers.clickOutsideHandler);
  noteElement.removeEventListener('keydown', eventHandlers.keydownHandler);
  editNoteButton.removeEventListener('click', eventHandlers.saveButtonHandler);
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

toggleChatButton.addEventListener('click', () => {
  chatWindow.classList.toggle('open');
  if (chatWindow.classList.contains('open')) {
    const infoText = document.createElement('div');
    infoText.classList.add('info-text');
    infoText.textContent = 'Select notes in the Flyout to query those notes with the LLM.';
    chatMessages.prepend(infoText);
  } else {
    const infoText = chatMessages.querySelector('.info-text');
    if (infoText) {
      infoText.remove();
    }
  }
});

function toggleFlyoutPanel() {
  flyoutPanel.classList.toggle('open');
  adjustAppPositions();
}

function adjustAppPositions() {
  const chatWidget = document.getElementById('chat-widget');
  const chatToggle = document.getElementById('toggle-chat');
  const toolbar = document.querySelectorAll('footer')[0];
  const notesView = document.getElementById('notes-view');
  const toolboxes = document.querySelectorAll('.toolbox');

  if (flyoutPanel.classList.contains('open')) {
    chatWidget.style.right = 'calc(30vw + 60px)';
    chatToggle.style.transform = 'TranslateX(calc(-30vw - 40px))';
    toolboxes.forEach(toolbox => {
      toolbox.style.width = 'calc(70vw - 81px)';
      toolbox.style.borderRight = '1px solid var(--secondary-color)';
    });
    notesView.style.width = `calc(70vw - 80px)`;
    toolbar.style.width = `calc(70vw - 80px)`;
  } else {
    chatWidget.style.right = '20px';
    chatToggle.style.transform = 'TranslateX(0)';
    toolboxes.forEach(toolbox => {
      toolbox.style.width = '';
      toolbox.style.borderRight = '';
    });
    notesView.style.width = ``;
    toolbar.style.width = ``;
  }
}

toggleFlyoutButton.addEventListener('click', toggleFlyoutPanel);

// const toggleSortSearchButton = document.getElementById('toggle-sort-search');
// const sortSearchContainer = document.getElementById('sort-search-container');
// const sortingOptions = document.getElementById('sorting-options');
// const searchContainer = document.getElementById('search-container');

// sortSearchContainer.classList.toggle('hidden');
// sortingOptions.classList.toggle('hidden')
// searchContainer.classList.toggle('hidden')
// searchInput.classList.toggle('hidden')
// tagSelect.classList.toggle('hidden')
// sortSearchContainer.style.maxHeight = '0';
// sortSearchContainer.style.margin = '0';
// sortSearchContainer.style.padding = '0';

// toggleSortSearchButton.addEventListener('click', () => {
//   sortSearchContainer.classList.toggle('hidden');
//   sortingOptions.classList.toggle('hidden')
//   searchContainer.classList.toggle('hidden')
//   searchInput.classList.toggle('hidden')
//   tagSelect.classList.toggle('hidden')

//   if (sortSearchContainer.classList.contains('hidden')) {
//     sortSearchContainer.style.maxHeight = '0';
//     sortSearchContainer.style.margin = '0';
//     sortSearchContainer.style.padding = '0';
//   } else {
//     sortSearchContainer.style.maxHeight = `${sortSearchContainer.scrollHeight}px`;
//     sortSearchContainer.style.margin = '20px';
//     sortSearchContainer.style.padding = '20px';
//   }
// });

async function createUser(userId, email, name) {
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: userId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('User created successfully');
        // Store the session token in local storage or cookies
        // sessionStorage.setItem('sessionToken', data.sessionToken);
        // Redirect to the main app page
        window.location.href = '/index.html';
      } else {
        console.error('Error creating user:', data.error);
      }
    } else {
      console.error('Error creating user');
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

async function loginUser(userId) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: userId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('User logged in successfully');
        // Store the session token in local storage or cookies
        // sessionStorage.setItem('sessionToken', data.sessionToken);
        // Redirect to the main app page
        window.location.href = '/index.html';
      } else {
        console.error('Error logging in:', data.error);
      }
    } else {
      console.error('Error logging in');
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

async function logoutUser() {
  try {
    const sessionToken = sessionStorage.getItem('sessionToken');
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Authorization': sessionToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('User logged out successfully');
        // Clear the session token from local storage or cookies
        sessionStorage.removeItem('sessionToken');
        // Redirect to the landing page or login page
        window.location.href = '/landing.html';
      } else {
        console.error('Error logging out:', data.error);
      }
    } else {
      console.error('Error logging out');
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// const logoutButton = document.getElementById('logout-button');

// logoutButton.addEventListener('click', () => {
//   logoutUser();
// });

function updateSummarizationInsightsButtons() {
  const summarizeNotesButton = document.getElementById('summarize-notes');
  const surfaceInsightsButton = document.getElementById('surface-insights');

  if (selectedNotes.length > 0) {
    summarizeNotesButton.disabled = false;
    surfaceInsightsButton.disabled = false;
  } else {
    summarizeNotesButton.disabled = true;
    surfaceInsightsButton.disabled = true;
  }
}

const toolboxTabs = document.querySelectorAll('.toolbox-tab');
const toolboxTabContents = document.querySelectorAll('.toolbox-tab-content');

toolboxTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.getAttribute('data-tab');
    toolboxTabs.forEach(tab => tab.classList.remove('active'));
    toolboxTabContents.forEach(content => content.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(tabId + '-tab').classList.remove('hidden');
  });
});

// toggleSortSearchButton.addEventListener('click', () => {
//   sortSearchContainer.classList.toggle('hidden');
//   sortingOptions.classList.toggle('hidden')
//   searchContainer.classList.toggle('hidden')
//   searchInput.classList.toggle('hidden')
//   tagSelect.classList.toggle('hidden')

// const toggleToolboxButton = document.getElementById('toggle-toolbox');
const toolbox = document.getElementById('toolbox');

// toggleToolboxButton.addEventListener('click', () => {
//   toolbox.classList.toggle('open');
//   toggleToolboxButton.classList.toggle('open');
//   app.style.height = toolbox.classList.contains('open') ? 'calc(100vh - 20vh)' : 'calc(100vh)';
// });

const deselectAllNotesButton = document.getElementById('deselect-all-notes');

deselectAllNotesButton.addEventListener('click', () => {
  selectedNotes = [];
  renderNotes();
});

// const selectAllTagsButton = document.getElementById('select-all-tags');

// selectAllTagsButton.addEventListener('click', () => {
//   const allTags = [...new Set(notes.flatMap(note => note.tags))];
//   allTags.forEach(tag => {
//     const option = document.createElement('option');
//     option.value = tag;
//     option.textContent = tag;
//     option.selected = true;
//     tagSelect.appendChild(option);
//   });
//   renderNotes();
// });

tagSelect.addEventListener('change', () => {
  const selectedOptions = Array.from(tagSelect.selectedOptions);
  if (selectedOptions.length === 1) {
    const selectedTag = selectedOptions[0].value;
    if (tagSelect.value !== selectedTag) {
      tagSelect.selectedIndex = -1;
    }
  }
  renderNotes();
});

function updateSelectedNotesCount() {
  if (selectedNotes.length > 1) {
    toggleBatchEditButton.classList.remove('hidden');
  } else {
    toggleBatchEditButton.classList.add('hidden');
    batchEditToolbox.classList.remove('open');
    toggleBatchEditButton.classList.remove('open');
  }
}

deleteSelectedNotesButton.addEventListener('click', () => {
  if (selectedNotes.length > 0) {
    if (confirm('Are you sure you want to delete the selected notes?')) {
      selectedNotes.forEach(note => deleteNote(note.id));
      selectedNotes = [];
      renderNotes();
    }
  }
});

updateSelectedNotesTagsButton.addEventListener('click', () => {
  if (selectedNotes.length > 0) {
    const newTags = selectedNotesTagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    selectedNotes.forEach(note => {
      if (note.tags == '') {
        updateNoteTags(note.id, newTags);
      } else {
        updateNoteTags(note.id, note.tags.concat(newTags));
      }
    });
    selectedNotesTagsInput.value = '';
    renderNotes();
  }
});

function updateNoteTags(noteId, tags) {
  const note = notes.find(note => note.id === noteId);
  if (note) {
    const uniqueTags = [...new Set(tags)];
    note.tags = uniqueTags;
    updateNote(noteId, note.text, uniqueTags);
  }
}

const addNoteToolbox = document.getElementById('add-note-toolbox');
const searchSortToolbox = document.getElementById('search-sort-toolbox');
const selectNotesToolbox = document.getElementById('select-notes-toolbox');
const batchEditToolbox = document.getElementById('batch-edit-toolbox');

function adjustNotesViewHeight() {
  const notesView = document.getElementById('notes-view');
  const toolboxes = document.querySelectorAll('.toolbox');
  let toolboxHeight = 0;

  toolboxes.forEach(toolbox => {
    if (toolbox.classList.contains('open')) {
      toolboxHeight += toolbox.offsetHeight;
    }
  });

  notesView.style.height = `calc(100vh - ${140 + toolboxHeight}px)`;
}

function closeAllToolboxes() {
  const toolboxes = document.querySelectorAll('.toolbox');
  toolboxes.forEach(toolbox => {
    toolbox.classList.remove('open');
    toolbox.style.display = '';
  });
}

document.getElementById('toggle-add-note').addEventListener('click', () => {
  if (addNoteToolbox.classList.contains('open')) {
    addNoteToolbox.classList.remove('open');
    addNoteToolbox.style.display = '';
  } else {
    closeAllToolboxes();
    addNoteToolbox.classList.add('open');
    addNoteToolbox.style.display = 'flex';
    noteText.focus(); // Add this line to focus on the text input
  }
  adjustNotesViewHeight();
});

document.getElementById('toggle-search-sort').addEventListener('click', () => {
  if (searchSortToolbox.classList.contains('open')) {
    searchSortToolbox.classList.remove('open');
  } else {
    closeAllToolboxes();
    searchSortToolbox.classList.toggle('open');
  }
  adjustNotesViewHeight();
});

document.getElementById('toggle-select-notes').addEventListener('click', () => {
  if (selectNotesToolbox.classList.contains('open')) {
    selectNotesToolbox.classList.remove('open');
  } else {
    closeAllToolboxes();
    selectNotesToolbox.classList.toggle('open');
  }
  adjustNotesViewHeight();
});

document.getElementById('toggle-batch-edit').addEventListener('click', () => {
  if (batchEditToolbox.classList.contains('open')) {
    batchEditToolbox.classList.remove('open');
  } else {
    closeAllToolboxes();
    batchEditToolbox.classList.toggle('open');
  }
  adjustNotesViewHeight();
});

noteText.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    saveNote();
  }
});

});
