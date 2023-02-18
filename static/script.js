const form = document.querySelector("#translate-form");
const inputTextArea = document.querySelector("#text");
const outputTextArea = document.querySelector("#translation");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = {
    text: formData.get("text"),
    source_language: formData.get("source_language"),
    target_language: formData.get("target_language"),
  };

  // Auto detect source language
  if (data.source_language === "auto") {
    const lang = await detectLanguage(data.text);
    data.source_language = lang;
    document.querySelector("#input-language").value = lang;
  }

  const response = await fetch("/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  outputTextArea.value = result.translation;

  // Remove old "Listen" buttons
  const oldButtons = document.querySelectorAll(".listen-button");
  oldButtons.forEach((button) => button.remove());

  // Create new "Listen" buttons
  const inputAudioButtons = document.querySelector("#input-audio-buttons");
  const inputAudioButton = document.createElement("button");
  inputAudioButton.innerText = "Listen";
  inputAudioButton.className = "btn btn-secondary ml-2 listen-button";
  inputAudioButton.addEventListener("click", async () => {
    const lang = formData.get("source_language");
    const audioResponse = await fetch(`/speak?text=${encodeURIComponent(formData.get("text"))}&lang=${lang}`);
    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.play();
  });

  const outputAudioButtons = document.querySelector("#output-audio-buttons");
  const outputAudioButton = document.createElement("button");
  outputAudioButton.innerText = "Listen";
  outputAudioButton.className = "btn btn-secondary ml-2 listen-button";
  outputAudioButton.addEventListener("click", async () => {
    const lang = formData.get("target_language");
    const audioResponse = await fetch(`/speak?text=${encodeURIComponent(result.translation)}&lang=${lang}`);
    const audioBlob = await audioResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);
    audio.play();
  });

  inputAudioButtons.appendChild(inputAudioButton);
  outputAudioButtons.appendChild(outputAudioButton);
});

async function detectLanguage(text) {
  const response = await fetch("/detect_language", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text }),
  });

  const result = await response.json();
  return result.language;
}
