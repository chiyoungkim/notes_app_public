// src/utils/utils.js
const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.autoTagNote = async (noteText) => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Please generate relevant tags for the following note:\n\n${noteText}\n\nTags:`,
        },
      ],
    });

    const generatedTags = response.content[0].text
      .trim()
      .split(',')
      .map((tag) => tag.trim());

    return generatedTags;
  } catch (error) {
    console.error('Error auto-tagging note:', error);
    return [];
  }
};