const form = document.querySelector("#translate-form");
const inputTextArea = document.querySelector("#text");
const outputTextArea = document.querySelector("#translation");
const sourceLanguageSelect = document.querySelector("#source_language");
const outputAudioButton = document.querySelector("#output-audio-button");
const inputAudioButton = document.querySelector("#input-audio-button");

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

  audioContext.decodeAudioData(audioBuffer, function(buffer) {
    audioSource.buffer = buffer;
    audioSource.connect(audioContext.destination);
    audioSource.start(0);
  });
}

async function playAudio(isSource) {
  const text = currentTranslationResult[isSource ? "origin" : "text"]
  const language = currentTranslationResult[isSource ? "src" : "dest"]
  // Check if the audio data is already cached
  if (audioCache[text]) {
    playCachedAudio(audioCache[text]);
    return;
  }

  // Make a request to the server to get the audio data
  const response = await fetch(`/speak?lang=${language}&text=${encodeURIComponent(text)}`);
  const audioData = await response.arrayBuffer();

  // Cache the audio data
  audioCache[text] = audioData;

  // Play the audio data
  playCachedAudio(audioData);
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

inputAudioButton.addEventListener("click", async () => {
  if (!this.disabled) await playAudio(true)
});

outputAudioButton.addEventListener("click", async () => {
  if (!this.disabled) await playAudio(false)
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
  inputAudioButton.disabled = false;
  outputAudioButton.disabled = false;
}

const translate = debounce(translationWorkflow, 500);

form.addEventListener("keydown", async () => {
  await translate()
});

form.addEventListener("change", async () => {
  await translate();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await translate();
});
