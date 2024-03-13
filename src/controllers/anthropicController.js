const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.autoTagNote = async (req, res) => {
  const { noteText } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please generate relevant tags for the following note:\n\n${noteText}\n\nTags:`
        }
      ]
    });

    const generatedTags = response.content[0].text.trim().split(',').map(tag => tag.trim());
    res.json({ tags: generatedTags });
  } catch (error) {
    console.error('Error auto-tagging note:', error);
    res.status(500).json({ error: 'An error occurred while auto-tagging the note.' });
  }
};

exports.queryNotes = async (req, res) => {
  const { question, notes } = req.body;

  try {
    const relevantNotes = notes.filter(note =>
      note.text.toLowerCase().includes(question.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(question.toLowerCase()))
    );

    const relevantNotesText = relevantNotes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Here are some relevant notes:\n\n${relevantNotesText}\n\nQuestion: ${question}\n\nAnswer:`
        }
      ]
    });

    res.json({ answer: response.content[0].text.trim() });
  } catch (error) {
    console.error('Error querying notes:', error);
    res.status(500).json({ error: 'An error occurred while querying the notes.' });
  }
};

exports.summarizeNotes = async (req, res) => {
  const { notes, summaryLength } = req.body;

  try {
    const notesText = notes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please provide a ${summaryLength} summary of the following notes:\n\n${notesText}\n\nSummary:`,
        },
      ],
    });

    res.json({ summary: response.content[0].text.trim() });
  } catch (error) {
    console.error('Error summarizing notes:', error);
    res.status(500).json({ error: 'An error occurred while summarizing the notes.' });
  }
};

exports.surfaceInsights = async (req, res) => {
  const { notes, insightsType } = req.body;

  try {
    const notesText = notes.map(note => `Note: ${note.text}\nTags: ${note.tags.join(', ')}`).join('\n\n');

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please provide ${insightsType} based on the following notes:\n\n${notesText}\n\nInsights:`,
        },
      ],
    });

    res.json({ insights: response.content[0].text.trim() });
  } catch (error) {
    console.error('Error surfacing insights:', error);
    res.status(500).json({ error: 'An error occurred while surfacing insights.' });
  }
};