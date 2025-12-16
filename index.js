// Gemini TTS Plus Extension for SillyTavern
// Enhanced Gemini TTS with voice styling support for Gemini 2.5 Pro

(function() {
    const extensionName = "gemini-tts-plus";
    
    const defaultSettings = {
        enabled: false,
        apiKey: "",
        language: "en-US",
        includeNarration: true,
        passAsterisks: false,
        onlyQuotes: false,
        skipCodeblocks: true,
        skipTaggedBlocks: true,
        ignoreAsterisks: false,
        characterVoices: {},
        characterInstructions: {},
        characterPersonality: {},
        characterVocalTraits: {}
    };
    
    let settings = Object.assign({}, defaultSettings);
    
    // Available Gemini 2.5 Pro voices
    const GEMINI_VOICES = [
        { name: "Kore", description: "Firm" },
        { name: "Orus", description: "Firm" },
        { name: "Autonoe", description: "Bright" },
        { name: "Umbriel", description: "Easy-going" },
        { name: "Erinome", description: "Clear" },
        { name: "Laomedeia", description: "Upbeat" },
        { name: "Schedar", description: "Even" },
        { name: "Achird", description: "Friendly" },
        { name: "Sadachbia", description: "Lively" },
        { name: "Fenrir", description: "Excitable" },
        { name: "Aoede", description: "Breezy" },
        { name: "Enceladus", description: "Breathy" },
        { name: "Algieba", description: "Smooth" },
        { name: "Algenib", description: "Gravelly" },
        { name: "Achernar", description: "Soft" },
        { name: "Gacrux", description: "Mature" },
        { name: "Zubenelgenubi", description: "Casual" },
        { name: "Sadaltager", description: "Knowledgeable" },
        { name: "Leda", description: "Youthful" },
        { name: "Callirrhoe", description: "Easy-going" },
        { name: "Iapetus", description: "Clear" },
        { name: "Despina", description: "Smooth" },
        { name: "Rasalgethi", description: "Informative" },
        { name: "Alnilam", description: "Firm" },
        { name: "Pulcherrima", description: "Forward" },
        { name: "Vindemiatrix", description: "Gentle" },
        { name: "Sulafat", description: "Warm" }
    ];
    
    // Available languages
    const LANGUAGES = [
        { code: "en-US", name: "English (US)" },
        { code: "en-GB", name: "English (UK)" },
        { code: "es-ES", name: "Spanish (Spain)" },
        { code: "es-US", name: "Spanish (US)" },
        { code: "fr-FR", name: "French" },
        { code: "de-DE", name: "German" },
        { code: "it-IT", name: "Italian" },
        { code: "ja-JP", name: "Japanese" },
        { code: "ko-KR", name: "Korean" },
        { code: "pt-BR", name: "Portuguese (Brazil)" },
        { code: "zh-CN", name: "Chinese (Simplified)" },
        { code: "hi-IN", name: "Hindi" },
        { code: "ru-RU", name: "Russian" }
    ];
    
    // Load settings
    function loadSettings() {
        if (window.extension_settings && window.extension_settings[extensionName]) {
            settings = Object.assign({}, defaultSettings, window.extension_settings[extensionName]);
        }
        if (window.extension_settings) {
            window.extension_settings[extensionName] = settings;
        }
    }
    
    // Save settings with debounce
    let saveTimeout;
    function saveSettings() {
        if (window.extension_settings) {
            window.extension_settings[extensionName] = settings;
        }
        
        // Debounced save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (window.saveSettingsDebounced) {
                window.saveSettingsDebounced();
            }
            console.log("[Gemini TTS Plus] Settings auto-saved");
        }, 1000);
    }
    
    // Text processing functions
    function processText(text) {
        if (!text) return "";
        
        let processed = text;
        
        // Skip codeblocks
        if (settings.skipCodeblocks) {
            processed = processed.replace(/```[\s\S]*?```/g, "");
            processed = processed.replace(/`[^`]+`/g, "");
        }
        
        // Skip tagged blocks
        if (settings.skipTaggedBlocks) {
            processed = processed.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, "");
        }
        
        // Ignore text inside asterisks
        if (settings.ignoreAsterisks) {
            processed = processed.replace(/\*[^*]+\*/g, "");
        }
        
        // Only narrate quotes
        if (settings.onlyQuotes) {
            const quotes = processed.match(/"[^"]+"/g);
            processed = quotes ? quotes.join(" ") : "";
        }
        
        // Handle asterisks
        if (!settings.passAsterisks) {
            processed = processed.replace(/\*/g, "");
        }
        
        return processed.trim();
    }
    
    // Call Gemini 2.5 Pro TTS API
    async function callGeminiTTS(text, voice, instructions, personality, vocalTraits, language) {
        if (!settings.apiKey) {
            console.error("[Gemini TTS Plus] API key not configured");
            return null;
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${settings.apiKey}`;
        
        // Build comprehensive system instruction
        let systemPrompt = instructions || "";
        
        // Add personality traits if provided
        if (personality && personality.trim()) {
            systemPrompt += `\n\n### CHARACTER PERSONALITY\n${personality}`;
        }
        
        // Add vocal traits if provided
        if (vocalTraits && vocalTraits.trim()) {
            systemPrompt += `\n\n### VOCAL CHARACTERISTICS\n${vocalTraits}`;
        }
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: text
                }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voice
                        }
                    }
                }
            }
        };
        
        // Add system instruction if we have any prompting
        if (systemPrompt.trim()) {
            requestBody.systemInstruction = {
                parts: [{
                    text: systemPrompt
                }]
            };
        }
        
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const error = await response.text();
                console.error("[Gemini TTS Plus] API error:", error);
                return null;
            }
            
            const data = await response.json();
            
            // Extract audio data from response
            if (data.candidates && data.candidates[0]?.content?.parts) {
                for (const part of data.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.mimeType?.startsWith("audio/")) {
                        return part.inlineData.data; // Base64 audio
                    }
                }
            }
            
            console.error("[Gemini TTS Plus] No audio in response");
            return null;
        } catch (error) {
            console.error("[Gemini TTS Plus] Request failed:", error);
            return null;
        }
    }
    
    // Play audio from base64
    function playAudio(base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play().catch(err => {
            console.error("[Gemini TTS Plus] Playback failed:", err);
        });
    }
    
    // Add TTS button to message using SillyTavern's API
    function addTTSButtonToMessage(messageId) {
        const context = window.SillyTavern?.getContext ? window.SillyTavern.getContext() : null;
        if (!context) return;
        
        // Try using SillyTavern's message button API if available
        if (context.addOneTimeMessageButton) {
            context.addOneTimeMessageButton(
                messageId,
                "Play TTS",
                "fa-face-smile",
                async () => {
                    const mesBlock = $(`#chat .mes[mesid="${messageId}"]`);
                    const messageText = mesBlock.find(".mes_text").text();
                    const characterName = mesBlock.attr("ch_name");
                    
                    if (!messageText || !characterName) return;
                    
                    const voice = settings.characterVoices[characterName] || GEMINI_VOICES[0].name;
                    const instructions = settings.characterInstructions[characterName] || "";
                    const personality = settings.characterPersonality[characterName] || "";
                    const vocalTraits = settings.characterVocalTraits[characterName] || "";
                    
                    const processedText = processText(messageText);
                    if (!processedText) return;
                    
                    const audioBase64 = await callGeminiTTS(processedText, voice, instructions, personality, vocalTraits, settings.language);
                    if (audioBase64) {
                        playAudio(audioBase64);
                    }
                }
            );
        } else {
            // Fallback: manual insertion
            addTTSButtonManually(messageId);
        }
    }
    
    function addTTSButtonManually(messageId) {
        const mesBlock = $(`#chat .mes[mesid="${messageId}"]`);
        if (!mesBlock.length) return;
        
        // Check if button already exists
        if (mesBlock.find(".gemini-tts-message-btn").length > 0) return;
        
        // Try different selectors
        let buttonContainer = mesBlock.find(".mes_buttons");
        if (!buttonContainer.length) {
            buttonContainer = mesBlock.find(".extraMesButtons");
        }
        if (!buttonContainer.length) {
            buttonContainer = mesBlock.find(".mes_block .ch_name");
            if (buttonContainer.length) {
                // Create buttons container if it doesn't exist
                buttonContainer = $('<div class="mes_buttons"></div>');
                mesBlock.find(".mes_block").append(buttonContainer);
            }
        }
        
        if (!buttonContainer.length) return;
        
        const ttsButton = $(`
            <div class="mes_button gemini-tts-message-btn" title="Play with Gemini TTS">
                <i class="fa-solid fa-face-smile"></i>
            </div>
        `);
        
        ttsButton.on("click", async function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            const messageText = mesBlock.find(".mes_text").text();
            const characterName = mesBlock.attr("ch_name");
            
            if (!messageText || !characterName) return;
            
            ttsButton.css("opacity", "0.5");
            
            const voice = settings.characterVoices[characterName] || GEMINI_VOICES[0].name;
            const instructions = settings.characterInstructions[characterName] || "";
            const personality = settings.characterPersonality[characterName] || "";
            const vocalTraits = settings.characterVocalTraits[characterName] || "";
            
            const processedText = processText(messageText);
            if (processedText) {
                const audioBase64 = await callGeminiTTS(processedText, voice, instructions, personality, vocalTraits, settings.language);
                if (audioBase64) {
                    playAudio(audioBase64);
                }
            }
            
            ttsButton.css("opacity", "1");
        });
        
        buttonContainer.prepend(ttsButton);
    }
    
    // Observer to add TTS buttons to new messages
    function observeMessages() {
        const chatElement = document.getElementById("chat");
        if (!chatElement) return;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains("mes")) {
                        const messageId = $(node).attr("mesid");
                        if (messageId) {
                            setTimeout(() => addTTSButtonToMessage(messageId), 100);
                        }
                    }
                });
            });
        });
        
        observer.observe(chatElement, {
            childList: true,
            subtree: false
        });
        
        // Add buttons to existing messages
        $("#chat .mes").each(function() {
            const messageId = $(this).attr("mesid");
            if (messageId) {
                addTTSButtonToMessage(messageId);
            }
        });
    }
    
    // Handle message for TTS
    async function onMessageReceived(data) {
        if (!settings.enabled) return;
        
        const context = window.SillyTavern?.getContext ? window.SillyTavern.getContext() : null;
        if (!context) return;
        
        const characterId = data.character_id || context.characterId;
        
        if (!characterId) return;
        
        let text = data.message || "";
        
        // Skip user messages unless narration is included
        if (data.is_user && !settings.includeNarration) return;
        
        // Process text
        text = processText(text);
        
        if (!text) return;
        
        // Get character-specific settings
        const voice = settings.characterVoices[characterId] || GEMINI_VOICES[0].name;
        const instructions = settings.characterInstructions[characterId] || "";
        const personality = settings.characterPersonality[characterId] || "";
        const vocalTraits = settings.characterVocalTraits[characterId] || "";
        
        // Call TTS
        const audioBase64 = await callGeminiTTS(text, voice, instructions, personality, vocalTraits, settings.language);
        
        if (audioBase64) {
            playAudio(audioBase64);
        }
    }
    
    // Build character configuration UI
    function buildCharacterConfig() {
        const context = window.SillyTavern?.getContext ? window.SillyTavern.getContext() : null;
        if (!context) return '<div class="gemini-tts-no-chars">No context available</div>';
        
        // Get characters from current chat
        const chat = context.chat;
        if (!chat || chat.length === 0) {
            return '<div class="gemini-tts-no-chars">No active chat. Start a conversation to configure character voices.</div>';
        }
        
        // Extract unique character names from chat messages
        const characterNamesInChat = new Set();
        chat.forEach(message => {
            if (message.name && !message.is_user) {
                characterNamesInChat.add(message.name);
            }
        });
        
        if (characterNamesInChat.size === 0) {
            return '<div class="gemini-tts-no-chars">No character messages in this chat yet.</div>';
        }
        
        const defaultInstructions = `### INSTRUCTION
You are an advanced Audio Engine creating an immersive First-Person roleplay experience.
Your goal is to perform the script below with extreme emotional realism and physical presence.

### HOW TO HANDLE BRACKETS [Action/Tone: ...]
The text inside brackets is your DIRECTORIAL CUE. You must interpret it intelligently:

1. **If it describes a Sound (e.g., [chewing, fabric rustling, moan]):** 
   -> GENERATE that sound audibly.
   
2. **If it describes a Vocal Tone (e.g., [voice drops to a whisper, condescending purr]):** 
   -> DO NOT read these words. Instead, APPLY that specific tone to the dialogue that follows.

3. **If it describes a Physical Action (e.g., [chewing slowly, kissing]):**
   -> Perform the action *while* speaking or in between words (e.g., speak with your mouth full, or breathe heavily).`;
        
        let html = '<div class="gemini-tts-char-list">';
        
        characterNamesInChat.forEach(charName => {
            const currentVoice = settings.characterVoices[charName] || GEMINI_VOICES[0].name;
            const currentInstructions = settings.characterInstructions[charName] || defaultInstructions;
            const currentPersonality = settings.characterPersonality[charName] || "";
            const currentVocalTraits = settings.characterVocalTraits[charName] || "";
            
            html += `
                <div class="gemini-tts-char-item">
                    <div class="gemini-tts-char-name">${charName}</div>
                    <div class="gemini-tts-char-controls">
                        <label>Voice:</label>
                        <select class="gemini-tts-voice-select" data-char-id="${charName}">
                            ${GEMINI_VOICES.map(v => 
                                `<option value="${v.name}" ${v.name === currentVoice ? "selected" : ""}>${v.name} — ${v.description}</option>`
                            ).join("")}
                        </select>
                        
                        <label>TTS Instructions:</label>
                        <textarea class="gemini-tts-instructions-input" data-char-id="${charName}" 
                            placeholder="TTS prompting instructions..."
                            rows="8">${currentInstructions}</textarea>
                        
                        <label>Character Personality:</label>
                        <textarea class="gemini-tts-personality-input" data-char-id="${charName}" 
                            placeholder="Describe personality traits (e.g., 'Confident and playful, with a teasing edge. Enjoys banter.')"
                            rows="3">${currentPersonality}</textarea>
                        
                        <label>Vocal Characteristics:</label>
                        <textarea class="gemini-tts-vocal-input" data-char-id="${charName}" 
                            placeholder="Describe vocal traits (e.g., 'Slightly husky voice, speaks with a slow drawl. Often pauses mid-sentence for effect.')"
                            rows="3">${currentVocalTraits}</textarea>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Update character configuration UI
    function updateCharacterConfig() {
        const container = $("#gemini-tts-char-config");
        if (container.length) {
            container.html(buildCharacterConfig());
            attachCharacterEventListeners();
        }
    }
    
    // Attach event listeners for character configs
    function attachCharacterEventListeners() {
        $(".gemini-tts-voice-select").off("change").on("change", function() {
            const charId = $(this).data("char-id");
            const voice = $(this).val();
            settings.characterVoices[charId] = voice;
            saveSettings();
        });
        
        $(".gemini-tts-instructions-input").off("input").on("input", function() {
            const charId = $(this).data("char-id");
            const instructions = $(this).val();
            settings.characterInstructions[charId] = instructions;
            saveSettings();
        });
        
        $(".gemini-tts-personality-input").off("input").on("input", function() {
            const charId = $(this).data("char-id");
            const personality = $(this).val();
            settings.characterPersonality[charId] = personality;
            saveSettings();
        });
        
        $(".gemini-tts-vocal-input").off("input").on("input", function() {
            const charId = $(this).data("char-id");
            const vocal = $(this).val();
            settings.characterVocalTraits[charId] = vocal;
            saveSettings();
        });
    }
    
    // Test API connection
    async function testAPIConnection() {
        const button = $("#gemini-tts-test-api");
        const status = $("#gemini-tts-api-status");
        
        if (!settings.apiKey) {
            status.text("Please enter an API key first").css("color", "red");
            return;
        }
        
        button.prop("disabled", true).text("Testing...");
        status.text("Testing connection...").css("color", "yellow");
        
        const testText = "Hello";
        const testVoice = GEMINI_VOICES[0].name;
        
        const result = await callGeminiTTS(testText, testVoice, "", settings.language);
        
        if (result) {
            status.text("✓ API key is valid!").css("color", "green");
            button.text("Test API Connection");
        } else {
            status.text("✗ API key test failed - check console for details").css("color", "red");
            button.text("Test API Connection");
        }
        
        button.prop("disabled", false);
    }
    
    // Create settings UI
    function createSettingsUI() {
        const settingsHtml = `
            <div id="gemini-tts-settings" class="gemini-tts-settings">
                <div class="gemini-tts-section">
                    <h4>API Configuration</h4>
                    <label for="gemini-tts-api-key">Gemini API Key:</label>
                    <input type="password" id="gemini-tts-api-key" class="text_pole" 
                        placeholder="Enter your Gemini API key" value="${settings.apiKey}">
                    <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                        <button id="gemini-tts-test-api" class="menu_button">Test API Connection</button>
                        <span id="gemini-tts-api-status" style="font-size: 0.9em;"></span>
                    </div>
                    
                    <label for="gemini-tts-language">Language:</label>
                    <select id="gemini-tts-language">
                        ${LANGUAGES.map(lang => 
                            `<option value="${lang.code}" ${lang.code === settings.language ? "selected" : ""}>${lang.name}</option>`
                        ).join("")}
                    </select>
                </div>
                
                <div class="gemini-tts-section">
                    <h4>Options</h4>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-enabled" ${settings.enabled ? "checked" : ""}>
                        <span>TTS Enabled</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-narration" ${settings.includeNarration ? "checked" : ""}>
                        <span>Include User Message Narration</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-asterisks" ${settings.passAsterisks ? "checked" : ""}>
                        <span>Pass Asterisks to TTS Engine</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-only-quotes" ${settings.onlyQuotes ? "checked" : ""}>
                        <span>Only Narrate Quotes</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-skip-code" ${settings.skipCodeblocks ? "checked" : ""}>
                        <span>Skip Codeblocks</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-skip-tags" ${settings.skipTaggedBlocks ? "checked" : ""}>
                        <span>Skip &lt;tagged&gt; blocks</span>
                    </label>
                    <label class="checkbox_label">
                        <input type="checkbox" id="gemini-tts-ignore-asterisks" ${settings.ignoreAsterisks ? "checked" : ""}>
                        <span>Ignore text, even "quotes", inside of asterisks</span>
                    </label>
                </div>
                
                <div class="gemini-tts-section">
                    <h4>Character Voice Configuration</h4>
                    <div id="gemini-tts-char-config">
                        ${buildCharacterConfig()}
                    </div>
                    <button id="gemini-tts-refresh-chars" class="menu_button">Refresh Characters</button>
                </div>
            </div>
        `;
        
        // Create collapsible panel matching SillyTavern structure
        const panel = $(`
            <div id="gemini-tts-plus-panel">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Gemini TTS Plus</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        ${settingsHtml}
                    </div>
                </div>
            </div>
        `);
        
        $("#extensions_settings2").append(panel);
        
        // Attach event listeners
        $("#gemini-tts-api-key").on("input", function() {
            settings.apiKey = $(this).val();
            saveSettings();
        });
        
        $("#gemini-tts-test-api").on("click", testAPIConnection);
        
        $("#gemini-tts-language").on("change", function() {
            settings.language = $(this).val();
            saveSettings();
        });
        
        $("#gemini-tts-enabled").on("change", function() {
            settings.enabled = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-narration").on("change", function() {
            settings.includeNarration = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-asterisks").on("change", function() {
            settings.passAsterisks = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-only-quotes").on("change", function() {
            settings.onlyQuotes = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-skip-code").on("change", function() {
            settings.skipCodeblocks = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-skip-tags").on("change", function() {
            settings.skipTaggedBlocks = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-ignore-asterisks").on("change", function() {
            settings.ignoreAsterisks = $(this).prop("checked");
            saveSettings();
        });
        
        $("#gemini-tts-refresh-chars").on("click", function() {
            updateCharacterConfig();
        });
        
        attachCharacterEventListeners();
    }
    
    // Test command
    async function testTTS(args) {
        const text = args.join(" ") || "Hello, this is a test of the Gemini TTS Plus extension.";
        const context = window.SillyTavern?.getContext ? window.SillyTavern.getContext() : null;
        if (!context) return "No context available";
        
        const characterId = context.characterId;
        const voice = settings.characterVoices[characterId] || GEMINI_VOICES[0].name;
        const instructions = settings.characterInstructions[characterId] || "";
        const personality = settings.characterPersonality[characterId] || "";
        const vocalTraits = settings.characterVocalTraits[characterId] || "";
        
        console.log("[Gemini TTS Plus] Testing with voice:", voice);
        const audioBase64 = await callGeminiTTS(text, voice, instructions, personality, vocalTraits, settings.language);
        
        if (audioBase64) {
            playAudio(audioBase64);
            return "TTS test played successfully";
        }
        return "TTS test failed";
    }
    
    // Initialize extension
    jQuery(async () => {
        try {
            loadSettings();
            createSettingsUI();
            observeMessages();
            
            // Register slash command
            if (window.SillyTavern?.getContext) {
                const context = window.SillyTavern.getContext();
                if (context.registerSlashCommand) {
                    context.registerSlashCommand("gemini-tts-test", testTTS, [], "Test Gemini TTS Plus", true, true);
                }
                
                // Hook into message events
                if (context.eventSource) {
                    context.eventSource.on("MESSAGE_RECEIVED", onMessageReceived);
                    context.eventSource.on("CHARACTER_MESSAGE_RENDERED", onMessageReceived);
                }
            }
            
            console.log("[Gemini TTS Plus] Extension loaded successfully");
        } catch (error) {
            console.error("[Gemini TTS Plus] Failed to initialize:", error);
        }
    });
})();