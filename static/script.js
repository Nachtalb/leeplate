const form = document.querySelector("#translate-form");
const inputTextArea = document.querySelector("#text");
const outputTextArea = document.querySelector("#translation");
const sourceLanguageSelect = document.querySelector("#source_language");
const outputAudioButton = document.querySelector("#output-audio-button");
const inputAudioButton = document.querySelector("#input-audio-button");
const outputAudioDownloadButton = document.querySelector(
  "#output-audio-download-button"
);
const inputAudioDownloadButton = document.querySelector(
  "#input-audio-download-button"
);

let currentTranslationInput;
let currentTranslationResult;
let audioCache = {};

function playCachedAudio(audioData) {
  const audioContext = new AudioContext();
  const audioSource = audioContext.createBufferSource();

  // Create a new ArrayBuffer that is not detached
  const audioBuffer = new ArrayBuffer(audioData.byteLength);
  const audioView = new Uint8Array(audioBuffer);
  audioView.set(new Uint8Array(audioData));

  audioContext.decodeAudioData(audioBuffer, function (buffer) {
    audioSource.buffer = buffer;
    audioSource.connect(audioContext.destination);
    audioSource.start(0);
  });
}

async function getAudio(text, language) {
  if (!(language in audioCache)) audioCache[language] = {};
  if (text in audioCache[language]) return audioCache[language][text];

  const response = await fetch(
    `/speak?lang=${language}&text=${encodeURIComponent(text)}`
  );
  const audioData = await response.arrayBuffer();

  // Cache the audio data
  audioCache[language][text] = audioData;

  return audioCache[language][text];
}

async function playAudio(isSource) {
  const text = currentTranslationResult[isSource ? "origin" : "text"];
  const language = currentTranslationResult[isSource ? "src" : "dest"];
  playCachedAudio(await getAudio(text, language));
}

async function downloadAudio(isSource) {
  const text = currentTranslationResult[isSource ? "origin" : "text"];
  const language = currentTranslationResult[isSource ? "src" : "dest"];
  const audioData = await getAudio(text, language);
  if (!audioData) {
    console.error(`No audio found for "${text}" in language "${language}"`);
    return;
  }
  const url = URL.createObjectURL(new Blob([audioData]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `audio_${text
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 20)}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function debounce(fn, delay) {
  let timerId;
  return async function (...args) {
    if (timerId) {
      clearTimeout(timerId);
    }
    return new Promise((resolve) => {
      timerId = setTimeout(async () => {
        const result = await fn(...args);
        timerId = null;
        resolve(result);
      }, delay);
    });
  };
}

const spokenLanguagesCacheKey = "spokenLanguages";
const spokenLanguagesCacheExpiry = 7 * 24 * 60 * 60 * 1000; // 1 week

// Function to fetch the list of available languages from the backend
async function fetchSpokenLanguages() {
  const response = await fetch("/spoken-languages");
  const data = await response.json();
  return data.languages;
}

// Function to get the list of available languages, fetching it if necessary
function getSpokenLanguages() {
  return new Promise((resolve, reject) => {
    // Check if the spoken languages are already cached in localStorage
    const cachedLanguages = JSON.parse(
      localStorage.getItem(spokenLanguagesCacheKey)
    );
    if (cachedLanguages && Date.now() < cachedLanguages.expiry) {
      // The spoken languages are cached and haven't expired yet, use them
      resolve(cachedLanguages.languages);
      return;
    }

    // The spoken languages aren't cached or have expired, fetch them from the backend
    fetchSpokenLanguages()
      .then((languages) => {
        // Cache the spoken languages in localStorage
        localStorage.setItem(
          spokenLanguagesCacheKey,
          JSON.stringify({
            languages: languages,
            expiry: Date.now() + spokenLanguagesCacheExpiry,
          })
        );

        // Return the list of spoken languages
        resolve(languages);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Function to check if a language code is in the list of available languages
async function canSpeakLanguage(languageCode) {
  return languageCode in (await getSpokenLanguages());
}

inputAudioButton.addEventListener("click", async (event) => {
  if (!event.currentTarget.disabled) await playAudio(true);
});
outputAudioButton.addEventListener("click", async (event) => {
  if (!event.currentTarget.disabled) await playAudio(false);
});
inputAudioDownloadButton.addEventListener("click", async (event) => {
  if (!event.currentTarget.disabled) await downloadAudio(true);
});
outputAudioDownloadButton.addEventListener("click", async (event) => {
  if (!event.currentTarget.disabled) await downloadAudio(false);
});

async function copyContent(button) {
  if (button.disabled) return;
  try {
    await navigator.clipboard.writeText(button.previousElementSibling.value);
    // Show a tooltip to indicate that the text has been copied
    button.setAttribute("data-bs-original-title", "Copied!");
    const tooltip = new bootstrap.Tooltip(button, {
      placement: "top",
      trigger: "manual",
    });
    tooltip.show();
    // Hide the tooltip after a short delay
    setTimeout(() => tooltip.hide(), 1000);
  } catch (error) {
    console.error("Failed to copy text:", error);
  }
}

const copyInputButton = document.getElementById("copyInputButton");
const copyOutputButton = document.getElementById("copyOutputButton");
copyInputButton.addEventListener("click", async (event) => {
  await copyContent(event.currentTarget);
});
copyOutputButton.addEventListener("click", async (event) => {
  await copyContent(event.currentTarget);
});

async function translationWorkflow() {
  const formData = new FormData(form);
  if (formData.get("text") === "") return;

  const data = JSON.stringify({
    text: formData.get("text"),
    source_language: formData.get("source_language"),
    target_language: formData.get("target_language"),
  });

  if (currentTranslationInput === data) return;

  outputTextArea.disabled = true;

  const response = await fetch("/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });

  if (response.ok) currentTranslationInput = data;

  currentTranslationResult = await response.json();
  outputTextArea.value = currentTranslationResult.text;
  if (formData.get("source_language") == "auto")
    sourceLanguageSelect.value = currentTranslationResult.src;

  outputTextArea.disabled = false;
  copyInputButton.disabled = false;
  copyOutputButton.disabled = false;
  inputAudioButton.disabled = !(await canSpeakLanguage(
    currentTranslationResult["src"]
  ));
  inputAudioDownloadButton.disabled = inputAudioButton.disabled;
  outputAudioButton.disabled = !(await canSpeakLanguage(
    currentTranslationResult["dest"]
  ));
  outputAudioDownloadButton.disabled = outputAudioButton.disabled;
}

const translate = debounce(translationWorkflow, 500);

form.addEventListener("keydown", async () => {
  await translate();
});

form.addEventListener("change", async () => {
  await translate();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await translate();
});
