let isActive = false;
let currentLanguage = 'python';
let apiKey = '';

// Load from storage on start
chrome.storage.sync.get(['isActive', 'language', 'apiKey'], (result) => {
  isActive = result.isActive || false;
  currentLanguage = result.language || 'python';
  apiKey = result.apiKey || '';
});

// Listen for popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleExtension') {
    isActive = request.isActive;
    currentLanguage = request.language;
    apiKey = request.apiKey;

    // Broadcast to content scripts
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateStatus',
          isActive,
          language: currentLanguage,
        }).catch(() => {});
      }
    });
  }

  if (request.action === 'solveProblem') {
    solveProblem(request.problemText, request.language)
      .then((solution) => {
        sendResponse({ success: true, solution });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'getStatus') {
    sendResponse({ isActive, language: currentLanguage });
  }
});

async function solveProblem(problemText, language) {
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Provide ONLY the code solution for this ${language} problem. No explanations, no comments, just the functional code.

Problem:
${problemText}

Requirements:
- Only output the raw code
- No comments or explanations
- Include all necessary imports
- Make the solution efficient`;

  const body = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'You are a code generator that outputs ONLY raw code with no explanations or comments.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 3000,
    temperature: 0.1,
    n: 1,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      let solution = data.choices[0].message.content.trim();
      // Remove markdown code blocks if any
      solution = solution.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
      return solution;
    } else {
      throw new Error('No solution generated');
    }
  } catch (err) {
    throw new Error(`Failed to solve problem: ${err.message}`);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Code Solver extension installed');
});
